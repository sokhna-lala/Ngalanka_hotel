
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
                CONCAT(c.nom, ' ', COALESCE(c.prenom, '')) AS client,
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
        console.error("Erreur récupération séjours :", error);
        res.status(500).json({
            message: "Impossible de récupérer les séjours"
        });
    }
});

// ==========================================
// GET - Détail d'un séjour
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const [sejours] = await pool.execute(`
            SELECT
                s.*,
                CONCAT(c.nom, ' ', COALESCE(c.prenom, '')) AS client,
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
                message: "Séjour introuvable"
            });
        }

        res.json(sejours[0]);
    } catch (error) {
        console.error("Erreur récupération séjour :", error);
        res.status(500).json({
            message: "Impossible de récupérer le séjour"
        });
    }
});

// ==========================================
// POST - Bloquer la création directe d'un séjour
// Le check-in doit passer par une réservation confirmée.
// ==========================================
router.post("/", (req, res) => {
    return res.status(403).json({
        message: "Création directe interdite. Effectuez le check-in depuis une réservation confirmée via /api/reservations/:id/checkin."
    });
});


module.exports = router;

// ==========================================
// PUT - Check-out
// ==========================================
router.put("/:id/checkout", async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [sejours] = await connection.execute(`
            SELECT
                id_sejour,
                id_reservation,
                id_chambre,
                statut
            FROM sejours
            WHERE id_sejour = ?
            FOR UPDATE
        `, [req.params.id]);

        if (sejours.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Séjour introuvable"
            });
        }

        const sejour = sejours[0];

        if (sejour.statut !== "EN_COURS") {
            await connection.rollback();

            return res.status(400).json({
                message: "Le check-out est possible uniquement pour un séjour en cours."
            });
        }

        await connection.execute(`
            UPDATE sejours
            SET statut = 'TERMINE',
                date_depart_reelle = NOW()
            WHERE id_sejour = ?
        `, [sejour.id_sejour]);

        if (sejour.id_reservation) {
            await connection.execute(`
                UPDATE reservations
                SET statut = 'TERMINEE'
                WHERE id_reservation = ?
                  AND statut = 'CONFIRMEE'
            `, [sejour.id_reservation]);
        }

        // Vérifier si une autre réservation confirmée
        // utilise prochainement cette chambre.
        const [reservationsFutures] = await connection.execute(`
            SELECT rc.id_reservation
            FROM reservation_chambres rc
            INNER JOIN reservations r
                ON r.id_reservation = rc.id_reservation
            WHERE rc.id_chambre = ?
              AND r.statut = 'CONFIRMEE'
              AND r.date_depart >= CURDATE()
              AND r.id_reservation <> COALESCE(?, 0)
            LIMIT 1
        `, [
            sejour.id_chambre,
            sejour.id_reservation
        ]);

        await connection.execute(`
            UPDATE chambres
            SET statut = ?
            WHERE id_chambre = ?
        `, [
            reservationsFutures.length > 0
                ? "RESERVEE"
                : "DISPONIBLE",
            sejour.id_chambre
        ]);

        await connection.commit();

        return res.json({
            message: "Check-out effectué avec succès",
            id_sejour: sejour.id_sejour,
            statut_sejour: "TERMINE"
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Erreur check-out :", error);

        return res.status(500).json({
            message: "Impossible d'effectuer le check-out"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;

// ==========================================
// POST - Créer un séjour / Check-in
// ==========================================
router.post("/", async (req, res) => {
    try {

        const {
            id_client,
            id_reservation,
            id_chambre,
            date_arrivee_prevue,
            date_arrivee_reelle,
            date_depart_prevue,
            nombre_adultes,
            nombre_enfants,
            caution,
            observation
        } = req.body;

        // ==========================================
        // Vérification des données obligatoires
        // ==========================================
        if (!id_client) {
            return res.status(400).json({
                message: "Le client est obligatoire"
            });
        }

        if (!id_chambre) {
            return res.status(400).json({
                message: "La chambre est obligatoire"
            });
        }

        // ==========================================
        // Génération du numéro de séjour
        // ==========================================
        const numero_sejour = `SEJ-${Date.now()}`;

        // ==========================================
        // Création du séjour
        // ==========================================
        const [result] = await pool.execute(
            `
            INSERT INTO sejours (
                numero_sejour,
                id_client,
                id_reservation,
                id_chambre,
                date_arrivee_prevue,
                date_arrivee_reelle,
                date_depart_prevue,
                nombre_adultes,
                nombre_enfants,
                statut,
                caution,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                numero_sejour,
                id_client,
                id_reservation || null,
                id_chambre,
                date_arrivee_prevue || null,
                date_arrivee_reelle || new Date(),
                date_depart_prevue || null,
                nombre_adultes || 1,
                nombre_enfants || 0,
                "en_cours",
                caution || 0,
                observation || null
            ]
        );

        // ==========================================
        // Réponse succès
        // ==========================================
        res.status(201).json({
            message: "Check-in effectué avec succès",
            id_sejour: result.insertId,
            numero_sejour: numero_sejour
        });

    } catch (error) {

        console.error(
            "Erreur check-in :",
            error
        );

        res.status(500).json({
            message: "Impossible d'effectuer le check-in",
            error: error.message
        });
    }
});


// ==========================================
// EXPORT
// ==========================================
module.exports = router;
