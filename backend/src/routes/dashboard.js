const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/stats", async (req, res) => {
    try {
        const [clients] = await pool.execute(
            "SELECT COUNT(*) AS total FROM clients"
        );

        const [chambres] = await pool.execute(
            "SELECT COUNT(*) AS total FROM chambres"
        );

        const [reservations] = await pool.execute(
            "SELECT COUNT(*) AS total FROM reservations"
        );

        const [factures] = await pool.execute(
            "SELECT COUNT(*) AS total FROM factures"
        );

        res.json({
            clients: clients[0].total,
            chambres: chambres[0].total,
            reservations: reservations[0].total,
            factures: factures[0].total
        });

    } catch (error) {
        console.error("Erreur statistiques dashboard :", error);

        res.status(500).json({
            message: "Impossible de récupérer les statistiques"
        });
    }
});

module.exports = router;