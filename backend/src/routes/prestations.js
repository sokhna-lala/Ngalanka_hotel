const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// =====================================================
// GET — Liste des prestations
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [prestations] = await pool.execute(`
            SELECT
                id_prestation,
                libelle,
                categorie,
                tarif,
                unite,
                description,
                statut,
                date_creation
            FROM prestations
            ORDER BY libelle ASC
        `);

        res.json(prestations);

    } catch (error) {
        console.error("Erreur récupération prestations :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des prestations"
        });
    }
});


// =====================================================
// GET — Une prestation par ID
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [prestations] = await pool.execute(`
            SELECT
                id_prestation,
                libelle,
                categorie,
                tarif,
                unite,
                description,
                statut,
                date_creation
            FROM prestations
            WHERE id_prestation = ?
        `, [id]);

        if (prestations.length === 0) {
            return res.status(404).json({
                message: "Prestation introuvable"
            });
        }

        res.json(prestations[0]);

    } catch (error) {
        console.error("Erreur récupération prestation :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération de la prestation"
        });
    }
});


// =====================================================
// POST — Créer une prestation
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            libelle,
            categorie,
            tarif,
            unite,
            description
        } = req.body;

        if (!libelle || !libelle.trim()) {
            return res.status(400).json({
                message: "Le nom de la prestation est obligatoire"
            });
        }

        const categoriesAutorisees = [
            "PISCINE",
            "SPORT",
            "LOISIR",
            "EVENEMENT",
            "AUTRE"
        ];

        const categorieFinale = categorie || "AUTRE";

        if (!categoriesAutorisees.includes(categorieFinale)) {
            return res.status(400).json({
                message: "Catégorie invalide"
            });
        }

        const tarifFinal = tarif !== undefined && tarif !== ""
            ? Number(tarif)
            : 0;

        if (isNaN(tarifFinal) || tarifFinal < 0) {
            return res.status(400).json({
                message: "Le tarif doit être un nombre positif ou nul"
            });
        }

        const uniteFinale =
            unite && unite.trim()
                ? unite.trim()
                : "Unité";

        const [result] = await pool.execute(`
            INSERT INTO prestations
            (
                libelle,
                categorie,
                tarif,
                unite,
                description,
                statut
            )
            VALUES (?, ?, ?, ?, ?, 'ACTIF')
        `, [
            libelle.trim(),
            categorieFinale,
            tarifFinal,
            uniteFinale,
            description || null
        ]);

        res.status(201).json({
            message: "Prestation créée avec succès",
            id_prestation: result.insertId
        });

    } catch (error) {
        console.error("Erreur création prestation :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "Une prestation avec ce nom existe déjà"
            });
        }

        res.status(500).json({
            message: "Erreur lors de la création de la prestation"
        });
    }
});


// =====================================================
// PUT — Modifier une prestation
// =====================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            libelle,
            categorie,
            tarif,
            unite,
            description
        } = req.body;

        if (!libelle || !libelle.trim()) {
            return res.status(400).json({
                message: "Le nom de la prestation est obligatoire"
            });
        }

        const categoriesAutorisees = [
            "PISCINE",
            "SPORT",
            "LOISIR",
            "EVENEMENT",
            "AUTRE"
        ];

        if (!categoriesAutorisees.includes(categorie)) {
            return res.status(400).json({
                message: "Catégorie invalide"
            });
        }

        const tarifFinal = tarif !== undefined && tarif !== ""
            ? Number(tarif)
            : 0;

        if (isNaN(tarifFinal) || tarifFinal < 0) {
            return res.status(400).json({
                message: "Le tarif doit être un nombre positif ou nul"
            });
        }

        const uniteFinale =
            unite && unite.trim()
                ? unite.trim()
                : "Unité";

        const [result] = await pool.execute(`
            UPDATE prestations
            SET
                libelle = ?,
                categorie = ?,
                tarif = ?,
                unite = ?,
                description = ?
            WHERE id_prestation = ?
        `, [
            libelle.trim(),
            categorie,
            tarifFinal,
            uniteFinale,
            description || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Prestation introuvable"
            });
        }

        res.json({
            message: "Prestation modifiée avec succès"
        });

    } catch (error) {
        console.error("Erreur modification prestation :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "Une prestation avec ce nom existe déjà"
            });
        }

        res.status(500).json({
            message: "Erreur lors de la modification de la prestation"
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

        const [result] = await pool.execute(`
            UPDATE prestations
            SET statut = ?
            WHERE id_prestation = ?
        `, [statut, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Prestation introuvable"
            });
        }

        res.json({
            message: "Statut modifié avec succès",
            statut
        });

    } catch (error) {
        console.error("Erreur changement statut prestation :", error);

        res.status(500).json({
            message: "Erreur lors du changement de statut"
        });
    }
});


// =====================================================
// DELETE — Supprimer une prestation
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(`
            DELETE FROM prestations
            WHERE id_prestation = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Prestation introuvable"
            });
        }

        res.json({
            message: "Prestation supprimée avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression prestation :", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({
                message: "Impossible de supprimer cette prestation car elle est déjà utilisée"
            });
        }

        res.status(500).json({
            message: "Impossible de supprimer cette prestation"
        });
    }
});


module.exports = router;