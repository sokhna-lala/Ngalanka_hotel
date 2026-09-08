const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/dashboard", async (req, res) => {
    try {
        // Pour commencer, on utilise le mois en cours
        const aujourdHui = new Date();

        const annee = aujourdHui.getFullYear();
        const mois = String(aujourdHui.getMonth() + 1).padStart(2, "0");

        const dateDebut = `${annee}-${mois}-01`;

        const dernierJour = new Date(annee, aujourdHui.getMonth() + 1, 0)
            .getDate();

        const dateFin = `${annee}-${mois}-${dernierJour}`;

        // ==============================
        // 1. CHIFFRE D'AFFAIRES
        // ==============================

        const [ca] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(net_a_payer), 0) AS total
            FROM factures
            WHERE DATE(date_facture) BETWEEN ? AND ?
            AND statut <> 'ANNULEE'
            `,
            [dateDebut, dateFin]
        );

        // ==============================
        // 2. ENCAISSEMENTS
        // ==============================

        const [encaissements] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(p.montant), 0) AS total
            FROM paiements p
            INNER JOIN factures f
                ON f.id_facture = p.id_facture
            WHERE DATE(p.date_paiement) BETWEEN ? AND ?
            AND f.statut <> 'ANNULEE'
            `,
            [dateDebut, dateFin]
        );

        // ==============================
        // 3. CREANCES
        // ==============================

        const [creances] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(reste_a_payer), 0) AS total
            FROM factures
            WHERE statut <> 'ANNULEE'
            AND reste_a_payer > 0
            `
        );

        // ==============================
        // 4. NOMBRE DE FACTURES
        // ==============================

        const [factures] = await pool.execute(
            `
            SELECT
                COUNT(*) AS total
            FROM factures
            WHERE DATE(date_facture) BETWEEN ? AND ?
            AND statut <> 'ANNULEE'
            `,
            [dateDebut, dateFin]
        );

        // ==============================
        // REPONSE
        // ==============================

        res.json({
            periode: {
                date_debut: dateDebut,
                date_fin: dateFin
            },

            chiffre_affaires: Number(ca[0].total),
            encaissements: Number(encaissements[0].total),
            creances: Number(creances[0].total),
            nombre_factures: Number(factures[0].total)
        });

    } catch (error) {

        console.error(
            "Erreur tableau de bord comptable :",
            error
        );

        res.status(500).json({
            message: "Impossible de récupérer les données comptables"
        });
    }
});

module.exports = router;