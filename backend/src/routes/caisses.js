const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// =====================================================
// GET - Liste des caisses
// =====================================================
router.get("/", async (req, res) => {
    try {
        const [caisses] = await pool.execute(`
            SELECT
                id_caisse,
                nom_caisse,
                solde_initial,
                solde_actuel,
                statut,
                utilisateur_ouverture,
                date_ouverture,
                date_fermeture,
                observation
            FROM caisses
            ORDER BY id_caisse DESC
        `);

        res.json(caisses);

    } catch (error) {
        console.error("Erreur récupération caisses :", error);

        res.status(500).json({
            message: "Impossible de récupérer les caisses"
        });
    }
});



// =====================================================
// POST - Créer une caisse
// =====================================================
router.post("/", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            nom_caisse,
            solde_initial = 0,
            observation
        } = req.body;

        if (!nom_caisse || !String(nom_caisse).trim()) {
            return res.status(400).json({
                message: "Le nom de la caisse est obligatoire"
            });
        }

        const montantInitial = Number(solde_initial);

        if (isNaN(montantInitial) || montantInitial < 0) {
            return res.status(400).json({
                message: "Le solde initial doit être un montant positif"
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.execute(`
            INSERT INTO caisses (
                nom_caisse,
                solde_initial,
                solde_actuel,
                statut,
                observation
            )
            VALUES (?, ?, ?, 'FERMEE', ?)
        `, [
            String(nom_caisse).trim(),
            montantInitial,
            montantInitial,
            observation || null
        ]);

        await connection.commit();

        res.status(201).json({
            message: "Caisse créée avec succès",
            id_caisse: result.insertId
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur création caisse :", error);

        res.status(500).json({
            message: "Impossible de créer la caisse"
        });

    } finally {
        connection.release();
    }
});


// =====================================================
// PUT - Ouvrir une caisse
// =====================================================
router.put("/:id/ouvrir", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const id = req.params.id;

        const {
            utilisateur_ouverture,
            solde_initial,
            observation
        } = req.body;

        const [caisses] = await connection.execute(`
            SELECT
                id_caisse,
                statut,
                solde_initial,
                solde_actuel
            FROM caisses
            WHERE id_caisse = ?
        `, [id]);

        if (caisses.length === 0) {
            return res.status(404).json({
                message: "Caisse introuvable"
            });
        }

        const caisse = caisses[0];

        if (caisse.statut === "OUVERTE") {
            return res.status(400).json({
                message: "La caisse est déjà ouverte"
            });
        }

        let montantInitial = Number(
            solde_initial !== undefined
                ? solde_initial
                : caisse.solde_initial
        );

        if (isNaN(montantInitial) || montantInitial < 0) {
            return res.status(400).json({
                message: "Le solde initial est invalide"
            });
        }

        await connection.beginTransaction();

        await connection.execute(`
            UPDATE caisses
            SET
                solde_initial = ?,
                solde_actuel = ?,
                statut = 'OUVERTE',
                utilisateur_ouverture = ?,
                date_ouverture = CURRENT_TIMESTAMP,
                date_fermeture = NULL,
                observation = ?
            WHERE id_caisse = ?
        `, [
            montantInitial,
            montantInitial,
            utilisateur_ouverture || null,
            observation || null,
            id
        ]);

        await connection.commit();

        res.json({
            message: "Caisse ouverte avec succès",
            id_caisse: id,
            solde_initial: montantInitial
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur ouverture caisse :", error);

        res.status(500).json({
            message: "Impossible d'ouvrir la caisse"
        });

    } finally {
        connection.release();
    }
});


// =====================================================
// PUT - Fermer une caisse
// =====================================================
router.put("/:id/fermer", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const id = req.params.id;

        const [caisses] = await connection.execute(`
            SELECT
                id_caisse,
                statut,
                solde_actuel
            FROM caisses
            WHERE id_caisse = ?
        `, [id]);

        if (caisses.length === 0) {
            return res.status(404).json({
                message: "Caisse introuvable"
            });
        }

        const caisse = caisses[0];

        if (caisse.statut === "FERMEE") {
            return res.status(400).json({
                message: "La caisse est déjà fermée"
            });
        }

        await connection.beginTransaction();

        await connection.execute(`
            UPDATE caisses
            SET
                statut = 'FERMEE',
                date_fermeture = CURRENT_TIMESTAMP
            WHERE id_caisse = ?
        `, [id]);

        await connection.commit();

        res.json({
            message: "Caisse fermée avec succès",
            id_caisse: id,
            solde_final: Number(caisse.solde_actuel)
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur fermeture caisse :", error);

        res.status(500).json({
            message: "Impossible de fermer la caisse"
        });

    } finally {
        connection.release();
    }
});


// =====================================================
// GET - Mouvements d'une caisse
// =====================================================
router.get("/:id/mouvements", async (req, res) => {
    try {
        const id = req.params.id;

        const [mouvements] = await pool.execute(`
            SELECT
                mc.id_mouvement_caisse,
                mc.id_caisse,
                mc.id_paiement,
                mc.type_mouvement,
                mc.montant,
                mc.motif,
                mc.reference,
                mc.date_mouvement,
                mc.id_utilisateur,
                mc.observation,
                p.numero_paiement
            FROM mouvements_caisse mc
            LEFT JOIN paiements p
                ON mc.id_paiement = p.id_paiement
            WHERE mc.id_caisse = ?
            ORDER BY mc.date_mouvement DESC
        `, [id]);

        res.json(mouvements);

    } catch (error) {
        console.error("Erreur récupération mouvements :", error);

        res.status(500).json({
            message: "Impossible de récupérer les mouvements de caisse"
        });
    }
});


// =====================================================
// POST - Ajouter un mouvement de caisse
// =====================================================
router.post("/:id/mouvements", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const idCaisse = req.params.id;

        const {
            id_paiement,
            type_mouvement,
            montant,
            motif,
            reference,
            id_utilisateur,
            observation
        } = req.body;

        // -----------------------------
        // Validation
        // -----------------------------

        if (!type_mouvement) {
            return res.status(400).json({
                message: "Le type de mouvement est obligatoire"
            });
        }

        if (!["ENTREE", "SORTIE"].includes(type_mouvement)) {
            return res.status(400).json({
                message: "Le type doit être ENTREE ou SORTIE"
            });
        }

        const montantMouvement = Number(montant);

        if (
            isNaN(montantMouvement) ||
            montantMouvement <= 0
        ) {
            return res.status(400).json({
                message: "Le montant doit être supérieur à 0"
            });
        }

        if (!motif || !String(motif).trim()) {
            return res.status(400).json({
                message: "Le motif est obligatoire"
            });
        }
// =====================================================
// GET - Une caisse
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [caisses] = await pool.execute(`
            SELECT
                id_caisse,
                nom_caisse,
                solde_initial,
                solde_actuel,
                statut,
                utilisateur_ouverture,
                date_ouverture,
                date_fermeture,
                observation
            FROM caisses
            WHERE id_caisse = ?
        `, [id]);

        if (caisses.length === 0) {
            return res.status(404).json({
                message: "Caisse introuvable"
            });
        }

        res.json(caisses[0]);

    } catch (error) {
        console.error("Erreur récupération caisse :", error);

        res.status(500).json({
            message: "Impossible de récupérer la caisse"
        });
    }
});


        // -----------------------------
        // Vérifier la caisse
        // -----------------------------

        const [caisses] = await connection.execute(`
            SELECT
                id_caisse,
                statut,
                solde_actuel
            FROM caisses
            WHERE id_caisse = ?
            FOR UPDATE
        `, [idCaisse]);

        if (caisses.length === 0) {
            return res.status(404).json({
                message: "Caisse introuvable"
            });
        }

        const caisse = caisses[0];

        if (caisse.statut !== "OUVERTE") {
            return res.status(400).json({
                message: "Impossible d'effectuer un mouvement sur une caisse fermée"
            });
        }

        // -----------------------------
        // Vérifier paiement si fourni
        // -----------------------------

        if (id_paiement) {
            const [paiements] = await connection.execute(`
                SELECT
                    id_paiement,
                    montant
                FROM paiements
                WHERE id_paiement = ?
            `, [id_paiement]);

            if (paiements.length === 0) {
                return res.status(404).json({
                    message: "Paiement introuvable"
                });
            }
        }

        // -----------------------------
        // Calcul du nouveau solde
        // -----------------------------

        const ancienSolde = Number(caisse.solde_actuel);

        let nouveauSolde;

        if (type_mouvement === "ENTREE") {
            nouveauSolde =
                ancienSolde + montantMouvement;
        } else {
            nouveauSolde =
                ancienSolde - montantMouvement;
        }

        // -----------------------------
        // Empêcher un solde négatif
        // -----------------------------

        if (nouveauSolde < 0) {
            return res.status(400).json({
                message: "Solde insuffisant pour effectuer cette sortie"
            });
        }

        await connection.beginTransaction();

        // -----------------------------
        // Insérer mouvement
        // -----------------------------

        const [result] = await connection.execute(`
            INSERT INTO mouvements_caisse (
                id_caisse,
                id_paiement,
                type_mouvement,
                montant,
                motif,
                reference,
                id_utilisateur,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            idCaisse,
            id_paiement || null,
            type_mouvement,
            montantMouvement,
            String(motif).trim(),
            reference || null,
            id_utilisateur || null,
            observation || null
        ]);

        // -----------------------------
        // Mise à jour du solde
        // -----------------------------

        await connection.execute(`
            UPDATE caisses
            SET solde_actuel = ?
            WHERE id_caisse = ?
        `, [
            nouveauSolde,
            idCaisse
        ]);

        await connection.commit();

        res.status(201).json({
            message: "Mouvement enregistré avec succès",
            id_mouvement_caisse: result.insertId,
            ancien_solde: ancienSolde,
            nouveau_solde: nouveauSolde
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur mouvement caisse :", error);

        res.status(500).json({
            message: "Impossible d'enregistrer le mouvement"
        });

    } finally {
        connection.release();
    }
});


// =====================================================
// GET - Solde d'une caisse
// =====================================================
router.get("/:id/solde", async (req, res) => {
    try {
        const id = req.params.id;

        const [caisses] = await pool.execute(`
            SELECT
                id_caisse,
                nom_caisse,
                solde_initial,
                solde_actuel,
                statut
            FROM caisses
            WHERE id_caisse = ?
        `, [id]);

        if (caisses.length === 0) {
            return res.status(404).json({
                message: "Caisse introuvable"
            });
        }

        res.json(caisses[0]);

    } catch (error) {
        console.error("Erreur récupération solde :", error);

        res.status(500).json({
            message: "Impossible de récupérer le solde"
        });
    }
});


module.exports = router;