require("dotenv").config();

const { envoyerEmail } = require("./emailService");

async function testerEmail() {
  try {
    const resultat = await envoyerEmail({
      destinataire: process.env.GMAIL_USER,
      sujet: "Test - NGALANKA HÔTEL",
      message:
        "Bonjour,\n\nCeci est un e-mail de test du système de notifications de NGALANKA HÔTEL.\n\nSi tu reçois ce message, la configuration Gmail fonctionne.",
    });

    console.log("E-mail envoyé avec succès :", resultat.messageId);
  } catch (erreur) {
    console.error("Échec de l'envoi de l'e-mail :", erreur.message);
  }
}

testerEmail();