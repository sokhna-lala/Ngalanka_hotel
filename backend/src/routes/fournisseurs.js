const express = require("express");
const router = express.Router();
const pool = require("../config/database");


// ==========================================
// GET - LISTE DES FOURNISSEURS
// ==========================================
router.get("/", async (req, res) => {
    try {

        const [fournisseurs] = await pool.execute(`
            SELECT
                id_fournisseur,
                raison_sociale,
                telephone,
                email,
                adresse,
                ville,
                pays,
                contact,
                observation,
                statut,
                date_creation
            FROM fournisseurs
            ORDER BY raison_sociale ASC
        `);

        res.json(fournisseurs);

    } catch (error) {

        console.error("Erreur récupération fournisseurs :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des fournisseurs"
        });
    }
});


// ==========================================
// GET - UN FOURNISSEUR PAR ID
// ==========================================
router.get("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const [fournisseurs] = await pool.execute(`
            SELECT
                id_fournisseur,
                raison_sociale,
                telephone,
                email,
                adresse,
                ville,
                pays,
                contact,
                observation,
                statut,
                date_creation
            FROM fournisseurs
            WHERE id_fournisseur = ?
        `, [id]);

        if (fournisseurs.length === 0) {
            return res.status(404).json({
                message: "Fournisseur introuvable"
            });
        }

        res.json(fournisseurs[0]);

    } catch (error) {

        console.error("Erreur récupération fournisseur :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération du fournisseur"
        });
    }
});


// ==========================================
// POST - AJOUTER UN FOURNISSEUR
// ==========================================
router.post("/", async (req, res) => {
    try {

        const {
            raison_sociale,
            telephone,
            email,
            adresse,
            ville,
            pays,
            contact,
            observation
        } = req.body;


        // Vérification obligatoire
        if (!raison_sociale) {
            return res.status(400).json({
                message: "La raison sociale est obligatoire"
            });
        }


        const [result] = await pool.execute(`
            INSERT INTO fournisseurs (
                raison_sociale,
                telephone,
                email,
                adresse,
                ville,
                pays,
                contact,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            raison_sociale,
            telephone || null,
            email || null,
            adresse || null,
            ville || null,
            pays || "Sénégal",
            contact || null,
            observation || null
        ]);


        res.status(201).json({
            message: "Fournisseur ajouté avec succès",
            id_fournisseur: result.insertId
        });

    } catch (error) {

        console.error("Erreur ajout fournisseur :", error);

        res.status(500).json({
            message: "Erreur lors de l'ajout du fournisseur"
        });
    }
});


// ==========================================
// PUT - MODIFIER UN FOURNISSEUR
// ==========================================
router.put("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            raison_sociale,
            telephone,
            email,
            adresse,
            ville,
            pays,
            contact,
            observation,
            statut
        } = req.body;


        // Vérification obligatoire
        if (!raison_sociale) {
            return res.status(400).json({
                message: "La raison sociale est obligatoire"
            });
        }


        const [result] = await pool.execute(`
            UPDATE fournisseurs
            SET
                raison_sociale = ?,
                telephone = ?,
                email = ?,
                adresse = ?,
                ville = ?,
                pays = ?,
                contact = ?,
                observation = ?,
                statut = ?
            WHERE id_fournisseur = ?
        `, [
            raison_sociale,
            telephone || null,
            email || null,
            adresse || null,
            ville || null,
            pays || "Sénégal",
            contact || null,
            observation || null,
            statut || "ACTIF",
            id
        ]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Fournisseur introuvable"
            });
        }


        res.json({
            message: "Fournisseur modifié avec succès"
        });

    } catch (error) {

        console.error("Erreur modification fournisseur :", error);

        res.status(500).json({
            message: "Erreur lors de la modification du fournisseur"
        });
    }
});


// ==========================================
// PATCH - ACTIVER / DÉSACTIVER
// ==========================================
router.patch("/:id/statut", async (req, res) => {
    try {

        const { id } = req.params;
        const { statut } = req.body;


        // Vérifier le statut
        if (!["ACTIF", "INACTIF"].includes(statut)) {
            return res.status(400).json({
                message: "Statut invalide"
            });
        }


        const [result] = await pool.execute(`
            UPDATE fournisseurs
            SET statut = ?
            WHERE id_fournisseur = ?
        `, [statut, id]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Fournisseur introuvable"
            });
        }


        res.json({
            message:
                statut === "ACTIF"
                    ? "Fournisseur activé avec succès"
                    : "Fournisseur désactivé avec succès"
        });

    } catch (error) {

        console.error("Erreur modification statut :", error);

        res.status(500).json({
            message: "Erreur lors de la modification du statut"
        });
    }
});


module.exports = router;