const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const enregistrerAudit = require("../utils/audit");

// =====================================================
// OUTILS
// =====================================================

const STATUTS = [
    "EN_ATTENTE",
    "CONFIRMEE",
    "ANNULEE",
    "TERMINEE"
];

function estDateValide(date) {
    if (!date) return false;

    const d = new Date(date);

    return !Number.isNaN(d.getTime());
}

function estHeureValide(heure) {
    if (!heure) return true;

    return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(heure);
}

function convertirHeureEnMinutes(heure) {
    if (!heure) return null;

    const morceaux = heure.split(":");

    return (
        Number(morceaux[0]) * 60 +
        Number(morceaux[1])
    );
}

function genererNumeroReservation() {
    const maintenant = new Date();

    const annee = maintenant.getFullYear();

    const mois = String(
        maintenant.getMonth() + 1
    ).padStart(2, "0");

    const jour = String(
        maintenant.getDate()
    ).padStart(2, "0");

    const heure = String(
        maintenant.getHours()
    ).padStart(2, "0");

    const minute = String(
        maintenant.getMinutes()
    ).padStart(2, "0");

    const seconde = String(
        maintenant.getSeconds()
    ).padStart(2, "0");

    const millisecondes = String(
        maintenant.getMilliseconds()
    ).padStart(3, "0");

    return `SEM-${annee}${mois}${jour}-${heure}${minute}${seconde}${millisecondes}`;
}


// =====================================================
// GET /api/reservations-salle
// Liste toutes les réservations
// =====================================================

router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                rs.id_reservation_salle,
                rs.numero_reservation,
                rs.id_salle,

                ss.nom AS nom_salle,
                ss.capacite AS capacite_salle,

                rs.id_client,

                COALESCE(
                    rs.nom_client,
                    TRIM(
                        CONCAT(
                            COALESCE(c.prenom, ''),
                            ' ',
                            COALESCE(c.nom, '')
                        )
                    )
                ) AS nom_client,

                c.telephone AS telephone_client,
                c.email AS email_client,

                rs.date_debut,
                rs.date_fin,
                rs.heure_debut,
                rs.heure_fin,
                rs.objet,
                rs.nombre_participants,
                rs.montant,
                rs.avance,

                (rs.montant - rs.avance) AS reste,

                rs.statut,
                rs.observation,
                rs.id_utilisateur,
                rs.date_creation

            FROM reservations_salle rs

            INNER JOIN salles_seminaire ss
                ON ss.id_salle = rs.id_salle

            LEFT JOIN clients c
                ON c.id_client = rs.id_client

            ORDER BY
                rs.date_debut DESC,
                rs.heure_debut DESC,
                rs.id_reservation_salle DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(
            "Erreur récupération réservations salle :",
            error
        );

        res.status(500).json({
            message:
                "Erreur serveur lors de la récupération des réservations"
        });
    }
});


// =====================================================
// GET /api/reservations-salle/:id
// Récupérer une réservation
// =====================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `
            SELECT
                rs.*,

                ss.nom AS nom_salle,
                ss.capacite AS capacite_salle,

                COALESCE(
                    rs.nom_client,
                    TRIM(
                        CONCAT(
                            COALESCE(c.prenom, ''),
                            ' ',
                            COALESCE(c.nom, '')
                        )
                    )
                ) AS nom_client,

                c.telephone AS telephone_client,
                c.email AS email_client

            FROM reservations_salle rs

            INNER JOIN salles_seminaire ss
                ON ss.id_salle = rs.id_salle

            LEFT JOIN clients c
                ON c.id_client = rs.id_client

            WHERE rs.id_reservation_salle = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    "Réservation de salle introuvable"
            });
        }

        const reservation = rows[0];

        reservation.reste =
            Number(reservation.montant || 0) -
            Number(reservation.avance || 0);

        res.json(reservation);

    } catch (error) {
        console.error(
            "Erreur récupération réservation :",
            error
        );

        res.status(500).json({
            message: "Erreur serveur"
        });
    }
});


// =====================================================
// POST /api/reservations-salle
// Créer une réservation
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            id_salle,
            id_client,
            nom_client,
            date_debut,
            date_fin,
            heure_debut,
            heure_fin,
            objet,
            nombre_participants,
            montant,
            avance,
            statut,
            observation,
            id_utilisateur
        } = req.body;


        // =================================================
        // VALIDATIONS
        // =================================================

        if (!id_salle) {
            return res.status(400).json({
                message: "La salle est obligatoire"
            });
        }

        // Client existant OU client saisi manuellement
        if (!id_client && !nom_client?.trim()) {
            return res.status(400).json({
                message:
                    "Veuillez sélectionner un client ou saisir le nom du client"
            });
        }

        if (!date_debut || !estDateValide(date_debut)) {
            return res.status(400).json({
                message:
                    "La date de début est obligatoire et doit être valide"
            });
        }

        if (!date_fin || !estDateValide(date_fin)) {
            return res.status(400).json({
                message:
                    "La date de fin est obligatoire et doit être valide"
            });
        }

        if (new Date(date_fin) < new Date(date_debut)) {
            return res.status(400).json({
                message:
                    "La date de fin ne peut pas être avant la date de début"
            });
        }

        if (!objet || !objet.trim()) {
            return res.status(400).json({
                message:
                    "L'objet de la réservation est obligatoire"
            });
        }

        if (
            !nombre_participants ||
            Number(nombre_participants) <= 0
        ) {
            return res.status(400).json({
                message:
                    "Le nombre de participants doit être supérieur à 0"
            });
        }

        if (
            heure_debut &&
            !estHeureValide(heure_debut)
        ) {
            return res.status(400).json({
                message: "L'heure de début est invalide"
            });
        }

        if (
            heure_fin &&
            !estHeureValide(heure_fin)
        ) {
            return res.status(400).json({
                message: "L'heure de fin est invalide"
            });
        }


        // =================================================
        // RÉCUPÉRER LA SALLE
        // =================================================

        const [salles] = await pool.execute(
            `
            SELECT *
            FROM salles_seminaire
            WHERE id_salle = ?
            `,
            [id_salle]
        );

        if (salles.length === 0) {
            return res.status(404).json({
                message:
                    "Salle de séminaire introuvable"
            });
        }

        const salle = salles[0];

        if (salle.statut === "HORS_SERVICE") {
            return res.status(409).json({
                message:
                    "Cette salle est actuellement hors service"
            });
        }


        // =================================================
        // VÉRIFIER LE CLIENT
        // =================================================

        if (id_client) {
            const [clients] = await pool.execute(
                `
                SELECT id_client
                FROM clients
                WHERE id_client = ?
                `,
                [id_client]
            );

            if (clients.length === 0) {
                return res.status(404).json({
                    message: "Client introuvable"
                });
            }
        }


        // =================================================
        // CAPACITÉ
        // =================================================

        if (
            Number(nombre_participants) >
            Number(salle.capacite)
        ) {
            return res.status(400).json({
                message:
                    `Le nombre de participants (${nombre_participants}) dépasse la capacité de la salle (${salle.capacite})`
            });
        }


        // =================================================
        // HEURES
        // =================================================

        if (heure_debut && heure_fin) {
            const debutMinutes =
                convertirHeureEnMinutes(heure_debut);

            const finMinutes =
                convertirHeureEnMinutes(heure_fin);

            if (finMinutes <= debutMinutes) {
                return res.status(400).json({
                    message:
                        "L'heure de fin doit être après l'heure de début"
                });
            }
        }


        // =================================================
        // CONTRÔLE DES CHEVAUCHEMENTS
        // =================================================

        const [chevauchements] = await pool.execute(
            `
            SELECT
                rs.id_reservation_salle,
                rs.numero_reservation,
                rs.date_debut,
                rs.date_fin,
                rs.heure_debut,
                rs.heure_fin,
                rs.statut

            FROM reservations_salle rs

            WHERE rs.id_salle = ?

            AND rs.statut <> 'ANNULEE'

            AND rs.date_debut <= ?
            AND rs.date_fin >= ?

            AND
            (
                rs.heure_debut IS NULL
                OR rs.heure_fin IS NULL
                OR ? IS NULL
                OR ? IS NULL

                OR
                (
                    rs.heure_debut < ?
                    AND rs.heure_fin > ?
                )
            )

            LIMIT 1
            `,
            [
                id_salle,
                date_fin,
                date_debut,
                heure_fin || null,
                heure_debut || null,
                heure_fin || "23:59:59",
                heure_debut || "00:00:00"
            ]
        );

        if (chevauchements.length > 0) {
            const conflit = chevauchements[0];

            return res.status(409).json({
                message:
                    `La salle est déjà réservée pendant cette période. Réservation concernée : ${conflit.numero_reservation}`
            });
        }


        // =================================================
        // MONTANTS
        // =================================================

        const montantFinal =
            Number(montant || 0);

        const avanceFinale =
            Number(avance || 0);

        if (
            Number.isNaN(montantFinal) ||
            montantFinal < 0
        ) {
            return res.status(400).json({
                message: "Le montant est invalide"
            });
        }

        if (
            Number.isNaN(avanceFinale) ||
            avanceFinale < 0
        ) {
            return res.status(400).json({
                message: "L'avance est invalide"
            });
        }

        if (avanceFinale > montantFinal) {
            return res.status(400).json({
                message:
                    "L'avance ne peut pas être supérieure au montant total"
            });
        }


        // =================================================
        // STATUT
        // =================================================

        const statutFinal =
            statut || "EN_ATTENTE";

        if (!STATUTS.includes(statutFinal)) {
            return res.status(400).json({
                message: "Statut de réservation invalide"
            });
        }


        // =================================================
        // NUMÉRO DE RÉSERVATION
        // =================================================

        let numeroReservation =
            genererNumeroReservation();

        let numeroExiste = true;

        while (numeroExiste) {
            const [rows] = await pool.execute(
                `
                SELECT id_reservation_salle
                FROM reservations_salle
                WHERE numero_reservation = ?
                `,
                [numeroReservation]
            );

            if (rows.length === 0) {
                numeroExiste = false;
            } else {
                numeroReservation =
                    genererNumeroReservation() +
                    Math.floor(
                        Math.random() * 1000
                    );
            }
        }


        // =================================================
        // INSERTION
        // =================================================

        const [result] = await pool.execute(
            `
            INSERT INTO reservations_salle
            (
                numero_reservation,
                id_salle,
                id_client,
                nom_client,
                date_debut,
                date_fin,
                heure_debut,
                heure_fin,
                objet,
                nombre_participants,
                montant,
                avance,
                statut,
                observation,
                id_utilisateur
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                numeroReservation,
                id_salle,
                id_client || null,
                nom_client?.trim() || null,
                date_debut,
                date_fin,
                heure_debut || null,
                heure_fin || null,
                objet.trim(),
                Number(nombre_participants),
                montantFinal,
                avanceFinale,
                statutFinal,
                observation?.trim() || null,
                id_utilisateur || null
            ]
        );


        // =================================================
        // AUDIT
        // =================================================

        await enregistrerAudit({
            id_utilisateur:
                id_utilisateur || null,

            action: "CREATION",

            table_cible:
                "reservations_salle",

            id_cible:
                result.insertId,

            description:
                `Création de la réservation ${numeroReservation} pour la salle "${salle.nom}"`,

            nouvelle_valeur: {
                id_reservation_salle:
                    result.insertId,

                numero_reservation:
                    numeroReservation,

                id_salle,

                id_client:
                    id_client || null,

                nom_client:
                    nom_client?.trim() || null,

                date_debut,

                date_fin,

                heure_debut:
                    heure_debut || null,

                heure_fin:
                    heure_fin || null,

                objet:
                    objet.trim(),

                nombre_participants:
                    Number(nombre_participants),

                montant:
                    montantFinal,

                avance:
                    avanceFinale,

                statut:
                    statutFinal,

                observation:
                    observation?.trim() || null
            },

            adresse_ip: req.ip,

            user_agent:
                req.get("user-agent")
        });


        res.status(201).json({
            message:
                "Réservation créée avec succès",

            id_reservation_salle:
                result.insertId,

            numero_reservation:
                numeroReservation
        });

    } catch (error) {
        console.error(
            "Erreur création réservation salle :",
            error
        );

        res.status(500).json({
            message:
                "Erreur serveur lors de la création de la réservation"
        });
    }
});


// =====================================================
// PUT /api/reservations-salle/:id
// Modifier une réservation
// =====================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_salle,
            id_client,
            nom_client,
            date_debut,
            date_fin,
            heure_debut,
            heure_fin,
            objet,
            nombre_participants,
            montant,
            avance,
            statut,
            observation,
            id_utilisateur
        } = req.body;


        // =================================================
        // RÉCUPÉRER L'ANCIENNE RÉSERVATION
        // =================================================

        const [anciennes] = await pool.execute(
            `
            SELECT *
            FROM reservations_salle
            WHERE id_reservation_salle = ?
            `,
            [id]
        );

        if (anciennes.length === 0) {
            return res.status(404).json({
                message:
                    "Réservation de salle introuvable"
            });
        }

        const ancienne = anciennes[0];


        // =================================================
        // VALIDATIONS
        // =================================================

        if (!id_salle) {
            return res.status(400).json({
                message: "La salle est obligatoire"
            });
        }

        if (!id_client && !nom_client?.trim()) {
            return res.status(400).json({
                message:
                    "Veuillez sélectionner un client ou saisir le nom du client"
            });
        }

        if (!date_debut || !estDateValide(date_debut)) {
            return res.status(400).json({
                message: "Date de début invalide"
            });
        }

        if (!date_fin || !estDateValide(date_fin)) {
            return res.status(400).json({
                message: "Date de fin invalide"
            });
        }

        if (new Date(date_fin) < new Date(date_debut)) {
            return res.status(400).json({
                message:
                    "La date de fin ne peut pas être avant la date de début"
            });
        }

        if (!objet || !objet.trim()) {
            return res.status(400).json({
                message:
                    "L'objet de la réservation est obligatoire"
            });
        }

        if (
            !nombre_participants ||
            Number(nombre_participants) <= 0
        ) {
            return res.status(400).json({
                message:
                    "Le nombre de participants doit être supérieur à 0"
            });
        }

        if (
            heure_debut &&
            !estHeureValide(heure_debut)
        ) {
            return res.status(400).json({
                message: "L'heure de début est invalide"
            });
        }

        if (
            heure_fin &&
            !estHeureValide(heure_fin)
        ) {
            return res.status(400).json({
                message: "L'heure de fin est invalide"
            });
        }

        if (heure_debut && heure_fin) {
            const debutMinutes =
                convertirHeureEnMinutes(heure_debut);

            const finMinutes =
                convertirHeureEnMinutes(heure_fin);

            if (finMinutes <= debutMinutes) {
                return res.status(400).json({
                    message:
                        "L'heure de fin doit être après l'heure de début"
                });
            }
        }


        // =================================================
        // SALLE
        // =================================================

        const [salles] = await pool.execute(
            `
            SELECT *
            FROM salles_seminaire
            WHERE id_salle = ?
            `,
            [id_salle]
        );

        if (salles.length === 0) {
            return res.status(404).json({
                message:
                    "Salle de séminaire introuvable"
            });
        }

        const salle = salles[0];

        if (salle.statut === "HORS_SERVICE") {
            return res.status(409).json({
                message:
                    "Cette salle est actuellement hors service"
            });
        }


        // =================================================
        // CLIENT
        // =================================================

        if (id_client) {
            const [clients] = await pool.execute(
                `
                SELECT id_client
                FROM clients
                WHERE id_client = ?
                `,
                [id_client]
            );

            if (clients.length === 0) {
                return res.status(404).json({
                    message: "Client introuvable"
                });
            }
        }


        // =================================================
        // CAPACITÉ
        // =================================================

        if (
            Number(nombre_participants) >
            Number(salle.capacite)
        ) {
            return res.status(400).json({
                message:
                    `Le nombre de participants (${nombre_participants}) dépasse la capacité de la salle (${salle.capacite})`
            });
        }


        // =================================================
        // CHEVAUCHEMENT
        // =================================================

        const [chevauchements] = await pool.execute(
            `
            SELECT
                rs.id_reservation_salle,
                rs.numero_reservation,
                rs.date_debut,
                rs.date_fin,
                rs.heure_debut,
                rs.heure_fin

            FROM reservations_salle rs

            WHERE rs.id_salle = ?

            AND rs.id_reservation_salle <> ?

            AND rs.statut <> 'ANNULEE'

            AND rs.date_debut <= ?
            AND rs.date_fin >= ?

            AND
            (
                rs.heure_debut IS NULL
                OR rs.heure_fin IS NULL
                OR ? IS NULL
                OR ? IS NULL

                OR
                (
                    rs.heure_debut < ?
                    AND rs.heure_fin > ?
                )
            )

            LIMIT 1
            `,
            [
                id_salle,
                id,
                date_fin,
                date_debut,
                heure_fin || null,
                heure_debut || null,
                heure_fin || "23:59:59",
                heure_debut || "00:00:00"
            ]
        );

        if (chevauchements.length > 0) {
            const conflit = chevauchements[0];

            return res.status(409).json({
                message:
                    `La salle est déjà réservée pendant cette période. Réservation concernée : ${conflit.numero_reservation}`
            });
        }


        // =================================================
        // MONTANTS
        // =================================================

        const montantFinal =
            Number(montant || 0);

        const avanceFinale =
            Number(avance || 0);

        if (
            Number.isNaN(montantFinal) ||
            montantFinal < 0
        ) {
            return res.status(400).json({
                message: "Le montant est invalide"
            });
        }

        if (
            Number.isNaN(avanceFinale) ||
            avanceFinale < 0
        ) {
            return res.status(400).json({
                message: "L'avance est invalide"
            });
        }

        if (avanceFinale > montantFinal) {
            return res.status(400).json({
                message:
                    "L'avance ne peut pas être supérieure au montant total"
            });
        }


        // =================================================
        // STATUT
        // =================================================

        const statutFinal =
            statut || ancienne.statut;

        if (!STATUTS.includes(statutFinal)) {
            return res.status(400).json({
                message: "Statut de réservation invalide"
            });
        }


        // =================================================
        // UPDATE
        // =================================================

        await pool.execute(
            `
            UPDATE reservations_salle

            SET
                id_salle = ?,
                id_client = ?,
                nom_client = ?,
                date_debut = ?,
                date_fin = ?,
                heure_debut = ?,
                heure_fin = ?,
                objet = ?,
                nombre_participants = ?,
                montant = ?,
                avance = ?,
                statut = ?,
                observation = ?

            WHERE id_reservation_salle = ?
            `,
            [
                id_salle,
                id_client || null,
                nom_client?.trim() || null,
                date_debut,
                date_fin,
                heure_debut || null,
                heure_fin || null,
                objet.trim(),
                Number(nombre_participants),
                montantFinal,
                avanceFinale,
                statutFinal,
                observation?.trim() || null,
                id
            ]
        );


        // =================================================
        // AUDIT
        // =================================================

        await enregistrerAudit({
            id_utilisateur:
                id_utilisateur || null,

            action: "MODIFICATION",

            table_cible:
                "reservations_salle",

            id_cible: id,

            description:
                `Modification de la réservation ${ancienne.numero_reservation}`,

            ancienne_valeur:
                ancienne,

            nouvelle_valeur: {
                id_reservation_salle:
                    Number(id),

                numero_reservation:
                    ancienne.numero_reservation,

                id_salle,

                id_client:
                    id_client || null,

                nom_client:
                    nom_client?.trim() || null,

                date_debut,

                date_fin,

                heure_debut:
                    heure_debut || null,

                heure_fin:
                    heure_fin || null,

                objet:
                    objet.trim(),

                nombre_participants:
                    Number(nombre_participants),

                montant:
                    montantFinal,

                avance:
                    avanceFinale,

                statut:
                    statutFinal,

                observation:
                    observation?.trim() || null
            },

            adresse_ip: req.ip,

            user_agent:
                req.get("user-agent")
        });


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
                "Erreur serveur lors de la modification"
        });
    }
});


// =====================================================
// PUT /api/reservations-salle/:id/statut
// Changer le statut
// =====================================================

router.put("/:id/statut", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            statut,
            id_utilisateur
        } = req.body;

        if (!STATUTS.includes(statut)) {
            return res.status(400).json({
                message:
                    "Statut de réservation invalide"
            });
        }

        const [rows] = await pool.execute(
            `
            SELECT *
            FROM reservations_salle
            WHERE id_reservation_salle = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    "Réservation de salle introuvable"
            });
        }

        const ancienne = rows[0];

        await pool.execute(
            `
            UPDATE reservations_salle
            SET statut = ?
            WHERE id_reservation_salle = ?
            `,
            [statut, id]
        );

        await enregistrerAudit({
            id_utilisateur:
                id_utilisateur || null,

            action:
                "CHANGEMENT_STATUT",

            table_cible:
                "reservations_salle",

            id_cible: id,

            description:
                `Changement du statut de la réservation ${ancienne.numero_reservation} : ${ancienne.statut} → ${statut}`,

            ancienne_valeur: {
                statut:
                    ancienne.statut
            },

            nouvelle_valeur: {
                statut
            },

            adresse_ip: req.ip,

            user_agent:
                req.get("user-agent")
        });

        res.json({
            message:
                "Statut de la réservation modifié avec succès"
        });

    } catch (error) {
        console.error(
            "Erreur changement statut réservation :",
            error
        );

        res.status(500).json({
            message:
                "Erreur serveur"
        });
    }
});


// =====================================================
// DELETE /api/reservations-salle/:id
// Supprimer une réservation
// =====================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { id_utilisateur } = req.body;

        const [rows] = await pool.execute(
            `
            SELECT *
            FROM reservations_salle
            WHERE id_reservation_salle = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    "Réservation de salle introuvable"
            });
        }

        const reservation = rows[0];

        await pool.execute(
            `
            DELETE FROM reservations_salle
            WHERE id_reservation_salle = ?
            `,
            [id]
        );

        await enregistrerAudit({
            id_utilisateur:
                id_utilisateur || null,

            action:
                "SUPPRESSION",

            table_cible:
                "reservations_salle",

            id_cible: id,

            description:
                `Suppression de la réservation ${reservation.numero_reservation}`,

            ancienne_valeur:
                reservation,

            adresse_ip: req.ip,

            user_agent:
                req.get("user-agent")
        });

        res.json({
            message:
                "Réservation supprimée avec succès"
        });

    } catch (error) {
        console.error(
            "Erreur suppression réservation :",
            error
        );

        res.status(500).json({
            message:
                "Erreur serveur lors de la suppression"
        });
    }
});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;