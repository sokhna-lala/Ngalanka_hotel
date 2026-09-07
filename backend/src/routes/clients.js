const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ==========================================
// GET - Liste des clients
// ==========================================
router.get("/", async (req, res) => {
    try {
        const [clients] = await pool.execute(`
            SELECT
                id_client,
                code_client,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                email,
                adresse,
                ville,
                pays,
                nationalite,
                type_piece,
                numero_piece,
                entreprise,
                observation,
                date_creation
            FROM clients
            ORDER BY date_creation DESC
        `);

        res.json(clients);

    } catch (error) {
        console.error("Erreur récupération clients :", error);

        res.status(500).json({
            message: "Impossible de récupérer les clients"
        });
    }
});

// ==========================================
// GET - Un client
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const [clients] = await pool.execute(
            `
            SELECT *
            FROM clients
            WHERE id_client = ?
            `,
            [req.params.id]
        );

        if (clients.length === 0) {
            return res.status(404).json({
                message: "Client introuvable"
            });
        }

        res.json(clients[0]);

    } catch (error) {
        console.error("Erreur récupération client :", error);

        res.status(500).json({
            message: "Impossible de récupérer le client"
        });
    }
});

// ==========================================
// POST - Ajouter un client
// ==========================================
router.post("/", async (req, res) => {
    try {
        const {
            code_client,
            nom,
            prenom,
            sexe,
            date_naissance,
            telephone,
            email,
            adresse,
            ville,
            pays,
            nationalite,
            type_piece,
            numero_piece,
            entreprise,
            observation
        } = req.body;

        if (!code_client || !nom) {
            return res.status(400).json({
                message: "Le code client et le nom sont obligatoires"
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO clients (
                code_client,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                email,
                adresse,
                ville,
                pays,
                nationalite,
                type_piece,
                numero_piece,
                entreprise,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                code_client,
                nom,
                prenom || null,
                sexe || null,
                date_naissance || null,
                telephone || null,
                email || null,
                adresse || null,
                ville || null,
                pays || "Sénégal",
                nationalite || "Sénégalaise",
                type_piece || null,
                numero_piece || null,
                entreprise || null,
                observation || null
            ]
        );

        res.status(201).json({
            message: "Client ajouté avec succès",
            id_client: result.insertId
        });

    } catch (error) {
        console.error("Erreur ajout client :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Ce code client existe déjà"
            });
        }

        res.status(500).json({
            message: "Impossible d'ajouter le client"
        });
    }
});

// ==========================================
// PUT - Modifier un client
// ==========================================
router.put("/:id", async (req, res) => {
    try {
        const {
            code_client,
            nom,
            prenom,
            sexe,
            date_naissance,
            telephone,
            email,
            adresse,
            ville,
            pays,
            nationalite,
            type_piece,
            numero_piece,
            entreprise,
            observation
        } = req.body;

        if (!code_client || !nom) {
            return res.status(400).json({
                message: "Le code client et le nom sont obligatoires"
            });
        }

        const [result] = await pool.execute(
            `
            UPDATE clients
            SET
                code_client = ?,
                nom = ?,
                prenom = ?,
                sexe = ?,
                date_naissance = ?,
                telephone = ?,
                email = ?,
                adresse = ?,
                ville = ?,
                pays = ?,
                nationalite = ?,
                type_piece = ?,
                numero_piece = ?,
                entreprise = ?,
                observation = ?
            WHERE id_client = ?
            `,
            [
                code_client,
                nom,
                prenom || null,
                sexe || null,
                date_naissance || null,
                telephone || null,
                email || null,
                adresse || null,
                ville || null,
                pays || "Sénégal",
                nationalite || "Sénégalaise",
                type_piece || null,
                numero_piece || null,
                entreprise || null,
                observation || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Client introuvable"
            });
        }

        res.json({
            message: "Client modifié avec succès"
        });

    } catch (error) {
        console.error("Erreur modification client :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Ce code client existe déjà"
            });
        }

        res.status(500).json({
            message: "Impossible de modifier le client"
        });
    }
});

// ==========================================
// DELETE - Supprimer un client
// ==========================================
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.execute(
            `
            DELETE FROM clients
            WHERE id_client = ?
            `,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Client introuvable"
            });
        }

        res.json({
            message: "Client supprimé avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression client :", error);

        res.status(500).json({
            message: "Impossible de supprimer le client"
        });
    }
});

module.exports = router;