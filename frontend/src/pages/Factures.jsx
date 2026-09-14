import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Factures.css";

const API_URL = "http://localhost:5000/api";

const formulaireInitial = {
    id_reservation: "",
    id_client: "",
    remise: 0,
    taxe: 0,
    observation: "",
    lignes: []
};

function Factures() {
    const [factures, setFactures] = useState([]);
    const [reservations, setReservations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [chargementReservations, setChargementReservations] = useState(true);

    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);
    const [factureEnModification, setFactureEnModification] = useState(null);
    const [factureDetail, setFactureDetail] = useState(null);

    const [formulaire, setFormulaire] = useState(formulaireInitial);

    const [recherche, setRecherche] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("TOUS");

    // =====================================================
    // CHARGER LES FACTURES
    // =====================================================

    const chargerFactures = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${API_URL}/factures`
            );

            setFactures(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

            setError("");
        } catch (err) {
            console.error("Erreur factures :", err);

            setError(
                err.response?.data?.message ||
                "Impossible de charger les factures."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // CHARGER LES RESERVATIONS
    // =====================================================

    const chargerReservations = async () => {
        try {
            setChargementReservations(true);

            const response = await axios.get(
                `${API_URL}/reservations`
            );

            setReservations(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            console.error(
                "Erreur réservations :",
                err
            );

            setReservations([]);
        } finally {
            setChargementReservations(false);
        }
    };

    // =====================================================
    // CHARGEMENT INITIAL
    // =====================================================

    useEffect(() => {
        chargerFactures();
        chargerReservations();
    }, []);

    // =====================================================
    // FORMATAGE
    // =====================================================

    const formatMontant = (montant) => {
        return Number(montant || 0).toLocaleString(
            "fr-FR"
        );
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const d = new Date(date);

        if (Number.isNaN(d.getTime())) {
            return "-";
        }

        return d.toLocaleDateString("fr-FR");
    };

    // =====================================================
    // STATUT
    // =====================================================

    const libelleStatut = (statut) => {
        const statuts = {
            IMPAYEE: "Impayée",
            PARTIELLE: "Partielle",
            PAYEE: "Payée",
            ANNULEE: "Annulée"
        };

        return statuts[statut] || statut || "-";
    };

    // =====================================================
    // NOUVELLE FACTURE
    // =====================================================

    const nouvelleFacture = () => {
        setFactureEnModification(null);
        setFormulaire(formulaireInitial);
        setAfficherFormulaire(true);
    };

    // =====================================================
    // SELECTION RESERVATION
    // =====================================================

    const handleReservationChange = (e) => {
        const idReservation = e.target.value;

        if (!idReservation) {
            setFormulaire(formulaireInitial);
            return;
        }

        const reservation = reservations.find(
            (item) =>
                Number(item.id_reservation) ===
                Number(idReservation)
        );

        if (!reservation) {
            return;
        }

        const nombreNuits =
            Number(reservation.nombre_nuits) ||
            Math.max(
                1,
                Math.ceil(
                    (
                        new Date(reservation.date_depart) -
                        new Date(reservation.date_arrivee)
                    ) /
                        (1000 * 60 * 60 * 24)
                )
            );

        const tarifNuit =
            Number(reservation.tarif_nuit) ||
            0;

        const montantChambre =
            Number(reservation.montant_chambre) ||
            nombreNuits * tarifNuit;

        setFormulaire({
            id_reservation:
                reservation.id_reservation,

            id_client:
                reservation.id_client,

            remise: 0,
            taxe: 0,
            observation:
                reservation.observation || "",

            lignes: [
                {
                    type_ligne: "CHAMBRE",

                    reference_id:
                        reservation.id_chambre || "",

                    designation:
                        `Chambre ${reservation.numero_chambre || ""}`.trim(),

                    quantite: nombreNuits,

                    prix_unitaire: tarifNuit,

                    remise: 0,

                    montant: montantChambre
                }
            ]
        });
    };

    // =====================================================
    // MODIFIER UNE FACTURE
    // =====================================================

    const modifierFacture = async (facture) => {
        try {
            const response = await axios.get(
                `${API_URL}/factures/${facture.id_facture}`
            );

            const data = response.data;
            const detail = data.facture;

            setFactureEnModification(facture);

            setFormulaire({
                id_reservation:
                    detail?.id_reservation || "",

                id_client:
                    detail?.id_client || "",

                remise:
                    Number(detail?.remise) || 0,

                taxe:
                    Number(detail?.taxe) || 0,

                observation:
                    detail?.observation || "",

                lignes:
                    Array.isArray(data.lignes)
                        ? data.lignes.map((ligne) => ({
                              type_ligne:
                                  ligne.type_ligne ||
                                  "AUTRE",

                              reference_id:
                                  ligne.reference_id ||
                                  "",

                              designation:
                                  ligne.designation ||
                                  "",

                              quantite:
                                  Number(
                                      ligne.quantite
                                  ) || 1,

                              prix_unitaire:
                                  Number(
                                      ligne.prix_unitaire
                                  ) || 0,

                              remise:
                                  Number(
                                      ligne.remise
                                  ) || 0
                          }))
                        : []
            });

            setAfficherFormulaire(true);
        } catch (err) {
            console.error(
                "Erreur récupération facture :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible de récupérer la facture."
            );
        }
    };

   // =====================================================
// VOIR UNE FACTURE
// =====================================================

const voirFacture = async (facture) => {
    try {
        const response = await axios.get(
            `${API_URL}/factures/${facture.id_facture}`
        );

        setFactureDetail({
            facture: response.data.facture,
            lignes: Array.isArray(response.data.lignes)
                ? response.data.lignes
                : []
        });

    } catch (err) {
        console.error(
            "Erreur consultation facture :",
            err
        );

        alert(
            err.response?.data?.message ||
            "Impossible de consulter la facture."
        );
    }
};
const fermerDetail = () => {
    setFactureDetail(null);
};
    // =====================================================
    // CHANGEMENT FORMULAIRE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire((ancien) => ({
            ...ancien,
            [name]: value
        }));
    };

    // =====================================================
    // CHANGEMENT LIGNE
    // =====================================================

    const handleLigneChange = (
        index,
        champ,
        value
    ) => {
        setFormulaire((ancien) => {
            const lignes = [
                ...ancien.lignes
            ];

            lignes[index] = {
                ...lignes[index],
                [champ]: value
            };

            return {
                ...ancien,
                lignes
            };
        });
    };

    // =====================================================
    // CALCULS
    // =====================================================

    const calculerMontantLigne = (ligne) => {
        const quantite =
            Number(ligne.quantite) || 0;

        const prix =
            Number(ligne.prix_unitaire) || 0;

        const remise =
            Number(ligne.remise) || 0;

        return Math.max(
            0,
            quantite * prix - remise
        );
    };

    const montantTotal = useMemo(() => {
        return formulaire.lignes.reduce(
            (total, ligne) =>
                total +
                calculerMontantLigne(ligne),
            0
        );
    }, [formulaire.lignes]);

    const remiseFacture =
        Number(formulaire.remise) || 0;

    const taxeFacture =
        Number(formulaire.taxe) || 0;

    const netAPayer = Math.max(
        0,
        montantTotal -
            remiseFacture +
            taxeFacture
    );

    // =====================================================
    // ENREGISTRER
    // =====================================================

    const enregistrerFacture = async (e) => {
        e.preventDefault();

        if (!formulaire.id_reservation) {
            alert(
                "Veuillez sélectionner une réservation."
            );
            return;
        }

        if (!formulaire.id_client) {
            alert(
                "Le client de la réservation est introuvable."
            );
            return;
        }

        if (
            !formulaire.lignes.length
        ) {
            alert(
                "La facture doit contenir au moins une ligne."
            );
            return;
        }

        const ligneInvalide =
            formulaire.lignes.find(
                (ligne) =>
                    !ligne.designation ||
                    !ligne.designation.trim()
            );

        if (ligneInvalide) {
            alert(
                "Toutes les lignes doivent avoir une désignation."
            );
            return;
        }

        try {
            const donnees = {
                id_client:
                    Number(
                        formulaire.id_client
                    ),

                id_reservation:
                    Number(
                        formulaire.id_reservation
                    ),

                id_sejour: null,

                remise:
                    Number(
                        formulaire.remise
                    ) || 0,

                taxe:
                    Number(
                        formulaire.taxe
                    ) || 0,

                observation:
                    formulaire.observation ||
                    "",

                lignes:
                    formulaire.lignes.map(
                        (ligne) => ({
                            type_ligne:
                                ligne.type_ligne ||
                                "AUTRE",

                            reference_id:
                                ligne.reference_id
                                    ? Number(
                                          ligne.reference_id
                                      )
                                    : null,

                            designation:
                                ligne.designation.trim(),

                            quantite:
                                Number(
                                    ligne.quantite
                                ) || 0,

                            prix_unitaire:
                                Number(
                                    ligne.prix_unitaire
                                ) || 0,

                            remise:
                                Number(
                                    ligne.remise
                                ) || 0
                        })
                    )
            };

            if (factureEnModification) {
                await axios.put(
                    `${API_URL}/factures/${factureEnModification.id_facture}`,
                    donnees
                );

                alert(
                    "Facture modifiée avec succès."
                );
            } else {
                await axios.post(
                    `${API_URL}/factures`,
                    donnees
                );

                alert(
                    "Facture créée avec succès."
                );
            }

            fermerFormulaire();

            await chargerFactures();
        } catch (err) {
            console.error(
                "Erreur facture :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer la facture."
            );
        }
    };

    // =====================================================
    // FERMER FORMULAIRE
    // =====================================================

    const fermerFormulaire = () => {
        setAfficherFormulaire(false);
        setFactureEnModification(null);
        setFormulaire(formulaireInitial);
    };

    // =====================================================
    // FILTRAGE
    // =====================================================

    const facturesFiltrees = useMemo(() => {
        const terme =
            recherche.trim().toLowerCase();

        return factures.filter((facture) => {
            const texte = [
                facture.numero_facture,
                facture.numero_reservation,
                facture.numero_sejour,
                facture.nom,
                facture.prenom,
                facture.code_client
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const correspondRecherche =
                !terme ||
                texte.includes(terme);

            const correspondStatut =
                filtreStatut === "TOUS" ||
                facture.statut === filtreStatut;

            return (
                correspondRecherche &&
                correspondStatut
            );
        });
    }, [
        factures,
        recherche,
        filtreStatut
    ]);

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const statistiques = useMemo(() => {
        const totalFactures =
            factures.length;

        const chiffreAffaires =
            factures.reduce(
                (total, facture) =>
                    total +
                    Number(
                        facture.net_a_payer
                    || 0),
                0
            );

        const encaisse =
            factures.reduce(
                (total, facture) =>
                    total +
                    Number(
                        facture.montant_paye
                    || 0),
                0
            );

        const impayes =
            factures.reduce(
                (total, facture) =>
                    total +
                    Number(
                        facture.reste_a_payer
                    || 0),
                0
            );

        return {
            totalFactures,
            chiffreAffaires,
            encaisse,
            impayes
        };
    }, [factures]);

    // =====================================================
    // RENDU
    // =====================================================

    return (
        <div className="factures-page">

            {/* EN-TÊTE */}

            <div className="factures-header">
                <div>
                    <h1>Factures</h1>

                    <p>
                        Préparez et gérez vos factures
                        à partir des réservations.
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={nouvelleFacture}
                >
                    + Nouvelle facture
                </button>
            </div>
            {/* =====================================================
    MODAL DETAIL FACTURE
===================================================== */}

{factureDetail && (
    <div className="modal-overlay">

        <div className="detail-modal">

            {/* EN-TÊTE */}

            <div className="detail-header">

                <div>
                    <span className="detail-label">
                        FACTURE
                    </span>

                    <h2>
                        {
                            factureDetail.facture
                                ?.numero_facture
                        }
                    </h2>

                    <p>
                        Émise le{" "}
                        {
                            formatDate(
                                factureDetail.facture
                                    ?.date_facture
                            )
                        }
                    </p>
                </div>

                <button
                    className="modal-close"
                    onClick={fermerDetail}
                >
                    ×
                </button>

            </div>

            {/* INFORMATIONS CLIENT */}

            <div className="detail-section">

                <div className="detail-section-title">
                    Informations client
                </div>

                <div className="detail-info-grid">

                    <div>
                        <span>
                            Client
                        </span>

                        <strong>
                            {
                                factureDetail.facture
                                    ?.nom
                            }{" "}
                            {
                                factureDetail.facture
                                    ?.prenom
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Code client
                        </span>

                        <strong>
                            {
                                factureDetail.facture
                                    ?.code_client ||
                                "-"
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Réservation
                        </span>

                        <strong className="detail-reservation">
                            {
                                factureDetail.facture
                                    ?.numero_reservation ||
                                "-"
                            }
                        </strong>
                    </div>

                </div>

            </div>

            {/* LIGNES */}

            <div className="detail-section">

                <div className="detail-section-title">
                    Détail des prestations
                </div>

                <div className="detail-lines">

                    <div className="detail-line detail-line-head">
                        <span>
                            Désignation
                        </span>

                        <span>
                            Qté
                        </span>

                        <span>
                            Prix unitaire
                        </span>

                        <span>
                            Total
                        </span>
                    </div>

                    {factureDetail.lignes.map(
                        (ligne, index) => (
                            <div
                                className="detail-line"
                                key={index}
                            >

                                <span>
                                    <strong>
                                        {
                                            ligne.designation
                                        }
                                    </strong>

                                    <small>
                                        {
                                            ligne.type_ligne
                                        }
                                    </small>
                                </span>

                                <span>
                                    {
                                        Number(
                                            ligne.quantite
                                        )
                                    }
                                </span>

                                <span>
                                    {
                                        formatMontant(
                                            ligne.prix_unitaire
                                        )
                                    }{" "}
                                    FCFA
                                </span>

                                <span>
                                    <strong>
                                        {
                                            formatMontant(
                                                ligne.montant
                                            )
                                        }{" "}
                                        FCFA
                                    </strong>
                                </span>

                            </div>
                        )
                    )}

                </div>

            </div>

            {/* TOTALS */}

            <div className="detail-total-section">

                <div className="detail-total-row">
                    <span>
                        Sous-total
                    </span>

                    <strong>
                        {
                            formatMontant(
                                factureDetail.facture
                                    ?.montant_total
                            )
                        }{" "}
                        FCFA
                    </strong>
                </div>

                <div className="detail-total-row">
                    <span>
                        Remise
                    </span>

                    <strong>
                        -{" "}
                        {
                            formatMontant(
                                factureDetail.facture
                                    ?.remise
                            )
                        }{" "}
                        FCFA
                    </strong>
                </div>

                <div className="detail-total-row">
                    <span>
                        Taxe
                    </span>

                    <strong>
                        +{" "}
                        {
                            formatMontant(
                                factureDetail.facture
                                    ?.taxe
                            )
                        }{" "}
                        FCFA
                    </strong>
                </div>

                <div className="detail-total-final">
                    <span>
                        NET À PAYER
                    </span>

                    <strong>
                        {
                            formatMontant(
                                factureDetail.facture
                                    ?.net_a_payer
                            )
                        }{" "}
                        FCFA
                    </strong>
                </div>

            </div>

            {/* PAIEMENT */}

            <div className="detail-payment">

                <div>
                    <span>
                        Montant payé
                    </span>

                    <strong className="payment-paid">
                        {
                            formatMontant(
                                factureDetail.facture
                                    ?.montant_paye
                            )
                        }{" "}
                        FCFA
                    </strong>
                </div>

                <div>
                    <span>
                        Reste à payer
                    </span>

                    <strong className="payment-rest">
                        {
                            formatMontant(
                                factureDetail.facture
                                    ?.reste_a_payer
                            )
                        }{" "}
                        FCFA
                    </strong>
                </div>

                <div>
                    <span>
                        Statut
                    </span>

                    <strong>
                        <span
                            className={`status-badge status-${String(
                                factureDetail.facture
                                    ?.statut || ""
                            ).toLowerCase()}`}
                        >
                            {
                                libelleStatut(
                                    factureDetail.facture
                                        ?.statut
                                )
                            }
                        </span>
                    </strong>
                </div>

            </div>

            {/* OBSERVATION */}

            {factureDetail.facture
                ?.observation && (
                <div className="detail-observation">

                    <span>
                        Observation
                    </span>

                    <p>
                        {
                            factureDetail.facture
                                .observation
                        }
                    </p>

                </div>
            )}

            {/* ACTIONS */}

            <div className="detail-actions">

                <button
                    type="button"
                    className="btn-secondary"
                    onClick={fermerDetail}
                >
                    Fermer
                </button>

            </div>

        </div>

    </div>
)}

            {/* ERREUR */}

            {error && (
                <div className="factures-alert">
                    {error}
                </div>
            )}

            {/* STATISTIQUES */}

            <div className="factures-stats">

                <div className="stat-card">
                    <div className="stat-icon">
                        🧾
                    </div>

                    <div>
                        <span>
                            Factures
                        </span>

                        <strong>
                            {
                                statistiques.totalFactures
                            }
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        💰
                    </div>

                    <div>
                        <span>
                            Net à payer
                        </span>

                        <strong>
                            {formatMontant(
                                statistiques.chiffreAffaires
                            )} FCFA
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        ✓
                    </div>

                    <div>
                        <span>
                            Encaissé
                        </span>

                        <strong>
                            {formatMontant(
                                statistiques.encaisse
                            )} FCFA
                        </strong>
                    </div>
                </div>

                <div className="stat-card stat-danger">
                    <div className="stat-icon">
                        !
                    </div>

                    <div>
                        <span>
                            Reste à payer
                        </span>

                        <strong>
                            {formatMontant(
                                statistiques.impayes
                            )} FCFA
                        </strong>
                    </div>
                </div>

            </div>

            {/* RECHERCHE */}

            <div className="factures-toolbar">

                <div className="search-box">
                    🔎

                    <input
                        type="text"
                        placeholder="Rechercher une facture, un client ou une réservation..."
                        value={recherche}
                        onChange={(e) =>
                            setRecherche(
                                e.target.value
                            )
                        }
                    />
                </div>

                <select
                    value={filtreStatut}
                    onChange={(e) =>
                        setFiltreStatut(
                            e.target.value
                        )
                    }
                >
                    <option value="TOUS">
                        Tous les statuts
                    </option>

                    <option value="IMPAYEE">
                        Impayées
                    </option>

                    <option value="PARTIELLE">
                        Partielles
                    </option>

                    <option value="PAYEE">
                        Payées
                    </option>

                    <option value="ANNULEE">
                        Annulées
                    </option>
                </select>

            </div>

            {/* TABLEAU */}

            <div className="factures-table-card">

                <div className="table-header">
                    <div>
                        <h2>
                            Liste des factures
                        </h2>

                        <span>
                            {
                                facturesFiltrees.length
                            } facture(s)
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="loader"></div>
                        <p>
                            Chargement des factures...
                        </p>
                    </div>
                ) : facturesFiltrees.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            🧾
                        </div>

                        <h3>
                            Aucune facture
                        </h3>

                        <p>
                            Aucune facture ne
                            correspond à votre recherche.
                        </p>
                    </div>
                ) : (
                    <div className="table-container">

                        <table>

                            <thead>
                                <tr>
                                    <th>
                                        Facture
                                    </th>

                                    <th>
                                        Client
                                    </th>

                                    <th>
                                        Réservation
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Net à payer
                                    </th>

                                    <th>
                                        Reste
                                    </th>

                                    <th>
                                        Statut
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {facturesFiltrees.map(
                                    (facture) => (
                                        <tr
                                            key={
                                                facture.id_facture
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        facture.numero_facture
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="client-cell">
                                                    <strong>
                                                        {
                                                            facture.nom
                                                        }{" "}
                                                        {
                                                            facture.prenom
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            facture.code_client
                                                        }
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="reservation-badge">
                                                    {
                                                        facture.numero_reservation ||
                                                        facture.numero_sejour ||
                                                        "-"
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        facture.date_facture
                                                    )
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        formatMontant(
                                                            facture.net_a_payer
                                                        )
                                                    }{" "}
                                                    FCFA
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    formatMontant(
                                                        facture.reste_a_payer
                                                    )
                                                }{" "}
                                                FCFA
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge status-${String(
                                                        facture.statut ||
                                                            ""
                                                    ).toLowerCase()}`}
                                                >
                                                    {libelleStatut(
                                                        facture.statut
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="action-buttons">

                                                    <button
                                                        className="btn-action btn-view"
                                                        title="Voir"
                                                        onClick={() =>
                                                            voirFacture(
                                                                facture
                                                            )
                                                        }
                                                    >
                                                        👁
                                                    </button>

                                                    <button
                                                        className="btn-action btn-edit"
                                                        title="Modifier"
                                                        onClick={() =>
                                                            modifierFacture(
                                                                facture
                                                            )
                                                        }
                                                    >
                                                        ✎
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* FORMULAIRE */}

            {afficherFormulaire && (
                <div className="modal-overlay">

                    <div className="facture-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {factureEnModification
                                        ? "Modifier la facture"
                                        : "Nouvelle facture"}
                                </h2>

                                <p>
                                    {factureEnModification
                                        ? "Modifiez les informations de la facture."
                                        : "Sélectionnez une réservation pour préparer la facture."}
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={
                                    fermerFormulaire
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={
                                enregistrerFacture
                            }
                        >

                            {/* RESERVATION */}

                            <section className="form-section">

                                <div className="section-title">
                                    <span>
                                        01
                                    </span>

                                    <div>
                                        <h3>
                                            Réservation
                                        </h3>

                                        <p>
                                            Les informations
                                            seront récupérées
                                            automatiquement.
                                        </p>
                                    </div>
                                </div>

                                <select
                                    className="reservation-select"
                                    value={
                                        formulaire.id_reservation
                                    }
                                    onChange={
                                        handleReservationChange
                                    }
                                    disabled={
                                        Boolean(
                                            factureEnModification
                                        )
                                    }
                                    required
                                >

                                    <option value="">
                                        {chargementReservations
                                            ? "Chargement des réservations..."
                                            : "Sélectionner une réservation"}
                                    </option>

                                    {reservations
    .filter((reservation) => {
        const factureExistante =
            factures.some(
                (facture) =>
                    String(facture.id_reservation) ===
                        String(reservation.id_reservation)
            );

        return !factureExistante;
    })
    .map((reservation) => (
        <option
            key={reservation.id_reservation}
            value={reservation.id_reservation}
        >
            {reservation.numero_reservation}
            {" — "}
            {reservation.client}
            {" — Chambre "}
            {reservation.numero_chambre}
        </option>
    ))}

                                </select>

                            </section>

                            {/* INFORMATIONS RESERVATION */}

                            {formulaire.id_reservation && (
                                (() => {
                                    const reservation =
                                        reservations.find(
                                            (item) =>
                                                Number(
                                                    item.id_reservation
                                                ) ===
                                                Number(
                                                    formulaire.id_reservation
                                                )
                                        );

                                    if (!reservation) {
                                        return null;
                                    }

                                    return (
                                        <section className="reservation-summary">

                                            <div className="summary-title">
                                                Informations de la réservation
                                            </div>

                                            <div className="summary-grid">

                                                <div>
                                                    <span>
                                                        Client
                                                    </span>

                                                    <strong>
                                                        {
                                                            reservation.client
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Chambre
                                                    </span>

                                                    <strong>
                                                        {
                                                            reservation.numero_chambre ||
                                                            "-"
                                                        }

                                                        {reservation.type_chambre
                                                            ? ` — ${reservation.type_chambre}`
                                                            : ""}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Arrivée
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                reservation.date_arrivee
                                                            )
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Départ
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                reservation.date_depart
                                                            )
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Nombre de nuits
                                                    </span>

                                                    <strong>
                                                        {
                                                            reservation.nombre_nuits ||
                                                            "-"
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Tarif / nuit
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatMontant(
                                                                reservation.tarif_nuit
                                                            )
                                                        }{" "}
                                                        FCFA
                                                    </strong>
                                                </div>

                                                <div className="summary-total">
                                                    <span>
                                                        Montant prévu
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatMontant(
                                                                reservation.montant_prevu ||
                                                                reservation.montant_chambre
                                                            )
                                                        }{" "}
                                                        FCFA
                                                    </strong>
                                                </div>

                                            </div>

                                        </section>
                                    );
                                })()
                            )}

                            {/* DETAILS FACTURE */}

                            <section className="form-section">

                                <div className="section-title">
                                    <span>
                                        02
                                    </span>

                                    <div>
                                        <h3>
                                            Détail de la facture
                                        </h3>

                                        <p>
                                            Vérifiez les prestations
                                            avant l'enregistrement.
                                        </p>
                                    </div>
                                </div>

                                <div className="invoice-line">

                                    <div className="line-main">

                                        <label>
                                            Désignation
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                formulaire
                                                    .lignes[0]
                                                    ?.designation ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                handleLigneChange(
                                                    0,
                                                    "designation",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    <div>
                                        <label>
                                            Nuits
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                formulaire
                                                    .lignes[0]
                                                    ?.quantite ||
                                                1
                                            }
                                            onChange={(e) =>
                                                handleLigneChange(
                                                    0,
                                                    "quantite",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label>
                                            Tarif
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                formulaire
                                                    .lignes[0]
                                                    ?.prix_unitaire ||
                                                0
                                            }
                                            onChange={(e) =>
                                                handleLigneChange(
                                                    0,
                                                    "prix_unitaire",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="line-total">

                                        <label>
                                            Total
                                        </label>

                                        <strong>
                                            {
                                                formatMontant(
                                                    calculerMontantLigne(
                                                        formulaire
                                                            .lignes[0] ||
                                                            {}
                                                    )
                                                )
                                            }{" "}
                                            FCFA
                                        </strong>

                                    </div>

                                </div>

                            </section>

                            {/* AJUSTEMENTS */}

                            <section className="form-section">

                                <div className="section-title">
                                    <span>
                                        03
                                    </span>

                                    <div>
                                        <h3>
                                            Ajustements
                                        </h3>

                                        <p>
                                            Remise, taxe et observation.
                                        </p>
                                    </div>
                                </div>

                                <div className="form-grid">

                                    <div className="form-group">
                                        <label>
                                            Remise
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            name="remise"
                                            value={
                                                formulaire.remise
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Taxe
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            name="taxe"
                                            value={
                                                formulaire.taxe
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Observation
                                    </label>

                                    <textarea
                                        name="observation"
                                        rows="3"
                                        placeholder="Ajouter une observation..."
                                        value={
                                            formulaire.observation
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                            </section>

                            {/* TOTAL */}

                            <div className="invoice-total-box">

                                <div>
                                    <span>
                                        Sous-total
                                    </span>

                                    <strong>
                                        {
                                            formatMontant(
                                                montantTotal
                                            )
                                        }{" "}
                                        FCFA
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Remise
                                    </span>

                                    <strong>
                                        -{" "}
                                        {
                                            formatMontant(
                                                remiseFacture
                                            )
                                        }{" "}
                                        FCFA
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Taxe
                                    </span>

                                    <strong>
                                        +{" "}
                                        {
                                            formatMontant(
                                                taxeFacture
                                            )
                                        }{" "}
                                        FCFA
                                    </strong>
                                </div>

                                <div className="grand-total">

                                    <span>
                                        NET À PAYER
                                    </span>

                                    <strong>
                                        {
                                            formatMontant(
                                                netAPayer
                                            )
                                        }{" "}
                                        FCFA
                                    </strong>

                                </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={
                                        fermerFormulaire
                                    }
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {factureEnModification
                                        ? "Enregistrer les modifications"
                                        : "Enregistrer la facture"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Factures;