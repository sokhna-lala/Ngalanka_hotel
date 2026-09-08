const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ==========================================
// GET - Liste des réservations
// ==========================================

router.get("/", async (req, res) => {

    try {

        const [reservations] = await pool.execute(`

            SELECT
                r.id_reservation,
                r.numero_reservation,
                r.id_client,

                CONCAT(
                    c.nom,
                    ' ',
                    COALESCE(c.prenom, '')
                ) AS client,

                r.date_reservation,
                r.date_arrivee,
                r.date_depart,
                r.nb_adultes,
                r.nb_enfants,
                r.statut,
                r.montant_prevu,
                r.avance,
                r.observation,

                ch.numero AS numero_chambre,
                tc.libelle AS type_chambre

            FROM reservations r

            INNER JOIN clients c
                ON c.id_client = r.id_client

            LEFT JOIN reservation_chambres rc
                ON rc.id_reservation = r.id_reservation

            LEFT JOIN chambres ch
                ON ch.id_chambre = rc.id_chambre

            LEFT JOIN types_chambre tc
                ON tc.id_type = ch.id_type

            ORDER BY r.date_creation DESC

        `);

        res.json(reservations);

    } catch (error) {

        console.error(
            "Erreur récupération réservations :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer les réservations"
        });
    }

});

// ==========================================
// GET - Clients pour formulaire réservation
// IMPORTANT : avant /:id
// ==========================================
router.get("/data/clients", async (req, res) => {
    try {
        const [clients] = await pool.execute(`
            SELECT
                id_client,
                code_client,
                nom,
                prenom,
                telephone
            FROM clients
            ORDER BY nom ASC, prenom ASC
        `);

        res.json(clients);

    } catch (error) {
        console.error(
            "Erreur récupération clients :",
            error
        );

        res.status(500).json({
            message: "Impossible de récupérer les clients"
        });
    }
});


// ==========================================
// GET - Chambres disponibles
// IMPORTANT : avant /:id
// ==========================================
router.get("/data/chambres", async (req, res) => {
    try {
        const [chambres] = await pool.execute(`
            SELECT
                c.id_chambre,
                c.numero,
                c.id_type,
                c.tarif,
                c.statut,
                t.libelle AS type_chambre
            FROM chambres c
            INNER JOIN types_chambre t
                ON t.id_type = c.id_type
            WHERE c.statut = 'DISPONIBLE'
            ORDER BY c.numero ASC
        `);

        res.json(chambres);

    } catch (error) {
        console.error(
            "Erreur récupération chambres :",
            error
        );

        res.status(500).json({
            message: "Impossible de récupérer les chambres disponibles"
        });
    }
});


// ==========================================
// GET - Une réservation
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const [reservations] = await pool.execute(`
            SELECT
                r.*,
                CONCAT(
                    c.nom,
                    ' ',
                    COALESCE(c.prenom, '')
                ) AS client
            FROM reservations r
            INNER JOIN clients c
                ON c.id_client = r.id_client
            WHERE r.id_reservation = ?
        `, [req.params.id]);

        if (reservations.length === 0) {
            return res.status(404).json({
                message: "Réservation introuvable"
            });
        }

        // Récupérer les chambres associées
        const [chambres] = await pool.execute(`
            SELECT
                rc.id_reservation_chambre,
                rc.id_chambre,
                c.numero,
                c.id_type,
                t.libelle AS type_chambre,
                rc.tarif_nuit,
                rc.nombre_nuits,
                rc.montant
            FROM reservation_chambres rc
            INNER JOIN chambres c
                ON c.id_chambre = rc.id_chambre
            INNER JOIN types_chambre t
                ON t.id_type = c.id_type
            WHERE rc.id_reservation = ?
        `, [req.params.id]);

        res.json({
            ...reservations[0],
            chambres
        });

    } catch (error) {
        console.error(
            "Erreur récupération réservation :",
            error
        );

        res.status(500).json({
            message: "Impossible de récupérer la réservation"
        });
    }
});


// ==========================================
// POST - Créer une réservation
// ==========================================
router.post("/", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            numero_reservation,
            id_client,
            date_arrivee,
            date_depart,
            nb_adultes,
            nb_enfants,
            statut,
            montant_prevu,
            avance,
            observation,
            id_utilisateur,
            id_chambre,
            tarif_nuit,
            nombre_nuits
        } = req.body;

        // ==========================================
        // Validation
        // ==========================================
        if (
            !numero_reservation ||
            !id_client ||
            !date_arrivee ||
            !date_depart ||
            !id_chambre
        ) {
            await connection.rollback();

            return res.status(400).json({
                message:
                    "Les informations obligatoires sont manquantes"
            });
        }

        // Vérifier les dates
        if (
            new Date(date_depart) <=
            new Date(date_arrivee)
        ) {
            await connection.rollback();

            return res.status(400).json({
                message:
                    "La date de départ doit être après la date d'arrivée"
            });
        }

        // ==========================================
        // Vérifier le client
        // ==========================================
        const [clients] = await connection.execute(`
            SELECT id_client
            FROM clients
            WHERE id_client = ?
        `, [id_client]);

        if (clients.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Client introuvable"
            });
        }

        // ==========================================
        // Vérifier la chambre
        // ==========================================
        const [chambres] = await connection.execute(`
            SELECT
                id_chambre,
                numero,
                tarif,
                statut
            FROM chambres
            WHERE id_chambre = ?
            FOR UPDATE
        `, [id_chambre]);

        if (chambres.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Chambre introuvable"
            });
        }

        const chambre = chambres[0];

        if (chambre.statut !== "DISPONIBLE") {
            await connection.rollback();

            return res.status(409).json({
                message:
                    `La chambre ${chambre.numero} n'est pas disponible. ` +
                    `Statut actuel : ${chambre.statut}`
            });
        }

        // ==========================================
        // Calcul du nombre de nuits
        // ==========================================
        const difference =
            new Date(date_depart).getTime() -
            new Date(date_arrivee).getTime();

        const nuits = Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );

        const totalNuits = Math.max(1, nuits);

        const tarif =
            Number(tarif_nuit) ||
            Number(chambre.tarif) ||
            0;

        const montantCalcule =
            tarif * totalNuits;

        const montantPrevuFinal =
            Number(montant_prevu) ||
            montantCalcule;

        const avanceFinale =
            Number(avance) || 0;

        // ==========================================
        // Vérifier que l'avance ne dépasse pas
        // le montant prévu
        // ==========================================
        if (avanceFinale > montantPrevuFinal) {
            await connection.rollback();

            return res.status(400).json({
                message:
                    "L'avance ne peut pas dépasser le montant prévu"
            });
        }

        // ==========================================
        // Créer la réservation
        // ==========================================
        const [result] = await connection.execute(`
            INSERT INTO reservations (
                numero_reservation,
                id_client,
                date_arrivee,
                date_depart,
                nb_adultes,
                nb_enfants,
                statut,
                montant_prevu,
                avance,
                observation,
                id_utilisateur
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            numero_reservation,
            id_client,
            date_arrivee,
            date_depart,
            Number(nb_adultes) || 1,
            Number(nb_enfants) || 0,
            statut || "EN_ATTENTE",
            montantPrevuFinal,
            avanceFinale,
            observation || null,
            id_utilisateur || null
        ]);

        const idReservation = result.insertId;

        // ==========================================
        // Ajouter la chambre à la réservation
        // ==========================================
        await connection.execute(`
            INSERT INTO reservation_chambres (
                id_reservation,
                id_chambre,
                tarif_nuit,
                nombre_nuits,
                montant
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            idReservation,
            id_chambre,
            tarif,
            totalNuits,
            montantCalcule
        ]);

        // ==========================================
        // La chambre devient RESERVEE
        // ==========================================
        await connection.execute(`
            UPDATE chambres
            SET statut = 'RESERVEE'
            WHERE id_chambre = ?
        `, [id_chambre]);

        await connection.commit();

        res.status(201).json({
            message:
                "Réservation créée avec succès",

            id_reservation:
                idReservation,

            numero_reservation:
                numero_reservation,

            id_chambre:
                id_chambre,

            numero_chambre:
                chambre.numero,

            nombre_nuits:
                totalNuits,

            montant_prevu:
                montantPrevuFinal,

            avance:
                avanceFinale,

            statut:
                statut || "EN_ATTENTE"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur création réservation :",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message:
                    "Ce numéro de réservation existe déjà"
            });
        }

        res.status(500).json({
            message:
                "Impossible de créer la réservation"
        });

    } finally {
        connection.release();
    }
});


// ==========================================
// POST - CHECK-IN
// Réservation → Séjour
// ==========================================
router.post("/:id/checkin", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const idReservation = req.params.id;

        const {
            utilisateur_checkin,
            caution = 0
        } = req.body;

        // ==========================================
        // Récupérer réservation
        // ==========================================
        const [reservations] = await connection.execute(`
            SELECT
                r.id_reservation,
                r.numero_reservation,
                r.id_client,
                r.date_arrivee,
                r.date_depart,
                r.nb_adultes,
                r.nb_enfants,
                r.statut
            FROM reservations r
            WHERE r.id_reservation = ?
            FOR UPDATE
        `, [idReservation]);

        if (reservations.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message:
                    "Réservation introuvable"
            });
        }

        const reservation =
            reservations[0];

        // ==========================================
        // La réservation doit être CONFIRMEE
        // ==========================================
        if (reservation.statut !== "CONFIRMEE") {
            await connection.rollback();

            return res.status(400).json({
                message:
                    "Le check-in est uniquement possible pour une réservation confirmée."
            });
        }

        // ==========================================
        // Vérifier séjour existant
        // ==========================================
        const [sejoursExistants] =
            await connection.execute(`
                SELECT
                    id_sejour,
                    numero_sejour,
                    statut
                FROM sejours
                WHERE id_reservation = ?
                AND statut IN (
                    'EN_ATTENTE',
                    'EN_COURS'
                )
                LIMIT 1
                FOR UPDATE
            `, [idReservation]);

        if (sejoursExistants.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message:
                    "Un séjour est déjà associé à cette réservation.",

                id_sejour:
                    sejoursExistants[0].id_sejour,

                numero_sejour:
                    sejoursExistants[0].numero_sejour
            });
        }

        // ==========================================
        // Récupérer la chambre
        // ==========================================
        const [reservationChambres] =
            await connection.execute(`
                SELECT
                    rc.id_chambre,
                    rc.tarif_nuit,
                    rc.nombre_nuits,
                    rc.montant,
                    c.numero,
                    c.statut
                FROM reservation_chambres rc
                INNER JOIN chambres c
                    ON c.id_chambre = rc.id_chambre
                WHERE rc.id_reservation = ?
                LIMIT 1
                FOR UPDATE
            `, [idReservation]);

        if (reservationChambres.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message:
                    "Aucune chambre n'est associée à cette réservation."
            });
        }

        const chambre =
            reservationChambres[0];

        // ==========================================
        // Vérifier chambre
        // ==========================================
        if (
            chambre.statut !== "RESERVEE" &&
            chambre.statut !== "DISPONIBLE"
        ) {
            await connection.rollback();

            return res.status(409).json({
                message:
                    `La chambre ${chambre.numero} ` +
                    `ne peut pas être occupée. ` +
                    `Statut actuel : ${chambre.statut}`
            });
        }

        // ==========================================
        // Calcul nombre nuits
        // ==========================================
        const difference =
            new Date(
                reservation.date_depart
            ).getTime() -
            new Date(
                reservation.date_arrivee
            ).getTime();

        const nombreNuits =
            Math.max(
                1,
                Math.ceil(
                    difference /
                    (1000 * 60 * 60 * 24)
                )
            );

        // ==========================================
        // Générer numéro séjour
        // ==========================================
        const annee =
            new Date().getFullYear();

        const [dernierSejour] =
            await connection.execute(`
                SELECT numero_sejour
                FROM sejours
                WHERE numero_sejour LIKE ?
                ORDER BY id_sejour DESC
                LIMIT 1
                FOR UPDATE
            `, [`SEJ-${annee}-%`]);

        let numero = 1;

        if (dernierSejour.length > 0) {
            const partie =
                dernierSejour[0]
                    .numero_sejour
                    .split("-")
                    .pop();

            const dernierNumero =
                parseInt(partie, 10);

            if (
                !Number.isNaN(
                    dernierNumero
                )
            ) {
                numero =
                    dernierNumero + 1;
            }
        }

        const numeroSejour =
            `SEJ-${annee}-${String(numero).padStart(4, "0")}`;

        // ==========================================
        // Créer séjour
        // ==========================================
        const [result] =
            await connection.execute(`
                INSERT INTO sejours (
                    numero_sejour,
                    id_client,
                    id_reservation,
                    id_chambre,
                    date_arrivee_prevue,
                    date_arrivee_reelle,
                    date_depart_prevue,
                    nombre_nuits,
                    nombre_adultes,
                    nombre_enfants,
                    statut,
                    caution,
                    utilisateur_checkin
                )
                VALUES (
                    ?, ?, ?, ?, ?, NOW(), ?,
                    ?, ?, ?, 'EN_COURS', ?, ?
                )
            `, [
                numeroSejour,
                reservation.id_client,
                reservation.id_reservation,
                chambre.id_chambre,
                reservation.date_arrivee,
                reservation.date_depart,
                nombreNuits,
                reservation.nb_adultes,
                reservation.nb_enfants,
                Number(caution) || 0,
                utilisateur_checkin || null
            ]);

        const idSejour =
            result.insertId;

        // ==========================================
        // Chambre → OCCUPEE
        // ==========================================
        await connection.execute(`
            UPDATE chambres
            SET statut = 'OCCUPEE'
            WHERE id_chambre = ?
        `, [chambre.id_chambre]);

        await connection.commit();

        res.status(201).json({
            message:
                "Check-in effectué avec succès",

            id_sejour:
                idSejour,

            numero_sejour:
                numeroSejour,

            id_reservation:
                reservation.id_reservation,

            numero_reservation:
                reservation.numero_reservation,

            id_chambre:
                chambre.id_chambre,

            numero_chambre:
                chambre.numero,

            statut_sejour:
                "EN_COURS"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur check-in :",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message:
                    "Le numéro de séjour existe déjà."
            });
        }

        res.status(500).json({
            message:
                "Impossible d'effectuer le check-in."
        });

    } finally {
        connection.release();
    }
});


// ==========================================
// PUT - Modifier une réservation
// ==========================================
router.put("/:id", async (req, res) => {
    try {

        const {
            id_client,
            date_arrivee,
            date_depart,
            nb_adultes,
            nb_enfants,
            statut,
            montant_prevu,
            avance,
            observation
        } = req.body;

        if (
            !id_client ||
            !date_arrivee ||
            !date_depart
        ) {
            return res.status(400).json({
                message:
                    "Les informations obligatoires sont manquantes"
            });
        }

        if (
            new Date(date_depart) <=
            new Date(date_arrivee)
        ) {
            return res.status(400).json({
                message:
                    "La date de départ doit être après la date d'arrivée"
            });
        }

        const [result] =
            await pool.execute(`
                UPDATE reservations
                SET
                    id_client = ?,
                    date_arrivee = ?,
                    date_depart = ?,
                    nb_adultes = ?,
                    nb_enfants = ?,
                    statut = ?,
                    montant_prevu = ?,
                    avance = ?,
                    observation = ?
                WHERE id_reservation = ?
            `, [
                id_client,
                date_arrivee,
                date_depart,
                Number(nb_adultes) || 1,
                Number(nb_enfants) || 0,
                statut || "EN_ATTENTE",
                Number(montant_prevu) || 0,
                Number(avance) || 0,
                observation || null,
                req.params.id
            ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "Réservation introuvable"
            });
        }

        res.json({
            message:
                "Réservation modifiée avec succès"
        });

    } catch (error) {

        console.error(
            "Erreur modification réservation :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de modifier la réservation"
        });
    }
});

// ==========================================
// POST - ANNULER UNE RÉSERVATION
// ==========================================

router.post("/:id/annuler", async (req, res) => {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        const idReservation = req.params.id;


        // ==========================================
        // RÉCUPÉRER LA RÉSERVATION
        // ==========================================

        const [reservations] =
            await connection.execute(
                `
                SELECT
                    id_reservation,
                    numero_reservation,
                    statut
                FROM reservations
                WHERE id_reservation = ?
                FOR UPDATE
                `,
                [idReservation]
            );


        if (reservations.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "Réservation introuvable"
            });
        }


        const reservation =
            reservations[0];


        // ==========================================
        // VÉRIFIER SI DÉJÀ ANNULÉE
        // ==========================================

        if (
            reservation.statut === "ANNULEE"
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Cette réservation est déjà annulée."
            });
        }


        // ==========================================
        // RÉCUPÉRER LA CHAMBRE
        // ==========================================

        const [chambresReservation] =
            await connection.execute(
                `
                SELECT
                    id_chambre
                FROM reservation_chambres
                WHERE id_reservation = ?
                `,
                [idReservation]
            );


        // ==========================================
        // ANNULER LA RÉSERVATION
        // ==========================================

        await connection.execute(
            `
            UPDATE reservations
            SET statut = 'ANNULEE'
            WHERE id_reservation = ?
            `,
            [idReservation]
        );


        // ==========================================
        // LIBÉRER LES CHAMBRES
        // ==========================================

        for (
            const chambreReservation
            of chambresReservation
        ) {

            await connection.execute(
                `
                UPDATE chambres
                SET statut = 'DISPONIBLE'
                WHERE id_chambre = ?
                `,
                [
                    chambreReservation.id_chambre
                ]
            );
        }


        // ==========================================
        // VALIDER TRANSACTION
        // ==========================================

        await connection.commit();


        res.json({

            message:
                "Réservation annulée avec succès",

            id_reservation:
                reservation.id_reservation,

            numero_reservation:
                reservation.numero_reservation,

            statut:
                "ANNULEE"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur annulation réservation :",
            error
        );

        res.status(500).json({

            message:
                "Impossible d'annuler la réservation"
        });

    } finally {

        connection.release();
    }

});// ==========================================
// POST - ANNULER UNE RÉSERVATION
// ==========================================

router.post("/:id/annuler", async (req, res) => {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        const idReservation = req.params.id;


        // ==========================================
        // RÉCUPÉRER LA RÉSERVATION
        // ==========================================

        const [reservations] =
            await connection.execute(
                `
                SELECT
                    id_reservation,
                    numero_reservation,
                    statut
                FROM reservations
                WHERE id_reservation = ?
                FOR UPDATE
                `,
                [idReservation]
            );


        if (reservations.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "Réservation introuvable"
            });
        }


        const reservation =
            reservations[0];


        // ==========================================
        // VÉRIFIER SI DÉJÀ ANNULÉE
        // ==========================================

        if (
            reservation.statut === "ANNULEE"
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Cette réservation est déjà annulée."
            });
        }


        // ==========================================
        // RÉCUPÉRER LA CHAMBRE
        // ==========================================

        const [chambresReservation] =
            await connection.execute(
                `
                SELECT
                    id_chambre
                FROM reservation_chambres
                WHERE id_reservation = ?
                `,
                [idReservation]
            );


        // ==========================================
        // ANNULER LA RÉSERVATION
        // ==========================================

        await connection.execute(
            `
            UPDATE reservations
            SET statut = 'ANNULEE'
            WHERE id_reservation = ?
            `,
            [idReservation]
        );


        // ==========================================
        // LIBÉRER LES CHAMBRES
        // ==========================================

        for (
            const chambreReservation
            of chambresReservation
        ) {

            await connection.execute(
                `
                UPDATE chambres
                SET statut = 'DISPONIBLE'
                WHERE id_chambre = ?
                `,
                [
                    chambreReservation.id_chambre
                ]
            );
        }


        // ==========================================
        // VALIDER TRANSACTION
        // ==========================================

        await connection.commit();


        res.json({

            message:
                "Réservation annulée avec succès",

            id_reservation:
                reservation.id_reservation,

            numero_reservation:
                reservation.numero_reservation,

            statut:
                "ANNULEE"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur annulation réservation :",
            error
        );

        res.status(500).json({

            message:
                "Impossible d'annuler la réservation"
        });

    } finally {

        connection.release();
    }

});// ==========================================
// POST - ANNULER UNE RÉSERVATION
// ==========================================

router.post("/:id/annuler", async (req, res) => {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        const idReservation = req.params.id;


        // ==========================================
        // RÉCUPÉRER LA RÉSERVATION
        // ==========================================

        const [reservations] =
            await connection.execute(
                `
                SELECT
                    id_reservation,
                    numero_reservation,
                    statut
                FROM reservations
                WHERE id_reservation = ?
                FOR UPDATE
                `,
                [idReservation]
            );


        if (reservations.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "Réservation introuvable"
            });
        }


        const reservation =
            reservations[0];


        // ==========================================
        // VÉRIFIER SI DÉJÀ ANNULÉE
        // ==========================================

        if (
            reservation.statut === "ANNULEE"
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Cette réservation est déjà annulée."
            });
        }


        // ==========================================
        // RÉCUPÉRER LA CHAMBRE
        // ==========================================

        const [chambresReservation] =
            await connection.execute(
                `
                SELECT
                    id_chambre
                FROM reservation_chambres
                WHERE id_reservation = ?
                `,
                [idReservation]
            );


        // ==========================================
        // ANNULER LA RÉSERVATION
        // ==========================================

        await connection.execute(
            `
            UPDATE reservations
            SET statut = 'ANNULEE'
            WHERE id_reservation = ?
            `,
            [idReservation]
        );


        // ==========================================
        // LIBÉRER LES CHAMBRES
        // ==========================================

        for (
            const chambreReservation
            of chambresReservation
        ) {

            await connection.execute(
                `
                UPDATE chambres
                SET statut = 'DISPONIBLE'
                WHERE id_chambre = ?
                `,
                [
                    chambreReservation.id_chambre
                ]
            );
        }


        // ==========================================
        // VALIDER TRANSACTION
        // ==========================================

        await connection.commit();


        res.json({

            message:
                "Réservation annulée avec succès",

            id_reservation:
                reservation.id_reservation,

            numero_reservation:
                reservation.numero_reservation,

            statut:
                "ANNULEE"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur annulation réservation :",
            error
        );

        res.status(500).json({

            message:
                "Impossible d'annuler la réservation"
        });

    } finally {

        connection.release();
    }

});

// ==========================================
// PUT - ANNULER UNE RÉSERVATION
// ==========================================

router.put("/:id/annuler", async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();

        const idReservation =
            req.params.id;


        // ======================================
        // RÉCUPÉRER LA RÉSERVATION
        // ======================================

        const [reservations] =
            await connection.execute(
                `
                SELECT
                    id_reservation,
                    statut
                FROM reservations
                WHERE id_reservation = ?
                FOR UPDATE
                `,
                [idReservation]
            );


        if (
            reservations.length === 0
        ) {

            await connection.rollback();

            return res.status(404).json({
                message:
                    "Réservation introuvable"
            });
        }


        const reservation =
            reservations[0];


        // ======================================
        // DÉJÀ ANNULÉE
        // ======================================

        if (
            reservation.statut === "ANNULEE"
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Cette réservation est déjà annulée"
            });
        }


        // ======================================
        // EMPÊCHER ANNULATION SI CHECK-IN
        // ======================================

        const [sejours] =
            await connection.execute(
                `
                SELECT
                    id_sejour,
                    statut
                FROM sejours
                WHERE id_reservation = ?
                AND statut = 'EN_COURS'
                `,
                [idReservation]
            );


        if (
            sejours.length > 0
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Impossible d'annuler cette réservation car le client est déjà en séjour."
            });
        }


        // ======================================
        // RÉCUPÉRER LES CHAMBRES
        // ======================================

        const [chambres] =
            await connection.execute(
                `
                SELECT
                    id_chambre
                FROM reservation_chambres
                WHERE id_reservation = ?
                `,
                [idReservation]
            );


        // ======================================
        // ANNULER LA RÉSERVATION
        // ======================================

        await connection.execute(
            `
            UPDATE reservations
            SET statut = 'ANNULEE'
            WHERE id_reservation = ?
            `,
            [idReservation]
        );


        // ======================================
        // LIBÉRER LES CHAMBRES
        // ======================================

        for (
            const chambre of chambres
        ) {

            await connection.execute(
                `
                UPDATE chambres
                SET statut = 'DISPONIBLE'
                WHERE id_chambre = ?
                `,
                [
                    chambre.id_chambre
                ]
            );
        }


        await connection.commit();


        res.json({

            message:
                "Réservation annulée avec succès"

        });


    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur annulation réservation :",
            error
        );

        res.status(500).json({

            message:
                "Impossible d'annuler la réservation"

        });

    } finally {

        connection.release();

    }

});

module.exports = router;