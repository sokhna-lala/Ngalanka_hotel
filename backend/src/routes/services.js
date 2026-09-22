const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const enregistrerAudit = require("../utils/audit");

// =====================================================
// GET — Liste des services
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [services] = await pool.execute(`
            SELECT
                id_service,
                nom_service,
                description,
                statut,
                date_creation,
                date_modification
            FROM services
            ORDER BY nom_service ASC
        `);

        res.json(services);

    } catch (error) {
        console.error("Erreur récupération services :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la récupération des services"
        });
    }
});


// =====================================================
// GET — Services actifs
// =====================================================

router.get("/actifs", async (req, res) => {
    try {
        const [services] = await pool.execute(`
            SELECT
                id_service,
                nom_service,
                description
            FROM services
            WHERE statut = 'ACTIF'
            ORDER BY nom_service ASC
        `);

        res.json(services);

    } catch (error) {
        console.error("Erreur récupération services actifs :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// GET — Un service
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [services] = await pool.execute(
            `
            SELECT
                id_service,
                nom_service,
                description,
                statut,
                date_creation,
                date_modification
            FROM services
            WHERE id_service = ?
            LIMIT 1
            `,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                message: "Service introuvable"
            });
        }

        res.json(services[0]);

    } catch (error) {
        console.error("Erreur récupération service :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// POST — Créer un service
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            nom_service,
            description,
            id_utilisateur
        } = req.body;

        if (!nom_service || !nom_service.trim()) {
            return res.status(400).json({
                message: "Le nom du service est obligatoire"
            });
        }

        const nomService = nom_service.trim();
        const descriptionService = description?.trim() || null;

        const [existant] = await pool.execute(
            `
            SELECT id_service
            FROM services
            WHERE nom_service = ?
            LIMIT 1
            `,
            [nomService]
        );

        if (existant.length > 0) {
            return res.status(409).json({
                message: "Ce service existe déjà"
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO services (
                nom_service,
                description
            )
            VALUES (?, ?)
            `,
            [
                nomService,
                descriptionService
            ]
        );

        const idService = result.insertId;

        // =====================================================
        // AUDIT — Création
        // =====================================================

        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "CREATION",
            table_cible: "services",
            id_cible: idService,
            description: `Création du service "${nomService}"`,
            ancienne_valeur: null,
            nouvelle_valeur: {
                id_service: idService,
                nom_service: nomService,
                description: descriptionService,
                statut: "ACTIF"
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.status(201).json({
            message: "Service créé avec succès",
            id_service: idService
        });

    } catch (error) {
        console.error("Erreur création service :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la création du service"
        });
    }
});


// =====================================================
// PUT — Modifier un service
// =====================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nom_service,
            description,
            id_utilisateur
        } = req.body;

        if (!nom_service || !nom_service.trim()) {
            return res.status(400).json({
                message: "Le nom du service est obligatoire"
            });
        }

        const nomService = nom_service.trim();
        const descriptionService = description?.trim() || null;

        // Récupérer l'ancienne valeur
        const [services] = await pool.execute(
            `
            SELECT
                id_service,
                nom_service,
                description,
                statut
            FROM services
            WHERE id_service = ?
            LIMIT 1
            `,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                message: "Service introuvable"
            });
        }

        const ancienService = services[0];

        // Vérifier les doublons
        const [doublon] = await pool.execute(
            `
            SELECT id_service
            FROM services
            WHERE nom_service = ?
            AND id_service != ?
            LIMIT 1
            `,
            [nomService, id]
        );

        if (doublon.length > 0) {
            return res.status(409).json({
                message: "Ce nom de service est déjà utilisé"
            });
        }

        await pool.execute(
            `
            UPDATE services
            SET
                nom_service = ?,
                description = ?
            WHERE id_service = ?
            `,
            [
                nomService,
                descriptionService,
                id
            ]
        );

        // =====================================================
        // AUDIT — Modification
        // =====================================================

        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "MODIFICATION",
            table_cible: "services",
            id_cible: id,
            description: `Modification du service "${nomService}"`,
            ancienne_valeur: ancienService,
            nouvelle_valeur: {
                id_service: Number(id),
                nom_service: nomService,
                description: descriptionService,
                statut: ancienService.statut
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Service modifié avec succès"
        });

    } catch (error) {
        console.error("Erreur modification service :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la modification du service"
        });
    }
});


// =====================================================
// PUT — Modifier le statut
// =====================================================

router.put("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            statut,
            id_utilisateur
        } = req.body;

        const statutsAutorises = [
            "ACTIF",
            "INACTIF"
        ];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({
                message: "Statut invalide"
            });
        }

        // Récupérer l'ancien statut
        const [services] = await pool.execute(
            `
            SELECT
                id_service,
                nom_service,
                statut
            FROM services
            WHERE id_service = ?
            LIMIT 1
            `,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                message: "Service introuvable"
            });
        }

        const ancienService = services[0];

        const [result] = await pool.execute(
            `
            UPDATE services
            SET statut = ?
            WHERE id_service = ?
            `,
            [statut, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Service introuvable"
            });
        }

        // =====================================================
        // AUDIT — Changement de statut
        // =====================================================

        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "CHANGEMENT_STATUT",
            table_cible: "services",
            id_cible: id,
            description: `Changement du statut du service "${ancienService.nom_service}" : ${ancienService.statut} → ${statut}`,
            ancienne_valeur: {
                statut: ancienService.statut
            },
            nouvelle_valeur: {
                statut: statut
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Statut du service modifié avec succès",
            statut
        });

    } catch (error) {
        console.error("Erreur changement statut service :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// DELETE — Supprimer un service
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { id_utilisateur } = req.body || {};

        // Récupérer le service avant suppression
        const [services] = await pool.execute(
            `
            SELECT
                id_service,
                nom_service,
                description,
                statut
            FROM services
            WHERE id_service = ?
            LIMIT 1
            `,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                message: "Service introuvable"
            });
        }

        const ancienService = services[0];

        const [result] = await pool.execute(
            `
            DELETE FROM services
            WHERE id_service = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Service introuvable"
            });
        }

        // =====================================================
        // AUDIT — Suppression
        // =====================================================

        await enregistrerAudit({
            id_utilisateur: id_utilisateur || null,
            action: "SUPPRESSION",
            table_cible: "services",
            id_cible: id,
            description: `Suppression du service "${ancienService.nom_service}"`,
            ancienne_valeur: ancienService,
            nouvelle_valeur: null,
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Service supprimé avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression service :", error);

        res.status(500).json({
            message: "Impossible de supprimer ce service. Il peut être utilisé par un employé."
        });
    }
});


module.exports = router;