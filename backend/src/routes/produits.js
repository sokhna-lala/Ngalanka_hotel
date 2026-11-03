
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// =====================================================
// GET - LISTE DES PRODUITS
// =====================================================
router.get("/", async (req, res) => {
    try {
        const [produits] = await pool.execute(`
            SELECT
                p.id_produit,
                p.id_categorie,
                p.code,
                p.libelle,
                p.prix_vente,
                p.prix_achat,
                p.unite,
                p.stock_minimum,
                p.description,
                p.statut,
                p.date_creation,

                c.libelle AS categorie,
                c.type AS type_categorie,

                COALESCE(
                    SUM(
                        CASE
                            WHEN ms.type_mouvement = 'ENTREE'
                                THEN ms.quantite

                            WHEN ms.type_mouvement = 'SORTIE'
                                THEN -ms.quantite

                            WHEN ms.type_mouvement = 'PERTE'
                                THEN -ms.quantite

                            ELSE 0
                        END
                    ),
                    0
                ) AS stock_actuel

            FROM produits p

            LEFT JOIN categories_produit c
                ON p.id_categorie = c.id_categorie

            LEFT JOIN mouvements_stock ms
                ON p.id_produit = ms.id_produit

            GROUP BY
                p.id_produit,
                p.id_categorie,
                p.code,
                p.libelle,
                p.prix_vente,
                p.prix_achat,
                p.unite,
                p.stock_minimum,
                p.description,
                p.statut,
                p.date_creation,
                c.libelle,
                c.type

            ORDER BY p.libelle ASC
        `);

        res.json(produits);

    } catch (error) {
        console.error("Erreur récupération produits :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des produits"
        });
    }
});


// =====================================================
// GET - LISTE DES CATEGORIES
// =====================================================
router.get("/categories", async (req, res) => {
    try {
        const [categories] = await pool.execute(`
            SELECT
                id_categorie,
                libelle,
                type,
                description,
                statut
            FROM categories_produit
            WHERE statut = 'ACTIF'
            ORDER BY type, libelle
        `);

        res.json(categories);

    } catch (error) {
        console.error("Erreur récupération catégories :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des catégories"
        });
    }
});


// =====================================================
// GET - UN PRODUIT PAR ID
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [produits] = await pool.execute(`
            SELECT
                p.*,
                c.libelle AS categorie,
                c.type AS type_categorie
            FROM produits p

            LEFT JOIN categories_produit c
                ON p.id_categorie = c.id_categorie

            WHERE p.id_produit = ?
        `, [id]);

        if (produits.length === 0) {
            return res.status(404).json({
                message: "Produit introuvable"
            });
        }

        res.json(produits[0]);

    } catch (error) {
        console.error("Erreur récupération produit :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération du produit"
        });
    }
});


// =====================================================
// POST - AJOUTER UN PRODUIT
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            id_categorie,
            code,
            libelle,
            prix_vente,
            prix_achat,
            unite,
            stock_minimum,
            description
        } = req.body;


        // ==========================================
        // VÉRIFICATION DU LIBELLÉ
        // ==========================================
        if (!libelle || !libelle.trim()) {
            return res.status(400).json({
                message: "Le libellé est obligatoire"
            });
        }


        // ==========================================
        // VÉRIFIER SI LE CODE EXISTE DÉJÀ
        // ==========================================
        if (code) {
            const [produitExistant] = await pool.execute(
                "SELECT id_produit FROM produits WHERE code = ?",
                [code]
            );

            if (produitExistant.length > 0) {
                return res.status(400).json({
                    message: "Ce code produit existe déjà"
                });
            }
        }


        // ==========================================
        // AJOUT DU PRODUIT
        // ==========================================
        const [result] = await pool.execute(`
            INSERT INTO produits (
                id_categorie,
                code,
                libelle,
                prix_vente,
                prix_achat,
                unite,
                stock_minimum,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_categorie || null,
            code || null,
            libelle.trim(),
            prix_vente || 0,
            prix_achat || 0,
            unite || "Unité",
            stock_minimum || 0,
            description || null
        ]);


        res.status(201).json({
            message: "Produit ajouté avec succès",
            id_produit: result.insertId
        });

    } catch (error) {
        console.error("Erreur ajout produit :", error);

        res.status(500).json({
            message: "Erreur lors de l'ajout du produit"
        });
    }
});


// =====================================================
// PUT - MODIFIER UN PRODUIT
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_categorie,
            code,
            libelle,
            prix_vente,
            prix_achat,
            unite,
            stock_minimum,
            description,
            statut
        } = req.body;


        // ==========================================
        // VÉRIFICATION DU LIBELLÉ
        // ==========================================
        if (!libelle || !libelle.trim()) {
            return res.status(400).json({
                message: "Le libellé est obligatoire"
            });
        }


        // ==========================================
        // VÉRIFIER SI LE PRODUIT EXISTE
        // ==========================================
        const [produit] = await pool.execute(
            "SELECT id_produit FROM produits WHERE id_produit = ?",
            [id]
        );

        if (produit.length === 0) {
            return res.status(404).json({
                message: "Produit introuvable"
            });
        }


        // ==========================================
        // VÉRIFIER LE CODE
        // ==========================================
        if (code) {
            const [codeExistant] = await pool.execute(
                `
                SELECT id_produit
                FROM produits
                WHERE code = ?
                AND id_produit != ?
                `,
                [code, id]
            );

            if (codeExistant.length > 0) {
                return res.status(400).json({
                    message: "Ce code produit est déjà utilisé"
                });
            }
        }


        // ==========================================
        // MODIFIER LE PRODUIT
        // ==========================================
        await pool.execute(`
            UPDATE produits
            SET
                id_categorie = ?,
                code = ?,
                libelle = ?,
                prix_vente = ?,
                prix_achat = ?,
                unite = ?,
                stock_minimum = ?,
                description = ?,
                statut = ?
            WHERE id_produit = ?
        `, [
            id_categorie || null,
            code || null,
            libelle.trim(),
            prix_vente || 0,
            prix_achat || 0,
            unite || "Unité",
            stock_minimum || 0,
            description || null,
            statut || "ACTIF",
            id
        ]);


        res.json({
            message: "Produit modifié avec succès"
        });

    } catch (error) {
        console.error("Erreur modification produit :", error);

        res.status(500).json({
            message: "Erreur lors de la modification du produit"
        });
    }
});


// =====================================================
// PATCH - ACTIVER / DESACTIVER UN PRODUIT
// =====================================================
router.patch("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;


        // ==========================================
        // VÉRIFIER LE STATUT
        // ==========================================
        if (!["ACTIF", "INACTIF"].includes(statut)) {
            return res.status(400).json({
                message: "Statut invalide"
            });
        }


        // ==========================================
        // MODIFIER LE STATUT
        // ==========================================
        const [result] = await pool.execute(
            `
            UPDATE produits
            SET statut = ?
            WHERE id_produit = ?
            `,
            [statut, id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Produit introuvable"
            });
        }


        res.json({
            message: `Produit ${
                statut === "ACTIF"
                    ? "activé"
                    : "désactivé"
            } avec succès`
        });

    } catch (error) {
        console.error("Erreur modification statut :", error);

        res.status(500).json({
            message: "Erreur lors de la modification du statut"
        });
    }
});

// ==========================================
// DELETE - Supprimer un produit
// ==========================================
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si le produit existe
        const [produits] = await pool.execute(
            "SELECT id_produit, libelle FROM produits WHERE id_produit = ?",
            [id]
        );

        if (produits.length === 0) {
            return res.status(404).json({
                message: "Produit introuvable"
            });
        }

        // Vérifier si le produit possède des mouvements de stock
        const [mouvements] = await pool.execute(
            "SELECT COUNT(*) AS total FROM mouvements_stock WHERE id_produit = ?",
            [id]
        );

        if (mouvements[0].total > 0) {
            return res.status(400).json({
                message:
                    "Impossible de supprimer ce produit car il possède déjà des mouvements de stock."
            });
        }

        // Supprimer le produit
        await pool.execute(
            "DELETE FROM produits WHERE id_produit = ?",
            [id]
        );

        res.json({
            message: "Produit supprimé avec succès"
        });

    } catch (error) {
        console.error("Erreur suppression produit :", error);

        res.status(500).json({
            message: "Erreur lors de la suppression du produit"
        });
    }
});


module.exports = router;
