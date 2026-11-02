const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ======================================================
// GET /api/dashboard/stats
// Statistiques générales + détail des chambres
// ======================================================
router.get("/stats", async (req, res) => {
    try {

        // ==================================================
        // 1. Statistiques générales
        // ==================================================

        const [dashboard] = await pool.execute(`
            SELECT *
            FROM v_dashboard_hotel
            LIMIT 1
        `);

        const statsGenerales = dashboard.length > 0
            ? dashboard[0]
            : {
                total_chambres: 0,
                chambres_disponibles: 0,
                chambres_occupees: 0,
                arrivees_du_jour: 0,
                departs_du_jour: 0,
                total_clients: 0,
                chiffre_affaires_jour: 0,
                encaissements_jour: 0,
                maintenances_en_cours: 0
            };


        // ==================================================
        // 2. Détail des chambres par type
        // ==================================================

        const [chambresParType] = await pool.execute(`
            SELECT
                t.id_type,
                t.libelle,
                COUNT(c.id_chambre) AS total,

                SUM(
                    CASE
                        WHEN c.statut = 'DISPONIBLE'
                        THEN 1
                        ELSE 0
                    END
                ) AS disponibles,

                SUM(
                    CASE
                        WHEN c.statut = 'OCCUPEE'
                        THEN 1
                        ELSE 0
                    END
                ) AS occupees,

                SUM(
                    CASE
                        WHEN c.statut = 'RESERVEE'
                        THEN 1
                        ELSE 0
                    END
                ) AS reservees,

                SUM(
                    CASE
                        WHEN c.statut = 'NETTOYAGE'
                        THEN 1
                        ELSE 0
                    END
                ) AS nettoyage,

                SUM(
                    CASE
                        WHEN c.statut = 'HORS_SERVICE'
                        THEN 1
                        ELSE 0
                    END
                ) AS hors_service

            FROM types_chambre t

            LEFT JOIN chambres c
                ON c.id_type = t.id_type

            WHERE t.statut = 'ACTIF'

            GROUP BY
                t.id_type,
                t.libelle

            ORDER BY
                t.id_type
        `);


        // ==================================================
        // 3. Statistiques globales par statut
        // ==================================================

        const [occupation] = await pool.execute(`
            SELECT
                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN statut = 'DISPONIBLE'
                        THEN 1
                        ELSE 0
                    END
                ) AS disponibles,

                SUM(
                    CASE
                        WHEN statut = 'OCCUPEE'
                        THEN 1
                        ELSE 0
                    END
                ) AS occupees,

                SUM(
                    CASE
                        WHEN statut = 'RESERVEE'
                        THEN 1
                        ELSE 0
                    END
                ) AS reservees,

                SUM(
                    CASE
                        WHEN statut = 'NETTOYAGE'
                        THEN 1
                        ELSE 0
                    END
                ) AS nettoyage,

                SUM(
                    CASE
                        WHEN statut = 'HORS_SERVICE'
                        THEN 1
                        ELSE 0
                    END
                ) AS hors_service

            FROM chambres
        `);


        // ==================================================
        // 4. Réservations à venir
        // ==================================================

        const [reservations] = await pool.execute(`
            SELECT COUNT(*) AS total
            FROM reservations
            WHERE statut IN ('EN_ATTENTE', 'CONFIRMEE')
              AND date_arrivee >= CURDATE()
        `);


        // ==================================================
        // 5. Factures impayées / partielles
        // ==================================================

        const [facturesImpayees] = await pool.execute(`
            SELECT
                COUNT(*) AS nombre,
                COALESCE(SUM(reste_a_payer), 0) AS montant
            FROM factures
            WHERE statut IN ('IMPAYEE', 'PARTIELLE')
        `);


        // ==================================================
        // 6. Réponse complète
        // ==================================================

        res.json({

            // ----------------------------------------------
            // Statistiques générales
            // ----------------------------------------------

            clients: Number(statsGenerales.total_clients || 0),

            chambres: {
                total: Number(statsGenerales.total_chambres || 0),
                disponibles: Number(
                    statsGenerales.chambres_disponibles || 0
                ),
                occupees: Number(
                    statsGenerales.chambres_occupees || 0
                ),
                reservees: Number(
                    occupation[0]?.reservees || 0
                ),
                nettoyage: Number(
                    occupation[0]?.nettoyage || 0
                ),
                hors_service: Number(
                    occupation[0]?.hors_service || 0
                ),

                // Détail par type
                par_type: chambresParType.map(chambre => ({
                    id_type: chambre.id_type,
                    libelle: chambre.libelle,

                    total: Number(chambre.total || 0),
                    disponibles: Number(
                        chambre.disponibles || 0
                    ),
                    occupees: Number(
                        chambre.occupees || 0
                    ),
                    reservees: Number(
                        chambre.reservees || 0
                    ),
                    nettoyage: Number(
                        chambre.nettoyage || 0
                    ),
                    hors_service: Number(
                        chambre.hors_service || 0
                    )
                }))
            },


            // ----------------------------------------------
            // Réservations
            // ----------------------------------------------

            reservations: Number(
                reservations[0]?.total || 0
            ),


            // ----------------------------------------------
            // Arrivées / départs
            // ----------------------------------------------

            arrivees_du_jour: Number(
                statsGenerales.arrivees_du_jour || 0
            ),

            departs_du_jour: Number(
                statsGenerales.departs_du_jour || 0
            ),


            // ----------------------------------------------
            // Clients
            // ----------------------------------------------

            total_clients: Number(
                statsGenerales.total_clients || 0
            ),


            // ----------------------------------------------
            // Finance
            // ----------------------------------------------

            chiffre_affaires_jour: Number(
                statsGenerales.chiffre_affaires_jour || 0
            ),

            encaissements_jour: Number(
                statsGenerales.encaissements_jour || 0
            ),


            // ----------------------------------------------
            // Factures
            // ----------------------------------------------

            factures_impayees: {
                nombre: Number(
                    facturesImpayees[0]?.nombre || 0
                ),

                montant: Number(
                    facturesImpayees[0]?.montant || 0
                )
            },


            // ----------------------------------------------
            // Maintenance
            // ----------------------------------------------

            maintenances_en_cours: Number(
                statsGenerales.maintenances_en_cours || 0
            )
        });

    } catch (error) {

        console.error(
            "Erreur statistiques dashboard :",
            error
        );

        res.status(500).json({
            message:
                "Impossible de récupérer les statistiques du dashboard",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined
        });
    }
});

/* ======================================================
   GET /api/dashboard/recherche?q=...
   Recherche globale : clients, réservations et chambres
====================================================== */
router.get("/recherche", async (req, res) => {
    try {
        const terme = String(req.query.q || "").trim();

        if (terme.length < 2) {
            return res.json({
                clients: [],
                reservations: [],
                chambres: []
            });
        }

        const recherche = `%${terme}%`;

        const [clients] = await pool.execute(
            `SELECT
                id_client,
                code_client,
                nom,
                prenom,
                telephone,
                email
             FROM clients
             WHERE nom LIKE ?
                OR prenom LIKE ?
                OR telephone LIKE ?
                OR email LIKE ?
                OR code_client LIKE ?
             ORDER BY nom, prenom
             LIMIT 10`,
            [recherche, recherche, recherche, recherche, recherche]
        );

        const [reservations] = await pool.execute(
            `SELECT
                r.id_reservation,
                r.numero_reservation,
                r.statut,
                r.date_arrivee,
                r.date_depart,
                c.nom,
                c.prenom,
                c.telephone
             FROM reservations r
             LEFT JOIN clients c
                ON c.id_client = r.id_client
             WHERE r.numero_reservation LIKE ?
                OR c.nom LIKE ?
                OR c.prenom LIKE ?
                OR c.telephone LIKE ?
             ORDER BY r.id_reservation DESC
             LIMIT 10`,
            [recherche, recherche, recherche, recherche]
        );

        const [chambres] = await pool.execute(
            `SELECT
                c.id_chambre,
                c.numero,
                c.statut,
                t.libelle AS type_chambre,
                c.tarif
             FROM chambres c
             LEFT JOIN types_chambre t
                ON t.id_type = c.id_type
             WHERE c.numero LIKE ?
                OR t.libelle LIKE ?
             ORDER BY c.numero
             LIMIT 10`,
            [recherche, recherche]
        );

        res.json({
            clients,
            reservations,
            chambres
        });

    } catch (error) {
        console.error("Erreur recherche dashboard :", error);

        res.status(500).json({
            message: "Impossible d'effectuer la recherche."
        });
    }
});



module.exports = router;