import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./ServicesFonctions.css";

const SERVICES_API = "http://localhost:5000/api/services";
const FONCTIONS_API = "http://localhost:5000/api/fonctions";

const formulaireInitial = {
    nom: "",
    description: "",
};

function ServicesFonctions() {
    const { utilisateur } = useAuth();

    const [services, setServices] = useState([]);
    const [fonctions, setFonctions] = useState([]);

    const [rechercheService, setRechercheService] = useState("");
    const [rechercheFonction, setRechercheFonction] = useState("");

    const [modalOuvert, setModalOuvert] = useState(false);
    const [typeModal, setTypeModal] = useState("");
    const [elementSelectionne, setElementSelectionne] = useState(null);

    const [formulaire, setFormulaire] = useState(formulaireInitial);

    const [chargement, setChargement] = useState(false);
    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    useEffect(() => {
        chargerServices();
        chargerFonctions();
    }, []);

    // =====================================================
    // SERVICES
    // =====================================================

    const chargerServices = async () => {
        try {
            const response = await fetch(SERVICES_API);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Erreur lors du chargement des services"
                );
            }

            setServices(data);
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // FONCTIONS
    // =====================================================

    const chargerFonctions = async () => {
        try {
            const response = await fetch(FONCTIONS_API);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Erreur lors du chargement des fonctions"
                );
            }

            setFonctions(data);
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // OUVRIR AJOUT
    // =====================================================

    const ouvrirAjout = (type) => {
        setTypeModal(type);
        setElementSelectionne(null);
        setFormulaire(formulaireInitial);
        setMessage("");
        setErreur("");
        setModalOuvert(true);
    };

    // =====================================================
    // OUVRIR MODIFICATION
    // =====================================================

    const ouvrirModification = (type, element) => {
        setTypeModal(type);
        setElementSelectionne(element);

        setFormulaire({
            nom:
                type === "service"
                    ? element.nom_service || ""
                    : element.nom_fonction || "",
            description: element.description || "",
        });

        setMessage("");
        setErreur("");
        setModalOuvert(true);
    };

    // =====================================================
    // FERMER MODAL
    // =====================================================

    const fermerModal = () => {
        setModalOuvert(false);
        setTypeModal("");
        setElementSelectionne(null);
        setFormulaire(formulaireInitial);
        setMessage("");
        setErreur("");
    };

    // =====================================================
    // CHANGEMENT FORMULAIRE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire((ancien) => ({
            ...ancien,
            [name]: value,
        }));
    };

    // =====================================================
    // ENREGISTRER
    // =====================================================

    const enregistrer = async (e) => {
        e.preventDefault();

        setMessage("");
        setErreur("");

        if (!formulaire.nom.trim()) {
            setErreur(
                `Le nom ${
                    typeModal === "service"
                        ? "du service"
                        : "de la fonction"
                } est obligatoire.`
            );
            return;
        }

        try {
            setChargement(true);

            const api =
                typeModal === "service"
                    ? SERVICES_API
                    : FONCTIONS_API;

            const nomChamp =
                typeModal === "service"
                    ? "nom_service"
                    : "nom_fonction";

            const url = elementSelectionne
                ? `${api}/${
                      typeModal === "service"
                          ? elementSelectionne.id_service
                          : elementSelectionne.id_fonction
                  }`
                : api;

            const method = elementSelectionne ? "PUT" : "POST";

            const body = {
                [nomChamp]: formulaire.nom,
                description: formulaire.description,
                id_utilisateur: utilisateur?.id_utilisateur || null,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Erreur lors de l'enregistrement"
                );
            }

            setMessage(
                elementSelectionne
                    ? `${
                          typeModal === "service"
                              ? "Service"
                              : "Fonction"
                      } modifié avec succès.`
                    : `${
                          typeModal === "service"
                              ? "Service"
                              : "Fonction"
                      } créé avec succès.`
            );

            if (typeModal === "service") {
                await chargerServices();
            } else {
                await chargerFonctions();
            }

            setTimeout(() => {
                fermerModal();
            }, 700);
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        } finally {
            setChargement(false);
        }
    };

    // =====================================================
    // CHANGER STATUT
    // =====================================================

    const changerStatut = async (type, element, nouveauStatut) => {
        const nom =
            type === "service"
                ? element.nom_service
                : element.nom_fonction;

        const confirmation = window.confirm(
            `Voulez-vous vraiment ${
                nouveauStatut === "ACTIF"
                    ? "activer"
                    : "désactiver"
            } "${nom}" ?`
        );

        if (!confirmation) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const api =
                type === "service"
                    ? SERVICES_API
                    : FONCTIONS_API;

            const id =
                type === "service"
                    ? element.id_service
                    : element.id_fonction;

            const response = await fetch(
                `${api}/${id}/statut`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        statut: nouveauStatut,
                        id_utilisateur:
                            utilisateur?.id_utilisateur || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Erreur lors du changement de statut"
                );
            }

            setMessage(
                `${
                    type === "service"
                        ? "Service"
                        : "Fonction"
                } ${
                    nouveauStatut === "ACTIF"
                        ? "activé"
                        : "désactivé"
                } avec succès.`
            );

            if (type === "service") {
                await chargerServices();
            } else {
                await chargerFonctions();
            }
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // SUPPRIMER
    // =====================================================

    const supprimer = async (type, element) => {
        const nom =
            type === "service"
                ? element.nom_service
                : element.nom_fonction;

        const confirmation = window.confirm(
            `Voulez-vous vraiment supprimer "${nom}" ?`
        );

        if (!confirmation) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const api =
                type === "service"
                    ? SERVICES_API
                    : FONCTIONS_API;

            const id =
                type === "service"
                    ? element.id_service
                    : element.id_fonction;

            const response = await fetch(
                `${api}/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id_utilisateur:
                            utilisateur?.id_utilisateur || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Erreur lors de la suppression"
                );
            }

            setMessage(
                `${
                    type === "service"
                        ? "Service"
                        : "Fonction"
                } supprimé avec succès.`
            );

            if (type === "service") {
                await chargerServices();
            } else {
                await chargerFonctions();
            }
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // FILTRES
    // =====================================================

    const servicesFiltres = services.filter((service) =>
        `${service.nom_service} ${service.description || ""}`
            .toLowerCase()
            .includes(rechercheService.toLowerCase())
    );

    const fonctionsFiltrees = fonctions.filter((fonction) =>
        `${fonction.nom_fonction} ${fonction.description || ""}`
            .toLowerCase()
            .includes(rechercheFonction.toLowerCase())
    );

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const servicesActifs = services.filter(
        (service) => service.statut === "ACTIF"
    ).length;

    const fonctionsActives = fonctions.filter(
        (fonction) => fonction.statut === "ACTIF"
    ).length;

    return (
        <div className="services-fonctions-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="sf-header">

                <div>
                    <h1>Services & Fonctions</h1>

                    <p>
                        Gérez les services et les fonctions du personnel.
                    </p>
                </div>

            </div>

            {/* =================================================
                MESSAGES
            ================================================= */}

            {message && (
                <div className="sf-message succes">
                    ✓ {message}
                </div>
            )}

            {erreur && (
                <div className="sf-message erreur">
                    ⚠ {erreur}
                </div>
            )}

            {/* =================================================
                STATISTIQUES
            ================================================= */}

            <div className="sf-stats">

                <div className="sf-stat-card">

                    <div className="sf-stat-icon">
                        🏢
                    </div>

                    <div>
                        <span>Total services</span>
                        <strong>{services.length}</strong>
                        <small>
                            {servicesActifs} actif(s)
                        </small>
                    </div>

                </div>

                <div className="sf-stat-card">

                    <div className="sf-stat-icon">
                        💼
                    </div>

                    <div>
                        <span>Total fonctions</span>
                        <strong>{fonctions.length}</strong>
                        <small>
                            {fonctionsActives} active(s)
                        </small>
                    </div>

                </div>

            </div>

            {/* =================================================
                CONTENU
            ================================================= */}

            <div className="sf-columns">

                {/* =================================================
                    SERVICES
                ================================================= */}

                <section className="sf-card">

                    <div className="sf-card-header">

                        <div>
                            <h2>🏢 Services</h2>

                            <span>
                                {servicesFiltres.length} service(s)
                            </span>
                        </div>

                        <button
                            className="sf-btn-ajouter"
                            onClick={() =>
                                ouvrirAjout("service")
                            }
                        >
                            + Ajouter
                        </button>

                    </div>

                    <div className="sf-recherche">

                        <span>🔎</span>

                        <input
                            type="text"
                            placeholder="Rechercher un service..."
                            value={rechercheService}
                            onChange={(e) =>
                                setRechercheService(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div className="sf-liste">

                        {servicesFiltres.length === 0 ? (
                            <div className="sf-vide">
                                Aucun service trouvé.
                            </div>
                        ) : (
                            servicesFiltres.map((service) => (

                                <div
                                    className="sf-element"
                                    key={service.id_service}
                                >

                                    <div className="sf-element-icon">
                                        🏢
                                    </div>

                                    <div className="sf-element-info">

                                        <strong>
                                            {service.nom_service}
                                        </strong>

                                        <span>
                                            {service.description ||
                                                "Aucune description"}
                                        </span>

                                        <small
                                            className={
                                                service.statut ===
                                                "ACTIF"
                                                    ? "sf-actif"
                                                    : "sf-inactif"
                                            }
                                        >
                                            ● {service.statut}
                                        </small>

                                    </div>

                                    <div className="sf-actions">

                                        <button
                                            title="Modifier"
                                            onClick={() =>
                                                ouvrirModification(
                                                    "service",
                                                    service
                                                )
                                            }
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            title={
                                                service.statut ===
                                                "ACTIF"
                                                    ? "Désactiver"
                                                    : "Activer"
                                            }
                                            onClick={() =>
                                                changerStatut(
                                                    "service",
                                                    service,
                                                    service.statut ===
                                                        "ACTIF"
                                                        ? "INACTIF"
                                                        : "ACTIF"
                                                )
                                            }
                                        >
                                            {service.statut ===
                                            "ACTIF"
                                                ? "⏸"
                                                : "▶️"}
                                        </button>

                                        <button
                                            className="sf-action-delete"
                                            title="Supprimer"
                                            onClick={() =>
                                                supprimer(
                                                    "service",
                                                    service
                                                )
                                            }
                                        >
                                            🗑️
                                        </button>

                                    </div>

                                </div>

                            ))
                        )}

                    </div>

                </section>

                {/* =================================================
                    FONCTIONS
                ================================================= */}

                <section className="sf-card">

                    <div className="sf-card-header">

                        <div>
                            <h2>💼 Fonctions</h2>

                            <span>
                                {fonctionsFiltrees.length} fonction(s)
                            </span>
                        </div>

                        <button
                            className="sf-btn-ajouter"
                            onClick={() =>
                                ouvrirAjout("fonction")
                            }
                        >
                            + Ajouter
                        </button>

                    </div>

                    <div className="sf-recherche">

                        <span>🔎</span>

                        <input
                            type="text"
                            placeholder="Rechercher une fonction..."
                            value={rechercheFonction}
                            onChange={(e) =>
                                setRechercheFonction(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div className="sf-liste">

                        {fonctionsFiltrees.length === 0 ? (
                            <div className="sf-vide">
                                Aucune fonction trouvée.
                            </div>
                        ) : (
                            fonctionsFiltrees.map((fonction) => (

                                <div
                                    className="sf-element"
                                    key={fonction.id_fonction}
                                >

                                    <div className="sf-element-icon">
                                        💼
                                    </div>

                                    <div className="sf-element-info">

                                        <strong>
                                            {fonction.nom_fonction}
                                        </strong>

                                        <span>
                                            {fonction.description ||
                                                "Aucune description"}
                                        </span>

                                        <small
                                            className={
                                                fonction.statut ===
                                                "ACTIF"
                                                    ? "sf-actif"
                                                    : "sf-inactif"
                                            }
                                        >
                                            ● {fonction.statut}
                                        </small>

                                    </div>

                                    <div className="sf-actions">

                                        <button
                                            title="Modifier"
                                            onClick={() =>
                                                ouvrirModification(
                                                    "fonction",
                                                    fonction
                                                )
                                            }
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            title={
                                                fonction.statut ===
                                                "ACTIF"
                                                    ? "Désactiver"
                                                    : "Activer"
                                            }
                                            onClick={() =>
                                                changerStatut(
                                                    "fonction",
                                                    fonction,
                                                    fonction.statut ===
                                                        "ACTIF"
                                                        ? "INACTIF"
                                                        : "ACTIF"
                                                )
                                            }
                                        >
                                            {fonction.statut ===
                                            "ACTIF"
                                                ? "⏸"
                                                : "▶️"}
                                        </button>

                                        <button
                                            className="sf-action-delete"
                                            title="Supprimer"
                                            onClick={() =>
                                                supprimer(
                                                    "fonction",
                                                    fonction
                                                )
                                            }
                                        >
                                            🗑️
                                        </button>

                                    </div>

                                </div>

                            ))
                        )}

                    </div>

                </section>

            </div>

            {/* =================================================
                MODAL
            ================================================= */}

            {modalOuvert && (

                <div
                    className="sf-modal-overlay"
                    onClick={fermerModal}
                >

                    <div
                        className="sf-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="sf-modal-header">

                            <div>

                                <h2>
                                    {elementSelectionne
                                        ? `Modifier ${
                                              typeModal ===
                                              "service"
                                                  ? "le service"
                                                  : "la fonction"
                                          }`
                                        : `Ajouter ${
                                              typeModal ===
                                              "service"
                                                  ? "un service"
                                                  : "une fonction"
                                          }`}
                                </h2>

                                <p>
                                    Renseignez les informations
                                    ci-dessous.
                                </p>

                            </div>

                            <button
                                className="sf-modal-close"
                                onClick={fermerModal}
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={enregistrer}>

                            <div className="sf-form-group">

                                <label>
                                    {typeModal ===
                                    "service"
                                        ? "Nom du service"
                                        : "Nom de la fonction"}{" "}
                                    *
                                </label>

                                <input
                                    type="text"
                                    name="nom"
                                    value={
                                        formulaire.nom
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder={
                                        typeModal ===
                                        "service"
                                            ? "Ex : Réception"
                                            : "Ex : Réceptionniste"
                                    }
                                    required
                                />

                            </div>

                            <div className="sf-form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={
                                        formulaire.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Description..."
                                    rows="4"
                                />

                            </div>

                            <div className="sf-modal-actions">

                                <button
                                    type="button"
                                    className="sf-btn-annuler"
                                    onClick={fermerModal}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="sf-btn-enregistrer"
                                    disabled={chargement}
                                >
                                    {chargement
                                        ? "Enregistrement..."
                                        : elementSelectionne
                                        ? "Enregistrer les modifications"
                                        : "Ajouter"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ServicesFonctions;