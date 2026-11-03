const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ==========================================
// GET - Liste des achats
// ==========================================
router.get("/", async (req, res) => {
    try {
        const [achats] = await pool.execute(`
            SELECT
                a.id_achat,
                a.numero_achat,
                a.id_fournisseur,
                f.raison_sociale AS fournisseur,
                a.numero_facture_fournisseur,
                a.date_achat,
                a.montant,
                a.statut,
                a.observation,
                a.id_utilisateur
            FROM achats a
            INNER JOIN fournisseurs f
                ON f.id_fournisseur = a.id_fournisseur
            ORDER BY a.date_achat DESC
        `);

        res.json(achats);

    } catch (error) {
        console.error("Erreur récupération achats :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des achats"
        });
    }
});
// ==========================================
// PATCH - Valider un achat
// ==========================================
router.patch("/:id/valider", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;
        const { id_utilisateur } = req.body;

        await connection.beginTransaction();

        // ------------------------------------------
        // Vérifier l'achat
        // ------------------------------------------
        const [achats] = await connection.execute(`
            SELECT
                id_achat,
                numero_achat,
                statut
            FROM achats
            WHERE id_achat = ?
            FOR UPDATE
        `, [id]);

        if (achats.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Achat introuvable"
            });
        }

        const achat = achats[0];

        // ------------------------------------------
        // Vérifier le statut
        // ------------------------------------------
        if (achat.statut !== "EN ATTENTE") {
            await connection.rollback();

            return res.status(400).json({
                message: `Impossible de valider cet achat. Son statut actuel est : ${achat.statut}`
            });
        }

        // ------------------------------------------
        // Récupérer les lignes de l'achat
        // ------------------------------------------
        const [lignes] = await connection.execute(`
            SELECT
                la.id_ligne,
                la.id_produit,
                la.quantite,
                p.libelle
            FROM lignes_achat la
            INNER JOIN produits p
                ON p.id_produit = la.id_produit
            WHERE la.id_achat = ?
        `, [id]);

        if (lignes.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "Impossible de valider un achat sans produit"
            });
        }

        // ------------------------------------------
        // Mettre l'achat à VALIDÉ
        // ------------------------------------------
        await connection.execute(`
            UPDATE achats
            SET
                statut = 'VALIDE',
                id_utilisateur = COALESCE(?, id_utilisateur)
            WHERE id_achat = ?
        `, [
            id_utilisateur || null,
            id
        ]);

        // ------------------------------------------
        // Créer les mouvements de stock
        // ------------------------------------------
        for (const ligne of lignes) {

            await connection.execute(`
                INSERT INTO mouvements_stock (
                    id_produit,
                    type_mouvement,
                    quantite,
                    motif,
                    reference,
                    id_utilisateur
                )
                VALUES (?, 'ENTREE', ?, ?, ?, ?)
            `, [
                ligne.id_produit,
                ligne.quantite,
                `Entrée suite à l'achat ${achat.numero_achat}`,
                achat.numero_achat,
                id_utilisateur || null
            ]);
        }

        // ------------------------------------------
        // Valider la transaction
        // ------------------------------------------
        await connection.commit();

        res.json({
            message: "Achat validé avec succès",
            id_achat: achat.id_achat,
            numero_achat: achat.numero_achat,
            statut: "VALIDE",
            mouvements_crees: lignes.length
        });

    } catch (error) {

        await connection.rollback();

        console.error("Erreur validation achat :", error);

        res.status(500).json({
            message: "Erreur lors de la validation de l'achat"
        });

    } finally {
        connection.release();
    }
});

// ==========================================
// GET - Détail d'un achat
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [achats] = await pool.execute(`
            SELECT
                a.id_achat,
                a.numero_achat,
                a.id_fournisseur,
                f.raison_sociale AS fournisseur,
                a.numero_facture_fournisseur,
                a.date_achat,
                a.montant,
                a.statut,
                a.observation,
                a.id_utilisateur
            FROM achats a
            INNER JOIN fournisseurs f
                ON f.id_fournisseur = a.id_fournisseur
            WHERE a.id_achat = ?
        `, [id]);

        if (achats.length === 0) {
            return res.status(404).json({
                message: "Achat introuvable"
            });
        }

        const [lignes] = await pool.execute(`
            SELECT
                la.id_ligne,
                la.id_achat,
                la.id_produit,
                p.code,
                p.libelle AS produit,
                p.unite,
                la.quantite,
                la.prix_unitaire,
                la.montant
            FROM lignes_achat la
            INNER JOIN produits p
                ON p.id_produit = la.id_produit
            WHERE la.id_achat = ?
            ORDER BY la.id_ligne ASC
        `, [id]);

        res.json({
            achat: achats[0],
            lignes
        });

    } catch (error) {
        console.error("Erreur récupération détail achat :", error);

        res.status(500).json({
            message: "Erreur lors de la récupération du détail de l'achat"
        });
    }
});

// ==========================================
// POST - Créer un achat
// ==========================================
router.post("/", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            id_fournisseur,
            numero_facture_fournisseur,
            observation,
            id_utilisateur,
            lignes
        } = req.body;

        // ------------------------------------------
        // Vérifications
        // ------------------------------------------
        if (!id_fournisseur) {
            return res.status(400).json({
                message: "Le fournisseur est obligatoire"
            });
        }

        if (!Array.isArray(lignes) || lignes.length === 0) {
            return res.status(400).json({
                message: "L'achat doit contenir au moins un produit"
            });
        }

        // Vérifier que le fournisseur existe
        const [fournisseurs] = await connection.execute(`
            SELECT id_fournisseur
            FROM fournisseurs
            WHERE id_fournisseur = ?
        `, [id_fournisseur]);

        if (fournisseurs.length === 0) {
            return res.status(404).json({
                message: "Fournisseur introuvable"
            });
        }

        // ------------------------------------------
        // Vérifier les lignes et calculer le total
        // ------------------------------------------
        let montantTotal = 0;

        for (const ligne of lignes) {

            if (!ligne.id_produit) {
                return res.status(400).json({
                    message: "Chaque ligne doit contenir un produit"
                });
            }

            if (!ligne.quantite || Number(ligne.quantite) <= 0) {
                return res.status(400).json({
                    message: "La quantité doit être supérieure à 0"
                });
            }

            if (
                ligne.prix_unitaire === undefined ||
                Number(ligne.prix_unitaire) < 0
            ) {
                return res.status(400).json({
                    message: "Le prix unitaire est invalide"
                });
            }

            // Vérifier que le produit existe
            const [produits] = await connection.execute(`
                SELECT id_produit
                FROM produits
                WHERE id_produit = ?
            `, [ligne.id_produit]);

            if (produits.length === 0) {
                return res.status(404).json({
                    message: `Produit introuvable : ${ligne.id_produit}`
                });
            }

            const montantLigne =
                Number(ligne.quantite) * Number(ligne.prix_unitaire);

            montantTotal += montantLigne;
        }

        // ------------------------------------------
        // Génération du numéro d'achat
        // ------------------------------------------
        const [dernierAchat] = await connection.execute(`
            SELECT numero_achat
            FROM achats
            ORDER BY id_achat DESC
            LIMIT 1
        `);

        let numeroAchat;

        if (dernierAchat.length === 0) {
            numeroAchat = "ACH-0001";
        } else {
            const dernierNumero = dernierAchat[0].numero_achat;

            const numero = parseInt(
                dernierNumero.replace("ACH-", ""),
                10
            ) || 0;

            numeroAchat = `ACH-${String(numero + 1).padStart(4, "0")}`;
        }

        // ------------------------------------------
        // Transaction
        // ------------------------------------------
        await connection.beginTransaction();

        // Création de l'achat
        const [achatResult] = await connection.execute(`
            INSERT INTO achats (
                numero_achat,
                id_fournisseur,
                numero_facture_fournisseur,
                montant,
                statut,
                observation,
                id_utilisateur
            )
            VALUES (?, ?, ?, ?, 'EN ATTENTE', ?, ?)
        `, [
            numeroAchat,
            id_fournisseur,
            numero_facture_fournisseur || null,
            montantTotal,
            observation || null,
            id_utilisateur || null
        ]);

        const idAchat = achatResult.insertId;

        // ------------------------------------------
        // Création des lignes
        // ------------------------------------------
        for (const ligne of lignes) {

            const montantLigne =
                Number(ligne.quantite) * Number(ligne.prix_unitaire);

            await connection.execute(`
                INSERT INTO lignes_achat (
                    id_achat,
                    id_produit,
                    quantite,
                    prix_unitaire,
                    montant
                )
                VALUES (?, ?, ?, ?, ?)
            `, [
                idAchat,
                ligne.id_produit,
                ligne.quantite,
                ligne.prix_unitaire,
                montantLigne
            ]);
        }

        await connection.commit();

        res.status(201).json({
            message: "Achat créé avec succès",
            id_achat: idAchat,
            numero_achat: numeroAchat,
            montant: montantTotal,
            statut: "EN ATTENTE"
        });

    } catch (error) {

        await connection.rollback();

        console.error("Erreur création achat :", error);

        res.status(500).json({
            message: "Erreur lors de la création de l'achat"
        });

    } finally {
        connection.release();
    }
});

module.exports = router;