
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ==========================================
// GET - Liste des stocks
// ==========================================
router.get("/", async (req, res) => {
    try {
        const [stocks] = await pool.execute(`
            SELECT
                p.id_produit,
                p.code,
                p.libelle,
                p.unite,
                p.prix_vente,
                p.prix_achat,
                p.stock_minimum,

                COALESCE(
                    SUM(
                        CASE
                            WHEN ms.type_mouvement IN ('ENTREE', 'INVENTAIRE')
                                THEN ms.quantite

                            WHEN ms.type_mouvement IN ('SORTIE', 'PERTE')
                                THEN -ms.quantite

                            ELSE 0
                        END
                    ),
                    0
                ) AS stock_actuel

            FROM produits p

            LEFT JOIN mouvements_stock ms
                ON ms.id_produit = p.id_produit

            GROUP BY
                p.id_produit,
                p.code,
                p.libelle,
                p.unite,
                p.prix_vente,
                p.prix_achat,
                p.stock_minimum

            ORDER BY p.libelle ASC
        `);

        const resultats = stocks.map(stock => {
            const stockActuel = Number(stock.stock_actuel);
            const stockMinimum = Number(stock.stock_minimum);

            let etat = "OK";

            if (stockActuel <= 0) {
                etat = "RUPTURE";
            } else if (stockActuel <= stockMinimum) {
                etat = "STOCK FAIBLE";
            }

            return {
                ...stock,
                prix_vente: Number(stock.prix_vente),
                prix_achat: Number(stock.prix_achat),
                stock_minimum: stockMinimum,
                stock_actuel: stockActuel,
                etat
            };
        });

        res.json(resultats);

    } catch (error) {
        console.error("Erreur récupération stocks :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des stocks"
        });
    }
});


// ==========================================
// GET - Historique des mouvements de stock
// ==========================================
router.get("/mouvements", async (req, res) => {
    try {
        const [mouvements] = await pool.execute(`
            SELECT
                ms.id_mouvement,
                ms.date_mouvement,
                ms.type_mouvement,
                ms.quantite,
                ms.motif,
                ms.reference,
                ms.id_utilisateur,

                p.id_produit,
                p.code,
                p.libelle AS produit,
                p.unite

            FROM mouvements_stock ms

            INNER JOIN produits p
                ON p.id_produit = ms.id_produit

            ORDER BY ms.date_mouvement DESC, ms.id_mouvement DESC
        `);

        res.json(mouvements);

    } catch (error) {
        console.error("Erreur récupération mouvements :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des mouvements de stock"
        });
    }
});


// ==========================================
// POST - Sortie de stock
// ==========================================
router.post("/sortie", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            id_produit,
            quantite,
            motif,
            reference,
            id_utilisateur
        } = req.body;

        // Vérification des données obligatoires
        if (!id_produit || !quantite) {
            return res.status(400).json({
                message: "Le produit et la quantité sont obligatoires"
            });
        }

        if (Number(quantite) <= 0) {
            return res.status(400).json({
                message: "La quantité doit être supérieure à 0"
            });
        }

        await connection.beginTransaction();

        // ==========================================
        // 1. Vérifier que le produit existe
        // ==========================================
        const [produits] = await connection.execute(`
            SELECT
                id_produit,
                code,
                libelle
            FROM produits
            WHERE id_produit = ?
        `, [id_produit]);

        if (produits.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Produit introuvable"
            });
        }

        const produit = produits[0];

        // ==========================================
        // 2. Calculer le stock actuel
        // ==========================================
        const [stockResult] = await connection.execute(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type_mouvement IN ('ENTREE', 'INVENTAIRE')
                                THEN quantite

                            WHEN type_mouvement IN ('SORTIE', 'PERTE')
                                THEN -quantite

                            ELSE 0
                        END
                    ),
                    0
                ) AS stock_actuel
            FROM mouvements_stock
            WHERE id_produit = ?
        `, [id_produit]);

        const stockActuel = Number(stockResult[0].stock_actuel);
        const quantiteSortie = Number(quantite);

        // ==========================================
        // 3. Vérifier le stock disponible
        // ==========================================
        if (quantiteSortie > stockActuel) {
            await connection.rollback();

            return res.status(400).json({
                message: "Stock insuffisant",
                produit: produit.libelle,
                stock_actuel: stockActuel,
                quantite_demandee: quantiteSortie
            });
        }

        // ==========================================
        // 4. Créer le mouvement SORTIE
        // ==========================================
        await connection.execute(`
            INSERT INTO mouvements_stock (
                id_produit,
                type_mouvement,
                quantite,
                motif,
                reference,
                id_utilisateur
            )
            VALUES (?, 'SORTIE', ?, ?, ?, ?)
        `, [
            id_produit,
            quantiteSortie,
            motif || "Sortie de stock",
            reference || null,
            id_utilisateur || null
        ]);

        await connection.commit();

        // ==========================================
        // 5. Calculer le nouveau stock
        // ==========================================
        const nouveauStock = stockActuel - quantiteSortie;

        res.status(201).json({
            message: "Sortie de stock enregistrée avec succès",
            id_produit: produit.id_produit,
            code: produit.code,
            produit: produit.libelle,
            quantite_sortie: quantiteSortie,
            ancien_stock: stockActuel,
            nouveau_stock: nouveauStock,
            type_mouvement: "SORTIE"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur sortie de stock :", error);

        res.status(500).json({
            message: "Erreur lors de la sortie de stock"
        });

    } finally {
        connection.release();
    }
});


// ==========================================
// POST - Perte de stock
// ==========================================
router.post("/perte", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            id_produit,
            quantite,
            motif,
            reference,
            id_utilisateur
        } = req.body;

        // Vérification des données
        if (!id_produit || !quantite) {
            return res.status(400).json({
                message: "Le produit et la quantité sont obligatoires"
            });
        }

        if (Number(quantite) <= 0) {
            return res.status(400).json({
                message: "La quantité doit être supérieure à 0"
            });
        }

        if (!motif || motif.trim() === "") {
            return res.status(400).json({
                message: "Le motif de la perte est obligatoire"
            });
        }

        await connection.beginTransaction();

        // ==========================================
        // 1. Vérifier le produit
        // ==========================================
        const [produits] = await connection.execute(`
            SELECT
                id_produit,
                code,
                libelle
            FROM produits
            WHERE id_produit = ?
        `, [id_produit]);

        if (produits.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Produit introuvable"
            });
        }

        const produit = produits[0];

        // ==========================================
        // 2. Calculer le stock actuel
        // ==========================================
        const [stockResult] = await connection.execute(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type_mouvement IN ('ENTREE', 'INVENTAIRE')
                                THEN quantite

                            WHEN type_mouvement IN ('SORTIE', 'PERTE')
                                THEN -quantite

                            ELSE 0
                        END
                    ),
                    0
                ) AS stock_actuel
            FROM mouvements_stock
            WHERE id_produit = ?
        `, [id_produit]);

        const stockActuel = Number(stockResult[0].stock_actuel);
        const quantitePerte = Number(quantite);

        // ==========================================
        // 3. Vérifier le stock disponible
        // ==========================================
        if (quantitePerte > stockActuel) {
            await connection.rollback();

            return res.status(400).json({
                message: "Stock insuffisant pour enregistrer cette perte",
                produit: produit.libelle,
                stock_actuel: stockActuel,
                quantite_demandee: quantitePerte
            });
        }

        // ==========================================
        // 4. Créer le mouvement PERTE
        // ==========================================
        await connection.execute(`
            INSERT INTO mouvements_stock (
                id_produit,
                type_mouvement,
                quantite,
                motif,
                reference,
                id_utilisateur
            )
            VALUES (?, 'PERTE', ?, ?, ?, ?)
        `, [
            id_produit,
            quantitePerte,
            motif.trim(),
            reference || null,
            id_utilisateur || null
        ]);

        await connection.commit();

        // ==========================================
        // 5. Calculer le nouveau stock
        // ==========================================
        const nouveauStock = stockActuel - quantitePerte;

        res.status(201).json({
            message: "Perte de stock enregistrée avec succès",
            id_produit: produit.id_produit,
            code: produit.code,
            produit: produit.libelle,
            quantite_perdue: quantitePerte,
            ancien_stock: stockActuel,
            nouveau_stock: nouveauStock,
            type_mouvement: "PERTE"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur perte de stock :", error);

        res.status(500).json({
            message: "Erreur lors de l'enregistrement de la perte"
        });

    } finally {
        connection.release();
    }
});


// ==========================================
// POST - Inventaire de stock
// ==========================================
router.post("/inventaire", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            id_produit,
            stock_reel,
            motif,
            reference,
            id_utilisateur
        } = req.body;

        // ==========================================
        // 1. Vérification des données
        // ==========================================
        if (!id_produit || stock_reel === undefined || stock_reel === null) {
            return res.status(400).json({
                message: "Le produit et le stock réel sont obligatoires"
            });
        }

        if (Number(stock_reel) < 0) {
            return res.status(400).json({
                message: "Le stock réel ne peut pas être négatif"
            });
        }

        await connection.beginTransaction();

        // ==========================================
        // 2. Vérifier le produit
        // ==========================================
        const [produits] = await connection.execute(`
            SELECT
                id_produit,
                code,
                libelle
            FROM produits
            WHERE id_produit = ?
        `, [id_produit]);

        if (produits.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Produit introuvable"
            });
        }

        const produit = produits[0];

        // ==========================================
        // 3. Calculer le stock actuel
        // ==========================================
        const [stockResult] = await connection.execute(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type_mouvement IN ('ENTREE', 'INVENTAIRE')
                                THEN quantite

                            WHEN type_mouvement IN ('SORTIE', 'PERTE')
                                THEN -quantite

                            ELSE 0
                        END
                    ),
                    0
                ) AS stock_actuel
            FROM mouvements_stock
            WHERE id_produit = ?
        `, [id_produit]);

        const stockActuel = Number(stockResult[0].stock_actuel);
        const stockReel = Number(stock_reel);

        // ==========================================
        // 4. Calculer l'écart
        // ==========================================
        const ecart = stockReel - stockActuel;

        // Aucun écart
        if (ecart === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "Aucun écart d'inventaire",
                produit: produit.libelle,
                stock_actuel: stockActuel,
                stock_reel: stockReel
            });
        }

        // ==========================================
        // 5. Enregistrer la correction
        // ==========================================
        const typeMouvement = ecart > 0 ? "INVENTAIRE" : "PERTE";
        const quantiteMouvement = Math.abs(ecart);

        const motifFinal = motif
            ? motif.trim()
            : `Correction inventaire - stock réel : ${stockReel}`;

        await connection.execute(`
            INSERT INTO mouvements_stock (
                id_produit,
                type_mouvement,
                quantite,
                motif,
                reference,
                id_utilisateur
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            id_produit,
            typeMouvement,
            quantiteMouvement,
            motifFinal,
            reference || null,
            id_utilisateur || null
        ]);

        await connection.commit();

        res.status(201).json({
            message: "Inventaire enregistré avec succès",
            id_produit: produit.id_produit,
            code: produit.code,
            produit: produit.libelle,
            stock_avant: stockActuel,
            stock_reel: stockReel,
            ecart: ecart,
            type_mouvement: typeMouvement,
            quantite_mouvement: quantiteMouvement,
            nouveau_stock: stockReel
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur inventaire :", error);

        res.status(500).json({
            message: "Erreur lors de l'enregistrement de l'inventaire"
        });

    } finally {
        connection.release();
    }
});

module.exports = router;

