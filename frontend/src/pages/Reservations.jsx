
import { useEffect, useState } from "react";
import axios from "axios";
import "./Reservations.css";

const API_URL = "http://localhost:5000/api/reservations";

const formulaireInitial = {
    id_client: "",
    id_chambre: "",
    date_arrivee: "",
    date_depart: "",
    nb_adultes: 1,
    nb_enfants: 0,
    statut: "EN_ATTENTE",
    avance: 0,
    observation: ""
};

function Reservations() {

    const [reservations, setReservations] = useState([]);
    const [clients, setClients] = useState([]);
    const [chambres, setChambres] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingFormulaire, setLoadingFormulaire] = useState(false);
    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);
    const [reservationEnModification, setReservationEnModification] =
        useState(null);

    const [formulaire, setFormulaire] = useState(formulaireInitial);

    // ==========================================
    // CHARGER LES RÉSERVATIONS
    // ==========================================

    const chargerReservations = async () => {

        try {

            setLoading(true);

            const response = await axios.get(API_URL);

            setReservations(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

            setError("");

        } catch (err) {

            console.error(
                "Erreur chargement réservations :",
                err
            );

            setError(
                err.response?.data?.message ||
                "Impossible de charger les réservations."
            );

        } finally {

            setLoading(false);

        }
    };

    // ==========================================
    // CHARGER CLIENTS ET CHAMBRES
    // ==========================================

    const chargerDonneesFormulaire = async () => {

        try {

            setLoadingFormulaire(true);

            const [
                clientsResponse,
                chambresResponse
            ] = await Promise.all([
                axios.get(`${API_URL}/data/clients`),
                axios.get(`${API_URL}/data/chambres`)
            ]);

            setClients(
                Array.isArray(clientsResponse.data)
                    ? clientsResponse.data
                    : []
            );

            setChambres(
                Array.isArray(chambresResponse.data)
                    ? chambresResponse.data
                    : []
            );

        } catch (err) {

            console.error(
                "Erreur chargement données formulaire :",
                err
            );

            setError(
                err.response?.data?.message ||
                "Impossible de charger les clients ou les chambres."
            );

        } finally {

            setLoadingFormulaire(false);

        }
    };

    // ==========================================
    // CHARGEMENT INITIAL
    // ==========================================

    useEffect(() => {

        chargerReservations();
        chargerDonneesFormulaire();

    }, []);

    // ==========================================
    // MODIFICATION DES CHAMPS
    // ==========================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormulaire((ancien) => ({
            ...ancien,
            [name]: value
        }));
    };

    // ==========================================
    // OUVRIR NOUVELLE RÉSERVATION
    // ==========================================

    const nouvelleReservation = async () => {

        setReservationEnModification(null);

        setFormulaire({
            ...formulaireInitial
        });

        setAfficherFormulaire(true);

        await chargerDonneesFormulaire();
    };

    // ==========================================
    // MODIFIER UNE RÉSERVATION
    // ==========================================

    const modifierReservation = (reservation) => {

        setReservationEnModification(reservation);

        setFormulaire({

            id_client:
                reservation.id_client || "",

            id_chambre: "",

            date_arrivee:
                reservation.date_arrivee
                    ? String(reservation.date_arrivee).substring(0, 10)
                    : "",

            date_depart:
                reservation.date_depart
                    ? String(reservation.date_depart).substring(0, 10)
                    : "",

            nb_adultes:
                reservation.nb_adultes || 1,

            nb_enfants:
                reservation.nb_enfants || 0,

            statut:
                reservation.statut || "EN_ATTENTE",

            avance:
                reservation.avance || 0,

            observation:
                reservation.observation || ""
        });

        setAfficherFormulaire(true);
    };

    // ==========================================
    // CALCUL DU NOMBRE DE NUITS
    // ==========================================

    const calculerNombreNuits = () => {

        if (
            !formulaire.date_arrivee ||
            !formulaire.date_depart
        ) {
            return 0;
        }

        const arrivee = new Date(
            `${formulaire.date_arrivee}T00:00:00`
        );

        const depart = new Date(
            `${formulaire.date_depart}T00:00:00`
        );

        const difference =
            depart.getTime() - arrivee.getTime();

        const nuits = Math.ceil(
            difference / (1000 * 60 * 60 * 24)
        );

        return nuits > 0 ? nuits : 0;
    };

    // ==========================================
    // CHAMBRE SÉLECTIONNÉE
    // ==========================================

    const chambreSelectionnee = chambres.find(
        (chambre) =>
            String(chambre.id_chambre) ===
            String(formulaire.id_chambre)
    );

    // ==========================================
    // CALCULS
    // ==========================================

    const nombreNuits = calculerNombreNuits();

    const tarifNuit = chambreSelectionnee
        ? Number(chambreSelectionnee.tarif) || 0
        : 0;

    const montantPrevu =
        nombreNuits > 0
            ? tarifNuit * nombreNuits
            : 0;

    // ==========================================
    // ENREGISTRER UNE RÉSERVATION
    // ==========================================

    const enregistrerReservation = async (e) => {

        e.preventDefault();

        try {

            setError("");

            // --------------------------------------
            // VALIDATIONS COMMUNES
            // --------------------------------------

            if (!formulaire.id_client) {

                alert("Veuillez sélectionner un client.");

                return;
            }

            if (!formulaire.date_arrivee) {

                alert(
                    "Veuillez sélectionner la date d'arrivée."
                );

                return;
            }

            if (!formulaire.date_depart) {

                alert(
                    "Veuillez sélectionner la date de départ."
                );

                return;
            }

            if (nombreNuits <= 0) {

                alert(
                    "La date de départ doit être après la date d'arrivée."
                );

                return;
            }

            // ======================================
            // MODIFICATION
            // ======================================

            if (reservationEnModification) {

                await axios.put(
                    `${API_URL}/${reservationEnModification.id_reservation}`,
                    {
                        id_client:
                            Number(formulaire.id_client),

                        date_arrivee:
                            formulaire.date_arrivee,

                        date_depart:
                            formulaire.date_depart,

                        nb_adultes:
                            Number(formulaire.nb_adultes) || 1,

                        nb_enfants:
                            Number(formulaire.nb_enfants) || 0,

                        statut:
                            formulaire.statut,

                        montant_prevu:
                            Number(
                                reservationEnModification.montant_prevu
                            ) || 0,

                        avance:
                            Number(formulaire.avance) || 0,

                        observation:
                            formulaire.observation || null
                    }
                );

                alert(
                    "Réservation modifiée avec succès !"
                );

            } else {

                // ==================================
                // CRÉATION
                // ==================================

                if (!formulaire.id_chambre) {

                    alert(
                        "Veuillez sélectionner une chambre."
                    );

                    return;
                }

                if (!chambreSelectionnee) {

                    alert(
                        "La chambre sélectionnée est introuvable."
                    );

                    return;
                }

                const numeroReservation =
                    `RES-${Date.now()}`;

                await axios.post(
                    API_URL,
                    {
                        numero_reservation:
                            numeroReservation,

                        id_client:
                            Number(formulaire.id_client),

                        date_arrivee:
                            formulaire.date_arrivee,

                        date_depart:
                            formulaire.date_depart,

                        nb_adultes:
                            Number(formulaire.nb_adultes) || 1,

                        nb_enfants:
                            Number(formulaire.nb_enfants) || 0,

                        statut:
                            formulaire.statut,

                        montant_prevu:
                            montantPrevu,

                        avance:
                            Number(formulaire.avance) || 0,

                        observation:
                            formulaire.observation || null,

                        id_utilisateur:
                            null,

                        id_chambre:
                            Number(formulaire.id_chambre),

                        tarif_nuit:
                            tarifNuit,

                        nombre_nuits:
                            nombreNuits
                    }
                );

                alert(
                    "Réservation créée avec succès !"
                );
            }

            // ======================================
            // NETTOYAGE
            // ======================================

            setAfficherFormulaire(false);

            setReservationEnModification(null);

            setFormulaire({
                ...formulaireInitial
            });

            await chargerReservations();

            // Actualiser les chambres disponibles
            await chargerDonneesFormulaire();

        } catch (err) {

            console.error(
                "Erreur réservation :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer la réservation."
            );
        }
    };

    // ==========================================
    // FERMER FORMULAIRE
    // ==========================================

    const fermerFormulaire = () => {

        setAfficherFormulaire(false);

        setReservationEnModification(null);

        setFormulaire({
            ...formulaireInitial
        });

        setError("");
    };

    // ==========================================
    // FORMATAGE DATE
    // ==========================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const dateTexte =
            String(date).substring(0, 10);

        const morceaux =
            dateTexte.split("-");

        if (morceaux.length !== 3) {
            return dateTexte;
        }

        return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
    };

    // ==========================================
    // FORMATAGE MONTANT
    // ==========================================

    const formatMontant = (montant) => {

        return Number(montant || 0)
            .toLocaleString("fr-FR");
    };

    // ==========================================
    // RENDU
    // ==========================================

    return (
        <div className="reservations-page">

            {/* =====================================
                EN-TÊTE
            ====================================== */}

            <div className="page-header">

                <div>

                    <h1>
                        Réservations
                    </h1>

                    <p>
                        Gestion des réservations de l'hôtel
                    </p>

                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={nouvelleReservation}
                >
                    + Nouvelle réservation
                </button>

            </div>

            {/* =====================================
                ERREUR
            ====================================== */}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {/* =====================================
                FORMULAIRE
            ====================================== */}

            {afficherFormulaire && (

                <div className="reservation-form">

                    <div className="form-header">

                        <div>

                            <h2>
                                {reservationEnModification
                                    ? "Modifier la réservation"
                                    : "Nouvelle réservation"}
                            </h2>

                            {reservationEnModification && (
                                <p>
                                    {
                                        reservationEnModification
                                            .numero_reservation
                                    }
                                </p>
                            )}

                        </div>

                        <button
                            type="button"
                            onClick={fermerFormulaire}
                            className="btn-close"
                        >
                            ✕
                        </button>

                    </div>

                    {loadingFormulaire ? (

                        <p>
                            Chargement des données...
                        </p>

                    ) : (

                        <form
                            onSubmit={enregistrerReservation}
                        >

                            <div className="form-grid">

                                {/* CLIENT */}

                                <div>

                                    <label>
                                        Client *
                                    </label>

                                    <select
                                        name="id_client"
                                        value={
                                            formulaire.id_client
                                        }
                                        onChange={handleChange}
                                        required
                                    >

                                        <option value="">
                                            Sélectionner un client
                                        </option>

                                        {clients.map(
                                            (client) => (

                                                <option
                                                    key={
                                                        client.id_client
                                                    }
                                                    value={
                                                        client.id_client
                                                    }
                                                >
                                                    {
                                                        client.code_client
                                                    }
                                                    {" - "}
                                                    {client.nom}
                                                    {" "}
                                                    {client.prenom || ""}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* CHAMBRE */}

                                {!reservationEnModification && (

                                    <div>

                                        <label>
                                            Chambre *
                                        </label>

                                        <select
                                            name="id_chambre"
                                            value={
                                                formulaire.id_chambre
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            <option value="">
                                                Sélectionner une chambre
                                            </option>

                                            {chambres.map(
                                                (chambre) => (

                                                    <option
                                                        key={
                                                            chambre.id_chambre
                                                        }
                                                        value={
                                                            chambre.id_chambre
                                                        }
                                                    >
                                                        Chambre{" "}
                                                        {chambre.numero}
                                                        {" - "}
                                                        {
                                                            chambre.type_chambre
                                                        }
                                                        {" - "}
                                                        {
                                                            formatMontant(
                                                                chambre.tarif
                                                            )
                                                        }
                                                        {" FCFA/nuit"}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                        {chambres.length === 0 && (
                                            <small>
                                                Aucune chambre disponible.
                                            </small>
                                        )}

                                    </div>

                                )}

                                {/* DATE ARRIVÉE */}

                                <div>

                                    <label>
                                        Date d'arrivée *
                                    </label>

                                    <input
                                        type="date"
                                        name="date_arrivee"
                                        value={
                                            formulaire.date_arrivee
                                        }
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                {/* DATE DÉPART */}

                                <div>

                                    <label>
                                        Date de départ *
                                    </label>

                                    <input
                                        type="date"
                                        name="date_depart"
                                        value={
                                            formulaire.date_depart
                                        }
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                {/* ADULTES */}

                                <div>

                                    <label>
                                        Adultes
                                    </label>

                                    <input
                                        type="number"
                                        name="nb_adultes"
                                        min="1"
                                        value={
                                            formulaire.nb_adultes
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* ENFANTS */}

                                <div>

                                    <label>
                                        Enfants
                                    </label>

                                    <input
                                        type="number"
                                        name="nb_enfants"
                                        min="0"
                                        value={
                                            formulaire.nb_enfants
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* STATUT */}

                                <div>

                                    <label>
                                        Statut
                                    </label>

                                    <select
                                        name="statut"
                                        value={
                                            formulaire.statut
                                        }
                                        onChange={handleChange}
                                    >

                                        <option value="EN_ATTENTE">
                                            En attente
                                        </option>

                                        <option value="CONFIRMEE">
                                            Confirmée
                                        </option>

                                        <option value="ANNULEE">
                                            Annulée
                                        </option>

                                        <option value="NO_SHOW">
                                            No-show
                                        </option>

                                        <option value="TERMINEE">
                                            Terminée
                                        </option>

                                    </select>

                                </div>

                                {/* AVANCE */}

                                <div>

                                    <label>
                                        Avance
                                    </label>

                                    <input
                                        type="number"
                                        name="avance"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formulaire.avance
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* MONTANT */}

                                {!reservationEnModification && (

                                    <div>

                                        <label>
                                            Montant prévu
                                        </label>

                                        <input
                                            type="text"
                                            value={`${formatMontant(
                                                montantPrevu
                                            )} FCFA`}
                                            readOnly
                                        />

                                    </div>

                                )}

                                {/* NUITS */}

                                {!reservationEnModification && (

                                    <div>

                                        <label>
                                            Nombre de nuits
                                        </label>

                                        <input
                                            type="text"
                                            value={nombreNuits}
                                            readOnly
                                        />

                                    </div>

                                )}

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

                            {/* =================================
                                ACTIONS
                            ================================== */}

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
                                >
                                    {reservationEnModification
                                        ? "Enregistrer les modifications"
                                        : "Créer la réservation"}
                                </button>

                            </div>

                        </form>
                    )}

                </div>
            )}

            {/* =====================================
                TABLEAU
            ====================================== */}

            {!afficherFormulaire && (

                <>

                    {loading && (
                        <p>
                            Chargement des réservations...
                        </p>
                    )}

                    {!loading && !error && (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            Réservation
                                        </th>

                                        <th>
                                            Client
                                        </th>

                                        <th>
                                            Arrivée
                                        </th>

                                        <th>
                                            Départ
                                        </th>

                                        <th>
                                            Adultes
                                        </th>

                                        <th>
                                            Enfants
                                        </th>

                                        <th>
                                            Montant
                                        </th>

                                        <th>
                                            Avance
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

                                    {reservations.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="10"
                                                className="empty"
                                            >
                                                Aucune réservation enregistrée
                                            </td>

                                        </tr>

                                    ) : (

                                        reservations.map(
                                            (reservation) => (

                                                <tr
                                                    key={
                                                        reservation.id_reservation
                                                    }
                                                >

                                                    <td>

                                                        <strong>
                                                            {
                                                                reservation.numero_reservation
                                                            }
                                                        </strong>

                                                    </td>

                                                    <td>
                                                        {
                                                            reservation.client
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            reservation.date_arrivee
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            reservation.date_depart
                                                        )}
                                                    </td>

                                                    <td>
                                                        {
                                                            reservation.nb_adultes
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            reservation.nb_enfants
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatMontant(
                                                            reservation.montant_prevu
                                                        )}{" "}
                                                        FCFA
                                                    </td>

                                                    <td>
                                                        {formatMontant(
                                                            reservation.avance
                                                        )}{" "}
                                                        FCFA
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`status status-${String(
                                                                reservation.statut ||
                                                                ""
                                                            ).toLowerCase()}`}
                                                        >
                                                            {
                                                                reservation.statut
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="btn-action"
                                                            title="Modifier"
                                                            onClick={() =>
                                                                modifierReservation(
                                                                    reservation
                                                                )
                                                            }
                                                        >
                                                            ✏️
                                                        </button>

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

export default Reservations;

