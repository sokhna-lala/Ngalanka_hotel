const express = require("express");
const router = express.Router();

const pool = require("../config/database");

// =====================================================
// GET — Liste des fonctions
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [fonctions] = await pool.execute(`
            SELECT
                id_fonction,
                nom_fonction,
                description,
                statut,
                date_creation,
                date_modification
            FROM fonctions
            ORDER BY nom_fonction ASC
        `);

        res.json(fonctions);

    } catch (error) {
        console.error("Erreur récupération fonctions :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la récupération des fonctions"
        });
    }
});


// =====================================================
// GET — Fonctions actives
// =====================================================

router.get("/actives", async (req, res) => {
    try {
        const [fonctions] = await pool.execute(`
            SELECT
                id_fonction,
                nom_fonction,
                description
            FROM fonctions
            WHERE statut = 'ACTIF'
            ORDER BY nom_fonction ASC
        `);

        res.json(fonctions);

    } catch (error) {
        console.error("Erreur récupération fonctions actives :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// GET — Une fonction
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [fonctions] = await pool.execute(
            `
            SELECT
                id_fonction,
                nom_fonction,
                description,
                statut,
                date_creation,
                date_modification
            FROM fonctions
            WHERE id_fonction = ?
            LIMIT 1
            `,
            [id]
        );

        if (fonctions.length === 0) {
            return res.status(404).json({
                message: "Fonction introuvable"
            });
        }

        res.json(fonctions[0]);

    } catch (error) {
        console.error("Erreur récupération fonction :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// POST — Créer une fonction
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            nom_fonction,
            description
        } = req.body;

        if (!nom_fonction || !nom_fonction.trim()) {
            return res.status(400).json({
                message: "Le nom de la fonction est obligatoire"
            });
        }

        const [existant] = await pool.execute(
            `
            SELECT id_fonction
            FROM fonctions
            WHERE nom_fonction = ?
            LIMIT 1
            `,
            [nom_fonction.trim()]
        );

        if (existant.length > 0) {
            return res.status(409).json({
                message: "Cette fonction existe déjà"
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO fonctions (
                nom_fonction,
                description
            )
            VALUES (?, ?)
            `,
            [
                nom_fonction.trim(),
                description?.trim() || null
            ]
        );

        res.status(201).json({
            message: "Fonction créée avec succès",
            id_fonction: result.insertId
        });

    } catch (error) {
        console.error("Erreur création fonction :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la création de la fonction"
        });
    }
});


// =====================================================
// PUT — Modifier une fonction
// =====================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nom_fonction,
            description
        } = req.body;

        if (!nom_fonction || !nom_fonction.trim()) {
            return res.status(400).json({
                message: "Le nom de la fonction est obligatoire"
            });
        }

        const [fonction] = await pool.execute(
            `
            SELECT id_fonction
            FROM fonctions
            WHERE id_fonction = ?
            LIMIT 1
            `,
            [id]
        );

        if (fonction.length === 0) {
            return res.status(404).json({
                message: "Fonction introuvable"
            });
        }

        const [doublon] = await pool.execute(
            `
            SELECT id_fonction
            FROM fonctions
            WHERE nom_fonction = ?
            AND id_fonction != ?
            LIMIT 1
            `,
            [nom_fonction.trim(), id]
        );

        if (doublon.length > 0) {
            return res.status(409).json({
                message: "Ce nom de fonction est déjà utilisé"
            });
        }

        await pool.execute(
            `
            UPDATE fonctions
            SET
                nom_fonction = ?,
                description = ?
            WHERE id_fonction = ?
            `,
            [
                nom_fonction.trim(),
                description?.trim() || null,
                id
            ]
        );

        res.json({
            message: "Fonction modifiée avec succès"
        });

    } catch (error) {
        console.error("Erreur modification fonction :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la modification de la fonction"
        });
    }
});


// =====================================================
// PUT — Modifier le statut
// =====================================================

router.put("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        const statutsAutorises = [
            "ACTIF",
            "INACTIF"
        ];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({
                message: "Statut invalide"
            });
        }

        const [result] = await pool.execute(
            `
            UPDATE fonctions
            SET statut = ?
            WHERE id_fonction = ?
            `,
            [statut, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Fonction introuvable"
            });
        }

        res.json({
            message: "Statut de la fonction modifié avec succès",
            statut
        });

    } catch (error) {
        console.error("Erreur changement statut fonction :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// DELETE — Supprimer une fonction
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            `
            DELETE FROM fonctions
            WHERE id_fonction = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Fonction introuvable"
            });
        }

        res.json({
            message: "Fonction supprimée avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression fonction :", error);

        res.status(500).json({
            message: "Impossible de supprimer cette fonction. Elle peut être utilisée par un employé."
        });
    }
});


module.exports = router;