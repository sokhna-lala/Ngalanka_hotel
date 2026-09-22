const express = require("express");
const router = express.Router();

const db = require("../config/database");

// =====================================================
// GET — Tous les paramètres
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id_parametre,
                cle,
                valeur,
                description,
                type_valeur,
                date_modification
            FROM parametres
            ORDER BY cle ASC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Erreur GET /parametres :", error);

        res.status(500).json({
            message: "Erreur lors du chargement des paramètres",
        });
    }
});

// =====================================================
// GET — Un paramètre par ID
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                id_parametre,
                cle,
                valeur,
                description,
                type_valeur,
                date_modification
            FROM parametres
            WHERE id_parametre = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Paramètre introuvable",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Erreur GET /parametres/:id :", error);

        res.status(500).json({
            message: "Erreur lors du chargement du paramètre",
        });
    }
});

// =====================================================
// GET — Paramètre par clé
// Exemple : /api/parametres/cle/nom_hotel
// =====================================================

router.get("/cle/:cle", async (req, res) => {
    try {
        const { cle } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                id_parametre,
                cle,
                valeur,
                description,
                type_valeur,
                date_modification
            FROM parametres
            WHERE cle = ?
            `,
            [cle]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Paramètre introuvable",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Erreur GET /parametres/cle/:cle :", error);

        res.status(500).json({
            message: "Erreur lors du chargement du paramètre",
        });
    }
});

// =====================================================
// PUT — Modifier un paramètre
// =====================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { valeur, description } = req.body;

        if (valeur === undefined || valeur === null) {
            return res.status(400).json({
                message: "La valeur du paramètre est obligatoire",
            });
        }

        const [existant] = await db.query(
            `
            SELECT id_parametre
            FROM parametres
            WHERE id_parametre = ?
            `,
            [id]
        );

        if (existant.length === 0) {
            return res.status(404).json({
                message: "Paramètre introuvable",
            });
        }

        await db.query(
            `
            UPDATE parametres
            SET
                valeur = ?,
                description = ?
            WHERE id_parametre = ?
            `,
            [
                String(valeur),
                description || null,
                id,
            ]
        );

        const [rows] = await db.query(
            `
            SELECT
                id_parametre,
                cle,
                valeur,
                description,
                type_valeur,
                date_modification
            FROM parametres
            WHERE id_parametre = ?
            `,
            [id]
        );

        res.json({
            message: "Paramètre modifié avec succès",
            parametre: rows[0],
        });
    } catch (error) {
        console.error("Erreur PUT /parametres/:id :", error);

        res.status(500).json({
            message: "Erreur lors de la modification du paramètre",
        });
    }
});

// =====================================================
// POST — Créer un paramètre
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            cle,
            valeur,
            description,
            type_valeur,
        } = req.body;

        if (!cle || !cle.trim()) {
            return res.status(400).json({
                message: "La clé est obligatoire",
            });
        }

        if (valeur === undefined || valeur === null) {
            return res.status(400).json({
                message: "La valeur est obligatoire",
            });
        }

        const typeAutorise = [
            "TEXTE",
            "NOMBRE",
            "BOOLEAN",
            "JSON",
        ];

        const typeFinal =
            type_valeur || "TEXTE";

        if (!typeAutorise.includes(typeFinal)) {
            return res.status(400).json({
                message: "Type de valeur invalide",
            });
        }

        const [existant] = await db.query(
            `
            SELECT id_parametre
            FROM parametres
            WHERE cle = ?
            `,
            [cle.trim()]
        );

        if (existant.length > 0) {
            return res.status(409).json({
                message: "Cette clé existe déjà",
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO parametres
            (
                cle,
                valeur,
                description,
                type_valeur
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cle.trim(),
                String(valeur),
                description || null,
                typeFinal,
            ]
        );

        const [rows] = await db.query(
            `
            SELECT
                id_parametre,
                cle,
                valeur,
                description,
                type_valeur,
                date_modification
            FROM parametres
            WHERE id_parametre = ?
            `,
            [result.insertId]
        );

        res.status(201).json({
            message: "Paramètre créé avec succès",
            parametre: rows[0],
        });
    } catch (error) {
        console.error("Erreur POST /parametres :", error);

        res.status(500).json({
            message: "Erreur lors de la création du paramètre",
        });
    }
});

// =====================================================
// DELETE — Supprimer un paramètre
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM parametres
            WHERE id_parametre = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Paramètre introuvable",
            });
        }

        res.json({
            message: "Paramètre supprimé avec succès",
        });
    } catch (error) {
        console.error("Erreur DELETE /parametres/:id :", error);

        res.status(500).json({
            message: "Erreur lors de la suppression du paramètre",
        });
    }
});

module.exports = router;