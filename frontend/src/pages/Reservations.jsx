import { useEffect, useState } from "react";
import axios from "axios";
import "./Reservations.css";

const API_URL = "http://localhost:5000/api";


// ==========================================
// DONNÉES INITIALES RÉSERVATION
// ==========================================

const reservationInitiale = {
    date_arrivee: "",
    date_depart: "",
    nb_adultes: 1,
    nb_enfants: 0,
    id_chambre: "",
    tarif_nuit: 0,
    nombre_nuits: 0,
    montant_prevu: 0,
    avance: 0,
    observation: ""
};


// ==========================================
// DONNÉES INITIALES NOUVEAU CLIENT
// ==========================================

const nouveauClientInitial = {
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    sexe: "",
    date_naissance: "",
    adresse: "",
    ville: "",
    pays: "Sénégal",
    nationalite: "Sénégalaise",
    type_piece: "",
    numero_piece: "",
    entreprise: "",
    observation: ""
};


function Reservations() {

    // ==========================================
    // DONNÉES
    // ==========================================

    const [reservations, setReservations] =
        useState([]);

    const [chambres, setChambres] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==========================================
    // FORMULAIRE
    // ==========================================

    const [afficherFormulaire, setAfficherFormulaire] =
        useState(false);

    const [telephoneRecherche, setTelephoneRecherche] =
        useState("");

    const [rechercheEffectuee, setRechercheEffectuee] =
        useState(false);

    const [rechercheLoading, setRechercheLoading] =
        useState(false);

    const [clientTrouve, setClientTrouve] =
        useState(null);

    const [nouveauClient, setNouveauClient] =
        useState(nouveauClientInitial);

    const [reservation, setReservation] =
        useState(reservationInitiale);


    // ==========================================
    // MODE MODIFICATION
    // ==========================================

    const [modeModification, setModeModification] =
        useState(false);

    const [
        idReservationModification,
        setIdReservationModification
    ] = useState(null);


    // ==========================================
    // CHARGER RÉSERVATIONS
    // ==========================================

    const chargerReservations = async () => {

        try {

            setLoading(true);

            const response =
                await axios.get(
                    `${API_URL}/reservations`
                );

            setReservations(
                response.data
            );

            setError("");

        } catch (err) {

            console.error(
                "Erreur réservations :",
                err
            );

            setError(
                err.response?.data?.message ||
                "Impossible de charger les réservations"
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // CHARGER CHAMBRES
    // ==========================================

    const chargerChambres = async () => {

        try {

            const response =
                await axios.get(
                    `${API_URL}/reservations/data/chambres`
                );

            setChambres(
                response.data
            );

        } catch (err) {

            console.error(
                "Erreur chambres :",
                err
            );
        }
    };


    // ==========================================
    // CHARGEMENT INITIAL
    // ==========================================

    useEffect(() => {

        chargerReservations();

        chargerChambres();

    }, []);


    // ==========================================
    // OUVRIR FORMULAIRE
    // ==========================================

    const ouvrirFormulaire = () => {

        setModeModification(false);

        setIdReservationModification(null);

        setTelephoneRecherche("");

        setRechercheEffectuee(false);

        setClientTrouve(null);

        setNouveauClient(
            nouveauClientInitial
        );

        setReservation(
            reservationInitiale
        );

        setAfficherFormulaire(true);

        chargerChambres();
    };


    // ==========================================
    // FERMER FORMULAIRE
    // ==========================================

    const fermerFormulaire = () => {

        setAfficherFormulaire(false);

        setModeModification(false);

        setIdReservationModification(null);

        setTelephoneRecherche("");

        setRechercheEffectuee(false);

        setClientTrouve(null);

        setNouveauClient(
            nouveauClientInitial
        );

        setReservation(
            reservationInitiale
        );
    };


    // ==========================================
    // RECHERCHER CLIENT
    // ==========================================

    const rechercherClient = async () => {

        if (!telephoneRecherche.trim()) {

            alert(
                "Veuillez saisir un numéro de téléphone."
            );

            return;
        }

        try {

            setRechercheLoading(true);

            setClientTrouve(null);

            const response =
                await axios.get(
                    `${API_URL}/clients/telephone/${encodeURIComponent(
                        telephoneRecherche.trim()
                    )}`
                );

            setClientTrouve(
                response.data
            );

            setRechercheEffectuee(true);

        } catch (err) {

            if (
                err.response?.status === 404
            ) {

                setClientTrouve(null);

                setNouveauClient({
                    ...nouveauClientInitial,

                    telephone:
                        telephoneRecherche.trim()
                });

                setRechercheEffectuee(true);

            } else {

                console.error(
                    "Erreur recherche client :",
                    err
                );

                alert(
                    err.response?.data?.message ||
                    "Erreur lors de la recherche du client."
                );
            }

        } finally {

            setRechercheLoading(false);
        }
    };


    // ==========================================
    // MODIFICATION CLIENT
    // ==========================================

    const handleClientChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setNouveauClient(
            (ancien) => ({
                ...ancien,
                [name]: value
            })
        );
    };


    // ==========================================
    // MODIFICATION RÉSERVATION
    // ==========================================

    const handleReservationChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setReservation(
            (ancien) => ({
                ...ancien,
                [name]: value
            })
        );
    };


    // ==========================================
    // CHOISIR CHAMBRE
    // ==========================================

    const choisirChambre = (e) => {

        const idChambre =
            e.target.value;

        const chambre =
            chambres.find(
                (item) =>
                    String(
                        item.id_chambre
                    ) ===
                    String(
                        idChambre
                    )
            );

        setReservation(
            (ancien) => ({
                ...ancien,

                id_chambre:
                    idChambre,

                tarif_nuit:
                    chambre
                        ? Number(
                            chambre.tarif
                        )
                        : 0
            })
        );
    };


    // ==========================================
    // CALCUL AUTOMATIQUE
    // ==========================================

    useEffect(() => {

        if (
            !reservation.date_arrivee ||
            !reservation.date_depart
        ) {

            return;
        }

        const arrivee =
            new Date(
                reservation.date_arrivee
            );

        const depart =
            new Date(
                reservation.date_depart
            );

        const difference =
            depart.getTime() -
            arrivee.getTime();

        const nuits =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );

        if (nuits > 0) {

            const montant =
                nuits *
                Number(
                    reservation.tarif_nuit || 0
                );

            setReservation(
                (ancien) => ({
                    ...ancien,

                    nombre_nuits:
                        nuits,

                    montant_prevu:
                        montant
                })
            );
        }

    }, [
        reservation.date_arrivee,
        reservation.date_depart,
        reservation.tarif_nuit
    ]);


    // ==========================================
    // GÉNÉRER CODE CLIENT
    // ==========================================

    const genererCodeClient = () => {

        const annee =
            new Date()
                .getFullYear();

        const timestamp =
            Date.now()
                .toString()
                .slice(-6);

        return `CLI-${annee}-${timestamp}`;
    };


    // ==========================================
    // GÉNÉRER NUMÉRO RÉSERVATION
    // ==========================================

    const genererNumeroReservation = () => {

        const annee =
            new Date()
                .getFullYear();

        const numero =
            String(
                reservations.length + 1
            ).padStart(4, "0");

        return `RES-${annee}-${numero}`;
    };


    // ==========================================
    // ENREGISTRER RÉSERVATION
    // ==========================================

    const enregistrerReservation = async (e) => {

        e.preventDefault();


        // ======================================
        // MODE MODIFICATION
        // ======================================

        if (modeModification) {

            try {

                await axios.put(
                    `${API_URL}/reservations/${idReservationModification}`,
                    {

                        id_client:
                            clientTrouve.id_client,

                        date_arrivee:
                            reservation.date_arrivee,

                        date_depart:
                            reservation.date_depart,

                        nb_adultes:
                            Number(
                                reservation.nb_adultes
                            ),

                        nb_enfants:
                            Number(
                                reservation.nb_enfants
                            ),

                        statut:
                            "EN_ATTENTE",

                        montant_prevu:
                            Number(
                                reservation.montant_prevu
                            ),

                        avance:
                            Number(
                                reservation.avance
                            ),

                        observation:
                            reservation.observation
                    }
                );


                alert(
                    "Réservation modifiée avec succès !"
                );


                fermerFormulaire();

                await chargerReservations();

                await chargerChambres();


                return;

            } catch (err) {

                console.error(
                    "Erreur modification réservation :",
                    err
                );

                alert(
                    err.response?.data?.message ||
                    "Impossible de modifier la réservation."
                );

                return;
            }
        }


        // ======================================
        // CRÉATION NOUVELLE RÉSERVATION
        // ======================================

        try {

            let idClient;


            // CLIENT EXISTANT

            if (clientTrouve) {

                idClient =
                    clientTrouve.id_client;
            }


            // NOUVEAU CLIENT

            else {

                if (
                    !nouveauClient.nom ||
                    !nouveauClient.telephone
                ) {

                    alert(
                        "Le nom et le téléphone du nouveau client sont obligatoires."
                    );

                    return;
                }


                const clientResponse =
                    await axios.post(
                        `${API_URL}/clients`,
                        {
                            ...nouveauClient,

                            code_client:
                                genererCodeClient()
                        }
                    );


                idClient =
                    clientResponse
                        .data
                        .id_client;
            }


            // VALIDATION CHAMBRE

            if (
                !reservation.id_chambre
            ) {

                alert(
                    "Veuillez sélectionner une chambre."
                );

                return;
            }


            // CRÉATION

            await axios.post(
                `${API_URL}/reservations`,
                {

                    numero_reservation:
                        genererNumeroReservation(),

                    id_client:
                        idClient,

                    date_arrivee:
                        reservation.date_arrivee,

                    date_depart:
                        reservation.date_depart,

                    nb_adultes:
                        Number(
                            reservation.nb_adultes
                        ),

                    nb_enfants:
                        Number(
                            reservation.nb_enfants
                        ),

                    statut:
                        "EN_ATTENTE",

                    montant_prevu:
                        Number(
                            reservation.montant_prevu
                        ),

                    avance:
                        Number(
                            reservation.avance
                        ),

                    observation:
                        reservation.observation,

                    id_chambre:
                        Number(
                            reservation.id_chambre
                        ),

                    tarif_nuit:
                        Number(
                            reservation.tarif_nuit
                        ),

                    nombre_nuits:
                        Number(
                            reservation.nombre_nuits
                        )
                }
            );


            alert(
                "Réservation créée avec succès !"
            );


            fermerFormulaire();

            await chargerReservations();

            await chargerChambres();


        } catch (err) {

            console.error(
                "Erreur création réservation :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible de créer la réservation."
            );
        }
    };


    // ==========================================
    // ANNULER RÉSERVATION
    // ==========================================

    const annulerReservation = async (
        idReservation
    ) => {

        const confirmation =
            window.confirm(
                "Voulez-vous vraiment annuler cette réservation ?"
            );

        if (!confirmation) {

            return;
        }

        try {

            await axios.put(
                `${API_URL}/reservations/${idReservation}/annuler`
            );


            alert(
                "La réservation a été annulée avec succès."
            );


            await chargerReservations();

            await chargerChambres();


        } catch (err) {

            console.error(
                "Erreur annulation réservation :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible d'annuler la réservation."
            );
        }
    };


    // ==========================================
    // MODIFIER RÉSERVATION
    // ==========================================

    const modifierReservation = async (
        item
    ) => {

        try {

            setModeModification(true);

            setIdReservationModification(
                item.id_reservation
            );


            // ==================================
            // CLIENT
            // ==================================

            setClientTrouve({
                id_client:
                    item.id_client,

                nom:
                    item.client || "",

                prenom:
                    "",

                telephone:
                    item.telephone || "",

                email:
                    item.email || ""
            });


            setRechercheEffectuee(true);


            // ==================================
            // RECHARGER CHAMBRES
            // ==================================

            await chargerChambres();


            // ==================================
            // CHAMBRE
            // ==================================

            const chambre =
                chambres.find(
                    (c) =>
                        String(
                            c.numero
                        ) ===
                        String(
                            item.numero_chambre
                        )
                );


            // ==================================
            // DONNÉES FORMULAIRE
            // ==================================

            setReservation({

                date_arrivee:
                    item.date_arrivee
                        ? item.date_arrivee
                            .substring(0, 10)
                        : "",

                date_depart:
                    item.date_depart
                        ? item.date_depart
                            .substring(0, 10)
                        : "",

                nb_adultes:
                    item.nb_adultes || 1,

                nb_enfants:
                    item.nb_enfants || 0,

                id_chambre:
                    chambre
                        ? String(
                            chambre.id_chambre
                        )
                        : "",

                tarif_nuit:
                    chambre
                        ? Number(
                            chambre.tarif
                        )
                        : 0,

                nombre_nuits:
                    0,

                montant_prevu:
                    Number(
                        item.montant_prevu || 0
                    ),

                avance:
                    Number(
                        item.avance || 0
                    ),

                observation:
                    item.observation || ""
            });


            setAfficherFormulaire(true);


        } catch (err) {

            console.error(
                "Erreur modification :",
                err
            );

            alert(
                "Impossible de charger la réservation."
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

        return new Date(
            date
        ).toLocaleDateString(
            "fr-FR"
        );
    };


    // ==========================================
    // FORMAT MONTANT
    // ==========================================

    const formatMontant = (montant) => {

        return Number(
            montant || 0
        ).toLocaleString(
            "fr-FR"
        );
    };


    // ==========================================
    // RENDU
    // ==========================================

    return (

        <div className="reservations-page">


            {/* ==================================
                HEADER
            ================================== */}

            <div className="page-header">

                <div>

                    <h1>
                        Réservations
                    </h1>

                    <p>
                        Gestion des réservations de chambres
                    </p>

                </div>


                <button
                    type="button"
                    className="btn-primary"
                    onClick={
                        ouvrirFormulaire
                    }
                >
                    + Nouvelle réservation
                </button>

            </div>


            {/* ==================================
                FORMULAIRE
            ================================== */}

            {
                afficherFormulaire && (

                    <div className="reservation-form">


                        <div className="form-header">

                            <div>

                                <h2>

                                    {
                                        modeModification
                                            ? "Modifier la réservation"
                                            : "Nouvelle réservation"
                                    }

                                </h2>

                                <p>

                                    {
                                        modeModification
                                            ? "Modifiez les informations de la réservation"
                                            : "Recherchez d'abord le client"
                                    }

                                </p>

                            </div>


                            <button
                                type="button"
                                className="btn-close"
                                onClick={
                                    fermerFormulaire
                                }
                            >
                                ✕
                            </button>

                        </div>


                        <form
                            onSubmit={
                                enregistrerReservation
                            }
                        >


                            {/* ======================
                                CLIENT
                            ====================== */}

                            <div className="form-section">

                                <h3>
                                    1. Identification du client
                                </h3>


                                {
                                    !modeModification && (

                                        <div className="telephone-search">

                                            <input
                                                type="tel"
                                                value={
                                                    telephoneRecherche
                                                }
                                                onChange={
                                                    (e) =>
                                                        setTelephoneRecherche(
                                                            e.target.value
                                                        )
                                                }
                                                placeholder="Numéro de téléphone"
                                            />


                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={
                                                    rechercherClient
                                                }
                                                disabled={
                                                    rechercheLoading
                                                }
                                            >

                                                {
                                                    rechercheLoading
                                                        ? "Recherche..."
                                                        : "Rechercher"
                                                }

                                            </button>

                                        </div>
                                    )
                                }


                                {
                                    rechercheEffectuee &&
                                    clientTrouve && (

                                        <div className="client-found">

                                            <h4>
                                                ✓ Client sélectionné
                                            </h4>

                                            <p>

                                                <strong>

                                                    {
                                                        clientTrouve.nom
                                                    }{" "}

                                                    {
                                                        clientTrouve.prenom
                                                    }

                                                </strong>

                                            </p>


                                            {
                                                clientTrouve.telephone && (

                                                    <p>
                                                        📱 {
                                                            clientTrouve.telephone
                                                        }
                                                    </p>

                                                )
                                            }


                                            {
                                                clientTrouve.email && (

                                                    <p>
                                                        ✉️ {
                                                            clientTrouve.email
                                                        }
                                                    </p>

                                                )
                                            }

                                        </div>
                                    )
                                }


                                {
                                    rechercheEffectuee &&
                                    !clientTrouve &&
                                    !modeModification && (

                                        <div className="new-client-section">

                                            <h4>
                                                Nouveau client
                                            </h4>


                                            <div className="form-grid">

                                                <div>

                                                    <label>
                                                        Nom *
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="nom"
                                                        value={
                                                            nouveauClient.nom
                                                        }
                                                        onChange={
                                                            handleClientChange
                                                        }
                                                        required
                                                    />

                                                </div>


                                                <div>

                                                    <label>
                                                        Prénom
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="prenom"
                                                        value={
                                                            nouveauClient.prenom
                                                        }
                                                        onChange={
                                                            handleClientChange
                                                        }
                                                    />

                                                </div>


                                                <div>

                                                    <label>
                                                        Téléphone *
                                                    </label>

                                                    <input
                                                        type="tel"
                                                        name="telephone"
                                                        value={
                                                            nouveauClient.telephone
                                                        }
                                                        onChange={
                                                            handleClientChange
                                                        }
                                                        required
                                                    />

                                                </div>


                                                <div>

                                                    <label>
                                                        Email
                                                    </label>

                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={
                                                            nouveauClient.email
                                                        }
                                                        onChange={
                                                            handleClientChange
                                                        }
                                                    />

                                                </div>

                                            </div>

                                        </div>
                                    )
                                }

                            </div>


                            {/* ======================
                                SÉJOUR
                            ====================== */}

                            {
                                rechercheEffectuee && (

                                    <div className="form-section">

                                        <h3>
                                            2. Informations du séjour
                                        </h3>


                                        <div className="form-grid">

                                            <div>

                                                <label>
                                                    Date d'arrivée *
                                                </label>

                                                <input
                                                    type="date"
                                                    name="date_arrivee"
                                                    value={
                                                        reservation.date_arrivee
                                                    }
                                                    onChange={
                                                        handleReservationChange
                                                    }
                                                    required
                                                />

                                            </div>


                                            <div>

                                                <label>
                                                    Date de départ *
                                                </label>

                                                <input
                                                    type="date"
                                                    name="date_depart"
                                                    value={
                                                        reservation.date_depart
                                                    }
                                                    onChange={
                                                        handleReservationChange
                                                    }
                                                    required
                                                />

                                            </div>


                                            <div>

                                                <label>
                                                    Adultes
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    name="nb_adultes"
                                                    value={
                                                        reservation.nb_adultes
                                                    }
                                                    onChange={
                                                        handleReservationChange
                                                    }
                                                />

                                            </div>


                                            <div>

                                                <label>
                                                    Enfants
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    name="nb_enfants"
                                                    value={
                                                        reservation.nb_enfants
                                                    }
                                                    onChange={
                                                        handleReservationChange
                                                    }
                                                />

                                            </div>

                                        </div>

                                    </div>
                                )
                            }


                            {/* ======================
                                CHAMBRE
                            ====================== */}

                            {
                                rechercheEffectuee && (

                                    <div className="form-section">

                                        <h3>
                                            3. Chambre
                                        </h3>


                                        <div className="form-grid">

                                            <div className="full-width">

                                                <label>
                                                    Chambre *
                                                </label>

                                                <select
                                                    value={
                                                        reservation.id_chambre
                                                    }
                                                    onChange={
                                                        choisirChambre
                                                    }
                                                    required
                                                    disabled={
                                                        modeModification
                                                    }
                                                >

                                                    <option value="">
                                                        Sélectionner une chambre
                                                    </option>


                                                    {
                                                        chambres.map(
                                                            (chambre) => (

                                                                <option
                                                                    key={
                                                                        chambre.id_chambre
                                                                    }
                                                                    value={
                                                                        chambre.id_chambre
                                                                    }
                                                                >

                                                                    Chambre {
                                                                        chambre.numero
                                                                    }

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

                                                                    {" FCFA / nuit"}

                                                                </option>

                                                            )
                                                        )
                                                    }

                                                </select>

                                            </div>


                                            <div>

                                                <label>
                                                    Tarif / nuit
                                                </label>

                                                <input
                                                    type="number"
                                                    value={
                                                        reservation.tarif_nuit
                                                    }
                                                    readOnly
                                                />

                                            </div>


                                            <div>

                                                <label>
                                                    Nombre de nuits
                                                </label>

                                                <input
                                                    type="number"
                                                    value={
                                                        reservation.nombre_nuits
                                                    }
                                                    readOnly
                                                />

                                            </div>


                                            <div>

                                                <label>
                                                    Montant prévu
                                                </label>

                                                <input
                                                    type="number"
                                                    value={
                                                        reservation.montant_prevu
                                                    }
                                                    readOnly
                                                />

                                            </div>


                                            <div>

                                                <label>
                                                    Avance
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    name="avance"
                                                    value={
                                                        reservation.avance
                                                    }
                                                    onChange={
                                                        handleReservationChange
                                                    }
                                                />

                                            </div>


                                            <div className="full-width">

                                                <label>
                                                    Observation
                                                </label>

                                                <textarea
                                                    name="observation"
                                                    value={
                                                        reservation.observation
                                                    }
                                                    onChange={
                                                        handleReservationChange
                                                    }
                                                    rows="3"
                                                />

                                            </div>

                                        </div>

                                    </div>
                                )
                            }


                            {/* ======================
                                ACTIONS FORMULAIRE
                            ====================== */}

                            {
                                rechercheEffectuee && (

                                    <div className="form-actions">

                                        <button
                                            type="button"
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

                                            {
                                                modeModification
                                                    ? "Enregistrer les modifications"
                                                    : "Enregistrer la réservation"
                                            }

                                        </button>

                                    </div>
                                )
                            }

                        </form>

                    </div>
                )
            }


            {/* ==================================
                LISTE DES RÉSERVATIONS
            ================================== */}

            {
                !afficherFormulaire && (

                    <>

                        {
                            loading && (

                                <p>
                                    Chargement des réservations...
                                </p>

                            )
                        }


                        {
                            error && (

                                <p className="error-message">
                                    {error}
                                </p>

                            )
                        }


                        {
                            !loading &&
                            !error && (

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
                                                    Chambre
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

                                            {
                                                reservations.length === 0

                                                    ? (

                                                        <tr>

                                                            <td
                                                                colSpan="10"
                                                                className="empty"
                                                            >
                                                                Aucune réservation enregistrée
                                                            </td>

                                                        </tr>

                                                    )

                                                    : (

                                                        reservations.map(
                                                            (item) => (

                                                                <tr
                                                                    key={
                                                                        item.id_reservation
                                                                    }
                                                                >

                                                                    <td>

                                                                        <strong>

                                                                            {
                                                                                item.numero_reservation
                                                                            }

                                                                        </strong>

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            item.client
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatDate(
                                                                                item.date_arrivee
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatDate(
                                                                                item.date_depart
                                                                            )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            item.nb_adultes
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            item.numero_chambre

                                                                                ? (

                                                                                    <>

                                                                                        <strong>

                                                                                            Chambre {
                                                                                                item.numero_chambre
                                                                                            }

                                                                                        </strong>


                                                                                        {
                                                                                            item.type_chambre && (

                                                                                                <div
                                                                                                    className="room-type"
                                                                                                >

                                                                                                    {
                                                                                                        item.type_chambre
                                                                                                    }

                                                                                                </div>

                                                                                            )
                                                                                        }

                                                                                    </>

                                                                                )

                                                                                : (

                                                                                    "—"

                                                                                )
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatMontant(
                                                                                item.montant_prevu
                                                                            )
                                                                        }

                                                                        {" FCFA"}

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            formatMontant(
                                                                                item.avance
                                                                            )
                                                                        }

                                                                        {" FCFA"}

                                                                    </td>


                                                                    <td>

                                                                        <span
                                                                            className={`status status-${String(
                                                                                item.statut
                                                                            ).toLowerCase()}`}
                                                                        >

                                                                            {
                                                                                item.statut
                                                                            }

                                                                        </span>

                                                                    </td>


                                                                    {/* ACTIONS */}

                                                                    <td
                                                                        className="actions-cell"
                                                                    >

                                                                        {
                                                                            item.statut !== "ANNULEE" && (

                                                                                <>

                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn-edit"
                                                                                        onClick={() =>
                                                                                            modifierReservation(
                                                                                                item
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Modifier
                                                                                    </button>


                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn-cancel"
                                                                                        onClick={() =>
                                                                                            annulerReservation(
                                                                                                item.id_reservation
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Annuler
                                                                                    </button>

                                                                                </>

                                                                            )
                                                                        }


                                                                        {
                                                                            item.statut === "ANNULEE" && (

                                                                                <span
                                                                                    className="cancelled-text"
                                                                                >
                                                                                    Annulée
                                                                                </span>

                                                                            )
                                                                        }

                                                                    </td>

                                                                </tr>

                                                            )
                                                        )
                                                    )
                                            }

                                        </tbody>

                                    </table>

                                </div>
                            )
                        }

                    </>
                )
            }

        </div>
    );
}


export default Reservations;