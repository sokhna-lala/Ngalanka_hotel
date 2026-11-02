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
                u.id_employe,
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
                u.date_modification,

                e.matricule,
                e.nom AS nom_employe,
                e.prenom AS prenom_employe,
                e.fonction,
                e.service,
                e.statut AS statut_employe

            FROM utilisateurs u

            INNER JOIN roles r
                ON r.id_role = u.id_role

            LEFT JOIN employes e
                ON e.id_employe = u.id_employe

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
// GET — Personnel disponible pour un compte utilisateur
// =====================================================
// Retourne uniquement les employés ACTIFS qui n'ont pas
// encore de compte utilisateur.
//
// Si id_utilisateur est fourni, l'employé actuellement
// associé à ce compte est également retourné.
// =====================================================

router.get("/personnel", async (req, res) => {
    try {
        const { id_utilisateur } = req.query;

        let query = `
            SELECT
                e.id_employe,
                e.matricule,
                e.nom,
                e.prenom,
                e.telephone,
                e.email,
                e.fonction,
                e.service,
                e.statut,
                u.id_utilisateur
            FROM employes e

            LEFT JOIN utilisateurs u
                ON u.id_employe = e.id_employe

            WHERE e.statut = 'ACTIF'
        `;

        const params = [];

        if (id_utilisateur) {
            query += `
                AND (
                    u.id_utilisateur IS NULL
                    OR u.id_utilisateur = ?
                )
            `;

            params.push(id_utilisateur);
        } else {
            query += `
                AND u.id_utilisateur IS NULL
            `;
        }

        query += `
            ORDER BY e.nom ASC, e.prenom ASC
        `;

        const [employes] = await pool.execute(query, params);

        res.json(employes);

    } catch (error) {
        console.error("Erreur récupération personnel disponible :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération du personnel disponible"
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
                u.id_employe,
                u.nom_utilisateur,
                u.nom_complet,
                u.id_role,
                r.nom_role,
                u.telephone,
                u.email,
                u.statut,
                u.derniere_connexion,
                u.date_creation,
                u.date_modification,

                e.matricule,
                e.nom AS nom_employe,
                e.prenom AS prenom_employe,
                e.fonction,
                e.service,
                e.statut AS statut_employe

            FROM utilisateurs u

            INNER JOIN roles r
                ON r.id_role = u.id_role

            LEFT JOIN employes e
                ON e.id_employe = u.id_employe

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
            id_employe,
            nom_utilisateur,
            mot_de_passe,
            id_role,
            statut
        } = req.body;

        // -----------------------------
        // Validation
        // -----------------------------

        if (
            !id_employe ||
            !nom_utilisateur ||
            !mot_de_passe ||
            !id_role
        ) {
            return res.status(400).json({
                message:
                    "Personnel, nom utilisateur, mot de passe et rôle sont obligatoires"
            });
        }

        if (mot_de_passe.length < 6) {
            return res.status(400).json({
                message:
                    "Le mot de passe doit contenir au moins 6 caractères"
            });
        }


        // -----------------------------
        // Vérifier l'employé
        // -----------------------------

        const [employes] = await pool.execute(`
            SELECT
                id_employe,
                matricule,
                nom,
                prenom,
                telephone,
                email,
                fonction,
                service,
                statut
            FROM employes
            WHERE id_employe = ?
            LIMIT 1
        `, [id_employe]);

        if (employes.length === 0) {
            return res.status(404).json({
                message: "L'employé sélectionné est introuvable"
            });
        }

        const employe = employes[0];

        if (employe.statut !== "ACTIF") {
            return res.status(400).json({
                message:
                    "Impossible de créer un compte pour un employé qui n'est pas actif"
            });
        }


        // -----------------------------
        // Vérifier si l'employé possède
        // déjà un compte
        // -----------------------------

        const [compteEmploye] = await pool.execute(`
            SELECT id_utilisateur
            FROM utilisateurs
            WHERE id_employe = ?
            LIMIT 1
        `, [id_employe]);

        if (compteEmploye.length > 0) {
            return res.status(409).json({
                message:
                    "Cet employé possède déjà un compte utilisateur"
            });
        }


        // -----------------------------
        // Vérifier le rôle
        // -----------------------------

        const [roles] = await pool.execute(`
            SELECT id_role
            FROM roles
            WHERE id_role = ?
            AND statut = 'ACTIF'
            LIMIT 1
        `, [id_role]);

        if (roles.length === 0) {
            return res.status(400).json({
                message: "Le rôle sélectionné est invalide"
            });
        }


        // -----------------------------
        // Vérifier doublon nom utilisateur
        // -----------------------------

        const [existants] = await pool.execute(`
            SELECT id_utilisateur
            FROM utilisateurs
            WHERE nom_utilisateur = ?
            LIMIT 1
        `, [nom_utilisateur]);

        if (existants.length > 0) {
            return res.status(409).json({
                message: "Ce nom d'utilisateur existe déjà"
            });
        }


        // -----------------------------
        // Générer le nom complet
        // depuis le personnel
        // -----------------------------

        const nomComplet = `${employe.prenom || ""} ${employe.nom || ""}`
            .trim();


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

        const [result] = await pool.execute(`
            INSERT INTO utilisateurs (
                id_employe,
                nom_utilisateur,
                mot_de_passe,
                nom_complet,
                id_role,
                telephone,
                email,
                statut
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_employe,
            nom_utilisateur,
            motDePasseHash,
            nomComplet,
            id_role,
            employe.telephone || null,
            employe.email || null,
            statut || "ACTIF"
        ]);


        // -----------------------------
        // AUDIT — Création
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "CREATION",
            table_cible: "utilisateurs",
            id_cible: result.insertId,
            description:
                `Création du compte "${nom_utilisateur}" pour ${nomComplet}`,
            nouvelle_valeur: {
                id_employe,
                matricule: employe.matricule,
                nom_complet: nomComplet,
                nom_utilisateur,
                id_role,
                telephone: employe.telephone || null,
                email: employe.email || null,
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
            id_employe,
            nom_utilisateur,
            id_role,
            statut,
            mot_de_passe
        } = req.body;


        if (
            !id_employe ||
            !nom_utilisateur ||
            !id_role
        ) {
            return res.status(400).json({
                message:
                    "Personnel, nom utilisateur et rôle sont obligatoires"
            });
        }


        // -----------------------------
        // Vérifier utilisateur
        // -----------------------------

        const [utilisateurs] = await pool.execute(`
            SELECT
                id_utilisateur,
                id_employe,
                nom_utilisateur,
                nom_complet,
                id_role,
                telephone,
                email,
                statut
            FROM utilisateurs
            WHERE id_utilisateur = ?
            LIMIT 1
        `, [id]);

        if (utilisateurs.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        const ancienneValeur = utilisateurs[0];


        // -----------------------------
        // Vérifier doublon nom utilisateur
        // -----------------------------

        const [doublons] = await pool.execute(`
            SELECT id_utilisateur
            FROM utilisateurs
            WHERE nom_utilisateur = ?
            AND id_utilisateur <> ?
            LIMIT 1
        `, [nom_utilisateur, id]);

        if (doublons.length > 0) {
            return res.status(409).json({
                message: "Ce nom d'utilisateur existe déjà"
            });
        }


        // -----------------------------
        // Vérifier l'employé
        // -----------------------------

        const [employes] = await pool.execute(`
            SELECT
                id_employe,
                matricule,
                nom,
                prenom,
                telephone,
                email,
                fonction,
                service,
                statut
            FROM employes
            WHERE id_employe = ?
            LIMIT 1
        `, [id_employe]);

        if (employes.length === 0) {
            return res.status(404).json({
                message: "L'employé sélectionné est introuvable"
            });
        }

        const employe = employes[0];

        if (employe.statut !== "ACTIF") {
            return res.status(400).json({
                message:
                    "Impossible d'associer un compte à un employé qui n'est pas actif"
            });
        }


        // -----------------------------
        // Vérifier si l'employé est déjà
        // associé à un autre utilisateur
        // -----------------------------

        const [compteEmploye] = await pool.execute(`
            SELECT id_utilisateur
            FROM utilisateurs
            WHERE id_employe = ?
            AND id_utilisateur <> ?
            LIMIT 1
        `, [id_employe, id]);

        if (compteEmploye.length > 0) {
            return res.status(409).json({
                message:
                    "Cet employé possède déjà un autre compte utilisateur"
            });
        }


        // -----------------------------
        // Vérifier rôle
        // -----------------------------

        const [roles] = await pool.execute(`
            SELECT id_role
            FROM roles
            WHERE id_role = ?
            AND statut = 'ACTIF'
            LIMIT 1
        `, [id_role]);

        if (roles.length === 0) {
            return res.status(400).json({
                message: "Le rôle sélectionné est invalide"
            });
        }


        // -----------------------------
        // Nom complet depuis le personnel
        // -----------------------------

        const nomComplet = `${employe.prenom || ""} ${employe.nom || ""}`
            .trim();


        // -----------------------------
        // Modification avec ou sans
        // nouveau mot de passe
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

            await pool.execute(`
                UPDATE utilisateurs
                SET
                    id_employe = ?,
                    nom_utilisateur = ?,
                    mot_de_passe = ?,
                    nom_complet = ?,
                    id_role = ?,
                    telephone = ?,
                    email = ?,
                    statut = ?
                WHERE id_utilisateur = ?
            `, [
                id_employe,
                nom_utilisateur,
                motDePasseHash,
                nomComplet,
                id_role,
                employe.telephone || null,
                employe.email || null,
                statut || "ACTIF",
                id
            ]);

        } else {

            await pool.execute(`
                UPDATE utilisateurs
                SET
                    id_employe = ?,
                    nom_utilisateur = ?,
                    nom_complet = ?,
                    id_role = ?,
                    telephone = ?,
                    email = ?,
                    statut = ?
                WHERE id_utilisateur = ?
            `, [
                id_employe,
                nom_utilisateur,
                nomComplet,
                id_role,
                employe.telephone || null,
                employe.email || null,
                statut || "ACTIF",
                id
            ]);
        }


        // -----------------------------
        // AUDIT — Modification
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "MODIFICATION",
            table_cible: "utilisateurs",
            id_cible: id,
            description:
                `Modification du compte "${nom_utilisateur}"`,
            ancienne_valeur: ancienneValeur,
            nouvelle_valeur: {
                id_employe,
                matricule: employe.matricule,
                nom_complet: nomComplet,
                nom_utilisateur,
                id_role,
                telephone: employe.telephone || null,
                email: employe.email || null,
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

        const [utilisateurs] = await pool.execute(`
            SELECT
                id_utilisateur,
                nom_utilisateur,
                statut
            FROM utilisateurs
            WHERE id_utilisateur = ?
            LIMIT 1
        `, [id]);

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

        await pool.execute(`
            UPDATE utilisateurs
            SET statut = ?
            WHERE id_utilisateur = ?
        `, [statut, id]);


        // -----------------------------
        // AUDIT — Changement statut
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "CHANGEMENT_STATUT",
            table_cible: "utilisateurs",
            id_cible: id,
            description:
                `Changement du statut de l'utilisateur "${nomUtilisateur}" : ${ancienStatut} → ${statut}`,
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

        const [utilisateurs] = await pool.execute(`
            SELECT
                id_utilisateur,
                id_employe,
                nom_utilisateur,
                nom_complet,
                id_role,
                telephone,
                email,
                statut
            FROM utilisateurs
            WHERE id_utilisateur = ?
            LIMIT 1
        `, [id]);

        if (utilisateurs.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        const ancienneValeur = utilisateurs[0];


        // -----------------------------
        // Suppression
        // -----------------------------

        await pool.execute(`
            DELETE FROM utilisateurs
            WHERE id_utilisateur = ?
        `, [id]);


        // -----------------------------
        // AUDIT — Suppression
        // -----------------------------

        await enregistrerAudit({
            id_utilisateur: req.body?.id_utilisateur || null,
            action: "SUPPRESSION",
            table_cible: "utilisateurs",
            id_cible: id,
            description:
                `Suppression de l'utilisateur "${ancienneValeur.nom_utilisateur}"`,
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