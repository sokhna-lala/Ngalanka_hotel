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

        // =====================================================
        // VALIDATIONS
        // =====================================================

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

        // =====================================================
        // VERIFIER LA FACTURE
        // =====================================================

        const [factures] = await connection.execute(
            `
            SELECT
                id_facture,
                numero_facture,
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

        if (
            montantPaiement >
            Number(facture.reste_a_payer)
        ) {
            return res.status(400).json({
                message: "Le montant dépasse le reste à payer"
            });
        }

        // =====================================================
        // VERIFIER LA CAISSE OUVERTE
        // =====================================================

        const [caisses] = await connection.execute(
            `
            SELECT
                id_caisse,
                nom_caisse,
                solde_actuel
            FROM caisses
            WHERE statut = 'OUVERTE'
            ORDER BY id_caisse ASC
            LIMIT 1
            FOR UPDATE
            `
        );

        if (caisses.length === 0) {
            return res.status(400).json({
                message:
                    "Aucune caisse ouverte. Ouvrez une caisse avant d'enregistrer un paiement."
            });
        }

        const caisse = caisses[0];

        // =====================================================
        // DEBUT TRANSACTION
        // =====================================================

        await connection.beginTransaction();

        // =====================================================
        // GENERER NUMERO PAIEMENT
        // =====================================================

        const numeroPaiement =
            await genererNumeroPaiement(connection);

        // =====================================================
        // INSERTION DU PAIEMENT
        // =====================================================

        const [paiementResult] =
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

        const idPaiement =
            paiementResult.insertId;

        // =====================================================
        // RECALCUL FACTURE
        // =====================================================

        const nouveauMontantPaye =
            Number(facture.montant_paye) +
            montantPaiement;

        const nouveauReste =
            Math.max(
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
                id_facture
            ]
        );

        // =====================================================
        // CREER MOUVEMENT DE CAISSE
        // =====================================================

        await connection.execute(
            `
            INSERT INTO mouvements_caisse (
                id_caisse,
                id_paiement,
                type_mouvement,
                montant,
                motif,
                reference,
                observation
            )
            VALUES (?, ?, 'ENTREE', ?, ?, ?, ?)
            `,
            [
                caisse.id_caisse,
                idPaiement,
                montantPaiement,
                `Paiement facture ${facture.numero_facture}`,
                reference || numeroPaiement,
                observation || null
            ]
        );

        // =====================================================
        // MISE A JOUR DU SOLDE CAISSE
        // =====================================================

        const ancienSolde =
            Number(caisse.solde_actuel);

        const nouveauSolde =
            ancienSolde + montantPaiement;

        await connection.execute(
            `
            UPDATE caisses
            SET solde_actuel = ?
            WHERE id_caisse = ?
            `,
            [
                nouveauSolde,
                caisse.id_caisse
            ]
        );

        // =====================================================
        // VALIDATION TRANSACTION
        // =====================================================

        await connection.commit();

        // =====================================================
        // REPONSE
        // =====================================================

        res.status(201).json({
            message:
                "Paiement et mouvement de caisse enregistrés avec succès",

            paiement: {
                id_paiement: idPaiement,
                numero_paiement: numeroPaiement,
                montant: montantPaiement,
                mode_paiement
            },

            facture: {
                id_facture,
                montant_paye: nouveauMontantPaye,
                reste_a_payer: nouveauReste,
                statut: nouveauStatut
            },

            caisse: {
                id_caisse: caisse.id_caisse,
                nom_caisse: caisse.nom_caisse,
                ancien_solde: ancienSolde,
                nouveau_solde: nouveauSolde
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur paiement + caisse :",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message:
                    "Le numéro de paiement existe déjà"
            });
        }

        res.status(500).json({
            message:
                "Impossible d'enregistrer le paiement et le mouvement de caisse"
        });

    } finally {
        connection.release();
    }
});


module.exports = router;