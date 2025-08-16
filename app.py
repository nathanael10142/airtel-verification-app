import os
from flask import Flask, render_template, request, flash, redirect, url_for

# On importe la fonction que nous avons modifiée depuis notre autre script
from send_alert_email import send_security_alert

# Initialisation de l'application Flask
app = Flask(__name__)

# Une "clé secrète" est nécessaire pour afficher des messages (notifications flash) à l'utilisateur.
# Mettez n'importe quelle chaîne de caractères ici.
app.secret_key = os.urandom(24)

@app.route('/send-alert', methods=['GET', 'POST'])
def send_alert_page():
    # Si l'utilisateur a soumis le formulaire (méthode POST)
    if request.method == 'POST':
        target_email = request.form.get('email')

        if not target_email or '@' not in target_email:
            flash("Veuillez entrer une adresse e-mail valide.", "danger")
            return redirect(url_for('send_alert_page'))

        # On appelle notre fonction d'envoi
        print(f"Tentative d'envoi d'alerte à : {target_email}")
        success = send_security_alert(target_email)

        # On affiche un message de succès ou d'échec
        if success:
            flash(f"E-mail envoyé avec succès à {target_email} !", "success")
        else:
            flash(f"Échec de l'envoi de l'e-mail. Vérifiez la console pour les erreurs.", "danger")
        
        return redirect(url_for('send_alert_page'))

    # Si l'utilisateur visite juste la page (méthode GET)
    return render_template('send_alert.html')

if __name__ == '__main__':
    # Lance le serveur web en mode debug (plus facile pour développer)
    app.run(debug=True, port=5001)