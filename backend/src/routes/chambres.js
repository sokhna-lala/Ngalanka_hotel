const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ==========================================
// GET - Liste des chambres
// ==========================================
router.get("/", async (req, res) => {
    try {
        const [chambres] = await pool.execute(`
            SELECT
                c.id_chambre,
                c.numero,
                c.id_type,
                t.libelle AS type_chambre,
                t.capacite,
                t.nombre_lits,
                c.etage,
                c.description,
                c.tarif,
                c.statut,
                c.observation,
                c.date_creation,
                c.date_modification
            FROM chambres c
            INNER JOIN types_chambre t
                ON c.id_type = t.id_type
            ORDER BY c.numero ASC
        `);

        res.json(chambres);

    } catch (error) {
        console.error("Erreur récupération chambres :", error);

        res.status(500).json({
            message: "Impossible de récupérer les chambres"
        });
    }
});


// ==========================================
// GET - Types de chambres
// IMPORTANT : cette route doit être AVANT /:id
// ==========================================
router.get("/types/liste", async (req, res) => {
    try {
        const [types] = await pool.execute(`
            SELECT
                id_type,
                libelle,
                description,
                capacite,
                nombre_lits,
                tarif_base,
                statut
            FROM types_chambre
            WHERE statut = 'ACTIF'
            ORDER BY libelle ASC
        `);

        res.json(types);

    } catch (error) {
        console.error("Erreur récupération types :", error);

        res.status(500).json({
            message: "Impossible de récupérer les types de chambres"
        });
    }
});


// ==========================================
// GET - Une chambre
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const [chambres] = await pool.execute(`
            SELECT
                c.id_chambre,
                c.numero,
                c.id_type,
                t.libelle AS type_chambre,
                t.capacite,
                t.nombre_lits,
                c.etage,
                c.description,
                c.tarif,
                c.statut,
                c.observation,
                c.date_creation,
                c.date_modification
            FROM chambres c
            INNER JOIN types_chambre t
                ON c.id_type = t.id_type
            WHERE c.id_chambre = ?
        `, [req.params.id]);

        if (chambres.length === 0) {
            return res.status(404).json({
                message: "Chambre introuvable"
            });
        }

        res.json(chambres[0]);

    } catch (error) {
        console.error("Erreur récupération chambre :", error);

        res.status(500).json({
            message: "Impossible de récupérer la chambre"
        });
    }
});


// ==========================================
// POST - Ajouter une chambre
// ==========================================
router.post("/", async (req, res) => {
    try {

        const {
            numero,
            id_type,
            etage,
            description,
            tarif,
            statut,
            observation
        } = req.body;

        // Vérification des champs obligatoires
        if (!numero || !id_type || tarif === undefined || tarif === "") {
            return res.status(400).json({
                message: "Le numéro, le type et le tarif sont obligatoires"
            });
        }

        // Vérifier que le type existe
        const [types] = await pool.execute(
            `
            SELECT id_type
            FROM types_chambre
            WHERE id_type = ?
            `,
            [id_type]
        );

        if (types.length === 0) {
            return res.status(400).json({
                message: "Le type de chambre sélectionné n'existe pas"
            });
        }

        // Vérifier si le numéro existe déjà
        const [existante] = await pool.execute(
            `
            SELECT id_chambre
            FROM chambres
            WHERE numero = ?
            `,
            [numero]
        );

        if (existante.length > 0) {
            return res.status(409).json({
                message: "Ce numéro de chambre existe déjà"
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO chambres (
                numero,
                id_type,
                etage,
                description,
                tarif,
                statut,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                numero,
                id_type,
                etage || null,
                description || null,
                tarif,
                statut || "DISPONIBLE",
                observation || null
            ]
        );

        res.status(201).json({
            message: "Chambre ajoutée avec succès",
            id_chambre: result.insertId
        });

    } catch (error) {

        console.error("Erreur ajout chambre :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Ce numéro de chambre existe déjà"
            });
        }

        res.status(500).json({
            message: "Impossible d'ajouter la chambre"
        });
    }
});


// ==========================================
// PUT - Modifier une chambre
// ==========================================
router.put("/:id", async (req, res) => {
    try {

        const {
            numero,
            id_type,
            etage,
            description,
            tarif,
            statut,
            observation
        } = req.body;

        // Vérification des champs obligatoires
        if (!numero || !id_type || tarif === undefined || tarif === "") {
            return res.status(400).json({
                message: "Le numéro, le type et le tarif sont obligatoires"
            });
        }

        // Vérifier que la chambre existe
        const [chambreExistante] = await pool.execute(
            `
            SELECT id_chambre
            FROM chambres
            WHERE id_chambre = ?
            `,
            [req.params.id]
        );

        if (chambreExistante.length === 0) {
            return res.status(404).json({
                message: "Chambre introuvable"
            });
        }

        // Vérifier que le type existe
        const [types] = await pool.execute(
            `
            SELECT id_type
            FROM types_chambre
            WHERE id_type = ?
            `,
            [id_type]
        );

        if (types.length === 0) {
            return res.status(400).json({
                message: "Le type de chambre sélectionné n'existe pas"
            });
        }

        // Vérifier que le numéro n'est pas utilisé par une autre chambre
        const [numeroExistant] = await pool.execute(
            `
            SELECT id_chambre
            FROM chambres
            WHERE numero = ?
            AND id_chambre != ?
            `,
            [numero, req.params.id]
        );

        if (numeroExistant.length > 0) {
            return res.status(409).json({
                message: "Ce numéro de chambre est déjà utilisé"
            });
        }

        const [result] = await pool.execute(
            `
            UPDATE chambres
            SET
                numero = ?,
                id_type = ?,
                etage = ?,
                description = ?,
                tarif = ?,
                statut = ?,
                observation = ?
            WHERE id_chambre = ?
            `,
            [
                numero,
                id_type,
                etage || null,
                description || null,
                tarif,
                statut || "DISPONIBLE",
                observation || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Chambre introuvable"
            });
        }

        res.json({
            message: "Chambre modifiée avec succès"
        });

    } catch (error) {

        console.error("Erreur modification chambre :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Ce numéro de chambre existe déjà"
            });
        }

        res.status(500).json({
            message: "Impossible de modifier la chambre"
        });
    }
});


module.exports = router;