const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const pool = require("../config/database");

router.post("/login", async (req, res) => {
    try {
        const { nom_utilisateur, mot_de_passe } = req.body;

        // ==========================
        // VALIDATION
        // ==========================

        if (!nom_utilisateur || !mot_de_passe) {
            return res.status(400).json({
                message: "Nom d'utilisateur et mot de passe requis"
            });
        }

        // ==========================
        // RECHERCHE UTILISATEUR
        // ==========================

        const [rows] = await pool.execute(
            `SELECT
                u.id_utilisateur,
                u.nom_utilisateur,
                u.mot_de_passe,
                u.nom_complet,
                u.id_role,
                u.telephone,
                u.email,
                u.statut,
                u.derniere_connexion,
                r.nom_role
             FROM utilisateurs u
             INNER JOIN roles r
                ON u.id_role = r.id_role
             WHERE u.nom_utilisateur = ?
             LIMIT 1`,
            [nom_utilisateur]
        );

        // ==========================
        // UTILISATEUR INTROUVABLE
        // ==========================

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Nom d'utilisateur ou mot de passe incorrect"
            });
        }

        const utilisateur = rows[0];

        // ==========================
        // VERIFICATION DU STATUT
        // ==========================

        if (utilisateur.statut === "INACTIF") {
            return res.status(403).json({
                message: "Ce compte est désactivé."
            });
        }

        if (utilisateur.statut === "BLOQUE") {
            return res.status(403).json({
                message: "Ce compte est bloqué."
            });
        }

        // ==========================
        // VERIFICATION MOT DE PASSE
        // ==========================

        let motDePasseCorrect = false;

        /*
         * Les anciens utilisateurs peuvent encore avoir
         * leur mot de passe stocké en clair.
         *
         * Les nouveaux utilisateurs utilisent bcrypt.
         */

        const motDePasseStocke = utilisateur.mot_de_passe || "";

        const estHashBcrypt =
            motDePasseStocke.startsWith("$2a$") ||
            motDePasseStocke.startsWith("$2b$") ||
            motDePasseStocke.startsWith("$2y$");

        if (estHashBcrypt) {
            // ==========================
            // MOT DE PASSE BCRYPT
            // ==========================

            motDePasseCorrect = await bcrypt.compare(
                mot_de_passe,
                motDePasseStocke
            );
        } else {
            // ==========================
            // ANCIEN MOT DE PASSE EN CLAIR
            // ==========================

            motDePasseCorrect =
                mot_de_passe === motDePasseStocke;

            /*
             * Si le mot de passe est correct,
             * on le convertit immédiatement en bcrypt.
             */

            if (motDePasseCorrect) {
                const nouveauHash = await bcrypt.hash(
                    mot_de_passe,
                    10
                );

                await pool.execute(
                    `UPDATE utilisateurs
                     SET mot_de_passe = ?
                     WHERE id_utilisateur = ?`,
                    [
                        nouveauHash,
                        utilisateur.id_utilisateur
                    ]
                );
            }
        }

        // ==========================
        // MOT DE PASSE INCORRECT
        // ==========================

        if (!motDePasseCorrect) {
            return res.status(401).json({
                message: "Nom d'utilisateur ou mot de passe incorrect"
            });
        }

        // ==========================
        // MISE A JOUR DERNIERE CONNEXION
        // ==========================

        await pool.execute(
            `UPDATE utilisateurs
             SET derniere_connexion = NOW()
             WHERE id_utilisateur = ?`,
            [utilisateur.id_utilisateur]
        );

        // ==========================
        // REPONSE
        // ==========================

        res.json({
            message: "Connexion réussie",
            utilisateur: {
                id_utilisateur: utilisateur.id_utilisateur,
                nom_utilisateur: utilisateur.nom_utilisateur,
                nom_complet: utilisateur.nom_complet,
                id_role: utilisateur.id_role,
                nom_role: utilisateur.nom_role,
                telephone: utilisateur.telephone,
                email: utilisateur.email,
                statut: utilisateur.statut,
                derniere_connexion: new Date()
            }
        });

    } catch (error) {
        console.error("Erreur login :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});

module.exports = router;