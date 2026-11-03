const express = require("express");
const router = express.Router();
const pool = require("../config/database");

/* =========================================================
   GET /api/commandes
   Liste toutes les commandes
========================================================= */
router.get("/", async (req, res) => {
    try {
        const [commandes] = await pool.execute(`
            SELECT
                c.*,

                cl.nom AS client_nom,
                cl.prenom AS client_prenom,
                cl.telephone AS client_telephone,
                cl.email AS client_email,

                ch.numero AS numero_chambre,

                s.numero_sejour,

                (
                    SELECT COUNT(*)
                    FROM lignes_commande lc
                    WHERE lc.id_commande = c.id_commande
                ) AS nombre_lignes

            FROM commandes c

            LEFT JOIN clients cl
                ON cl.id_client = c.id_client

            LEFT JOIN chambres ch
                ON ch.id_chambre = c.id_chambre

            LEFT JOIN sejours s
                ON s.id_sejour = c.id_sejour

            ORDER BY
                c.date_commande DESC,
                c.id_commande DESC
        `);

        const resultats = commandes.map((commande) => ({
            ...commande,

            nom_client: commande.id_client
                ? `${commande.client_prenom || ""} ${commande.client_nom || ""}`.trim()
                : null
        }));

        res.json(resultats);

    } catch (error) {
        console.error(
            "Erreur récupération commandes :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la récupération des commandes"
        });
    }
});


/* =========================================================
   GET /api/commandes/sejours-actifs
   Séjours actuellement en cours
========================================================= */
router.get("/sejours-actifs", async (req, res) => {
    try {
        const [sejours] = await pool.execute(`
            SELECT
                s.id_sejour,
                s.numero_sejour,
                s.id_client,
                s.id_chambre,

                c.numero AS numero_chambre,

                cl.nom,
                cl.prenom

            FROM sejours s

            INNER JOIN chambres c
                ON c.id_chambre = s.id_chambre

            INNER JOIN clients cl
                ON cl.id_client = s.id_client

            WHERE s.statut = 'EN_COURS'

            ORDER BY
                s.date_arrivee_reelle DESC
        `);

        const resultats = sejours.map((sejour) => ({
            id_sejour: sejour.id_sejour,
            numero_sejour: sejour.numero_sejour,
            id_client: sejour.id_client,
            id_chambre: sejour.id_chambre,
            numero_chambre: sejour.numero_chambre,

            nom_client:
                `${sejour.prenom || ""} ${sejour.nom || ""}`.trim()
        }));

        res.json(resultats);

    } catch (error) {
        console.error(
            "Erreur récupération séjours actifs :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la récupération des séjours actifs"
        });
    }
});


/* =========================================================
   GET /api/commandes/:id
   Détails complets d'une commande
========================================================= */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        /* -------------------------------------------------
           Informations de la commande
        ------------------------------------------------- */
        const [commandes] = await pool.execute(`
            SELECT
                c.*,

                cl.nom AS client_nom,
                cl.prenom AS client_prenom,
                cl.telephone AS client_telephone,
                cl.email AS client_email,

                ch.numero AS numero_chambre,

                s.numero_sejour

            FROM commandes c

            LEFT JOIN clients cl
                ON cl.id_client = c.id_client

            LEFT JOIN chambres ch
                ON ch.id_chambre = c.id_chambre

            LEFT JOIN sejours s
                ON s.id_sejour = c.id_sejour

            WHERE c.id_commande = ?
        `, [id]);

        if (commandes.length === 0) {
            return res.status(404).json({
                message: "Commande introuvable"
            });
        }

        const commande = commandes[0];

        /* -------------------------------------------------
           Nom complet du client
        ------------------------------------------------- */
        const nomClient = commande.id_client
            ? `${commande.client_prenom || ""} ${commande.client_nom || ""}`.trim()
            : null;


        /* -------------------------------------------------
           Produits de la commande
        ------------------------------------------------- */
        const [lignes] = await pool.execute(`
            SELECT
                lc.id_ligne,
                lc.id_commande,
                lc.id_produit,
                lc.quantite,
                lc.prix_unitaire,
                lc.montant,

                p.code,
                p.libelle,
                p.unite

            FROM lignes_commande lc

            INNER JOIN produits p
                ON p.id_produit = lc.id_produit

            WHERE lc.id_commande = ?

            ORDER BY
                lc.id_ligne ASC
        `, [id]);


        /* -------------------------------------------------
           Réponse complète
        ------------------------------------------------- */
        res.json({
            ...commande,

            nom_client: nomClient,

            lignes
        });

    } catch (error) {
        console.error(
            "Erreur récupération commande :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la récupération de la commande"
        });
    }
});


/* =========================================================
   POST /api/commandes
   Créer une commande
========================================================= */
router.post("/", async (req, res) => {
    let connection;

    try {
        const {
            id_client,
            id_sejour,
            id_chambre,
            table_numero,
            type_commande,
            observation,
            id_utilisateur,
            lignes
        } = req.body;


        /* -------------------------------------------------
           Types de commandes autorisés
        ------------------------------------------------- */
        const typesAutorises = [
            "RESTAURANT",
            "BAR",
            "ROOM_SERVICE",
            "AUTRE"
        ];

        if (
            !type_commande ||
            !typesAutorises.includes(type_commande)
        ) {
            return res.status(400).json({
                message: "Type de commande invalide"
            });
        }


        /* -------------------------------------------------
           Vérification des produits
        ------------------------------------------------- */
        if (
            !Array.isArray(lignes) ||
            lignes.length === 0
        ) {
            return res.status(400).json({
                message:
                    "La commande doit contenir au moins un produit"
            });
        }


        for (const ligne of lignes) {
            const quantite = Number(ligne.quantite);

            if (
                !ligne.id_produit ||
                !Number.isFinite(quantite) ||
                quantite <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Chaque ligne doit contenir un produit et une quantité valide"
                });
            }
        }


        /* -------------------------------------------------
           ROOM SERVICE
           Un séjour est obligatoire
        ------------------------------------------------- */
        if (type_commande === "ROOM_SERVICE") {

            if (!id_sejour) {
                return res.status(400).json({
                    message:
                        "Le séjour est obligatoire pour un room service"
                });
            }
        }


        /* -------------------------------------------------
           Vérification du séjour
        ------------------------------------------------- */
        let clientDuSejour = null;
        let chambreDuSejour = null;

        if (id_sejour) {

            const [sejours] = await pool.execute(`
                SELECT
                    id_sejour,
                    id_client,
                    id_chambre,
                    statut

                FROM sejours

                WHERE id_sejour = ?
            `, [id_sejour]);


            if (sejours.length === 0) {
                return res.status(400).json({
                    message: "Séjour introuvable"
                });
            }


            const sejour = sejours[0];


            if (sejour.statut !== "EN_COURS") {
                return res.status(400).json({
                    message:
                        "Le séjour sélectionné n'est pas actuellement en cours"
                });
            }


            clientDuSejour = sejour.id_client;
            chambreDuSejour = sejour.id_chambre;
        }


        /* -------------------------------------------------
           Connexion transactionnelle
        ------------------------------------------------- */
        connection = await pool.getConnection();

        await connection.beginTransaction();


        /* -------------------------------------------------
           Génération du numéro de commande
        ------------------------------------------------- */
        const [numeroResult] = await connection.execute(`
            SELECT
                COALESCE(MAX(id_commande), 0) + 1
                AS prochain_numero

            FROM commandes
        `);


        const prochainNumero =
            numeroResult[0].prochain_numero;


        const numeroCommande =
            `CMD-${String(prochainNumero).padStart(4, "0")}`;


        /* -------------------------------------------------
           Client final
        ------------------------------------------------- */
        const clientFinal =
            id_sejour
                ? clientDuSejour
                : (id_client || null);


        /* -------------------------------------------------
           Chambre finale
        ------------------------------------------------- */
        const chambreFinal =
            id_sejour
                ? chambreDuSejour
                : (id_chambre || null);


        /* -------------------------------------------------
           Création de la commande
        ------------------------------------------------- */
        const [commandeResult] = await connection.execute(`
            INSERT INTO commandes (
                numero_commande,
                id_client,
                id_sejour,
                id_chambre,
                table_numero,
                type_commande,
                montant_total,
                observation,
                id_utilisateur
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            numeroCommande,
            clientFinal,
            id_sejour || null,
            chambreFinal,
            table_numero || null,
            type_commande,
            0,
            observation || null,
            id_utilisateur || null
        ]);


        const idCommande =
            commandeResult.insertId;


        let montantTotal = 0;


        /* -------------------------------------------------
           Ajout des produits
        ------------------------------------------------- */
        for (const ligne of lignes) {

            const [produits] = await connection.execute(`
                SELECT
                    id_produit,
                    libelle,
                    prix_vente,
                    statut

                FROM produits

                WHERE id_produit = ?
            `, [ligne.id_produit]);


            if (produits.length === 0) {
                throw new Error(
                    `Produit introuvable : ${ligne.id_produit}`
                );
            }


            const produit = produits[0];


            /* ---------------------------------------------
               Produit actif
            --------------------------------------------- */
            if (
                produit.statut &&
                produit.statut !== "ACTIF"
            ) {
                throw new Error(
                    `Le produit "${produit.libelle}" est inactif`
                );
            }


            const quantite =
                Number(ligne.quantite);


            const prixUnitaire =
                Number(produit.prix_vente || 0);


            const montant =
                Number(
                    (
                        quantite * prixUnitaire
                    ).toFixed(2)
                );


            /* ---------------------------------------------
               Création de la ligne
            --------------------------------------------- */
            await connection.execute(`
                INSERT INTO lignes_commande (
                    id_commande,
                    id_produit,
                    quantite,
                    prix_unitaire,
                    montant
                )

                VALUES (?, ?, ?, ?, ?)
            `, [
                idCommande,
                produit.id_produit,
                quantite,
                prixUnitaire,
                montant
            ]);


            montantTotal += montant;
        }


        montantTotal =
            Number(montantTotal.toFixed(2));


        /* -------------------------------------------------
           Mise à jour du montant total
        ------------------------------------------------- */
        await connection.execute(`
            UPDATE commandes

            SET montant_total = ?

            WHERE id_commande = ?
        `, [
            montantTotal,
            idCommande
        ]);


        /* -------------------------------------------------
           Validation de la transaction
        ------------------------------------------------- */
        await connection.commit();


        /* -------------------------------------------------
           Réponse
        ------------------------------------------------- */
        res.status(201).json({
            message:
                "Commande créée avec succès",

            id_commande:
                idCommande,

            numero_commande:
                numeroCommande,

            montant_total:
                montantTotal,

            statut:
                "OUVERTE"
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }


        console.error(
            "Erreur création commande :",
            error
        );


        res.status(500).json({
            message:
                error.message ||
                "Erreur lors de la création de la commande"
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
});


/* =========================================================
   PATCH /api/commandes/:id/statut
   Modifier le statut d'une commande
========================================================= */
router.patch("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;


        /* -------------------------------------------------
           Statuts autorisés
        ------------------------------------------------- */
        const statutsAutorises = [
            "OUVERTE",
            "EN_PREPARATION",
            "SERVIE",
            "FACTUREE"
        ];


        if (
            !statut ||
            !statutsAutorises.includes(statut)
        ) {
            return res.status(400).json({
                message:
                    "Statut de commande invalide"
            });
        }


        /* -------------------------------------------------
           Mise à jour
        ------------------------------------------------- */
        const [result] = await pool.execute(`
            UPDATE commandes

            SET statut = ?

            WHERE id_commande = ?
        `, [
            statut,
            id
        ]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "Commande introuvable"
            });
        }


        res.json({
            message:
                "Statut de la commande modifié avec succès",

            statut
        });

    } catch (error) {

        console.error(
            "Erreur modification statut commande :",
            error
        );


        res.status(500).json({
            message:
                "Erreur lors de la modification du statut de la commande"
        });
    }
});


module.exports = router;