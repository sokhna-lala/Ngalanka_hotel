const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// =====================================================
// GET - Tableau de bord comptable
// =====================================================

router.get("/dashboard", async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        // -------------------------------------------------
        // Conditions de date
        // -------------------------------------------------

        let conditionFactures = "";
        let conditionPaiements = "";
        let conditionMouvements = "";

        const paramsFactures = [];
        const paramsPaiements = [];
        const paramsMouvements = [];

        if (date_debut) {
            conditionFactures += " AND DATE(f.date_facture) >= ?";
            conditionPaiements += " AND DATE(p.date_paiement) >= ?";
            conditionMouvements += " AND DATE(mc.date_mouvement) >= ?";

            paramsFactures.push(date_debut);
            paramsPaiements.push(date_debut);
            paramsMouvements.push(date_debut);
        }

        if (date_fin) {
            conditionFactures += " AND DATE(f.date_facture) <= ?";
            conditionPaiements += " AND DATE(p.date_paiement) <= ?";
            conditionMouvements += " AND DATE(mc.date_mouvement) <= ?";

            paramsFactures.push(date_fin);
            paramsPaiements.push(date_fin);
            paramsMouvements.push(date_fin);
        }

        // =================================================
        // CHIFFRE D'AFFAIRES
        // =================================================

        const [caResult] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(f.net_a_payer), 0) AS chiffre_affaires
            FROM factures f
            WHERE f.statut <> 'ANNULEE'
            ${conditionFactures}
            `,
            paramsFactures
        );

        // =================================================
        // TOTAL ENCAISSEMENTS
        // =================================================

        const [encaissementsResult] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(p.montant), 0) AS total_encaissements
            FROM paiements p
            WHERE 1 = 1
            ${conditionPaiements}
            `,
            paramsPaiements
        );

        // =================================================
        // TOTAL SORTIES
        // =================================================

        const [sortiesResult] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(mc.montant), 0) AS total_sorties
            FROM mouvements_caisse mc
            WHERE mc.type_mouvement = 'SORTIE'
            ${conditionMouvements}
            `,
            paramsMouvements
        );

        // =================================================
        // TOTAL ENTREES CAISSE
        // =================================================

        const [entreesResult] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(mc.montant), 0) AS total_entrees
            FROM mouvements_caisse mc
            WHERE mc.type_mouvement = 'ENTREE'
            ${conditionMouvements}
            `,
            paramsMouvements
        );

        // =================================================
        // SOLDE GLOBAL DES CAISSES
        // =================================================

        const [caissesResult] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(solde_actuel), 0) AS solde_global
            FROM caisses
            WHERE statut = 'OUVERTE'
            `
        );

        // =================================================
        // NOMBRE DE FACTURES
        // =================================================

        const [facturesResult] = await pool.execute(
            `
            SELECT
                COUNT(*) AS nombre_factures
            FROM factures f
            WHERE f.statut <> 'ANNULEE'
            ${conditionFactures}
            `,
            paramsFactures
        );

        // =================================================
        // FACTURES PAYEES
        // =================================================

        const [facturesPayeesResult] = await pool.execute(
            `
            SELECT
                COUNT(*) AS factures_payees
            FROM factures f
            WHERE f.statut = 'PAYEE'
            ${conditionFactures}
            `,
            paramsFactures
        );

        // =================================================
        // FACTURES PARTIELLES
        // =================================================

        const [facturesPartiellesResult] = await pool.execute(
            `
            SELECT
                COUNT(*) AS factures_partielles
            FROM factures f
            WHERE f.statut = 'PARTIELLE'
            ${conditionFactures}
            `,
            paramsFactures
        );

        // =================================================
        // FACTURES IMPAYEES
        // =================================================

        const [impayesResult] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(f.reste_a_payer), 0) AS total_impayes
            FROM factures f
            WHERE f.statut <> 'ANNULEE'
            ${conditionFactures}
            `,
            paramsFactures
        );

        // =================================================
        // RESULTAT
        // =================================================

        const totalEntrees =
            Number(entreesResult[0].total_entrees || 0);

        const totalSorties =
            Number(sortiesResult[0].total_sorties || 0);

        const soldeMouvements =
            totalEntrees - totalSorties;

        res.json({
            periode: {
                date_debut: date_debut || null,
                date_fin: date_fin || null
            },

            finances: {
                chiffre_affaires:
                    Number(
                        caResult[0].chiffre_affaires || 0
                    ),

                total_encaissements:
                    Number(
                        encaissementsResult[0]
                            .total_encaissements || 0
                    ),

                total_entrees:
                    totalEntrees,

                total_sorties:
                    totalSorties,

                solde_mouvements:
                    soldeMouvements,

                solde_global_caisses:
                    Number(
                        caissesResult[0].solde_global || 0
                    ),

                total_impayes:
                    Number(
                        impayesResult[0].total_impayes || 0
                    )
            },

            factures: {
                nombre:
                    Number(
                        facturesResult[0].nombre_factures || 0
                    ),

                payees:
                    Number(
                        facturesPayeesResult[0].factures_payees || 0
                    ),

                partielles:
                    Number(
                        facturesPartiellesResult[0]
                            .factures_partielles || 0
                    )
            }
        });

    } catch (error) {
        console.error(
            "Erreur tableau de bord comptable :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer les données comptables"
        });
    }
});


// =====================================================
// GET - Répartition des paiements par mode
// =====================================================

router.get("/paiements-par-mode", async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        let conditions = "";
        const params = [];

        if (date_debut) {
            conditions +=
                " AND DATE(p.date_paiement) >= ?";
            params.push(date_debut);
        }

        if (date_fin) {
            conditions +=
                " AND DATE(p.date_paiement) <= ?";
            params.push(date_fin);
        }

        const [result] = await pool.execute(
            `
            SELECT
                p.mode_paiement,
                COUNT(*) AS nombre_paiements,
                COALESCE(SUM(p.montant), 0) AS montant_total
            FROM paiements p
            WHERE 1 = 1
            ${conditions}
            GROUP BY p.mode_paiement
            ORDER BY montant_total DESC
            `,
            params
        );

        res.json(result);

    } catch (error) {
        console.error(
            "Erreur répartition paiements :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer la répartition des paiements"
        });
    }
});


// =====================================================
// GET - Journal comptable
// =====================================================

router.get("/journal", async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        let conditions = "";
        const params = [];

        if (date_debut) {
            conditions +=
                " AND DATE(mc.date_mouvement) >= ?";
            params.push(date_debut);
        }

        if (date_fin) {
            conditions +=
                " AND DATE(mc.date_mouvement) <= ?";
            params.push(date_fin);
        }

        const [journal] = await pool.execute(
            `
            SELECT
                mc.id_mouvement_caisse,
                mc.date_mouvement,
                mc.type_mouvement,
                mc.montant,
                mc.motif,
                mc.reference,
                mc.observation,

                c.id_caisse,
                c.nom_caisse,

                p.id_paiement,
                p.numero_paiement,
                p.mode_paiement,

                f.id_facture,
                f.numero_facture

            FROM mouvements_caisse mc

            INNER JOIN caisses c
                ON mc.id_caisse = c.id_caisse

            LEFT JOIN paiements p
                ON mc.id_paiement = p.id_paiement

            LEFT JOIN factures f
                ON p.id_facture = f.id_facture

            WHERE 1 = 1
            ${conditions}

            ORDER BY mc.date_mouvement DESC,
                     mc.id_mouvement_caisse DESC
            `,
            params
        );

        res.json(journal);

    } catch (error) {
        console.error(
            "Erreur journal comptable :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer le journal comptable"
        });
    }
});


// =====================================================
// GET - Résumé mensuel
// =====================================================

router.get("/mensuel", async (req, res) => {
    try {
        const [result] = await pool.execute(
            `
            SELECT
                DATE_FORMAT(date_paiement, '%Y-%m') AS mois,
                COUNT(*) AS nombre_paiements,
                COALESCE(SUM(montant), 0) AS total_encaissements

            FROM paiements

            GROUP BY DATE_FORMAT(
                date_paiement,
                '%Y-%m'
            )

            ORDER BY mois DESC
            `
        );

        res.json(result);

    } catch (error) {
        console.error(
            "Erreur résumé mensuel :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer le résumé mensuel"
        });
    }
});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;