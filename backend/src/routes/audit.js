const express = require("express");
const router = express.Router();

const db = require("../config/database");

// =====================================================
// GET — Journal complet
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                ja.id_audit,
                ja.id_utilisateur,
                u.nom_utilisateur,
                u.nom_complet,
                r.nom_role,
                ja.action,
                ja.table_cible,
                ja.id_cible,
                ja.description,
                ja.ancienne_valeur,
                ja.nouvelle_valeur,
                ja.adresse_ip,
                ja.user_agent,
                ja.date_action
            FROM journal_audit ja
            LEFT JOIN utilisateurs u
                ON ja.id_utilisateur = u.id_utilisateur
            LEFT JOIN roles r
                ON u.id_role = r.id_role
            ORDER BY ja.date_action DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Erreur GET /audit :", error);

        res.status(500).json({
            message: "Erreur lors du chargement du journal d'audit",
        });
    }
});

// =====================================================
// GET — Audit par ID
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                ja.id_audit,
                ja.id_utilisateur,
                u.nom_utilisateur,
                u.nom_complet,
                r.nom_role,
                ja.action,
                ja.table_cible,
                ja.id_cible,
                ja.description,
                ja.ancienne_valeur,
                ja.nouvelle_valeur,
                ja.adresse_ip,
                ja.user_agent,
                ja.date_action
            FROM journal_audit ja
            LEFT JOIN utilisateurs u
                ON ja.id_utilisateur = u.id_utilisateur
            LEFT JOIN roles r
                ON u.id_role = r.id_role
            WHERE ja.id_audit = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Entrée d'audit introuvable",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Erreur GET /audit/:id :", error);

        res.status(500).json({
            message: "Erreur lors du chargement de l'entrée d'audit",
        });
    }
});

// =====================================================
// POST — Ajouter une entrée au journal
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            id_utilisateur,
            action,
            table_cible,
            id_cible,
            description,
            ancienne_valeur,
            nouvelle_valeur,
            adresse_ip,
            user_agent,
        } = req.body;

        if (!action || !action.trim()) {
            return res.status(400).json({
                message: "L'action est obligatoire",
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO journal_audit
            (
                id_utilisateur,
                action,
                table_cible,
                id_cible,
                description,
                ancienne_valeur,
                nouvelle_valeur,
                adresse_ip,
                user_agent
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                id_utilisateur || null,
                action.trim(),
                table_cible || null,
                id_cible || null,
                description || null,
                ancienne_valeur
                    ? JSON.stringify(ancienne_valeur)
                    : null,
                nouvelle_valeur
                    ? JSON.stringify(nouvelle_valeur)
                    : null,
                adresse_ip || null,
                user_agent || null,
            ]
        );

        res.status(201).json({
            message: "Action enregistrée dans le journal",
            id_audit: result.insertId,
        });
    } catch (error) {
        console.error("Erreur POST /audit :", error);

        res.status(500).json({
            message: "Erreur lors de l'enregistrement de l'audit",
        });
    }
});

// =====================================================
// DELETE — Supprimer une entrée
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM journal_audit
            WHERE id_audit = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Entrée d'audit introuvable",
            });
        }

        res.json({
            message: "Entrée d'audit supprimée",
        });
    } catch (error) {
        console.error("Erreur DELETE /audit/:id :", error);

        res.status(500).json({
            message: "Erreur lors de la suppression",
        });
    }
});

module.exports = router;