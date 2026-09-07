const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.post("/login", async (req, res) => {
    try {
        const { nom_utilisateur, mot_de_passe } = req.body;

        if (!nom_utilisateur || !mot_de_passe) {
            return res.status(400).json({
                message: "Nom d'utilisateur et mot de passe requis"
            });
        }

        const [rows] = await pool.execute(
            `SELECT 
                u.id_utilisateur,
                u.nom_utilisateur,
                u.nom_complet,
                u.id_role,
                u.telephone,
                u.email,
                u.statut,
                r.nom_role
             FROM utilisateurs u
             INNER JOIN roles r ON u.id_role = r.id_role
             WHERE u.nom_utilisateur = ?
             AND u.mot_de_passe = ?
             LIMIT 1`,
            [nom_utilisateur, mot_de_passe]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Nom d'utilisateur ou mot de passe incorrect"
            });
        }

        res.json({
            message: "Connexion réussie",
            utilisateur: rows[0]
        });

    } catch (error) {
        console.error("Erreur login :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});

module.exports = router;