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
            description:
                `Création de l'employé "${prenom ? prenom + " " : ""}${nom}"`,
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


        // -----------------------------
        // Validation
        // -----------------------------

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
        // Modification employé
        // -----------------------------

        const nouveauStatut = statut || "ACTIF";

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
                nouveauStatut,
                observation || null,
                id
            ]
        );


        // -----------------------------
        // Synchroniser le compte utilisateur
        // -----------------------------

        const nomComplet = [prenom, nom]
            .filter(Boolean)
            .join(" ")
            .trim();


        let statutUtilisateur = null;

        if (nouveauStatut === "ACTIF") {
            statutUtilisateur = "ACTIF";
        } else if (nouveauStatut === "INACTIF") {
            statutUtilisateur = "INACTIF";
        } else if (nouveauStatut === "SUSPENDU") {
            statutUtilisateur = "BLOQUE";
        }


        if (statutUtilisateur) {
            await pool.execute(
                `
                UPDATE utilisateurs
                SET
                    nom_complet = ?,
                    telephone = ?,
                    email = ?,
                    statut = ?
                WHERE id_employe = ?
                `,
                [
                    nomComplet || nom,
                    telephone || null,
                    email || null,
                    statutUtilisateur,
                    id
                ]
            );
        } else {
            await pool.execute(
                `
                UPDATE utilisateurs
                SET
                    nom_complet = ?,
                    telephone = ?,
                    email = ?
                WHERE id_employe = ?
                `,
                [
                    nomComplet || nom,
                    telephone || null,
                    email || null,
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
            table_cible: "employes",
            id_cible: id,
            description:
                `Modification de l'employé "${prenom ? prenom + " " : ""}${nom}"`,
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
                statut: nouveauStatut,
                observation: observation || null
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });


        res.json({
            message:
                "Employé modifié et compte utilisateur synchronisé avec succès"
        });

    } catch (error) {
        console.error(
            "Erreur modification employé et synchronisation utilisateur :",
            error
        );

        res.status(500).json({
            message:
                "Erreur serveur lors de la modification de l'employé"
        });
    }
});


// =====================================================
// PUT — Modifier le statut d'un employé
// =====================================================

router.put("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;


        // ---------------------------------------------
        // Statuts autorisés
        // ---------------------------------------------

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


        // ---------------------------------------------
        // Vérifier que l'employé existe
        // ---------------------------------------------

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


        // ---------------------------------------------
        // Modifier le statut de l'employé
        // ---------------------------------------------

        await pool.execute(
            `
            UPDATE employes
            SET statut = ?
            WHERE id_employe = ?
            `,
            [statut, id]
        );


        // ---------------------------------------------
        // Synchroniser le compte utilisateur
        //
        // ACTIF     → ACTIF
        // INACTIF   → INACTIF
        // SUSPENDU  → BLOQUE
        // ---------------------------------------------

        let statutUtilisateur;

        if (statut === "ACTIF") {
            statutUtilisateur = "ACTIF";
        } else if (statut === "INACTIF") {
            statutUtilisateur = "INACTIF";
        } else {
            statutUtilisateur = "BLOQUE";
        }


        const [utilisateurs] = await pool.execute(
            `
            SELECT
                id_utilisateur,
                nom_utilisateur,
                statut
            FROM utilisateurs
            WHERE id_employe = ?
            LIMIT 1
            `,
            [id]
        );


        if (utilisateurs.length > 0) {
            await pool.execute(
                `
                UPDATE utilisateurs
                SET statut = ?
                WHERE id_employe = ?
                `,
                [statutUtilisateur, id]
            );
        }


        // ---------------------------------------------
        // AUDIT — Changement de statut
        // ---------------------------------------------

        await enregistrerAudit({
            id_utilisateur: req.body.id_utilisateur || null,
            action: "CHANGEMENT_STATUT",
            table_cible: "employes",
            id_cible: id,
            description:
                `Changement du statut de l'employé "${employes[0].prenom ? employes[0].prenom + " " : ""}${employes[0].nom}"`,
            ancienne_valeur: {
                statut: ancienStatut,
                statut_utilisateur:
                    utilisateurs.length > 0
                        ? utilisateurs[0].statut
                        : null
            },
            nouvelle_valeur: {
                statut_employe: statut,
                statut_utilisateur:
                    utilisateurs.length > 0
                        ? statutUtilisateur
                        : null
            },
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });


        res.json({
            message:
                "Statut de l'employé et du compte utilisateur synchronisés avec succès",
            statut_employe: statut,
            statut_utilisateur:
                utilisateurs.length > 0
                    ? statutUtilisateur
                    : null
        });

    } catch (error) {
        console.error(
            "Erreur changement statut employé/utilisateur :",
            error
        );

        res.status(500).json({
            message:
                "Erreur serveur lors du changement de statut"
        });
    }
});


// =====================================================
// DELETE — Supprimer un employé
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;


        // ---------------------------------------------
        // Vérifier que l'employé existe
        // ---------------------------------------------

        const [employes] = await pool.execute(
            `
            SELECT
                id_employe,
                matricule,
                nom,
                prenom
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

        const employe = employes[0];


        // ---------------------------------------------
        // Vérifier si l'employé est lié à un utilisateur
        // ---------------------------------------------

        const [utilisateurs] = await pool.execute(
            `
            SELECT
                id_utilisateur,
                nom_utilisateur
            FROM utilisateurs
            WHERE id_employe = ?
            LIMIT 1
            `,
            [id]
        );


        if (utilisateurs.length > 0) {
            return res.status(409).json({
                message:
                    `Impossible de supprimer cet employé car il est lié au compte utilisateur "${utilisateurs[0].nom_utilisateur}". ` +
                    `Dissociez d'abord le compte utilisateur avant de supprimer l'employé.`
            });
        }


        // ---------------------------------------------
        // Suppression
        // ---------------------------------------------

        await pool.execute(
            `
            DELETE FROM employes
            WHERE id_employe = ?
            `,
            [id]
        );


        // ---------------------------------------------
        // AUDIT — Suppression
        // ---------------------------------------------

        await enregistrerAudit({
            id_utilisateur: req.body?.id_utilisateur || null,
            action: "SUPPRESSION",
            table_cible: "employes",
            id_cible: id,
            description:
                `Suppression de l'employé "${employe.prenom ? employe.prenom + " " : ""}${employe.nom}"`,
            ancienne_valeur: employe,
            adresse_ip: req.ip,
            user_agent: req.get("user-agent")
        });


        res.json({
            message:
                `Employé ${employe.matricule} supprimé avec succès`
        });

    } catch (error) {
        console.error("Erreur suppression employé :", error);

        res.status(500).json({
            message:
                "Impossible de supprimer cet employé"
        });
    }
});


module.exports = router;