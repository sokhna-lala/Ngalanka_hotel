const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { envoyerEmail } = require("../../emailService");

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

                rc.id_chambre,
                rc.tarif_nuit,
                rc.nombre_nuits,
                rc.montant AS montant_chambre,

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
            message:
                "Impossible de récupérer les clients"
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
            message:
                "Impossible de récupérer les chambres disponibles"
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
                message:
                    "Réservation introuvable"
            });
        }


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
            message:
                "Impossible de récupérer la réservation"
        });
    }
});


// ==========================================
// POST - Créer une réservation
// ==========================================

router.post("/", async (req, res) => {

    const connection =
        await pool.getConnection();

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
            tarif_nuit
        } = req.body;


        // Validation

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


        // Vérification des dates

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


        // Vérifier le client et récupérer ses coordonnées

        const [clients] = await connection.execute(`
            SELECT
                id_client,
                nom,
                prenom,
                email,
                telephone
            FROM clients
            WHERE id_client = ?
        `, [id_client]);


        if (clients.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                message:
                    "Client introuvable"
            });
        }


        // Vérifier la chambre

        const [chambres] =
            await connection.execute(`
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
                message:
                    "Chambre introuvable"
            });
        }


        const chambre =
            chambres[0];


        if (
            chambre.statut !==
            "DISPONIBLE"
        ) {

            await connection.rollback();

            return res.status(409).json({
                message:
                    `La chambre ${chambre.numero} n'est pas disponible. Statut actuel : ${chambre.statut}`
            });
        }


        // Calcul nombre nuits

        const difference =
            new Date(date_depart).getTime() -
            new Date(date_arrivee).getTime();


        const totalNuits =
            Math.max(
                1,
                Math.ceil(
                    difference /
                    (1000 * 60 * 60 * 24)
                )
            );


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


        if (
            avanceFinale >
            montantPrevuFinal
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "L'avance ne peut pas dépasser le montant prévu"
            });
        }


        // Créer réservation

        const [result] =
            await connection.execute(`
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

                VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
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


        const idReservation =
            result.insertId;


        // Ajouter chambre

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


        // Chambre réservée

        await connection.execute(`
            UPDATE chambres

            SET statut = 'RESERVEE'

            WHERE id_chambre = ?
        `, [id_chambre]);


        await connection.commit();

    // Notification e-mail au client après l'enregistrement
        let notificationEmail = "NON_ENVOYEE";

        try {
            const client = clients[0];

            if (client.email) {
                await envoyerEmail({
                    destinataire: client.email,
                    sujet: `Demande de réservation ${numero_reservation} - NGALANKA HÔTEL`,
                    message: `Bonjour ${client.prenom || ""} ${client.nom || ""},

        Nous avons bien reçu votre demande de réservation.

        Numéro de réservation : ${numero_reservation}
        Date d'arrivée : ${date_arrivee}
        Date de départ : ${date_depart}
        Nombre de nuits : ${totalNuits}
        Montant prévu : ${montantPrevuFinal}
        Avance versée : ${avanceFinale}

        Votre demande est actuellement en attente de confirmation.

        Merci d'avoir choisi NGALANKA HÔTEL.

        Cordialement,
        L'équipe NGALANKA HÔTEL`,
                });

                notificationEmail = "ENVOYEE";
            } else {
                notificationEmail = "EMAIL_CLIENT_ABSENT";
            }
        } catch (emailError) {
            console.error(
                "Erreur notification e-mail réservation :",
                emailError.message
            );

            notificationEmail = "ECHEC";
        }
        res.status(201).json({

            message:
                "Réservation créée avec succès",

            id_reservation:
                idReservation,

            numero_reservation,

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
                statut || "EN_ATTENTE",
         notification_email: notificationEmail
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Erreur création réservation :",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {

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



/* ==========================================
   POST - CONFIRMER UNE RÉSERVATION
========================================== */

router.post("/:id/confirmer", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [reservations] = await connection.execute(
            `SELECT id_reservation, statut
             FROM reservations
             WHERE id_reservation = ?
             FOR UPDATE`,
            [req.params.id]
        );

        if (reservations.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Réservation introuvable."
            });
        }

        const reservation = reservations[0];

        if (reservation.statut !== "EN_ATTENTE") {
            await connection.rollback();
            return res.status(400).json({
                message: "Seule une réservation en attente peut être confirmée."
            });
        }

        await connection.execute(
            `UPDATE reservations
             SET statut = 'CONFIRMEE'
             WHERE id_reservation = ?`,
            [req.params.id]
        );

        await connection.commit();

        return res.json({
            message: "Réservation confirmée avec succès.",
            statut: "CONFIRMEE"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Erreur confirmation réservation :", error);

        return res.status(500).json({
            message: "Impossible de confirmer la réservation."
        });

    } finally {
        connection.release();
    }
});




/* ==========================================
   POST - CHECK-IN
   Réservation confirmée → Séjour en cours
========================================== */

router.post("/:id/checkin", async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const idReservation = req.params.id;
        const { utilisateur_checkin, caution = 0 } = req.body;

        // 1. Récupérer et verrouiller la réservation
        const [reservations] = await connection.execute(
            `SELECT
                id_reservation,
                numero_reservation,
                id_client,
                date_arrivee,
                date_depart,
                nb_adultes,
                nb_enfants,
                statut
             FROM reservations
             WHERE id_reservation = ?
             FOR UPDATE`,
            [idReservation]
        );

        if (reservations.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Réservation introuvable."
            });
        }

        const reservation = reservations[0];

        // 2. Le check-in exige une réservation confirmée
        if (reservation.statut !== "CONFIRMEE") {
            await connection.rollback();
            return res.status(400).json({
                message:
                    "Le check-in est uniquement possible pour une réservation confirmée."
            });
        }

        // 3. Empêcher la création d'un deuxième séjour actif
        const [sejoursExistants] = await connection.execute(
            `SELECT id_sejour
             FROM sejours
             WHERE id_reservation = ?
               AND statut IN ('EN_ATTENTE', 'EN_COURS')
             LIMIT 1
             FOR UPDATE`,
            [idReservation]
        );

        if (sejoursExistants.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                message:
                    "Un séjour est déjà associé à cette réservation."
            });
        }

        // 4. Récupérer la chambre liée à la réservation
        const [chambres] = await connection.execute(
            `SELECT
                rc.id_chambre,
                c.numero,
                c.statut
             FROM reservation_chambres rc
             INNER JOIN chambres c
                ON c.id_chambre = rc.id_chambre
             WHERE rc.id_reservation = ?
             LIMIT 1
             FOR UPDATE`,
            [idReservation]
        );

        if (chambres.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                message:
                    "Aucune chambre n'est associée à cette réservation."
            });
        }

        const chambre = chambres[0];

        if (
            chambre.statut !== "RESERVEE" &&
            chambre.statut !== "DISPONIBLE"
        ) {
            await connection.rollback();
            return res.status(409).json({
                message:
                    `La chambre ${chambre.numero} ne peut pas être occupée. Statut actuel : ${chambre.statut}`
            });
        }

        // 5. Calculer le nombre de nuits
        const arrivee = new Date(reservation.date_arrivee);
        const depart = new Date(reservation.date_depart);

        const nombreNuits = Math.max(
            1,
            Math.ceil(
                (depart.getTime() - arrivee.getTime()) /
                (1000 * 60 * 60 * 24)
            )
        );

        // 6. Générer le numéro de séjour
        const annee = new Date().getFullYear();

        const [derniersSejours] = await connection.execute(
            `SELECT numero_sejour
             FROM sejours
             WHERE numero_sejour LIKE ?
             ORDER BY id_sejour DESC
             LIMIT 1`,
            [`SEJ-${annee}-%`]
        );

        let prochainNumero = 1;

        if (derniersSejours.length > 0) {
            const partie = derniersSejours[0]
                .numero_sejour.split("-").pop();

            const dernierNumero = parseInt(partie, 10);

            if (!Number.isNaN(dernierNumero)) {
                prochainNumero = dernierNumero + 1;
            }
        }

        const numeroSejour =
            `SEJ-${annee}-${String(prochainNumero).padStart(4, "0")}`;

        // 7. Créer le séjour
        const [resultat] = await connection.execute(
            `INSERT INTO sejours (
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
                ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?,
                'EN_COURS', ?, ?
            )`,
            [
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
            ]
        );

        // 8. Marquer la chambre comme occupée
        await connection.execute(
            `UPDATE chambres
             SET statut = 'OCCUPEE'
             WHERE id_chambre = ?`,
            [chambre.id_chambre]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Check-in effectué avec succès.",
            id_sejour: resultat.insertId,
            numero_sejour: numeroSejour,
            id_reservation: reservation.id_reservation,
            id_chambre: chambre.id_chambre,
            numero_chambre: chambre.numero,
            statut_sejour: "EN_COURS"
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Erreur check-in :", error);

        return res.status(500).json({
            message: "Impossible d'effectuer le check-in.",
            erreur: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// ==========================================
// POST - Annuler une réservation
// ==========================================

router.post("/:id/annuler", async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();

        const idReservation =
            req.params.id;


        const [reservations] =
            await connection.execute(`
                SELECT
                    id_reservation,
                    numero_reservation,
                    statut

                FROM reservations

                WHERE id_reservation = ?

                FOR UPDATE
            `, [idReservation]);


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


        if (
            reservation.statut ===
            "ANNULEE"
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Cette réservation est déjà annulée."
            });
        }


        // Empêcher annulation si séjour actif

        const [sejours] =
            await connection.execute(`
                SELECT id_sejour

                FROM sejours

                WHERE id_reservation = ?

                AND statut = 'EN_COURS'
            `, [idReservation]);


        if (
            sejours.length > 0
        ) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Impossible d'annuler cette réservation car le client est déjà en séjour."
            });
        }


        // Récupérer chambres

        const [chambres] =
            await connection.execute(`
                SELECT id_chambre

                FROM reservation_chambres

                WHERE id_reservation = ?
            `, [idReservation]);


        // Annuler réservation

        await connection.execute(`
            UPDATE reservations

            SET statut = 'ANNULEE'

            WHERE id_reservation = ?
        `, [idReservation]);


        // Libérer chambres

        for (
            const chambre of chambres
        ) {

            await connection.execute(`
                UPDATE chambres

                SET statut = 'DISPONIBLE'

                WHERE id_chambre = ?
            `, [
                chambre.id_chambre
            ]);
        }


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


module.exports = router;