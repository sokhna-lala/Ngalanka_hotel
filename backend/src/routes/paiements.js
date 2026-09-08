const express = require("express");
const router = express.Router();
const pool = require("../config/database");

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
// GET - Liste de tous les paiements
// =====================================================
router.get("/", async (req, res) => {
    try {
        const [paiements] = await pool.execute(`
            SELECT
                p.id_paiement,
                p.numero_paiement,
                p.id_facture,
                p.date_paiement,
                p.montant,
                p.mode_paiement,
                p.reference,
                p.observation,

                f.numero_facture,
                f.net_a_payer,
                f.montant_paye,
                f.reste_a_payer,

                c.code_client,
                c.nom,
                c.prenom

            FROM paiements p

            INNER JOIN factures f
                ON p.id_facture = f.id_facture

            INNER JOIN clients c
                ON f.id_client = c.id_client

            ORDER BY p.date_paiement DESC
        `);

        res.json(paiements);

    } catch (error) {
        console.error("Erreur récupération paiements :", error);

        res.status(500).json({
            message: "Impossible de récupérer les paiements"
        });
    }
});// =====================================================
// GET - Un paiement par son ID
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [paiements] = await pool.execute(
            `
            SELECT
                p.*,

                f.numero_facture,
                f.net_a_payer,
                f.montant_paye,
                f.reste_a_payer,

                c.code_client,
                c.nom,
                c.prenom,
                c.telephone,
                c.email

            FROM paiements p

            INNER JOIN factures f
                ON p.id_facture = f.id_facture

            INNER JOIN clients c
                ON f.id_client = c.id_client

            WHERE p.id_paiement = ?
            `,
            [id]
        );

        if (paiements.length === 0) {
            return res.status(404).json({
                message: "Paiement introuvable"
            });
        }

        res.json(paiements[0]);

    } catch (error) {
        console.error("Erreur récupération paiement :", error);

        res.status(500).json({
            message: "Impossible de récupérer le paiement"
        });
    }
});
// =====================================================
// POST - Ajouter un paiement
// =====================================================
router.post("/", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            id_facture,
            montant,
            mode_paiement,
            reference,
            observation
        } = req.body;

        const montantPaiement = Number(montant);

        // -------------------------------------------------
        // Vérifications
        // -------------------------------------------------
        if (!id_facture) {
            return res.status(400).json({
                message: "La facture est obligatoire"
            });
        }

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

        // -------------------------------------------------
        // Vérifier la facture
        // -------------------------------------------------
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
            [id_facture]
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

        // -------------------------------------------------
        // Démarrer la transaction
        // -------------------------------------------------
        await connection.beginTransaction();

        // -------------------------------------------------
        // Générer le numéro de paiement
        // -------------------------------------------------
        const numeroPaiement =
            await genererNumeroPaiement(connection);

        // -------------------------------------------------
        // Enregistrer le paiement
        // -------------------------------------------------
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
                id_facture,
                montantPaiement,
                mode_paiement,
                reference || null,
                observation || null
            ]
        );

        // -------------------------------------------------
        // Recalculer le montant payé
        // -------------------------------------------------
        const nouveauMontantPaye =
            Number(facture.montant_paye) + montantPaiement;

        const nouveauReste = Math.max(
            0,
            Number(facture.net_a_payer) - nouveauMontantPaye
        );

        // -------------------------------------------------
        // Déterminer le nouveau statut
        // -------------------------------------------------
        let nouveauStatut = "PARTIELLE";

        if (nouveauReste === 0) {
            nouveauStatut = "PAYEE";
        }

        // -------------------------------------------------
        // Mettre à jour la facture
        // -------------------------------------------------
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
                id_facture
            ]
        );

        // -------------------------------------------------
        // Valider la transaction
        // -------------------------------------------------
        await connection.commit();

        // -------------------------------------------------
        // Réponse
        // -------------------------------------------------
        res.status(201).json({
            message: "Paiement enregistré avec succès",
            numero_paiement: numeroPaiement,
            montant_paye: nouveauMontantPaye,
            reste_a_payer: nouveauReste,
            statut: nouveauStatut
        });

    } catch (error) {

        // Annuler la transaction en cas d'erreur
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

module.exports = router;