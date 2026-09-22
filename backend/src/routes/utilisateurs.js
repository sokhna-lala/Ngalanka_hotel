const express = require("express");
const bcrypt = require("bcryptjs");
const enregistrerAudit = require("../utils/audit");

const router = express.Router();
const pool = require("../config/database");

// =====================================================
// GET — Liste des utilisateurs
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [utilisateurs] = await pool.execute(`
            SELECT
                u.id_utilisateur,
                u.nom_utilisateur,
                u.nom_complet,
                u.id_role,
                r.nom_role,
                r.description AS description_role,
                u.telephone,
                u.email,
                u.statut,
                u.derniere_connexion,
                u.date_creation,
                u.date_modification
            FROM utilisateurs u
            INNER JOIN roles r
                ON r.id_role = u.id_role
            ORDER BY u.date_creation DESC
        `);

        res.json(utilisateurs);

    } catch (error) {
        console.error("Erreur récupération utilisateurs :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des utilisateurs"
        });
    }
});


// =====================================================
// GET — Liste des rôles
// =====================================================

router.get("/roles", async (req, res) => {
    try {
        const [roles] = await pool.execute(`
            SELECT
                id_role,
                nom_role,
                description,
                statut
            FROM roles
            WHERE statut = 'ACTIF'
            ORDER BY nom_role ASC
        `);

        res.json(roles);

    } catch (error) {
        console.error("Erreur récupération rôles :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des rôles"
        });
    }
});


// =====================================================
// GET — Utilisateur par ID
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [utilisateurs] = await pool.execute(`
            SELECT
                u.id_utilisateur,
                u.nom_utilisateur,
                u.nom_complet,
                u.id_role,
                r.nom_role,
                u.telephone,
                u.email,
                u.statut,
                u.derniere_connexion,
                u.date_creation,
                u.date_modification
            FROM utilisateurs u
            INNER JOIN roles r
                ON r.id_role = u.id_role
            WHERE u.id_utilisateur = ?
            LIMIT 1
        `, [id]);

        if (utilisateurs.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        res.json(utilisateurs[0]);

    } catch (error) {
        console.error("Erreur récupération utilisateur :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération de l'utilisateur"
        });
    }
});


// =====================================================
// POST — Créer un utilisateur
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            nom_utilisateur,
            mot_de_passe,
            nom_complet,
            id_role,
            telephone,
            email,
            statut
        } = req.body;

        // -----------------------------
        // Validation
        // -----------------------------

        if (
            !nom_utilisateur ||
            !mot_de_passe ||
            !nom_complet ||
            !id_role
        ) {
            return res.status(400).json({
                message:
                    "Nom utilisateur, mot de passe, nom complet et rôle sont obligatoires"
            });
        }

        if (mot_de_passe.length < 6) {
            return res.status(400).json({
                message:
                    "Le mot de passe doit contenir au moins 6 caractères"
            });
        }

        // -----------------------------
        // Vérifier le rôle
        // -----------------------------

        const [roles] = await pool.execute(
            `
            SELECT id_role
            FROM roles
            WHERE id_role = ?
            AND statut = 'ACTIF'
            LIMIT 1
            `,
            [id_role]
        );

        if (roles.length === 0) {
            return res.status(400).json({
                message: "Le rôle sélectionné est invalide"
            });
        }

        // -----------------------------
        // Vérifier doublon
        // -----------------------------

        const [existants] = await pool.execute(
            `
            SELECT id_utilisateur
            FROM utilisateurs
            WHERE nom_utilisateur = ?
            LIMIT 1
            `,
            [nom_utilisateur]
        );

        if (existants.length > 0) {
            return res.status(409).json({
                message: "Ce nom d'utilisateur existe déjà"
            });
        }

        // -----------------------------
        // Hash du mot de passe
        // -----------------------------

        const motDePasseHash = await bcrypt.hash(
            mot_de_passe,
            10
        );

        // -----------------------------
        // Création utilisateur
        // -----------------------------

        const [result] = await pool.execute(
            `
            INSERT INTO utilisateurs (
                nom_utilisateur,
                mot_de_passe,
                nom_complet,
                id_role,
                telephone,
                email,
                statut
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                nom_utilisateur,
                motDePasseHash,
                nom_complet,
                id_role,
                telephone || null,
                email || null,
                statut || "ACTIF"
            ]
        );

        // -----------------------------
        // AUDIT — Création
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "CREATION",
            table_cible: "utilisateurs",
            id_cible: result.insertId,
            description: `Création de l'utilisateur "${nom_utilisateur}"`,
            nouvelle_valeur: {
                nom_utilisateur,
                nom_complet,
                id_role,
                telephone: telephone || null,
                email: email || null,
                statut: statut || "ACTIF"
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            id_utilisateur: result.insertId
        });

    } catch (error) {
        console.error("Erreur création utilisateur :", error);

        res.status(500).json({
            message: "Erreur lors de la création de l'utilisateur"
        });
    }
});


// =====================================================
// PUT — Modifier un utilisateur
// =====================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nom_utilisateur,
            nom_complet,
            id_role,
            telephone,
            email,
            statut,
            mot_de_passe
        } = req.body;

        if (
            !nom_utilisateur ||
            !nom_complet ||
            !id_role
        ) {
            return res.status(400).json({
                message:
                    "Nom utilisateur, nom complet et rôle sont obligatoires"
            });
        }

        // -----------------------------
        // Vérifier utilisateur
        // -----------------------------

        const [utilisateurs] = await pool.execute(
            `
            SELECT
                id_utilisateur,
                nom_utilisateur,
                nom_complet,
                id_role,
                telephone,
                email,
                statut
            FROM utilisateurs
            WHERE id_utilisateur = ?
            LIMIT 1
            `,
            [id]
        );

        if (utilisateurs.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        const ancienneValeur = utilisateurs[0];

        // -----------------------------
        // Vérifier doublon de nom utilisateur
        // -----------------------------

        const [doublons] = await pool.execute(
            `
            SELECT id_utilisateur
            FROM utilisateurs
            WHERE nom_utilisateur = ?
            AND id_utilisateur <> ?
            LIMIT 1
            `,
            [nom_utilisateur, id]
        );

        if (doublons.length > 0) {
            return res.status(409).json({
                message: "Ce nom d'utilisateur existe déjà"
            });
        }

        // -----------------------------
        // Vérifier rôle
        // -----------------------------

        const [roles] = await pool.execute(
            `
            SELECT id_role
            FROM roles
            WHERE id_role = ?
            AND statut = 'ACTIF'
            LIMIT 1
            `,
            [id_role]
        );

        if (roles.length === 0) {
            return res.status(400).json({
                message: "Le rôle sélectionné est invalide"
            });
        }

        // -----------------------------
        // Si un nouveau mot de passe est fourni
        // -----------------------------

        if (mot_de_passe && mot_de_passe.trim() !== "") {

            if (mot_de_passe.length < 6) {
                return res.status(400).json({
                    message:
                        "Le mot de passe doit contenir au moins 6 caractères"
                });
            }

            const motDePasseHash = await bcrypt.hash(
                mot_de_passe,
                10
            );

            await pool.execute(
                `
                UPDATE utilisateurs
                SET
                    nom_utilisateur = ?,
                    mot_de_passe = ?,
                    nom_complet = ?,
                    id_role = ?,
                    telephone = ?,
                    email = ?,
                    statut = ?
                WHERE id_utilisateur = ?
                `,
                [
                    nom_utilisateur,
                    motDePasseHash,
                    nom_complet,
                    id_role,
                    telephone || null,
                    email || null,
                    statut || "ACTIF",
                    id
                ]
            );

        } else {

            await pool.execute(
                `
                UPDATE utilisateurs
                SET
                    nom_utilisateur = ?,
                    nom_complet = ?,
                    id_role = ?,
                    telephone = ?,
                    email = ?,
                    statut = ?
                WHERE id_utilisateur = ?
                `,
                [
                    nom_utilisateur,
                    nom_complet,
                    id_role,
                    telephone || null,
                    email || null,
                    statut || "ACTIF",
                    id
                ]
            );
        }

        // -----------------------------
        // AUDIT — Modification
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "MODIFICATION",
            table_cible: "utilisateurs",
            id_cible: id,
            description: `Modification de l'utilisateur "${nom_utilisateur}"`,
            ancienne_valeur: ancienneValeur,
            nouvelle_valeur: {
                nom_utilisateur,
                nom_complet,
                id_role,
                telephone: telephone || null,
                email: email || null,
                statut: statut || "ACTIF",
                mot_de_passe_modifie: !!mot_de_passe
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Utilisateur modifié avec succès"
        });

    } catch (error) {
        console.error("Erreur modification utilisateur :", error);

        res.status(500).json({
            message: "Erreur lors de la modification de l'utilisateur"
        });
    }
});


// =====================================================
// PUT — Modifier uniquement le statut
// =====================================================

router.put("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        const statutsAutorises = [
            "ACTIF",
            "INACTIF",
            "BLOQUE"
        ];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({
                message: "Statut invalide"
            });
        }

        // -----------------------------
        // Récupérer l'ancien statut
        // -----------------------------

        const [utilisateurs] = await pool.execute(
            `
            SELECT
                id_utilisateur,
                nom_utilisateur,
                statut
            FROM utilisateurs
            WHERE id_utilisateur = ?
            LIMIT 1
            `,
            [id]
        );

        if (utilisateurs.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        const ancienStatut = utilisateurs[0].statut;
        const nomUtilisateur = utilisateurs[0].nom_utilisateur;

        // -----------------------------
        // Modifier le statut
        // -----------------------------

        await pool.execute(
            `
            UPDATE utilisateurs
            SET statut = ?
            WHERE id_utilisateur = ?
            `,
            [statut, id]
        );

        // -----------------------------
        // AUDIT — Changement statut
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "CHANGEMENT_STATUT",
            table_cible: "utilisateurs",
            id_cible: id,
            description: `Changement du statut de l'utilisateur "${nomUtilisateur}" : ${ancienStatut} → ${statut}`,
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
            message: "Statut modifié avec succès"
        });

    } catch (error) {
        console.error("Erreur modification statut :", error);

        res.status(500).json({
            message: "Erreur lors de la modification du statut"
        });
    }
});


// =====================================================
// DELETE — Supprimer un utilisateur
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // -----------------------------
        // Récupérer l'utilisateur avant suppression
        // -----------------------------

        const [utilisateurs] = await pool.execute(
            `
            SELECT
                id_utilisateur,
                nom_utilisateur,
                nom_complet,
                id_role,
                telephone,
                email,
                statut
            FROM utilisateurs
            WHERE id_utilisateur = ?
            LIMIT 1
            `,
            [id]
        );

        if (utilisateurs.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        const ancienneValeur = utilisateurs[0];

        // -----------------------------
        // Suppression
        // -----------------------------

        await pool.execute(
            `
            DELETE FROM utilisateurs
            WHERE id_utilisateur = ?
            `,
            [id]
        );

        // -----------------------------
        // AUDIT — Suppression
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body?.id_utilisateur || null,
            action: "SUPPRESSION",
            table_cible: "utilisateurs",
            id_cible: id,
            description: `Suppression de l'utilisateur "${ancienneValeur.nom_utilisateur}"`,
            ancienne_valeur: ancienneValeur,
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });

        res.json({
            message: "Utilisateur supprimé avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression utilisateur :", error);

        res.status(500).json({
            message:
                "Impossible de supprimer cet utilisateur. Il peut être utilisé par d'autres données."
        });
    }
});


module.exports = router;