const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// =====================================================
// UTILITAIRE : générer un numéro de facture
// =====================================================
const genererNumeroFacture = async (connection) => {
    const annee = new Date().getFullYear();

    const [result] = await connection.execute(
        `
        SELECT numero_facture
        FROM factures
        WHERE numero_facture LIKE ?
        ORDER BY id_facture DESC
        LIMIT 1
        `,
        [`FAC-${annee}-%`]
    );

    let numero = 1;

    if (result.length > 0) {
        const dernierNumero = result[0].numero_facture;
        const partie = dernierNumero.split("-").pop();
        const dernierNumeroInt = parseInt(partie, 10);

        if (!isNaN(dernierNumeroInt)) {
            numero = dernierNumeroInt + 1;
        }
    }

    return `FAC-${annee}-${String(numero).padStart(4, "0")}`;
};

// =====================================================
// UTILITAIRE : générer un numéro de paiement
// =====================================================
const genererNumeroPaiement = async (connection) => {
    const annee = new Date().getFullYear();

    const [result] = await connection.execute(
        `
        SELECT numero_paiement
        FROM paiements
        WHERE numero_paiement LIKE ?
        ORDER BY id_paiement DESC
        LIMIT 1
        `,
        [`PAY-${annee}-%`]
    );

    let numero = 1;

    if (result.length > 0) {
        const dernierNumero = result[0].numero_paiement;
        const partie = dernierNumero.split("-").pop();
        const dernierNumeroInt = parseInt(partie, 10);

        if (!isNaN(dernierNumeroInt)) {
            numero = dernierNumeroInt + 1;
        }
    }

    return `PAY-${annee}-${String(numero).padStart(4, "0")}`;
};

// =====================================================
// GET - Liste des factures
// =====================================================
router.get("/", async (req, res) => {
    try {
        const [factures] = await pool.execute(`
            SELECT
                f.id_facture,
                f.numero_facture,
                f.id_client,
                f.id_sejour,
                f.date_facture,
                f.montant_total,
                f.remise,
                f.taxe,
                f.net_a_payer,
                f.montant_paye,
                f.reste_a_payer,
                f.statut,
                f.observation,

                c.code_client,
                c.nom,
                c.prenom,

                s.numero_sejour

            FROM factures f

            INNER JOIN clients c
                ON f.id_client = c.id_client

            LEFT JOIN sejours s
                ON f.id_sejour = s.id_sejour

            ORDER BY f.date_facture DESC
        `);

        res.json(factures);

    } catch (error) {
        console.error("Erreur récupération factures :", error);

        res.status(500).json({
            message: "Impossible de récupérer les factures"
        });
    }
});

// =====================================================
// GET - Une facture avec ses lignes et paiements
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // -----------------------------
        // Facture
        // -----------------------------
        const [factures] = await pool.execute(
            `
            SELECT
                f.*,

                c.code_client,
                c.nom,
                c.prenom,
                c.telephone,
                c.email,
                c.adresse,

                s.numero_sejour

            FROM factures f

            INNER JOIN clients c
                ON f.id_client = c.id_client

            LEFT JOIN sejours s
                ON f.id_sejour = s.id_sejour

            WHERE f.id_facture = ?
            `,
            [id]
        );

        if (factures.length === 0) {
            return res.status(404).json({
                message: "Facture introuvable"
            });
        }

        // -----------------------------
        // Lignes de facture
        // -----------------------------
        const [lignes] = await pool.execute(
            `
            SELECT
                id_ligne,
                id_facture,
                type_ligne,
                reference_id,
                designation,
                quantite,
                prix_unitaire,
                remise,
                montant

            FROM lignes_facture

            WHERE id_facture = ?

            ORDER BY id_ligne ASC
            `,
            [id]
        );

        // -----------------------------
        // Paiements
        // -----------------------------
        const [paiements] = await pool.execute(
            `
            SELECT
                id_paiement,
                numero_paiement,
                id_facture,
                date_paiement,
                montant,
                mode_paiement,
                reference,
                observation

            FROM paiements

            WHERE id_facture = ?

            ORDER BY date_paiement DESC
            `,
            [id]
        );

        res.json({
            facture: factures[0],
            lignes,
            paiements
        });

    } catch (error) {
        console.error("Erreur récupération facture :", error);

        res.status(500).json({
            message: "Impossible de récupérer la facture"
        });
    }
});

// =====================================================
// POST - Créer une facture
// =====================================================
router.post("/", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            id_client,
            id_sejour,
            remise = 0,
            taxe = 0,
            observation,
            lignes = []
        } = req.body;

        // -----------------------------
        // Vérification client
        // -----------------------------
        if (!id_client) {
            return res.status(400).json({
                message: "Le client est obligatoire"
            });
        }

        // -----------------------------
        // Vérification lignes
        // -----------------------------
        if (!Array.isArray(lignes) || lignes.length === 0) {
            return res.status(400).json({
                message: "La facture doit contenir au moins une ligne"
            });
        }

        // -----------------------------
        // Vérifier client
        // -----------------------------
        const [clients] = await connection.execute(
            `
            SELECT id_client
            FROM clients
            WHERE id_client = ?
            `,
            [id_client]
        );

        if (clients.length === 0) {
            return res.status(404).json({
                message: "Client introuvable"
            });
        }

        // -----------------------------
        // Vérifier séjour si fourni
        // -----------------------------
        if (id_sejour) {
            const [sejours] = await connection.execute(
                `
                SELECT id_sejour
                FROM sejours
                WHERE id_sejour = ?
                `,
                [id_sejour]
            );

            if (sejours.length === 0) {
                return res.status(404).json({
                    message: "Séjour introuvable"
                });
            }
        }

        // -----------------------------
        // Préparer les lignes
        // -----------------------------
        let montantTotal = 0;

        const lignesPreparees = lignes.map((ligne) => {
            const quantite = Math.max(
                0,
                Number(ligne.quantite) || 0
            );

            const prixUnitaire = Math.max(
                0,
                Number(ligne.prix_unitaire) || 0
            );

            const remiseLigne = Math.max(
                0,
                Number(ligne.remise) || 0
            );

            const montant = Math.max(
                0,
                quantite * prixUnitaire - remiseLigne
            );

            montantTotal += montant;

            return {
                type_ligne: ligne.type_ligne || "AUTRE",
                reference_id: ligne.reference_id || null,
                designation: ligne.designation
                    ? String(ligne.designation).trim()
                    : "",
                quantite,
                prix_unitaire: prixUnitaire,
                remise: remiseLigne,
                montant
            };
        });

        // -----------------------------
        // Vérifier désignations
        // -----------------------------
        for (const ligne of lignesPreparees) {
            if (!ligne.designation) {
                return res.status(400).json({
                    message: "La désignation d'une ligne est obligatoire"
                });
            }
        }

        // -----------------------------
        // Calcul facture
        // -----------------------------
        const remiseFacture = Math.max(
            0,
            Number(remise) || 0
        );

        const taxeFacture = Math.max(
            0,
            Number(taxe) || 0
        );

        const netAPayer = Math.max(
            0,
            montantTotal - remiseFacture + taxeFacture
        );

        // -----------------------------
        // Transaction
        // -----------------------------
        await connection.beginTransaction();

        // -----------------------------
        // Générer numéro
        // -----------------------------
        const numeroFacture =
            await genererNumeroFacture(connection);

        // -----------------------------
        // Créer facture
        // -----------------------------
        const [result] = await connection.execute(
            `
            INSERT INTO factures (
                numero_facture,
                id_client,
                id_sejour,
                montant_total,
                remise,
                taxe,
                net_a_payer,
                montant_paye,
                reste_a_payer,
                statut,
                observation
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                numeroFacture,
                id_client,
                id_sejour || null,
                montantTotal,
                remiseFacture,
                taxeFacture,
                netAPayer,
                0,
                netAPayer,
                "BROUILLON",
                observation || null
            ]
        );

        const idFacture = result.insertId;

        // -----------------------------
        // Créer les lignes
        // -----------------------------
        for (const ligne of lignesPreparees) {
            await connection.execute(
                `
                INSERT INTO lignes_facture (
                    id_facture,
                    type_ligne,
                    reference_id,
                    designation,
                    quantite,
                    prix_unitaire,
                    remise,
                    montant
                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    idFacture,
                    ligne.type_ligne,
                    ligne.reference_id,
                    ligne.designation,
                    ligne.quantite,
                    ligne.prix_unitaire,
                    ligne.remise,
                    ligne.montant
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: "Facture créée avec succès",
            id_facture: idFacture,
            numero_facture: numeroFacture
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur création facture :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Le numéro de facture existe déjà"
            });
        }

        res.status(500).json({
            message: "Impossible de créer la facture"
        });

    } finally {
        connection.release();
    }
});

// =====================================================
// PUT - Modifier une facture
// =====================================================
router.put("/:id", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const id = req.params.id;

        const {
            id_client,
            id_sejour,
            remise = 0,
            taxe = 0,
            observation,
            lignes = []
        } = req.body;

        // -----------------------------
        // Vérifications
        // -----------------------------
        if (!id_client) {
            return res.status(400).json({
                message: "Le client est obligatoire"
            });
        }

        if (!Array.isArray(lignes) || lignes.length === 0) {
            return res.status(400).json({
                message: "La facture doit contenir au moins une ligne"
            });
        }

        // -----------------------------
        // Vérifier facture
        // -----------------------------
        const [factures] = await connection.execute(
            `
            SELECT
                id_facture,
                statut
            FROM factures
            WHERE id_facture = ?
            `,
            [id]
        );

        if (factures.length === 0) {
            return res.status(404).json({
                message: "Facture introuvable"
            });
        }

        if (factures[0].statut === "PAYEE") {
            return res.status(400).json({
                message: "Une facture payée ne peut pas être modifiée"
            });
        }

        if (factures[0].statut === "ANNULEE") {
            return res.status(400).json({
                message: "Une facture annulée ne peut pas être modifiée"
            });
        }

        // -----------------------------
        // Préparer les lignes
        // -----------------------------
        let montantTotal = 0;

        const lignesPreparees = lignes.map((ligne) => {
            const quantite = Math.max(
                0,
                Number(ligne.quantite) || 0
            );

            const prixUnitaire = Math.max(
                0,
                Number(ligne.prix_unitaire) || 0
            );

            const remiseLigne = Math.max(
                0,
                Number(ligne.remise) || 0
            );

            const montant = Math.max(
                0,
                quantite * prixUnitaire - remiseLigne
            );

            montantTotal += montant;

            return {
                type_ligne: ligne.type_ligne || "AUTRE",
                reference_id: ligne.reference_id || null,
                designation: ligne.designation
                    ? String(ligne.designation).trim()
                    : "",
                quantite,
                prix_unitaire: prixUnitaire,
                remise: remiseLigne,
                montant
            };
        });

        for (const ligne of lignesPreparees) {
            if (!ligne.designation) {
                return res.status(400).json({
                    message: "La désignation d'une ligne est obligatoire"
                });
            }
        }

        // -----------------------------
        // Calcul
        // -----------------------------
        const remiseFacture = Math.max(
            0,
            Number(remise) || 0
        );

        const taxeFacture = Math.max(
            0,
            Number(taxe) || 0
        );

        const netAPayer = Math.max(
            0,
            montantTotal - remiseFacture + taxeFacture
        );

        await connection.beginTransaction();

        // -----------------------------
        // Montant déjà payé
        // -----------------------------
        const [paiementResult] = await connection.execute(
            `
            SELECT COALESCE(SUM(montant), 0) AS total_paye
            FROM paiements
            WHERE id_facture = ?
            `,
            [id]
        );

        const montantPaye =
            Number(paiementResult[0].total_paye) || 0;

        const resteAPayer = Math.max(
            0,
            netAPayer - montantPaye
        );

        let statut = "BROUILLON";

        if (montantPaye > 0 && resteAPayer > 0) {
            statut = "PARTIELLE";
        }

        if (montantPaye >= netAPayer && netAPayer > 0) {
            statut = "PAYEE";
        }

        // -----------------------------
        // Mise à jour facture
        // -----------------------------
        await connection.execute(
            `
            UPDATE factures
            SET
                id_client = ?,
                id_sejour = ?,
                montant_total = ?,
                remise = ?,
                taxe = ?,
                net_a_payer = ?,
                montant_paye = ?,
                reste_a_payer = ?,
                statut = ?,
                observation = ?
            WHERE id_facture = ?
            `,
            [
                id_client,
                id_sejour || null,
                montantTotal,
                remiseFacture,
                taxeFacture,
                netAPayer,
                montantPaye,
                resteAPayer,
                statut,
                observation || null,
                id
            ]
        );

        // -----------------------------
        // Supprimer anciennes lignes
        // -----------------------------
        await connection.execute(
            `
            DELETE FROM lignes_facture
            WHERE id_facture = ?
            `,
            [id]
        );

        // -----------------------------
        // Insérer nouvelles lignes
        // -----------------------------
        for (const ligne of lignesPreparees) {
            await connection.execute(
                `
                INSERT INTO lignes_facture (
                    id_facture,
                    type_ligne,
                    reference_id,
                    designation,
                    quantite,
                    prix_unitaire,
                    remise,
                    montant
                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    id,
                    ligne.type_ligne,
                    ligne.reference_id,
                    ligne.designation,
                    ligne.quantite,
                    ligne.prix_unitaire,
                    ligne.remise,
                    ligne.montant
                ]
            );
        }

        await connection.commit();

        res.json({
            message: "Facture modifiée avec succès"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur modification facture :", error);

        res.status(500).json({
            message: "Impossible de modifier la facture"
        });

    } finally {
        connection.release();
    }
});

// =====================================================
// PUT - Annuler une facture
// =====================================================
router.put("/:id/annuler", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const id = req.params.id;

        const [factures] = await connection.execute(
            `
            SELECT
                id_facture,
                statut,
                montant_paye
            FROM factures
            WHERE id_facture = ?
            `,
            [id]
        );

        if (factures.length === 0) {
            return res.status(404).json({
                message: "Facture introuvable"
            });
        }

        const facture = factures[0];

        if (facture.statut === "ANNULEE") {
            return res.status(400).json({
                message: "La facture est déjà annulée"
            });
        }

        if (Number(facture.montant_paye) > 0) {
            return res.status(400).json({
                message: "Impossible d'annuler une facture ayant déjà reçu un paiement"
            });
        }

        await connection.execute(
            `
            UPDATE factures
            SET statut = 'ANNULEE'
            WHERE id_facture = ?
            `,
            [id]
        );

        res.json({
            message: "Facture annulée avec succès"
        });

    } catch (error) {
        console.error("Erreur annulation facture :", error);

        res.status(500).json({
            message: "Impossible d'annuler la facture"
        });

    } finally {
        connection.release();
    }
});

// =====================================================
// POST - Ajouter un paiement
// =====================================================
router.post("/:id/paiements", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const idFacture = req.params.id;

        const {
            montant,
            mode_paiement,
            reference,
            observation
        } = req.body;

        const montantPaiement = Number(montant);

        if (!montantPaiement || montantPaiement <= 0) {
            return res.status(400).json({
                message: "Le montant du paiement doit être supérieur à 0"
            });
        }

        if (!mode_paiement) {
            return res.status(400).json({
                message: "Le mode de paiement est obligatoire"
            });
        }

        // -----------------------------
        // Vérifier facture
        // -----------------------------
        const [factures] = await connection.execute(
            `
            SELECT
                id_facture,
                net_a_payer,
                montant_paye,
                reste_a_payer,
                statut

            FROM factures

            WHERE id_facture = ?
            `,
            [idFacture]
        );

        if (factures.length === 0) {
            return res.status(404).json({
                message: "Facture introuvable"
            });
        }

        const facture = factures[0];

        if (facture.statut === "ANNULEE") {
            return res.status(400).json({
                message: "Impossible d'effectuer un paiement sur une facture annulée"
            });
        }

        if (facture.statut === "PAYEE") {
            return res.status(400).json({
                message: "La facture est déjà entièrement payée"
            });
        }

        if (montantPaiement > Number(facture.reste_a_payer)) {
            return res.status(400).json({
                message: "Le montant dépasse le reste à payer"
            });
        }

        await connection.beginTransaction();

        // -----------------------------
        // Numéro paiement
        // -----------------------------
        const numeroPaiement =
            await genererNumeroPaiement(connection);

        // -----------------------------
        // Insérer paiement
        // -----------------------------
        await connection.execute(
            `
            INSERT INTO paiements (
                numero_paiement,
                id_facture,
                montant,
                mode_paiement,
                reference,
                observation
            )

            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                numeroPaiement,
                idFacture,
                montantPaiement,
                mode_paiement,
                reference || null,
                observation || null
            ]
        );

        // -----------------------------
        // Recalcul facture
        // -----------------------------
        const nouveauMontantPaye =
            Number(facture.montant_paye) +
            montantPaiement;

        const nouveauReste = Math.max(
            0,
            Number(facture.net_a_payer) -
            nouveauMontantPaye
        );

        let nouveauStatut = "PARTIELLE";

        if (nouveauReste === 0) {
            nouveauStatut = "PAYEE";
        }

        await connection.execute(
            `
            UPDATE factures
            SET
                montant_paye = ?,
                reste_a_payer = ?,
                statut = ?
            WHERE id_facture = ?
            `,
            [
                nouveauMontantPaye,
                nouveauReste,
                nouveauStatut,
                idFacture
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Paiement enregistré avec succès",
            numero_paiement: numeroPaiement,
            montant_paye: nouveauMontantPaye,
            reste_a_payer: nouveauReste,
            statut: nouveauStatut
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur paiement :", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Le numéro de paiement existe déjà"
            });
        }

        res.status(500).json({
            message: "Impossible d'enregistrer le paiement"
        });

    } finally {
        connection.release();
    }
});

// =====================================================
// GET - Paiements d'une facture
// =====================================================
router.get("/:id/paiements", async (req, res) => {
    try {
        const idFacture = req.params.id;

        const [paiements] = await pool.execute(
            `
            SELECT
                id_paiement,
                numero_paiement,
                id_facture,
                date_paiement,
                montant,
                mode_paiement,
                reference,
                observation
            FROM paiements
            WHERE id_facture = ?
            ORDER BY date_paiement DESC
            `,
            [idFacture]
        );

        res.json(paiements);

    } catch (error) {
        console.error("Erreur récupération paiements :", error);

        res.status(500).json({
            message: "Impossible de récupérer les paiements"
        });
    }
});

module.exports = router;