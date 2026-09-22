import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Personnel.css";

const API_URL = "http://localhost:5000/api/employes";

const formulaireInitial = {
    matricule: "",
    nom: "",
    prenom: "",
    sexe: "",
    date_naissance: "",
    telephone: "",
    email: "",
    adresse: "",
    fonction: "",
    service: "",
    date_embauche: "",
    salaire: "",
    statut: "ACTIF",
    observation: "",
};

function Personnel() {
    const { utilisateur } = useAuth();

    const [employes, setEmployes] = useState([]);
    const [formulaire, setFormulaire] = useState(formulaireInitial);

    const [employeSelectionne, setEmployeSelectionne] = useState(null);
    const [servicesDisponibles, setServicesDisponibles] = useState([]);
    const [fonctionsDisponibles, setFonctionsDisponibles] = useState([]);

    const [recherche, setRecherche] = useState("");
    const [statutFiltre, setStatutFiltre] = useState("TOUS");
    const [serviceFiltre, setServiceFiltre] = useState("TOUS");

    const [modalOuvert, setModalOuvert] = useState(false);
    const [chargement, setChargement] = useState(false);

    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    useEffect(() => {
        chargerEmployes();
    }, []);

    useEffect(() => {
        chargerServicesEtFonctions();
    }, []);

    // =====================================================
    // CHARGER LES EMPLOYES
    // =====================================================

    const chargerEmployes = async () => {
        try {
            setChargement(true);
            setErreur("");

            const response = await fetch(API_URL);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors du chargement des employés"
                );
            }

            setEmployes(data);

        } catch (error) {
            console.error(error);
            setErreur(error.message);

        } finally {
            setChargement(false);
        }
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
    // OUVRIR AJOUT
    // =====================================================

    const ouvrirAjout = () => {
        setEmployeSelectionne(null);
        setFormulaire(formulaireInitial);
        setMessage("");
        setErreur("");
        setModalOuvert(true);
    };

    // =====================================================
    // OUVRIR MODIFICATION
    // =====================================================

    const ouvrirModification = (employe) => {
        setEmployeSelectionne(employe);

        setFormulaire({
            matricule: employe.matricule || "",
            nom: employe.nom || "",
            prenom: employe.prenom || "",
            sexe: employe.sexe || "",
            date_naissance: employe.date_naissance
                ? employe.date_naissance.substring(0, 10)
                : "",
            telephone: employe.telephone || "",
            email: employe.email || "",
            adresse: employe.adresse || "",
            fonction: employe.fonction || "",
            service: employe.service || "",
            date_embauche: employe.date_embauche
                ? employe.date_embauche.substring(0, 10)
                : "",
            salaire: employe.salaire || "",
            statut: employe.statut || "ACTIF",
            observation: employe.observation || "",
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
        setEmployeSelectionne(null);
        setFormulaire(formulaireInitial);
        setMessage("");
        setErreur("");
    };

    // =====================================================
    // ENREGISTRER
    // =====================================================

    const enregistrerEmploye = async (e) => {
        e.preventDefault();

        setMessage("");
        setErreur("");

        if (!formulaire.matricule.trim()) {
            setErreur("Le matricule est obligatoire.");
            return;
        }

        if (!formulaire.nom.trim()) {
            setErreur("Le nom est obligatoire.");
            return;
        }

        try {
            setChargement(true);

            const url = employeSelectionne
                ? `${API_URL}/${employeSelectionne.id_employe}`
                : API_URL;

            const method = employeSelectionne
                ? "PUT"
                : "POST";

            const body = {
                matricule: formulaire.matricule,
                nom: formulaire.nom,
                prenom: formulaire.prenom,
                sexe: formulaire.sexe || null,
                date_naissance:
                    formulaire.date_naissance || null,
                telephone: formulaire.telephone,
                email: formulaire.email,
                adresse: formulaire.adresse,
                fonction: formulaire.fonction,
                service: formulaire.service,
                date_embauche:
                    formulaire.date_embauche || null,
                salaire: formulaire.salaire
                    ? Number(formulaire.salaire)
                    : 0,
                statut: formulaire.statut,
                observation: formulaire.observation,

                // Utilisateur connecté
                id_utilisateur:
                    utilisateur?.id_utilisateur || null,
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
                    data.message ||
                    "Erreur lors de l'enregistrement"
                );
            }

            setMessage(
                employeSelectionne
                    ? "Employé modifié avec succès."
                    : "Employé ajouté avec succès."
            );

            await chargerEmployes();

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

    const changerStatut = async (
        employe,
        nouveauStatut
    ) => {
        const confirmation = window.confirm(
            `Voulez-vous vraiment mettre ${employe.nom} ${employe.prenom || ""} en statut ${nouveauStatut} ?`
        );

        if (!confirmation) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/${employe.id_employe}/statut`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        statut: nouveauStatut,

                        // Utilisateur connecté
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

            setMessage("Statut modifié avec succès.");

            await chargerEmployes();

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // SUPPRIMER
    // =====================================================

    const supprimerEmploye = async (employe) => {
        const confirmation = window.confirm(
            `Voulez-vous vraiment supprimer ${employe.nom} ${employe.prenom || ""} ?`
        );

        if (!confirmation) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/${employe.id_employe}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        // Utilisateur connecté
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

            setMessage("Employé supprimé avec succès.");

            await chargerEmployes();

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // SERVICES DISPONIBLES
    // =====================================================

    const services = [
        ...new Set(
            employes
                .map((employe) => employe.service)
                .filter((service) => service)
        ),
    ].sort();

    // =====================================================
    // FILTRAGE
    // =====================================================

    const employesFiltres = employes.filter((employe) => {
        const rechercheTexte = recherche.toLowerCase();

        const correspondRecherche =
            employe.matricule
                ?.toLowerCase()
                .includes(rechercheTexte) ||
            employe.nom
                ?.toLowerCase()
                .includes(rechercheTexte) ||
            employe.prenom
                ?.toLowerCase()
                .includes(rechercheTexte) ||
            employe.fonction
                ?.toLowerCase()
                .includes(rechercheTexte) ||
            employe.service
                ?.toLowerCase()
                .includes(rechercheTexte) ||
            employe.telephone
                ?.toLowerCase()
                .includes(rechercheTexte);

        const correspondStatut =
            statutFiltre === "TOUS" ||
            employe.statut === statutFiltre;

        const correspondService =
            serviceFiltre === "TOUS" ||
            employe.service === serviceFiltre;

        return (
            correspondRecherche &&
            correspondStatut &&
            correspondService
        );
    });

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const totalEmployes = employes.length;

    const employesActifs = employes.filter(
        (employe) => employe.statut === "ACTIF"
    ).length;

    const employesInactifs = employes.filter(
        (employe) => employe.statut === "INACTIF"
    ).length;

    const employesSuspendus = employes.filter(
        (employe) => employe.statut === "SUSPENDU"
    ).length;

    // =====================================================
    // FORMAT SALAIRE
    // =====================================================

    const formatSalaire = (salaire) => {
        return `${Number(
            salaire || 0
        ).toLocaleString("fr-FR")} FCFA`;
    };

    // =====================================================
    // CHARGER SERVICES ET FONCTIONS
    // =====================================================

    const chargerServicesEtFonctions = async () => {
        try {
            const [
                servicesResponse,
                fonctionsResponse
            ] = await Promise.all([
                fetch(
                    "http://localhost:5000/api/services/actifs"
                ),
                fetch(
                    "http://localhost:5000/api/fonctions/actives"
                ),
            ]);

            const servicesData =
                await servicesResponse.json();

            const fonctionsData =
                await fonctionsResponse.json();

            if (!servicesResponse.ok) {
                throw new Error(
                    servicesData.message ||
                    "Erreur lors du chargement des services"
                );
            }

            if (!fonctionsResponse.ok) {
                throw new Error(
                    fonctionsData.message ||
                    "Erreur lors du chargement des fonctions"
                );
            }

            setServicesDisponibles(servicesData);
            setFonctionsDisponibles(fonctionsData);

        } catch (error) {
            console.error(
                "Erreur chargement services/fonctions :",
                error
            );
        }
    };

    return (
        <div className="personnel-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="personnel-header">

                <div>
                    <h1>Gestion du personnel</h1>

                    <p>
                        Gestion des employés, fonctions,
                        services et statuts.
                    </p>
                </div>

                <button
                    className="btn-ajouter-employe"
                    onClick={ouvrirAjout}
                >
                    + Nouvel employé
                </button>

            </div>

            {/* =================================================
                MESSAGES
            ================================================= */}

            {message && (
                <div className="personnel-message succes">
                    ✓ {message}
                </div>
            )}

            {erreur && (
                <div className="personnel-message erreur">
                    ⚠ {erreur}
                </div>
            )}

            {/* =================================================
                STATISTIQUES
            ================================================= */}

            <div className="stats-personnel">

                <div className="personnel-stat-card">

                    <div className="personnel-stat-icon">
                        👥
                    </div>

                    <div>
                        <span>Total employés</span>
                        <strong>
                            {totalEmployes}
                        </strong>
                    </div>

                </div>

                <div className="personnel-stat-card">

                    <div className="personnel-stat-icon">
                        🟢
                    </div>

                    <div>
                        <span>Employés actifs</span>
                        <strong>
                            {employesActifs}
                        </strong>
                    </div>

                </div>

                <div className="personnel-stat-card">

                    <div className="personnel-stat-icon">
                        🟠
                    </div>

                    <div>
                        <span>Inactifs</span>
                        <strong>
                            {employesInactifs}
                        </strong>
                    </div>

                </div>

                <div className="personnel-stat-card">

                    <div className="personnel-stat-icon">
                        🔴
                    </div>

                    <div>
                        <span>Suspendus</span>
                        <strong>
                            {employesSuspendus}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                FILTRES
            ================================================= */}

            <div className="personnel-filtres">

                <div className="recherche-personnel">

                    <span>🔎</span>

                    <input
                        type="text"
                        placeholder="Rechercher par nom, matricule, fonction..."
                        value={recherche}
                        onChange={(e) =>
                            setRecherche(e.target.value)
                        }
                    />

                </div>

                <select
                    value={statutFiltre}
                    onChange={(e) =>
                        setStatutFiltre(e.target.value)
                    }
                >
                    <option value="TOUS">
                        Tous les statuts
                    </option>

                    <option value="ACTIF">
                        Actifs
                    </option>

                    <option value="INACTIF">
                        Inactifs
                    </option>

                    <option value="SUSPENDU">
                        Suspendus
                    </option>

                </select>

                <select
                    value={serviceFiltre}
                    onChange={(e) =>
                        setServiceFiltre(e.target.value)
                    }
                >
                    <option value="TOUS">
                        Tous les services
                    </option>

                    {services.map((service) => (
                        <option
                            key={service}
                            value={service}
                        >
                            {service}
                        </option>
                    ))}

                </select>

            </div>

            {/* =================================================
                TABLEAU
            ================================================= */}

            <div className="tableau-personnel">

                <div className="tableau-personnel-header">

                    <div>

                        <h2>Liste du personnel</h2>

                        <span>
                            {employesFiltres.length}
                            {" "}employé(s)
                        </span>

                    </div>

                </div>

                {chargement &&
                employes.length === 0 ? (

                    <div className="personnel-chargement">
                        Chargement du personnel...
                    </div>

                ) : employesFiltres.length === 0 ? (

                    <div className="personnel-vide">
                        Aucun employé trouvé.
                    </div>

                ) : (

                    <div className="personnel-table-responsive">

                        <table>

                            <thead>

                                <tr>
                                    <th>Employé</th>
                                    <th>Matricule</th>
                                    <th>Fonction</th>
                                    <th>Service</th>
                                    <th>Téléphone</th>
                                    <th>Date embauche</th>
                                    <th>Salaire</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {employesFiltres.map(
                                    (employe) => (

                                        <tr
                                            key={
                                                employe.id_employe
                                            }
                                        >

                                            <td>

                                                <div className="employe-cell">

                                                    <div className="avatar-employe">
                                                        {employe.nom
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {employe.nom}{" "}
                                                            {employe.prenom || ""}
                                                        </strong>

                                                        <small>
                                                            ID #
                                                            {
                                                                employe.id_employe
                                                            }
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                <span className="badge-matricule">
                                                    {
                                                        employe.matricule
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    employe.fonction ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    employe.service ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    employe.telephone ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {employe.date_embauche
                                                    ? new Date(
                                                        employe.date_embauche
                                                    ).toLocaleDateString(
                                                        "fr-FR"
                                                    )
                                                    : "—"}
                                            </td>

                                            <td>
                                                <strong className="salaire-cell">
                                                    {formatSalaire(
                                                        employe.salaire
                                                    )}
                                                </strong>
                                            </td>

                                            <td>

                                                <span
                                                    className={`badge-statut-personnel statut-${employe.statut?.toLowerCase()}`}
                                                >
                                                    {
                                                        employe.statut
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="actions-personnel">

                                                    <button
                                                        className="btn-personnel-action modifier"
                                                        title="Modifier"
                                                        onClick={() =>
                                                            ouvrirModification(
                                                                employe
                                                            )
                                                        }
                                                    >
                                                        ✏️
                                                    </button>

                                                    {employe.statut !==
                                                        "ACTIF" && (

                                                        <button
                                                            className="btn-personnel-action activer"
                                                            title="Activer"
                                                            onClick={() =>
                                                                changerStatut(
                                                                    employe,
                                                                    "ACTIF"
                                                                )
                                                            }
                                                        >
                                                            ✓
                                                        </button>

                                                    )}

                                                    {employe.statut ===
                                                        "ACTIF" && (

                                                        <button
                                                            className="btn-personnel-action suspendre"
                                                            title="Suspendre"
                                                            onClick={() =>
                                                                changerStatut(
                                                                    employe,
                                                                    "SUSPENDU"
                                                                )
                                                            }
                                                        >
                                                            ⏸
                                                        </button>

                                                    )}

                                                    <button
                                                        className="btn-personnel-action supprimer"
                                                        title="Supprimer"
                                                        onClick={() =>
                                                            supprimerEmploye(
                                                                employe
                                                            )
                                                        }
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

            {/* =================================================
                MODAL
            ================================================= */}

            {modalOuvert && (

                <div
                    className="personnel-modal-overlay"
                    onClick={fermerModal}
                >

                    <div
                        className="personnel-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="personnel-modal-header">

                            <div>

                                <h2>
                                    {employeSelectionne
                                        ? "Modifier l'employé"
                                        : "Nouvel employé"}
                                </h2>

                                <p>
                                    {employeSelectionne
                                        ? "Modifiez les informations de l'employé."
                                        : "Enregistrez un nouvel employé dans le système."}
                                </p>

                            </div>

                            <button
                                className="personnel-modal-close"
                                onClick={fermerModal}
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={enregistrerEmploye}
                        >

                            <div className="personnel-form-grid">

                                <div className="personnel-form-group">

                                    <label>
                                        Matricule *
                                    </label>

                                    <input
                                        type="text"
                                        name="matricule"
                                        value={
                                            formulaire.matricule
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex : EMP-001"
                                        required
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Nom *
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
                                        placeholder="Ex : Ndiaye"
                                        required
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Prénom
                                    </label>

                                    <input
                                        type="text"
                                        name="prenom"
                                        value={
                                            formulaire.prenom
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex : Amadou"
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Sexe
                                    </label>

                                    <select
                                        name="sexe"
                                        value={
                                            formulaire.sexe
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="">
                                            Sélectionner
                                        </option>

                                        <option value="M">
                                            Homme
                                        </option>

                                        <option value="F">
                                            Femme
                                        </option>

                                        <option value="AUTRE">
                                            Autre
                                        </option>

                                    </select>

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Date de naissance
                                    </label>

                                    <input
                                        type="date"
                                        name="date_naissance"
                                        value={
                                            formulaire.date_naissance
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Téléphone
                                    </label>

                                    <input
                                        type="text"
                                        name="telephone"
                                        value={
                                            formulaire.telephone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex : 77 000 00 00"
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            formulaire.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="employe@ngalanka.sn"
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Adresse
                                    </label>

                                    <input
                                        type="text"
                                        name="adresse"
                                        value={
                                            formulaire.adresse
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Adresse"
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Fonction
                                    </label>

                                    <select
                                        name="fonction"
                                        value={
                                            formulaire.fonction || ""
                                        }
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Sélectionner une fonction
                                        </option>

                                        {fonctionsDisponibles.map(
                                            (fonction) => (

                                                <option
                                                    key={
                                                        fonction.id_fonction
                                                    }
                                                    value={
                                                        fonction.nom_fonction
                                                    }
                                                >
                                                    {
                                                        fonction.nom_fonction
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Service
                                    </label>

                                    <select
                                        name="service"
                                        value={
                                            formulaire.service || ""
                                        }
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Sélectionner un service
                                        </option>

                                        {servicesDisponibles.map(
                                            (service) => (

                                                <option
                                                    key={
                                                        service.id_service
                                                    }
                                                    value={
                                                        service.nom_service
                                                    }
                                                >
                                                    {
                                                        service.nom_service
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Date d'embauche
                                    </label>

                                    <input
                                        type="date"
                                        name="date_embauche"
                                        value={
                                            formulaire.date_embauche
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                                <div className="personnel-form-group">

                                    <label>
                                        Salaire
                                    </label>

                                    <div className="salaire-input">

                                        <input
                                            type="number"
                                            name="salaire"
                                            value={
                                                formulaire.salaire
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                        />

                                        <span>
                                            FCFA
                                        </span>

                                    </div>

                                </div>

                                <div className="personnel-form-group full-width">

                                    <label>
                                        Observation
                                    </label>

                                    <textarea
                                        name="observation"
                                        value={
                                            formulaire.observation
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Informations complémentaires..."
                                        rows="4"
                                    />

                                </div>

                            </div>

                            <div className="personnel-modal-actions">

                                <button
                                    type="button"
                                    className="btn-personnel-annuler"
                                    onClick={fermerModal}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn-personnel-enregistrer"
                                    disabled={chargement}
                                >
                                    {chargement
                                        ? "Enregistrement..."
                                        : employeSelectionne
                                        ? "Enregistrer les modifications"
                                        : "Ajouter l'employé"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Personnel;