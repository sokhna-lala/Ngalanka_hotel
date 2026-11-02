import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Seminaires.css";

const API_SALLES = "http://localhost:5000/api/salles-seminaire";
const API_RESERVATIONS = "http://localhost:5000/api/reservations-salle";
const API_CLIENTS = "http://localhost:5000/api/clients";

const STATUTS_SALLE = [
    {
        value: "DISPONIBLE",
        label: "Disponible",
        className: "seminaire-statut-disponible"
    },
    {
        value: "OCCUPEE",
        label: "Occupée",
        className: "seminaire-statut-occupee"
    },
    {
        value: "HORS_SERVICE",
        label: "Hors service",
        className: "seminaire-statut-hors-service"
    }
];

const STATUTS_RESERVATION = [
    {
        value: "EN_ATTENTE",
        label: "En attente"
    },
    {
        value: "CONFIRMEE",
        label: "Confirmée"
    },
    {
        value: "ANNULEE",
        label: "Annulée"
    },
    {
        value: "TERMINEE",
        label: "Terminée"
    }
];

const formSalleInitial = {
    nom: "",
    capacite: "",
    description: "",
    tarif_journee: "",
    tarif_demi_journee: "",
    statut: "DISPONIBLE"
};

const formReservationInitial = {
    id_salle: "",
    id_client: "",
    nom_client: "",
    date_debut: "",
    date_fin: "",
    heure_debut: "",
    heure_fin: "",
    objet: "",
    nombre_participants: "",
    type_tarif: "JOURNEE",
    montant: "",
    avance: "",
    statut: "EN_ATTENTE",
    observation: ""
};

function Seminaires() {
    const { utilisateur } = useAuth();

    // =====================================================
    // SALLES
    // =====================================================

    const [salles, setSalles] = useState([]);
    const [formSalle, setFormSalle] = useState(formSalleInitial);
    const [salleSelectionnee, setSalleSelectionnee] = useState(null);

    const [recherche, setRecherche] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("TOUS");

    const [modalSalleOuverte, setModalSalleOuverte] =
        useState(false);

    const [modeEditionSalle, setModeEditionSalle] =
        useState(false);

    // =====================================================
    // RESERVATIONS
    // =====================================================

    const [reservations, setReservations] = useState([]);
    const [clients, setClients] = useState([]);

    const [formReservation, setFormReservation] =
        useState(formReservationInitial);

    const [reservationSelectionnee, setReservationSelectionnee] =
        useState(null);

    const [modalReservationOuverte, setModalReservationOuverte] =
        useState(false);

    const [modeEditionReservation, setModeEditionReservation] =
        useState(false);

    const [rechercheReservation, setRechercheReservation] =
        useState("");

    const [filtreStatutReservation, setFiltreStatutReservation] =
        useState("TOUS");

    // =====================================================
    // GENERAL
    // =====================================================

    const [chargement, setChargement] = useState(true);
    const [enregistrement, setEnregistrement] =
        useState(false);

    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    // =====================================================
    // CHARGEMENT DES DONNEES
    // =====================================================

    const chargerSalles = async () => {
        try {
            const response = await fetch(API_SALLES);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Impossible de récupérer les salles"
                );
            }

            setSalles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setErreur(
                error.message ||
                "Erreur lors du chargement des salles"
            );
        }
    };

    const chargerReservations = async () => {
        try {
            const response =
                await fetch(API_RESERVATIONS);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Impossible de récupérer les réservations"
                );
            }

            setReservations(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(error);
            setErreur(
                error.message ||
                "Erreur lors du chargement des réservations"
            );
        }
    };

    const chargerClients = async () => {
        try {
            const response =
                await fetch(API_CLIENTS);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Impossible de récupérer les clients"
                );
            }

            setClients(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(error);
            setErreur(
                error.message ||
                "Erreur lors du chargement des clients"
            );
        }
    };

    const chargerDonnees = async () => {
        try {
            setChargement(true);
            setErreur("");

            await Promise.all([
                chargerSalles(),
                chargerReservations(),
                chargerClients()
            ]);
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        chargerDonnees();
    }, []);

    // =====================================================
    // SALLES - FORMULAIRE
    // =====================================================

    const handleChangeSalle = (e) => {
        const { name, value } = e.target;

        setFormSalle((ancien) => ({
            ...ancien,
            [name]: value
        }));
    };

    const ouvrirAjoutSalle = () => {
        setModeEditionSalle(false);
        setSalleSelectionnee(null);
        setFormSalle(formSalleInitial);
        setMessage("");
        setErreur("");
        setModalSalleOuverte(true);
    };

    const ouvrirEditionSalle = (salle) => {
        setModeEditionSalle(true);
        setSalleSelectionnee(salle);

        setFormSalle({
            nom: salle.nom || "",
            capacite: salle.capacite ?? "",
            description: salle.description || "",
            tarif_journee: salle.tarif_journee ?? "",
            tarif_demi_journee:
                salle.tarif_demi_journee ?? "",
            statut: salle.statut || "DISPONIBLE"
        });

        setMessage("");
        setErreur("");
        setModalSalleOuverte(true);
    };

    const fermerModalSalle = () => {
        if (enregistrement) return;

        setModalSalleOuverte(false);
        setSalleSelectionnee(null);
        setFormSalle(formSalleInitial);
    };

    // =====================================================
    // SALLES - ENREGISTREMENT
    // =====================================================

    const enregistrerSalle = async (e) => {
        e.preventDefault();

        setMessage("");
        setErreur("");

        if (!formSalle.nom.trim()) {
            setErreur(
                "Le nom de la salle est obligatoire."
            );
            return;
        }

        if (
            !formSalle.capacite ||
            Number(formSalle.capacite) <= 0
        ) {
            setErreur(
                "La capacité doit être supérieure à 0."
            );
            return;
        }

        if (
            formSalle.tarif_journee === "" ||
            Number(formSalle.tarif_journee) < 0
        ) {
            setErreur(
                "Le tarif journée est invalide."
            );
            return;
        }

        if (
            formSalle.tarif_demi_journee === "" ||
            Number(formSalle.tarif_demi_journee) < 0
        ) {
            setErreur(
                "Le tarif demi-journée est invalide."
            );
            return;
        }

        try {
            setEnregistrement(true);

            const body = {
                nom: formSalle.nom.trim(),
                capacite: Number(formSalle.capacite),
                description:
                    formSalle.description.trim() || null,
                tarif_journee:
                    Number(formSalle.tarif_journee),
                tarif_demi_journee:
                    Number(formSalle.tarif_demi_journee),
                statut: formSalle.statut,
                id_utilisateur:
                    utilisateur?.id_utilisateur || null
            };

            const url = modeEditionSalle
                ? `${API_SALLES}/${salleSelectionnee.id_salle}`
                : API_SALLES;

            const response = await fetch(url, {
                method: modeEditionSalle
                    ? "PUT"
                    : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors de l'enregistrement"
                );
            }

            setMessage(
                modeEditionSalle
                    ? "Salle modifiée avec succès."
                    : "Salle créée avec succès."
            );

            await chargerSalles();

            setTimeout(() => {
                fermerModalSalle();
            }, 600);

        } catch (error) {
            console.error(error);
            setErreur(
                error.message ||
                "Erreur lors de l'enregistrement."
            );
        } finally {
            setEnregistrement(false);
        }
    };

    // =====================================================
    // SALLES - STATUT
    // =====================================================

    const changerStatutSalle = async (
        salle,
        nouveauStatut
    ) => {
        if (
            salle.statut === nouveauStatut
        ) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const response = await fetch(
                `${API_SALLES}/${salle.id_salle}/statut`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        statut: nouveauStatut,
                        id_utilisateur:
                            utilisateur?.id_utilisateur ||
                            null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Impossible de modifier le statut"
                );
            }

            setMessage(
                "Statut de la salle modifié avec succès."
            );

            await chargerSalles();

        } catch (error) {
            console.error(error);

            setErreur(
                error.message ||
                "Erreur lors du changement de statut."
            );
        }
    };

    // =====================================================
    // SALLES - SUPPRESSION
    // =====================================================

    const supprimerSalle = async (salle) => {
        const confirmation =
            window.confirm(
                `Voulez-vous vraiment supprimer la salle "${salle.nom}" ?`
            );

        if (!confirmation) return;

        try {
            setErreur("");
            setMessage("");

            const response = await fetch(
                `${API_SALLES}/${salle.id_salle}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        id_utilisateur:
                            utilisateur?.id_utilisateur ||
                            null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Impossible de supprimer la salle"
                );
            }

            setMessage(
                "Salle supprimée avec succès."
            );

            await chargerDonnees();

        } catch (error) {
            console.error(error);

            setErreur(
                error.message ||
                "Erreur lors de la suppression."
            );
        }
    };

    // =====================================================
    // RESERVATION - FORMULAIRE
    // =====================================================

    const handleChangeReservation = (e) => {
        const { name, value } = e.target;

        setFormReservation((ancien) => ({
            ...ancien,
            [name]: value
        }));
    };

    // =====================================================
    // CALCUL DU MONTANT
    // =====================================================

    const calculerMontantReservation = () => {
        const salle = salles.find(
            (item) =>
                Number(item.id_salle) ===
                Number(formReservation.id_salle)
        );

        if (!salle) {
            return 0;
        }

        const tarif = formReservation.type_tarif ===
            "DEMI_JOURNEE"
            ? Number(salle.tarif_demi_journee || 0)
            : Number(salle.tarif_journee || 0);

        if (
            !formReservation.date_debut ||
            !formReservation.date_fin
        ) {
            return tarif;
        }

        const debut = new Date(
            `${formReservation.date_debut}T00:00:00`
        );

        const fin = new Date(
            `${formReservation.date_fin}T00:00:00`
        );

        if (
            Number.isNaN(debut.getTime()) ||
            Number.isNaN(fin.getTime()) ||
            fin < debut
        ) {
            return tarif;
        }

        const difference =
            fin.getTime() - debut.getTime();

        const nombreJours =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            ) + 1;

        return (
            formReservation.type_tarif ===
            "DEMI_JOURNEE"
                ? tarif * nombreJours
                : tarif * nombreJours
        );
    };

    const montantCalcule =
        calculerMontantReservation();

    const avanceReservation =
        Number(formReservation.avance || 0);

    const resteReservation = Math.max(
        0,
        montantCalcule - avanceReservation
    );

    // =====================================================
    // OUVRIR RESERVATION
    // =====================================================

    const ouvrirReservation = () => {
        setModeEditionReservation(false);
        setReservationSelectionnee(null);

        const premiereSalleDisponible =
            salles.find(
                (salle) =>
                    salle.statut ===
                    "DISPONIBLE"
            );

        setFormReservation({
            ...formReservationInitial,
            id_salle:
                premiereSalleDisponible
                    ? premiereSalleDisponible.id_salle
                    : "",
            montant: ""
        });

        setMessage("");
        setErreur("");
        setModalReservationOuverte(true);
    };

    // =====================================================
    // EDITER RESERVATION
    // =====================================================

    const ouvrirEditionReservation = (
        reservation
    ) => {
        setModeEditionReservation(true);
        setReservationSelectionnee(
            reservation
        );

        setFormReservation({
            id_salle:
                reservation.id_salle || "",
            id_client:
                reservation.id_client
                    ? reservation.id_client
                    : "__MANUEL__",
            nom_client:
                reservation.id_client
                    ? ""
                    : reservation.nom_client || "",
            date_debut:
                reservation.date_debut
                    ? String(
                          reservation.date_debut
                      ).substring(0, 10)
                    : "",
            date_fin:
                reservation.date_fin
                    ? String(
                          reservation.date_fin
                      ).substring(0, 10)
                    : "",
            heure_debut:
                reservation.heure_debut
                    ? String(
                          reservation.heure_debut
                      ).substring(0, 5)
                    : "",
            heure_fin:
                reservation.heure_fin
                    ? String(
                          reservation.heure_fin
                      ).substring(0, 5)
                    : "",
            objet:
                reservation.objet || "",
            nombre_participants:
                reservation.nombre_participants ||
                "",
            type_tarif: "JOURNEE",
            montant:
                reservation.montant || "",
            avance:
                reservation.avance || "",
            statut:
                reservation.statut ||
                "EN_ATTENTE",
            observation:
                reservation.observation ||
                ""
        });

        setMessage("");
        setErreur("");
        setModalReservationOuverte(true);
    };

    const fermerModalReservation = () => {
        if (enregistrement) return;

        setModalReservationOuverte(false);
        setReservationSelectionnee(null);
        setFormReservation(
            formReservationInitial
        );
    };

    // =====================================================
    // ENREGISTRER RESERVATION
    // =====================================================

    const enregistrerReservation = async (e) => {
        e.preventDefault();

        setMessage("");
        setErreur("");

        const clientManuel =
            formReservation.id_client ===
            "__MANUEL__";

        if (
            !formReservation.id_client
        ) {
            setErreur(
                "Veuillez sélectionner un client ou choisir l'option client non enregistré."
            );
            return;
        }

        if (
            clientManuel &&
            !formReservation.nom_client.trim()
        ) {
            setErreur(
                "Veuillez saisir le nom du client."
            );
            return;
        }

        if (!formReservation.id_salle) {
            setErreur(
                "Veuillez sélectionner une salle."
            );
            return;
        }

        if (!formReservation.date_debut) {
            setErreur(
                "La date de début est obligatoire."
            );
            return;
        }

        if (!formReservation.date_fin) {
            setErreur(
                "La date de fin est obligatoire."
            );
            return;
        }

        if (
            new Date(
                formReservation.date_fin
            ) <
            new Date(
                formReservation.date_debut
            )
        ) {
            setErreur(
                "La date de fin ne peut pas être avant la date de début."
            );
            return;
        }

        if (
            !formReservation.objet.trim()
        ) {
            setErreur(
                "L'objet du séminaire est obligatoire."
            );
            return;
        }

        if (
            !formReservation.nombre_participants ||
            Number(
                formReservation.nombre_participants
            ) <= 0
        ) {
            setErreur(
                "Le nombre de participants doit être supérieur à 0."
            );
            return;
        }

        const salle = salles.find(
            (item) =>
                Number(item.id_salle) ===
                Number(
                    formReservation.id_salle
                )
        );

        if (!salle) {
            setErreur(
                "Salle sélectionnée introuvable."
            );
            return;
        }

        if (
            Number(
                formReservation.nombre_participants
            ) >
            Number(salle.capacite)
        ) {
            setErreur(
                `Cette salle peut accueillir au maximum ${salle.capacite} personnes.`
            );
            return;
        }

        if (
            avanceReservation >
            montantCalcule
        ) {
            setErreur(
                "L'avance ne peut pas être supérieure au montant total."
            );
            return;
        }

        try {
            setEnregistrement(true);

            const body = {
                id_salle:
                    Number(
                        formReservation.id_salle
                    ),

                id_client:
                    clientManuel
                        ? null
                        : Number(
                            formReservation.id_client
                        ),

                nom_client:
                    clientManuel
                        ? formReservation.nom_client.trim()
                        : null,

                date_debut:
                    formReservation.date_debut,

                date_fin:
                    formReservation.date_fin,

                heure_debut:
                    formReservation.heure_debut ||
                    null,

                heure_fin:
                    formReservation.heure_fin ||
                    null,

                objet:
                    formReservation.objet.trim(),

                nombre_participants:
                    Number(
                        formReservation.nombre_participants
                    ),

                montant:
                    Number(montantCalcule),

                avance:
                    Number(
                        formReservation.avance || 0
                    ),

                statut:
                    formReservation.statut,

                observation:
                    formReservation.observation.trim() ||
                    null,

                id_utilisateur:
                    utilisateur?.id_utilisateur ||
                    null
            };

            const url =
                modeEditionReservation
                    ? `${API_RESERVATIONS}/${reservationSelectionnee.id_reservation_salle}`
                    : API_RESERVATIONS;

            const response = await fetch(
                url,
                {
                    method:
                        modeEditionReservation
                            ? "PUT"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(body)
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors de l'enregistrement de la réservation"
                );
            }

            setMessage(
                modeEditionReservation
                    ? "Réservation modifiée avec succès."
                    : `Réservation créée avec succès. N° ${data.numero_reservation || ""}`
            );

            await chargerReservations();

            setTimeout(() => {
                fermerModalReservation();
            }, 800);

        } catch (error) {
            console.error(error);

            setErreur(
                error.message ||
                "Erreur lors de l'enregistrement."
            );
        } finally {
            setEnregistrement(false);
        }
    };

    // =====================================================
    // STATUT RESERVATION
    // =====================================================

    const changerStatutReservation = async (
        reservation,
        nouveauStatut
    ) => {
        if (
            reservation.statut ===
            nouveauStatut
        ) {
            return;
        }

        try {
            setMessage("");
            setErreur("");

            const response = await fetch(
                `${API_RESERVATIONS}/${reservation.id_reservation_salle}/statut`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        statut:
                            nouveauStatut,

                        id_utilisateur:
                            utilisateur?.id_utilisateur ||
                            null
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Impossible de modifier le statut"
                );
            }

            setMessage(
                "Statut de la réservation modifié."
            );

            await chargerReservations();

        } catch (error) {
            console.error(error);

            setErreur(
                error.message ||
                "Erreur lors du changement de statut."
            );
        }
    };

    // =====================================================
    // SUPPRIMER RESERVATION
    // =====================================================

    const supprimerReservation = async (
        reservation
    ) => {
        const confirmation =
            window.confirm(
                `Voulez-vous supprimer la réservation ${reservation.numero_reservation} ?`
            );

        if (!confirmation) return;

        try {
            setMessage("");
            setErreur("");

            const response = await fetch(
                `${API_RESERVATIONS}/${reservation.id_reservation_salle}`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        id_utilisateur:
                            utilisateur?.id_utilisateur ||
                            null
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Impossible de supprimer la réservation"
                );
            }

            setMessage(
                "Réservation supprimée avec succès."
            );

            await chargerReservations();

        } catch (error) {
            console.error(error);

            setErreur(
                error.message ||
                "Erreur lors de la suppression."
            );
        }
    };

    // =====================================================
    // FORMATAGE
    // =====================================================

    const formaterMontant = (montant) => {
        return `${Number(
            montant || 0
        ).toLocaleString("fr-FR")} FCFA`;
    };

    const formaterDate = (date) => {
        if (!date) return "-";

        const valeur = String(date).substring(
            0,
            10
        );

        const morceaux =
            valeur.split("-");

        if (morceaux.length !== 3) {
            return valeur;
        }

        return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
    };

    const obtenirStatutSalle = (
        statut
    ) => {
        return (
            STATUTS_SALLE.find(
                (item) =>
                    item.value === statut
            ) ||
            STATUTS_SALLE[0]
        );
    };

    const obtenirClasseStatutReservation =
        (statut) => {
            switch (statut) {
                case "CONFIRMEE":
                    return "reservation-statut-confirmee";

                case "ANNULEE":
                    return "reservation-statut-annulee";

                case "TERMINEE":
                    return "reservation-statut-terminee";

                default:
                    return "reservation-statut-attente";
            }
        };

    // =====================================================
    // FILTRE SALLES
    // =====================================================

    const sallesFiltrees =
        salles.filter((salle) => {
            const rechercheNormalisee =
                recherche
                    .toLowerCase()
                    .trim();

            const correspondRecherche =
                !rechercheNormalisee ||
                salle.nom
                    ?.toLowerCase()
                    .includes(
                        rechercheNormalisee
                    ) ||
                salle.description
                    ?.toLowerCase()
                    .includes(
                        rechercheNormalisee
                    );

            const correspondStatut =
                filtreStatut === "TOUS" ||
                salle.statut ===
                    filtreStatut;

            return (
                correspondRecherche &&
                correspondStatut
            );
        });

    // =====================================================
    // FILTRE RESERVATIONS
    // =====================================================

    const reservationsFiltrees =
        reservations.filter(
            (reservation) => {
                const rechercheNormalisee =
                    rechercheReservation
                        .toLowerCase()
                        .trim();

                const correspondRecherche =
                    !rechercheNormalisee ||
                    reservation.numero_reservation
                        ?.toLowerCase()
                        .includes(
                            rechercheNormalisee
                        ) ||
                    reservation.nom_client
                        ?.toLowerCase()
                        .includes(
                            rechercheNormalisee
                        ) ||
                    reservation.nom_salle
                        ?.toLowerCase()
                        .includes(
                            rechercheNormalisee
                        ) ||
                    reservation.objet
                        ?.toLowerCase()
                        .includes(
                            rechercheNormalisee
                        );

                const correspondStatut =
                    filtreStatutReservation ===
                        "TOUS" ||
                    reservation.statut ===
                        filtreStatutReservation;

                return (
                    correspondRecherche &&
                    correspondStatut
                );
            }
        );

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const totalSalles =
        salles.length;

    const sallesDisponibles =
        salles.filter(
            (salle) =>
                salle.statut ===
                "DISPONIBLE"
        ).length;

    const sallesOccupees =
        salles.filter(
            (salle) =>
                salle.statut ===
                "OCCUPEE"
        ).length;

    const sallesHorsService =
        salles.filter(
            (salle) =>
                salle.statut ===
                "HORS_SERVICE"
        ).length;

    const totalReservations =
        reservations.length;

    const reservationsConfirmees =
        reservations.filter(
            (reservation) =>
                reservation.statut ===
                "CONFIRMEE"
        ).length;

    // =====================================================
    // RENDU
    // =====================================================

    return (
        <div className="seminaires-page">

            {/* ============================================
                EN-TÊTE
            ============================================= */}

            <div className="seminaires-header">

                <div>
                    <div className="seminaires-breadcrumb">
                        Hôtel Ngalanka / Loisirs &
                        Événements / Séminaires
                    </div>

                    <h1>
                        🏢 Salles de séminaire
                    </h1>

                    <p>
                        Gérez vos salles et les
                        réservations de séminaires.
                    </p>
                </div>

                <div className="seminaires-header-actions">

                    <button
                        className="seminaires-btn-reserver"
                        onClick={
                            ouvrirReservation
                        }
                    >
                        <span>📅</span>
                        Réserver une salle
                    </button>

                    <button
                        className="seminaires-btn-ajouter"
                        onClick={
                            ouvrirAjoutSalle
                        }
                    >
                        <span>＋</span>
                        Ajouter une salle
                    </button>

                </div>

            </div>

            {/* ============================================
                MESSAGES
            ============================================= */}

            {message && (
                <div className="seminaires-message seminaires-message-success">
                    <span>✓</span>
                    {message}
                </div>
            )}

            {erreur && (
                <div className="seminaires-message seminaires-message-error">
                    <span>⚠</span>
                    {erreur}
                </div>
            )}

            {/* ============================================
                STATISTIQUES SALLES
            ============================================= */}

            <div className="seminaires-stats">

                <div className="seminaires-stat-card">
                    <div className="seminaires-stat-icon">
                        🏢
                    </div>

                    <div>
                        <span>
                            Total salles
                        </span>

                        <strong>
                            {totalSalles}
                        </strong>
                    </div>
                </div>

                <div className="seminaires-stat-card">
                    <div className="seminaires-stat-icon disponible">
                        ✓
                    </div>

                    <div>
                        <span>
                            Disponibles
                        </span>

                        <strong>
                            {sallesDisponibles}
                        </strong>
                    </div>
                </div>

                <div className="seminaires-stat-card">
                    <div className="seminaires-stat-icon occupee">
                        👥
                    </div>

                    <div>
                        <span>
                            Occupées
                        </span>

                        <strong>
                            {sallesOccupees}
                        </strong>
                    </div>
                </div>

                <div className="seminaires-stat-card">
                    <div className="seminaires-stat-icon hors-service">
                        ⚠
                    </div>

                    <div>
                        <span>
                            Hors service
                        </span>

                        <strong>
                            {sallesHorsService}
                        </strong>
                    </div>
                </div>

            </div>

            {/* ============================================
                RESERVATIONS - APERCU
            ============================================= */}

            <div className="seminaires-reservations-section">

                <div className="seminaires-section-header">

                    <div>
                        <h2>
                            📅 Réservations
                        </h2>

                        <p>
                            {totalReservations} réservation(s)
                            · {reservationsConfirmees}
                            confirmée(s)
                        </p>
                    </div>

                    <button
                        className="seminaires-btn-reserver-small"
                        onClick={
                            ouvrirReservation
                        }
                    >
                        ＋ Nouvelle réservation
                    </button>

                </div>

                <div className="seminaires-reservation-filtres">

                    <div className="seminaires-recherche">
                        <span>⌕</span>

                        <input
                            type="text"
                            placeholder="Rechercher une réservation..."
                            value={
                                rechercheReservation
                            }
                            onChange={(e) =>
                                setRechercheReservation(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <select
                        value={
                            filtreStatutReservation
                        }
                        onChange={(e) =>
                            setFiltreStatutReservation(
                                e.target.value
                            )
                        }
                    >
                        <option value="TOUS">
                            Tous les statuts
                        </option>

                        {STATUTS_RESERVATION.map(
                            (statut) => (
                                <option
                                    key={
                                        statut.value
                                    }
                                    value={
                                        statut.value
                                    }
                                >
                                    {statut.label}
                                </option>
                            )
                        )}
                    </select>

                </div>

                {reservationsFiltrees.length === 0 ? (

                    <div className="seminaires-reservations-vide">
                        <div>
                            📅
                        </div>

                        <h3>
                            Aucune réservation
                        </h3>

                        <p>
                            Créez une réservation
                            pour une salle de
                            séminaire.
                        </p>

                        <button
                            className="seminaires-btn-reserver-small"
                            onClick={
                                ouvrirReservation
                            }
                        >
                            📅 Réserver une salle
                        </button>
                    </div>

                ) : (

                    <div className="seminaires-reservations-table-container">

                        <table className="seminaires-reservations-table">

                            <thead>
                                <tr>
                                    <th>
                                        Réservation
                                    </th>

                                    <th>
                                        Client
                                    </th>

                                    <th>
                                        Salle
                                    </th>

                                    <th>
                                        Période
                                    </th>

                                    <th>
                                        Participants
                                    </th>

                                    <th>
                                        Montant
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

                                {reservationsFiltrees.map(
                                    (reservation) => (
                                        <tr
                                            key={
                                                reservation.id_reservation_salle
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        reservation.numero_reservation
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        reservation.objet
                                                    }
                                                </small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        reservation.nom_client
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        reservation.telephone_client ||
                                                        "-"
                                                    }
                                                </small>
                                            </td>

                                            <td>
                                                {
                                                    reservation.nom_salle
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        formaterDate(
                                                            reservation.date_debut
                                                        )
                                                    }
                                                </strong>

                                                <span>
                                                    au{" "}
                                                    {
                                                        formaterDate(
                                                            reservation.date_fin
                                                        )
                                                    }
                                                </span>

                                                {(reservation.heure_debut ||
                                                    reservation.heure_fin) && (
                                                    <small>
                                                        {
                                                            reservation.heure_debut
                                                        }{" "}
                                                        -{" "}
                                                        {
                                                            reservation.heure_fin
                                                        }
                                                    </small>
                                                )}
                                            </td>

                                            <td>
                                                👥{" "}
                                                {
                                                    reservation.nombre_participants
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        formaterMontant(
                                                            reservation.montant
                                                        )
                                                    }
                                                </strong>

                                                <small>
                                                    Reste :{" "}
                                                    {
                                                        formaterMontant(
                                                            reservation.reste
                                                        )
                                                    }
                                                </small>
                                            </td>

                                            <td>

                                                <select
                                                    className={`reservation-statut-select ${obtenirClasseStatutReservation(
                                                        reservation.statut
                                                    )}`}
                                                    value={
                                                        reservation.statut
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        changerStatutReservation(
                                                            reservation,
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >

                                                    {STATUTS_RESERVATION.map(
                                                        (
                                                            statut
                                                        ) => (
                                                            <option
                                                                key={
                                                                    statut.value
                                                                }
                                                                value={
                                                                    statut.value
                                                                }
                                                            >
                                                                {
                                                                    statut.label
                                                                }
                                                            </option>
                                                        )
                                                    )}

                                                </select>

                                            </td>

                                            <td>

                                                <div className="seminaires-table-actions">

                                                    <button
                                                        onClick={() =>
                                                            ouvrirEditionReservation(
                                                                reservation
                                                            )
                                                        }
                                                        title="Modifier"
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            supprimerReservation(
                                                                reservation
                                                            )
                                                        }
                                                        title="Supprimer"
                                                    >
                                                        🗑️
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

            {/* ============================================
                SALLES
            ============================================= */}

            <div className="seminaires-salles-section">

                <div className="seminaires-section-header">

                    <div>
                        <h2>
                            🏢 Gestion des salles
                        </h2>

                        <p>
                            Gérez les espaces disponibles
                            pour vos événements.
                        </p>
                    </div>

                </div>

                <div className="seminaires-filtres">

                    <div className="seminaires-recherche">
                        <span>⌕</span>

                        <input
                            type="text"
                            placeholder="Rechercher une salle..."
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

                        <option value="DISPONIBLE">
                            Disponibles
                        </option>

                        <option value="OCCUPEE">
                            Occupées
                        </option>

                        <option value="HORS_SERVICE">
                            Hors service
                        </option>
                    </select>

                </div>

                {chargement ? (

                    <div className="seminaires-chargement">

                        <div className="seminaires-spinner"></div>

                        <p>
                            Chargement...
                        </p>

                    </div>

                ) : sallesFiltrees.length === 0 ? (

                    <div className="seminaires-vide">

                        <div className="seminaires-vide-icon">
                            🏢
                        </div>

                        <h3>
                            {salles.length === 0
                                ? "Aucune salle enregistrée"
                                : "Aucune salle trouvée"}
                        </h3>

                        <p>
                            {salles.length === 0
                                ? "Commencez par ajouter une salle."
                                : "Modifiez vos critères de recherche."}
                        </p>

                        {salles.length === 0 && (
                            <button
                                className="seminaires-btn-ajouter"
                                onClick={
                                    ouvrirAjoutSalle
                                }
                            >
                                ＋ Ajouter une salle
                            </button>
                        )}

                    </div>

                ) : (

                    <div className="seminaires-grille">

                        {sallesFiltrees.map(
                            (salle) => {
                                const statut =
                                    obtenirStatutSalle(
                                        salle.statut
                                    );

                                return (
                                    <div
                                        className="seminaire-card"
                                        key={
                                            salle.id_salle
                                        }
                                    >

                                        <div className="seminaire-card-header">

                                            <div className="seminaire-card-icon">
                                                🏢
                                            </div>

                                            <span
                                                className={`seminaire-statut ${statut.className}`}
                                            >
                                                <span></span>
                                                {
                                                    statut.label
                                                }
                                            </span>

                                        </div>

                                        <div className="seminaire-card-body">

                                            <h2>
                                                {
                                                    salle.nom
                                                }
                                            </h2>

                                            {salle.description && (
                                                <p className="seminaire-description">
                                                    {
                                                        salle.description
                                                    }
                                                </p>
                                            )}

                                            <div className="seminaire-infos">

                                                <div className="seminaire-info">

                                                    <span className="seminaire-info-icon">
                                                        👥
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Capacité
                                                        </small>

                                                        <strong>
                                                            {
                                                                salle.capacite
                                                            }{" "}
                                                            personnes
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="seminaire-info">

                                                    <span className="seminaire-info-icon">
                                                        ☀️
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Journée
                                                        </small>

                                                        <strong>
                                                            {formaterMontant(
                                                                salle.tarif_journee
                                                            )}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="seminaire-info">

                                                    <span className="seminaire-info-icon">
                                                        🕐
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Demi-journée
                                                        </small>

                                                        <strong>
                                                            {formaterMontant(
                                                                salle.tarif_demi_journee
                                                            )}
                                                        </strong>
                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                        <div className="seminaire-card-footer">

                                            <button
                                                className="seminaire-btn-editer"
                                                onClick={() =>
                                                    ouvrirEditionSalle(
                                                        salle
                                                    )
                                                }
                                            >
                                                ✏️ Modifier
                                            </button>

                                            <button
                                                className="seminaire-btn-supprimer"
                                                onClick={() =>
                                                    supprimerSalle(
                                                        salle
                                                    )
                                                }
                                            >
                                                🗑️
                                            </button>

                                        </div>

                                        <div className="seminaire-statut-actions">

                                            <span>
                                                Statut :
                                            </span>

                                            <select
                                                value={
                                                    salle.statut
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    changerStatutSalle(
                                                        salle,
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                            >

                                                {STATUTS_SALLE.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <option
                                                            key={
                                                                item.value
                                                            }
                                                            value={
                                                                item.value
                                                            }
                                                        >
                                                            {
                                                                item.label
                                                            }
                                                        </option>
                                                    )
                                                )}

                                            </select>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>

            {/* ============================================
                MODAL SALLE
            ============================================= */}

            {modalSalleOuverte && (
                <div
                    className="seminaires-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            fermerModalSalle();
                        }
                    }}
                >

                    <div className="seminaires-modal">

                        <div className="seminaires-modal-header">

                            <div>
                                <span className="seminaires-modal-icon">
                                    🏢
                                </span>

                                <div>
                                    <h2>
                                        {modeEditionSalle
                                            ? "Modifier la salle"
                                            : "Nouvelle salle"}
                                    </h2>

                                    <p>
                                        Configurez les informations
                                        de la salle.
                                    </p>
                                </div>
                            </div>

                            <button
                                className="seminaires-modal-close"
                                onClick={
                                    fermerModalSalle
                                }
                                disabled={
                                    enregistrement
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            className="seminaires-form"
                            onSubmit={
                                enregistrerSalle
                            }
                        >

                            <div className="seminaires-form-grid">

                                <div className="seminaires-form-group full">

                                    <label>
                                        Nom de la salle *
                                    </label>

                                    <input
                                        type="text"
                                        name="nom"
                                        value={
                                            formSalle.nom
                                        }
                                        onChange={
                                            handleChangeSalle
                                        }
                                        placeholder="Ex : Salle de conférence"
                                        required
                                    />

                                </div>

                                <div className="seminaires-form-group">

                                    <label>
                                        Capacité *
                                    </label>

                                    <input
                                        type="number"
                                        name="capacite"
                                        min="1"
                                        value={
                                            formSalle.capacite
                                        }
                                        onChange={
                                            handleChangeSalle
                                        }
                                        placeholder="Ex : 50"
                                        required
                                    />

                                </div>

                                <div className="seminaires-form-group">

                                    <label>
                                        Statut
                                    </label>

                                    <select
                                        name="statut"
                                        value={
                                            formSalle.statut
                                        }
                                        onChange={
                                            handleChangeSalle
                                        }
                                    >
                                        {STATUTS_SALLE.map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item.value
                                                    }
                                                    value={
                                                        item.value
                                                    }
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>

                                <div className="seminaires-form-group">

                                    <label>
                                        Tarif journée *
                                    </label>

                                    <div className="seminaires-input-montant">

                                        <input
                                            type="number"
                                            name="tarif_journee"
                                            min="0"
                                            step="0.01"
                                            value={
                                                formSalle.tarif_journee
                                            }
                                            onChange={
                                                handleChangeSalle
                                            }
                                            required
                                        />

                                        <span>
                                            FCFA
                                        </span>

                                    </div>

                                </div>

                                <div className="seminaires-form-group">

                                    <label>
                                        Tarif demi-journée *
                                    </label>

                                    <div className="seminaires-input-montant">

                                        <input
                                            type="number"
                                            name="tarif_demi_journee"
                                            min="0"
                                            step="0.01"
                                            value={
                                                formSalle.tarif_demi_journee
                                            }
                                            onChange={
                                                handleChangeSalle
                                            }
                                            required
                                        />

                                        <span>
                                            FCFA
                                        </span>

                                    </div>

                                </div>

                                <div className="seminaires-form-group full">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            formSalle.description
                                        }
                                        onChange={
                                            handleChangeSalle
                                        }
                                        rows="4"
                                        placeholder="Description de la salle..."
                                    />

                                </div>

                            </div>

                            {erreur && (
                                <div className="seminaires-form-erreur">
                                    ⚠ {erreur}
                                </div>
                            )}

                            <div className="seminaires-modal-actions">

                                <button
                                    type="button"
                                    className="seminaires-btn-annuler"
                                    onClick={
                                        fermerModalSalle
                                    }
                                    disabled={
                                        enregistrement
                                    }
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="seminaires-btn-enregistrer"
                                    disabled={
                                        enregistrement
                                    }
                                >
                                    {enregistrement
                                        ? "Enregistrement..."
                                        : modeEditionSalle
                                            ? "Enregistrer les modifications"
                                            : "Créer la salle"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ============================================
                MODAL RESERVATION
            ============================================= */}

            {modalReservationOuverte && (
                <div
                    className="seminaires-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            fermerModalReservation();
                        }
                    }}
                >

                    <div className="seminaires-modal seminaires-modal-reservation">

                        <div className="seminaires-modal-header">

                            <div>

                                <span className="seminaires-modal-icon reservation">
                                    📅
                                </span>

                                <div>
                                    <h2>
                                        {modeEditionReservation
                                            ? "Modifier la réservation"
                                            : "Réserver une salle"}
                                    </h2>

                                    <p>
                                        Créez une réservation
                                        de salle de séminaire.
                                    </p>
                                </div>

                            </div>

                            <button
                                className="seminaires-modal-close"
                                onClick={
                                    fermerModalReservation
                                }
                                disabled={
                                    enregistrement
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            className="seminaires-form"
                            onSubmit={
                                enregistrerReservation
                            }
                        >

                            <div className="seminaires-form-grid">

                                {/* CLIENT */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Client *
                                    </label>

                                    <select
                                        name="id_client"
                                        value={
                                            formReservation.id_client
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                        required
                                    >

                                        <option value="">
                                            Sélectionner un client
                                        </option>

                                        <option value="__MANUEL__">
                                            ✍️ Client non enregistré
                                        </option>

                                        {clients.map(
                                            (
                                                client
                                            ) => (
                                                <option
                                                    key={
                                                        client.id_client
                                                    }
                                                    value={
                                                        client.id_client
                                                    }
                                                >
                                                    {client.prenom}{" "}
                                                    {client.nom}
                                                </option>
                                            )
                                        )}

                                    </select>

                                    {formReservation.id_client ===
                                        "__MANUEL__" && (
                                        <div
                                            className="seminaires-form-group"
                                            style={{ marginTop: "12px" }}
                                        >
                                            <label>
                                                Nom du client *
                                            </label>

                                            <input
                                                type="text"
                                                name="nom_client"
                                                value={
                                                    formReservation.nom_client
                                                }
                                                onChange={
                                                    handleChangeReservation
                                                }
                                                placeholder="Ex : Entreprise ABC / Mamadou Ndiaye"
                                                required
                                            />
                                        </div>
                                    )}

                                </div>

                                {/* SALLE */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Salle *
                                    </label>

                                    <select
                                        name="id_salle"
                                        value={
                                            formReservation.id_salle
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                        required
                                    >

                                        <option value="">
                                            Sélectionner une salle
                                        </option>

                                        {salles
                                            .filter(
                                                (
                                                    salle
                                                ) =>
                                                    salle.statut ===
                                                        "DISPONIBLE" ||
                                                    Number(
                                                        salle.id_salle
                                                    ) ===
                                                        Number(
                                                            formReservation.id_salle
                                                        )
                                            )
                                            .map(
                                                (
                                                    salle
                                                ) => (
                                                    <option
                                                        key={
                                                            salle.id_salle
                                                        }
                                                        value={
                                                            salle.id_salle
                                                        }
                                                    >
                                                        {
                                                            salle.nom
                                                        }{" "}
                                                        —{" "}
                                                        {
                                                            salle.capacite
                                                        } places
                                                    </option>
                                                )
                                            )}

                                    </select>

                                </div>

                                {/* DATES */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Date de début *
                                    </label>

                                    <input
                                        type="date"
                                        name="date_debut"
                                        value={
                                            formReservation.date_debut
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                        required
                                    />

                                </div>

                                <div className="seminaires-form-group">

                                    <label>
                                        Date de fin *
                                    </label>

                                    <input
                                        type="date"
                                        name="date_fin"
                                        value={
                                            formReservation.date_fin
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                        required
                                    />

                                </div>

                                {/* HEURES */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Heure de début
                                    </label>

                                    <input
                                        type="time"
                                        name="heure_debut"
                                        value={
                                            formReservation.heure_debut
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                    />

                                </div>

                                <div className="seminaires-form-group">

                                    <label>
                                        Heure de fin
                                    </label>

                                    <input
                                        type="time"
                                        name="heure_fin"
                                        value={
                                            formReservation.heure_fin
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                    />

                                </div>

                                {/* OBJET */}

                                <div className="seminaires-form-group full">

                                    <label>
                                        Objet du séminaire *
                                    </label>

                                    <input
                                        type="text"
                                        name="objet"
                                        value={
                                            formReservation.objet
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                        placeholder="Ex : Formation informatique"
                                        required
                                    />

                                </div>

                                {/* PARTICIPANTS */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Nombre de participants *
                                    </label>

                                    <input
                                        type="number"
                                        name="nombre_participants"
                                        min="1"
                                        value={
                                            formReservation.nombre_participants
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                        placeholder="Ex : 30"
                                        required
                                    />

                                </div>

                                {/* TYPE TARIF */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Type de tarif
                                    </label>

                                    <select
                                        name="type_tarif"
                                        value={
                                            formReservation.type_tarif
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                    >

                                        <option value="JOURNEE">
                                            Journée
                                        </option>

                                        <option value="DEMI_JOURNEE">
                                            Demi-journée
                                        </option>

                                    </select>

                                </div>

                                {/* MONTANT */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Montant total
                                    </label>

                                    <div className="seminaires-montant-calcul">

                                        <strong>
                                            {formaterMontant(
                                                montantCalcule
                                            )}
                                        </strong>

                                        <small>
                                            Calculé automatiquement
                                        </small>

                                    </div>

                                </div>

                                {/* AVANCE */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Avance
                                    </label>

                                    <div className="seminaires-input-montant">

                                        <input
                                            type="number"
                                            name="avance"
                                            min="0"
                                            step="0.01"
                                            value={
                                                formReservation.avance
                                            }
                                            onChange={
                                                handleChangeReservation
                                            }
                                            placeholder="0"
                                        />

                                        <span>
                                            FCFA
                                        </span>

                                    </div>

                                </div>

                                {/* RESTE */}

                                <div className="seminaires-form-group full">

                                    <div className="seminaires-reste-card">

                                        <div>
                                            <span>
                                                Reste à payer
                                            </span>

                                            <strong>
                                                {formaterMontant(
                                                    resteReservation
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                Total :{" "}
                                                {formaterMontant(
                                                    montantCalcule
                                                )}
                                            </small>

                                            <small>
                                                Avance :{" "}
                                                {formaterMontant(
                                                    avanceReservation
                                                )}
                                            </small>
                                        </div>

                                    </div>

                                </div>

                                {/* STATUT */}

                                <div className="seminaires-form-group">

                                    <label>
                                        Statut
                                    </label>

                                    <select
                                        name="statut"
                                        value={
                                            formReservation.statut
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                    >

                                        {STATUTS_RESERVATION.map(
                                            (
                                                statut
                                            ) => (
                                                <option
                                                    key={
                                                        statut.value
                                                    }
                                                    value={
                                                        statut.value
                                                    }
                                                >
                                                    {
                                                        statut.label
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* OBSERVATION */}

                                <div className="seminaires-form-group full">

                                    <label>
                                        Observation
                                    </label>

                                    <textarea
                                        name="observation"
                                        value={
                                            formReservation.observation
                                        }
                                        onChange={
                                            handleChangeReservation
                                        }
                                        rows="3"
                                        placeholder="Informations complémentaires..."
                                    />

                                </div>

                            </div>

                            {erreur && (
                                <div className="seminaires-form-erreur">
                                    ⚠ {erreur}
                                </div>
                            )}

                            <div className="seminaires-reservation-info">

                                <span>
                                    ℹ️
                                </span>

                                <p>
                                    Le système vérifiera automatiquement
                                    que la salle est disponible sur
                                    la période sélectionnée.
                                </p>

                            </div>

                            <div className="seminaires-modal-actions">

                                <button
                                    type="button"
                                    className="seminaires-btn-annuler"
                                    onClick={
                                        fermerModalReservation
                                    }
                                    disabled={
                                        enregistrement
                                    }
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="seminaires-btn-enregistrer reservation"
                                    disabled={
                                        enregistrement
                                    }
                                >
                                    {enregistrement
                                        ? "Enregistrement..."
                                        : modeEditionReservation
                                            ? "Enregistrer les modifications"
                                            : "Confirmer la réservation"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Seminaires;