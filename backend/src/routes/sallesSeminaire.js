const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const enregistrerAudit = require("../utils/audit");

// =====================================================
// GET /api/salles-seminaire
// Liste toutes les salles
// =====================================================
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                id_salle,
                nom,
                capacite,
                description,
                tarif_journee,
                tarif_demi_journee,
                statut,
                date_creation
            FROM salles_seminaire
            ORDER BY id_salle DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Erreur récupération salles de séminaire :", error);
        res.status(500).json({
            message: "Erreur serveur lors de la récupération des salles"
        });
    }
});

// =====================================================
// GET /api/salles-seminaire/:id
// Récupérer une salle
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `
            SELECT
                id_salle,
                nom,
                capacite,
                description,
                tarif_journee,
                tarif_demi_journee,
                statut,
                date_creation
            FROM salles_seminaire
            WHERE id_salle = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Salle de séminaire introuvable"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Erreur récupération salle :", error);
        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});

// =====================================================
// POST /api/salles-seminaire
// Créer une salle
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            nom,
            capacite,
            description,
            tarif_journee,
            tarif_demi_journee,
            statut,
            id_utilisateur
        } = req.body;

        // -----------------------------
        // Validation
        // -----------------------------
        if (!nom || !nom.trim()) {
            return res.status(400).json({
                message: "Le nom de la salle est obligatoire"
            });
        }

        if (
            capacite === undefined ||
            capacite === null ||
            Number.isNaN(Number(capacite)) ||
            Number(capacite) <= 0
        ) {
            return res.status(400).json({
                message: "La capacité doit être supérieure à 0"
            });
        }

        if (
            tarif_journee === undefined ||
            tarif_journee === null ||
            Number.isNaN(Number(tarif_journee)) ||
            Number(tarif_journee) < 0
        ) {
            return res.status(400).json({
                message: "Le tarif journée est invalide"
            });
        }

        if (
            tarif_demi_journee === undefined ||
            tarif_demi_journee === null ||
            Number.isNaN(Number(tarif_demi_journee)) ||
            Number(tarif_demi_journee) < 0
        ) {
            return res.status(400).json({
                message: "Le tarif demi-journée est invalide"
            });
        }

        const statutFinal = statut || "DISPONIBLE";

        const statutsAutorises = [
            "DISPONIBLE",
            "OCCUPEE",
            "HORS_SERVICE"
        ];

        if (!statutsAutorises.includes(statutFinal)) {
            return res.status(400).json({
                message: "Statut de salle invalide"
            });
        }

        // -----------------------------
        // Vérification du nom
        // -----------------------------
        const [existante] = await pool.execute(
            `
            SELECT id_salle
            FROM salles_seminaire
            WHERE nom = ?
            `,
            [nom.trim()]
        );

        if (existante.length > 0) {
            return res.status(409).json({
                message: "Une salle portant ce nom existe déjà"
            });
        }

        // -----------------------------
        // Insertion
        // -----------------------------
        const [result] = await pool.execute(
            `
            INSERT INTO salles_seminaire
            (
                nom,
                capacite,
                description,
                tarif_journee,
                tarif_demi_journee,
                statut
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                nom.trim(),
                Number(capacite),
                description || null,
                Number(tarif_journee),
                Number(tarif_demi_journee),
                statutFinal
            ]
        );

        // -----------------------------
        // Audit
        // -----------------------------
        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "CREATION",
            table_cible: "salles_seminaire",
            id_cible: result.insertId,
            description: `Création de la salle de séminaire "${nom.trim()}"`,
            nouvelle_valeur: {
                id_salle: result.insertId,
                nom: nom.trim(),
                capacite: Number(capacite),
                description: description || null,
                tarif_journee: Number(tarif_journee),
                tarif_demi_journee: Number(tarif_demi_journee),
                statut: statutFinal
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.status(201).json({
            message: "Salle de séminaire créée avec succès",
            id_salle: result.insertId
        });

    } catch (error) {
        console.error("Erreur création salle :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la création de la salle"
        });
    }
});

// =====================================================
// PUT /api/salles-seminaire/:id
// Modifier une salle
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nom,
            capacite,
            description,
            tarif_journee,
            tarif_demi_journee,
            statut,
            id_utilisateur
        } = req.body;

        // -----------------------------
        // Vérifier que la salle existe
        // -----------------------------
        const [ancienneSalle] = await pool.execute(
            `
            SELECT *
            FROM salles_seminaire
            WHERE id_salle = ?
            `,
            [id]
        );

        if (ancienneSalle.length === 0) {
            return res.status(404).json({
                message: "Salle de séminaire introuvable"
            });
        }

        const ancienne = ancienneSalle[0];

        // -----------------------------
        // Validation
        // -----------------------------
        if (!nom || !nom.trim()) {
            return res.status(400).json({
                message: "Le nom de la salle est obligatoire"
            });
        }

        if (
            capacite === undefined ||
            capacite === null ||
            Number.isNaN(Number(capacite)) ||
            Number(capacite) <= 0
        ) {
            return res.status(400).json({
                message: "La capacité doit être supérieure à 0"
            });
        }

        if (
            tarif_journee === undefined ||
            tarif_journee === null ||
            Number.isNaN(Number(tarif_journee)) ||
            Number(tarif_journee) < 0
        ) {
            return res.status(400).json({
                message: "Le tarif journée est invalide"
            });
        }

        if (
            tarif_demi_journee === undefined ||
            tarif_demi_journee === null ||
            Number.isNaN(Number(tarif_demi_journee)) ||
            Number(tarif_demi_journee) < 0
        ) {
            return res.status(400).json({
                message: "Le tarif demi-journée est invalide"
            });
        }

        const statutFinal = statut || ancienne.statut;

        const statutsAutorises = [
            "DISPONIBLE",
            "OCCUPEE",
            "HORS_SERVICE"
        ];

        if (!statutsAutorises.includes(statutFinal)) {
            return res.status(400).json({
                message: "Statut de salle invalide"
            });
        }

        // -----------------------------
        // Vérification du nom
        // -----------------------------
        const [nomExistant] = await pool.execute(
            `
            SELECT id_salle
            FROM salles_seminaire
            WHERE nom = ?
            AND id_salle <> ?
            `,
            [nom.trim(), id]
        );

        if (nomExistant.length > 0) {
            return res.status(409).json({
                message: "Une autre salle porte déjà ce nom"
            });
        }

        // -----------------------------
        // Mise à jour
        // -----------------------------
        await pool.execute(
            `
            UPDATE salles_seminaire
            SET
                nom = ?,
                capacite = ?,
                description = ?,
                tarif_journee = ?,
                tarif_demi_journee = ?,
                statut = ?
            WHERE id_salle = ?
            `,
            [
                nom.trim(),
                Number(capacite),
                description || null,
                Number(tarif_journee),
                Number(tarif_demi_journee),
                statutFinal,
                id
            ]
        );

        // -----------------------------
        // Audit
        // -----------------------------
        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "MODIFICATION",
            table_cible: "salles_seminaire",
            id_cible: id,
            description: `Modification de la salle de séminaire "${nom.trim()}"`,
            ancienne_valeur: ancienne,
            nouvelle_valeur: {
                id_salle: Number(id),
                nom: nom.trim(),
                capacite: Number(capacite),
                description: description || null,
                tarif_journee: Number(tarif_journee),
                tarif_demi_journee: Number(tarif_demi_journee),
                statut: statutFinal
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Salle de séminaire modifiée avec succès"
        });

    } catch (error) {
        console.error("Erreur modification salle :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la modification"
        });
    }
});

// =====================================================
// PUT /api/salles-seminaire/:id/statut
// Modifier uniquement le statut
// =====================================================
router.put("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, id_utilisateur } = req.body;

        const statutsAutorises = [
            "DISPONIBLE",
            "OCCUPEE",
            "HORS_SERVICE"
        ];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({
                message: "Statut de salle invalide"
            });
        }

        const [rows] = await pool.execute(
            `
            SELECT *
            FROM salles_seminaire
            WHERE id_salle = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Salle de séminaire introuvable"
            });
        }

        const ancienne = rows[0];

        await pool.execute(
            `
            UPDATE salles_seminaire
            SET statut = ?
            WHERE id_salle = ?
            `,
            [statut, id]
        );

        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "CHANGEMENT_STATUT",
            table_cible: "salles_seminaire",
            id_cible: id,
            description: `Changement du statut de la salle "${ancienne.nom}" : ${ancienne.statut} → ${statut}`,
            ancienne_valeur: {
                statut: ancienne.statut
            },
            nouvelle_valeur: {
                statut
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Statut de la salle modifié avec succès"
        });

    } catch (error) {
        console.error("Erreur changement statut salle :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});

// =====================================================
// DELETE /api/salles-seminaire/:id
// Supprimer une salle
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { id_utilisateur } = req.body;

        // -----------------------------
        // Vérifier que la salle existe
        // -----------------------------
        const [rows] = await pool.execute(
            `
            SELECT *
            FROM salles_seminaire
            WHERE id_salle = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Salle de séminaire introuvable"
            });
        }

        const salle = rows[0];

        // -----------------------------
        // Vérifier les réservations
        // -----------------------------
        const [reservations] = await pool.execute(
            `
            SELECT COUNT(*) AS total
            FROM reservations_salle
            WHERE id_salle = ?
            `,
            [id]
        );

        if (Number(reservations[0].total) > 0) {
            return res.status(409).json({
                message:
                    "Impossible de supprimer cette salle car elle possède des réservations"
            });
        }

        // -----------------------------
        // Suppression
        // -----------------------------
        await pool.execute(
            `
            DELETE FROM salles_seminaire
            WHERE id_salle = ?
            `,
            [id]
        );

        // -----------------------------
        // Audit
        // -----------------------------
        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "SUPPRESSION",
            table_cible: "salles_seminaire",
            id_cible: id,
            description: `Suppression de la salle de séminaire "${salle.nom}"`,
            ancienne_valeur: salle,
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Salle de séminaire supprimée avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression salle :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la suppression"
        });
    }
});

module.exports = router;