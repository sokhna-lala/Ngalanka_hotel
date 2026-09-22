const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const enregistrerAudit = require("../utils/audit");

// =====================================================
// GET — Liste des employés
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [employes] = await pool.execute(`
            SELECT
                id_employe,
                matricule,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                email,
                adresse,
                fonction,
                service,
                date_embauche,
                salaire,
                statut,
                observation,
                date_creation
            FROM employes
            ORDER BY date_creation DESC
        `);

        res.json(employes);

    } catch (error) {
        console.error("Erreur récupération employés :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la récupération des employés"
        });
    }
});


// =====================================================
// GET — Un employé par son ID
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [employes] = await pool.execute(
            `
            SELECT
                id_employe,
                matricule,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                email,
                adresse,
                fonction,
                service,
                date_embauche,
                salaire,
                statut,
                observation,
                date_creation
            FROM employes
            WHERE id_employe = ?
            LIMIT 1
            `,
            [id]
        );

        if (employes.length === 0) {
            return res.status(404).json({
                message: "Employé introuvable"
            });
        }

        res.json(employes[0]);

    } catch (error) {
        console.error("Erreur récupération employé :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// POST — Créer un employé
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            matricule,
            nom,
            prenom,
            sexe,
            date_naissance,
            telephone,
            email,
            adresse,
            fonction,
            service,
            date_embauche,
            salaire,
            statut,
            observation
        } = req.body;

        // -----------------------------
        // Validation
        // -----------------------------

        if (!matricule || !nom) {
            return res.status(400).json({
                message: "Le matricule et le nom sont obligatoires"
            });
        }

        // -----------------------------
        // Vérification matricule
        // -----------------------------

        const [existant] = await pool.execute(
            `
            SELECT id_employe
            FROM employes
            WHERE matricule = ?
            LIMIT 1
            `,
            [matricule]
        );

        if (existant.length > 0) {
            return res.status(409).json({
                message: "Ce matricule existe déjà"
            });
        }

        // -----------------------------
        // Insertion
        // -----------------------------

        const [result] = await pool.execute(
            `
            INSERT INTO employes (
                matricule,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                email,
                adresse,
                fonction,
                service,
                date_embauche,
                salaire,
                statut,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                matricule,
                nom,
                prenom || null,
                sexe || null,
                date_naissance || null,
                telephone || null,
                email || null,
                adresse || null,
                fonction || null,
                service || null,
                date_embauche || null,
                Number(salaire) || 0,
                statut || "ACTIF",
                observation || null
            ]
        );

        // -----------------------------
        // AUDIT — Création
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "CREATION",
            table_cible: "employes",
            id_cible: result.insertId,
            description: `Création de l'employé "${prenom ? prenom + " " : ""}${nom}"`,
            nouvelle_valeur: {
                matricule,
                nom,
                prenom: prenom || null,
                sexe: sexe || null,
                date_naissance: date_naissance || null,
                telephone: telephone || null,
                email: email || null,
                adresse: adresse || null,
                fonction: fonction || null,
                service: service || null,
                date_embauche: date_embauche || null,
                salaire: Number(salaire) || 0,
                statut: statut || "ACTIF",
                observation: observation || null
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.status(201).json({
            message: "Employé créé avec succès",
            id_employe: result.insertId
        });

    } catch (error) {
        console.error("Erreur création employé :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la création de l'employé"
        });
    }
});


// =====================================================
// PUT — Modifier un employé
// =====================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            matricule,
            nom,
            prenom,
            sexe,
            date_naissance,
            telephone,
            email,
            adresse,
            fonction,
            service,
            date_embauche,
            salaire,
            statut,
            observation
        } = req.body;

        if (!matricule || !nom) {
            return res.status(400).json({
                message: "Le matricule et le nom sont obligatoires"
            });
        }

        // -----------------------------
        // Vérification employé
        // -----------------------------

        const [employes] = await pool.execute(
            `
            SELECT
                id_employe,
                matricule,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                email,
                adresse,
                fonction,
                service,
                date_embauche,
                salaire,
                statut,
                observation
            FROM employes
            WHERE id_employe = ?
            LIMIT 1
            `,
            [id]
        );

        if (employes.length === 0) {
            return res.status(404).json({
                message: "Employé introuvable"
            });
        }

        const ancienneValeur = employes[0];

        // -----------------------------
        // Vérification matricule
        // -----------------------------

        const [matriculeExiste] = await pool.execute(
            `
            SELECT id_employe
            FROM employes
            WHERE matricule = ?
            AND id_employe != ?
            LIMIT 1
            `,
            [matricule, id]
        );

        if (matriculeExiste.length > 0) {
            return res.status(409).json({
                message: "Ce matricule est déjà utilisé"
            });
        }

        // -----------------------------
        // Modification
        // -----------------------------

        await pool.execute(
            `
            UPDATE employes
            SET
                matricule = ?,
                nom = ?,
                prenom = ?,
                sexe = ?,
                date_naissance = ?,
                telephone = ?,
                email = ?,
                adresse = ?,
                fonction = ?,
                service = ?,
                date_embauche = ?,
                salaire = ?,
                statut = ?,
                observation = ?
            WHERE id_employe = ?
            `,
            [
                matricule,
                nom,
                prenom || null,
                sexe || null,
                date_naissance || null,
                telephone || null,
                email || null,
                adresse || null,
                fonction || null,
                service || null,
                date_embauche || null,
                Number(salaire) || 0,
                statut || "ACTIF",
                observation || null,
                id
            ]
        );

        // -----------------------------
        // AUDIT — Modification
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "MODIFICATION",
            table_cible: "employes",
            id_cible: id,
            description: `Modification de l'employé "${prenom ? prenom + " " : ""}${nom}"`,
            ancienne_valeur: ancienneValeur,
            nouvelle_valeur: {
                matricule,
                nom,
                prenom: prenom || null,
                sexe: sexe || null,
                date_naissance: date_naissance || null,
                telephone: telephone || null,
                email: email || null,
                adresse: adresse || null,
                fonction: fonction || null,
                service: service || null,
                date_embauche: date_embauche || null,
                salaire: Number(salaire) || 0,
                statut: statut || "ACTIF",
                observation: observation || null
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Employé modifié avec succès"
        });

    } catch (error) {
        console.error("Erreur modification employé :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la modification"
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
            "INACTIF",
            "SUSPENDU"
        ];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({
                message: "Statut invalide"
            });
        }

        // -----------------------------
        // Récupérer l'ancien employé
        // -----------------------------

        const [employes] = await pool.execute(
            `
            SELECT
                id_employe,
                matricule,
                nom,
                prenom,
                statut
            FROM employes
            WHERE id_employe = ?
            LIMIT 1
            `,
            [id]
        );

        if (employes.length === 0) {
            return res.status(404).json({
                message: "Employé introuvable"
            });
        }

        const ancienStatut = employes[0].statut;

        const nomEmploye = `${employes[0].prenom ? employes[0].prenom + " " : ""}${employes[0].nom}`;

        // -----------------------------
        // Modifier le statut
        // -----------------------------

        await pool.execute(
            `
            UPDATE employes
            SET statut = ?
            WHERE id_employe = ?
            `,
            [statut, id]
        );

        // -----------------------------
        // AUDIT — Changement statut
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "CHANGEMENT_STATUT",
            table_cible: "employes",
            id_cible: id,
            description: `Changement du statut de l'employé "${nomEmploye}" : ${ancienStatut} → ${statut}`,
            ancienne_valeur: {
                statut: ancienStatut
            },
            nouvelle_valeur: {
                statut
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Statut de l'employé modifié avec succès",
            statut
        });

    } catch (error) {
        console.error("Erreur changement statut :", error);

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// DELETE — Supprimer un employé
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // -----------------------------
        // Récupérer l'employé avant suppression
        // -----------------------------

        const [employes] = await pool.execute(
            `
            SELECT
                id_employe,
                matricule,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                email,
                adresse,
                fonction,
                service,
                date_embauche,
                salaire,
                statut,
                observation
            FROM employes
            WHERE id_employe = ?
            LIMIT 1
            `,
            [id]
        );

        if (employes.length === 0) {
            return res.status(404).json({
                message: "Employé introuvable"
            });
        }

        const ancienneValeur = employes[0];

        // -----------------------------
        // Suppression
        // -----------------------------

        await pool.execute(
            `
            DELETE FROM employes
            WHERE id_employe = ?
            `,
            [id]
        );

        // -----------------------------
        // AUDIT — Suppression
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body?.id_utilisateur || null,
            action: "SUPPRESSION",
            table_cible: "employes",
            id_cible: id,
            description: `Suppression de l'employé "${ancienneValeur.prenom ? ancienneValeur.prenom + " " : ""}${ancienneValeur.nom}"`,
            ancienne_valeur: ancienneValeur,
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Employé supprimé avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression employé :", error);

        res.status(500).json({
            message: "Erreur serveur lors de la suppression"
        });
    }
});


module.exports = router;