
import { useEffect, useState } from "react";
import axios from "axios";
import "./Sejours.css";

const API_URL = "http://localhost:5000/api";

const formulaireInitial = {
    id_reservation: "",
    caution: 0,
    observation: ""
};

function Sejours() {
    const [sejours, setSejours] = useState([]);
    const [reservations, setReservations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);
    const [formulaire, setFormulaire] = useState(formulaireInitial);

    // ==========================================
    // CHARGER LES SÉJOURS
    // ==========================================

    const chargerSejours = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${API_URL}/sejours`
            );

            setSejours(response.data);
            setError("");

        } catch (err) {
            console.error("Erreur séjours :", err);

            setError(
                err.response?.data?.message ||
                "Impossible de charger les séjours."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // CHARGER LES RÉSERVATIONS CONFIRMÉES
    // ==========================================

    const chargerReservationsDisponibles = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/reservations`
            );

            const reservationsConfirmees =
                response.data.filter(
                    (reservation) =>
                        reservation.statut === "CONFIRMEE"
                );

            setReservations(reservationsConfirmees);

        } catch (err) {
            console.error(
                "Erreur récupération réservations :",
                err
            );
        }
    };

    // ==========================================
    // CHARGEMENT INITIAL
    // ==========================================

    useEffect(() => {
        chargerSejours();
        chargerReservationsDisponibles();
    }, []);

    // ==========================================
    // CHANGEMENT FORMULAIRE
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire((ancien) => ({
            ...ancien,
            [name]: value
        }));
    };

    // ==========================================
    // OUVRIR CHECK-IN
    // ==========================================

    const ouvrirCheckIn = async () => {
        await chargerReservationsDisponibles();

        setFormulaire(formulaireInitial);
        setAfficherFormulaire(true);
    };

    // ==========================================
    // FERMER FORMULAIRE
    // ==========================================

    const fermerFormulaire = () => {
        setAfficherFormulaire(false);
        setFormulaire(formulaireInitial);
    };

    // ==========================================
    // RÉSERVATION SÉLECTIONNÉE
    // ==========================================

    const reservationSelectionnee =
        reservations.find(
            (reservation) =>
                String(reservation.id_reservation) ===
                String(formulaire.id_reservation)
        );

    // ==========================================
    // CHECK-IN
    // ==========================================

    const effectuerCheckIn = async (e) => {
        e.preventDefault();

        if (!formulaire.id_reservation) {
            alert("Veuillez sélectionner une réservation.");
            return;
        }

        if (!reservationSelectionnee) {
            alert("La réservation sélectionnée est introuvable.");
            return;
        }

        try {
            await axios.post(
                `${API_URL}/sejours`,
                {
                    id_reservation:
                        Number(formulaire.id_reservation),

                    caution:
                        Number(formulaire.caution) || 0,

                    observation:
                        formulaire.observation || null
                }
            );

            alert("Check-in effectué avec succès !");

            fermerFormulaire();

            await chargerSejours();
            await chargerReservationsDisponibles();

        } catch (err) {
            console.error(
                "Erreur check-in :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible d'effectuer le check-in."
            );
        }
    };

    // ==========================================
    // CHECK-OUT
    // ==========================================

    const effectuerCheckOut = async (sejour) => {
        const confirmation = window.confirm(
            `Voulez-vous effectuer le check-out de ${sejour.client} ?`
        );

        if (!confirmation) {
            return;
        }

        try {
            await axios.put(
                `${API_URL}/sejours/${sejour.id_sejour}/checkout`
            );

            alert("Check-out effectué avec succès !");

            await chargerSejours();

        } catch (err) {
            console.error(
                "Erreur check-out :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible d'effectuer le check-out."
            );
        }
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "fr-FR"
        );
    };

    // ==========================================
    // FORMAT DATE + HEURE
    // ==========================================

    const formatDateHeure = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString(
            "fr-FR"
        );
    };

    // ==========================================
    // FORMAT MONTANT
    // ==========================================

    const formatMontant = (montant) => {
        return Number(montant || 0).toLocaleString(
            "fr-FR"
        );
    };

    // ==========================================
    // STATUT
    // ==========================================

    const afficherStatut = (statut) => {
        switch (statut) {
            case "EN_ATTENTE":
                return "En attente";

            case "EN_COURS":
                return "En cours";

            case "TERMINE":
                return "Terminé";

            case "ANNULE":
                return "Annulé";

            default:
                return statut || "-";
        }
    };

    // ==========================================
    // RENDU
    // ==========================================

    return (
        <div className="sejours-page">

            {/* ==================================
                EN-TÊTE
            ================================== */}

            <div className="page-header">

                <div>
                    <h1>Séjours</h1>

                    <p>
                        Gestion des séjours et des check-in / check-out
                    </p>
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={ouvrirCheckIn}
                >
                    + Nouveau check-in
                </button>

            </div>

            {/* ==================================
                FORMULAIRE CHECK-IN
            ================================== */}

            {afficherFormulaire && (

                <div className="sejour-form">

                    <div className="form-header">

                        <div>
                            <h2>
                                Nouveau check-in
                            </h2>

                            <p>
                                Sélectionnez une réservation confirmée
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={fermerFormulaire}
                        >
                            ✕
                        </button>

                    </div>

                    <form onSubmit={effectuerCheckIn}>

                        <div className="form-grid">

                            {/* RÉSERVATION */}

                            <div className="full-width">

                                <label>
                                    Réservation *
                                </label>

                                <select
                                    name="id_reservation"
                                    value={
                                        formulaire.id_reservation
                                    }
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Sélectionner une réservation
                                    </option>

                                    {reservations.map(
                                        (reservation) => (
                                            <option
                                                key={
                                                    reservation.id_reservation
                                                }
                                                value={
                                                    reservation.id_reservation
                                                }
                                            >
                                                {
                                                    reservation.numero_reservation
                                                }
                                                {" - "}
                                                {
                                                    reservation.client
                                                }
                                                {" - "}
                                                {
                                                    formatDate(
                                                        reservation.date_arrivee
                                                    )
                                                }
                                                {" → "}
                                                {
                                                    formatDate(
                                                        reservation.date_depart
                                                    )
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                                {reservations.length === 0 && (
                                    <small className="form-help">
                                        Aucune réservation confirmée disponible
                                        pour un check-in.
                                    </small>
                                )}

                            </div>

                            {/* INFORMATIONS RÉSERVATION */}

                            {reservationSelectionnee && (

                                <div className="reservation-info full-width">

                                    <h3>
                                        Informations de la réservation
                                    </h3>

                                    <div className="info-grid">

                                        <div>
                                            <span>
                                                Client
                                            </span>

                                            <strong>
                                                {
                                                    reservationSelectionnee.client
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Réservation
                                            </span>

                                            <strong>
                                                {
                                                    reservationSelectionnee.numero_reservation
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Arrivée prévue
                                            </span>

                                            <strong>
                                                {
                                                    formatDate(
                                                        reservationSelectionnee.date_arrivee
                                                    )
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Départ prévu
                                            </span>

                                            <strong>
                                                {
                                                    formatDate(
                                                        reservationSelectionnee.date_depart
                                                    )
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Adultes
                                            </span>

                                            <strong>
                                                {
                                                    reservationSelectionnee.nb_adultes
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Enfants
                                            </span>

                                            <strong>
                                                {
                                                    reservationSelectionnee.nb_enfants
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Montant prévu
                                            </span>

                                            <strong>
                                                {
                                                    formatMontant(
                                                        reservationSelectionnee.montant_prevu
                                                    )
                                                } FCFA
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Avance
                                            </span>

                                            <strong>
                                                {
                                                    formatMontant(
                                                        reservationSelectionnee.avance
                                                    )
                                                } FCFA
                                            </strong>
                                        </div>

                                    </div>

                                </div>
                            )}

                            {/* CAUTION */}

                            <div>

                                <label>
                                    Caution
                                </label>

                                <input
                                    type="number"
                                    name="caution"
                                    min="0"
                                    step="0.01"
                                    value={
                                        formulaire.caution
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                            {/* OBSERVATION */}

                            <div className="full-width">

                                <label>
                                    Observation
                                </label>

                                <textarea
                                    name="observation"
                                    value={
                                        formulaire.observation
                                    }
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Observation éventuelle..."
                                />

                            </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="form-actions">

                            <button
                                type="button"
                                onClick={fermerFormulaire}
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={
                                    !formulaire.id_reservation
                                }
                            >
                                Effectuer le check-in
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* ==================================
                LISTE DES SÉJOURS
            ================================== */}

            {!afficherFormulaire && (

                <>

                    {loading && (
                        <p>
                            Chargement des séjours...
                        </p>
                    )}

                    {error && (
                        <p className="error-message">
                            {error}
                        </p>
                    )}

                    {!loading && !error && (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Séjour</th>
                                        <th>Client</th>
                                        <th>Chambre</th>
                                        <th>Réservation</th>
                                        <th>Arrivée</th>
                                        <th>Départ</th>
                                        <th>Nuits</th>
                                        <th>Statut</th>
                                        <th>Caution</th>
                                        <th>Actions</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {sejours.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="10"
                                                className="empty"
                                            >
                                                Aucun séjour enregistré
                                            </td>

                                        </tr>

                                    ) : (

                                        sejours.map(
                                            (sejour) => (

                                                <tr
                                                    key={
                                                        sejour.id_sejour
                                                    }
                                                >

                                                    <td>
                                                        <strong>
                                                            {
                                                                sejour.numero_sejour
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {
                                                                sejour.client
                                                            }
                                                        </strong>

                                                        <br />

                                                        <small>
                                                            {
                                                                sejour.code_client
                                                            }
                                                        </small>
                                                    </td>

                                                    <td>
                                                        Chambre{" "}
                                                        {
                                                            sejour.numero_chambre
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            sejour.numero_reservation ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        <div>
                                                            {
                                                                formatDate(
                                                                    sejour.date_arrivee_prevue
                                                                )
                                                            }
                                                        </div>

                                                        {sejour.date_arrivee_reelle && (
                                                            <small>
                                                                Check-in :{" "}
                                                                {
                                                                    formatDateHeure(
                                                                        sejour.date_arrivee_reelle
                                                                    )
                                                                }
                                                            </small>
                                                        )}
                                                    </td>

                                                    <td>
                                                        <div>
                                                            {
                                                                formatDate(
                                                                    sejour.date_depart_prevue
                                                                )
                                                            }
                                                        </div>

                                                        {sejour.date_depart_reelle && (
                                                            <small>
                                                                Check-out :{" "}
                                                                {
                                                                    formatDateHeure(
                                                                        sejour.date_depart_reelle
                                                                    )
                                                                }
                                                            </small>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {
                                                            sejour.nombre_nuits
                                                        }
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`status status-${String(
                                                                sejour.statut
                                                            ).toLowerCase()}`}
                                                        >
                                                            {
                                                                afficherStatut(
                                                                    sejour.statut
                                                                )
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>
                                                        {
                                                            formatMontant(
                                                                sejour.caution
                                                            )
                                                        }{" "}
                                                        FCFA
                                                    </td>

                                                    <td>

                                                        {sejour.statut ===
                                                            "EN_COURS" && (

                                                            <button
                                                                type="button"
                                                                className="btn-action"
                                                                title="Effectuer le check-out"
                                                                onClick={() =>
                                                                    effectuerCheckOut(
                                                                        sejour
                                                                    )
                                                                }
                                                            >
                                                                🚪
                                                            </button>

                                                        )}

                                                        {sejour.statut ===
                                                            "TERMINE" && (

                                                            <span>
                                                                —
                                                            </span>

                                                        )}

                                                        {sejour.statut ===
                                                            "EN_ATTENTE" && (

                                                            <span>
                                                                —
                                                            </span>

                                                        )}

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </>
            )}

        </div>
    );
}

export default Sejours;

