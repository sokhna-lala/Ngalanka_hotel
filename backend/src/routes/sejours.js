const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ==========================================
// GET - Liste des séjours
// ==========================================
router.get("/", async (req, res) => {
    try {
        const [sejours] = await pool.execute(`
            SELECT
                s.id_sejour,
                s.numero_sejour,
                s.id_client,
                s.id_reservation,
                s.id_chambre,

                CONCAT(
                    c.nom,
                    ' ',
                    COALESCE(c.prenom, '')
                ) AS client,

                c.code_client,

                ch.numero AS numero_chambre,

                s.date_arrivee_prevue,
                s.date_arrivee_reelle,
                s.date_depart_prevue,
                s.date_depart_reelle,

                s.nombre_nuits,
                s.nombre_adultes,
                s.nombre_enfants,

                s.statut,
                s.caution,
                s.observation,

                r.numero_reservation

            FROM sejours s

            INNER JOIN clients c
                ON c.id_client = s.id_client

            INNER JOIN chambres ch
                ON ch.id_chambre = s.id_chambre

            LEFT JOIN reservations r
                ON r.id_reservation = s.id_reservation

            ORDER BY s.date_creation DESC
        `);

        res.json(sejours);

    } catch (error) {

        console.error(
            "Erreur récupération séjours :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer les séjours"
        });
    }
});


// ==========================================
// GET - Un séjour
// ==========================================
router.get("/:id", async (req, res) => {
    try {

        const [sejours] = await pool.execute(`
            SELECT
                s.*,

                CONCAT(
                    c.nom,
                    ' ',
                    COALESCE(c.prenom, '')
                ) AS client,

                c.code_client,
                c.nom,
                c.prenom,
                c.telephone,
                c.email,

                ch.numero AS numero_chambre,

                r.numero_reservation

            FROM sejours s

            INNER JOIN clients c
                ON c.id_client = s.id_client

            INNER JOIN chambres ch
                ON ch.id_chambre = s.id_chambre

            LEFT JOIN reservations r
                ON r.id_reservation = s.id_reservation

            WHERE s.id_sejour = ?
        `, [req.params.id]);

        if (sejours.length === 0) {
            return res.status(404).json({
                message:
                    "Séjour introuvable"
            });
        }

        res.json(sejours[0]);

    } catch (error) {

        console.error(
            "Erreur récupération séjour :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer le séjour"
        });
    }
});


module.exports = router;