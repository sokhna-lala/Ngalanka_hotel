const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function envoyerEmail({ destinataire, sujet, message }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Configuration Gmail manquante dans le fichier .env");
  }

  if (!destinataire) {
    throw new Error("L'adresse e-mail du destinataire est manquante");
  }

  return transporter.sendMail({
    from: `"NGALANKA HÔTEL" <${process.env.GMAIL_USER}>`,
    to: destinataire,
    subject: sujet,
    text: message,
  });
}

module.exports = { envoyerEmail };