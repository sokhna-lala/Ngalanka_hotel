import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Utilisateurs.css";

const API_URL = "http://localhost:5000/api/utilisateurs";

const initialForm = {
    nom_utilisateur: "",
    mot_de_passe: "",
    nom_complet: "",
    id_role: "",
    telephone: "",
    email: "",
};

function Utilisateurs() {
    const { utilisateur } = useAuth();

    const [utilisateurs, setUtilisateurs] = useState([]);
    const [roles, setRoles] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);

    const [recherche, setRecherche] = useState("");
    const [statutFiltre, setStatutFiltre] = useState("TOUS");

    const [chargement, setChargement] = useState(false);
    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    const [modalOuvert, setModalOuvert] = useState(false);

    useEffect(() => {
        chargerUtilisateurs();
        chargerRoles();
    }, []);

    // =====================================================
    // CHARGER LES UTILISATEURS
    // =====================================================

    const chargerUtilisateurs = async () => {
        try {
            setChargement(true);

            const response = await fetch(API_URL);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Erreur lors du chargement"
                );
            }

            setUtilisateurs(data);

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        } finally {
            setChargement(false);
        }
    };

    // =====================================================
    // CHARGER LES RÔLES
    // =====================================================

    const chargerRoles = async () => {
        try {
            const response = await fetch(`${API_URL}/roles`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors du chargement des rôles"
                );
            }

            setRoles(data);

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // OUVRIR AJOUT
    // =====================================================

    const ouvrirAjout = () => {
        setUtilisateurSelectionne(null);
        setForm(initialForm);
        setMessage("");
        setErreur("");
        setModalOuvert(true);
    };

    // =====================================================
    // OUVRIR MODIFICATION
    // =====================================================

    const ouvrirModification = (utilisateur) => {
        setUtilisateurSelectionne(utilisateur);

        setForm({
            nom_utilisateur: utilisateur.nom_utilisateur || "",
            mot_de_passe: "",
            nom_complet: utilisateur.nom_complet || "",
            id_role: utilisateur.id_role || "",
            telephone: utilisateur.telephone || "",
            email: utilisateur.email || "",
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
        setUtilisateurSelectionne(null);
        setForm(initialForm);
    };

    // =====================================================
    // GESTION FORMULAIRE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((ancien) => ({
            ...ancien,
            [name]: value,
        }));
    };

    // =====================================================
    // CRÉER / MODIFIER UN UTILISATEUR
    // =====================================================

    const enregistrerUtilisateur = async (e) => {
        e.preventDefault();

        setMessage("");
        setErreur("");

        if (!form.nom_utilisateur.trim()) {
            setErreur("Le nom d'utilisateur est obligatoire.");
            return;
        }

        if (!form.nom_complet.trim()) {
            setErreur("Le nom complet est obligatoire.");
            return;
        }

        if (!form.id_role) {
            setErreur("Veuillez sélectionner un rôle.");
            return;
        }

        if (!utilisateurSelectionne && !form.mot_de_passe) {
            setErreur("Le mot de passe est obligatoire.");
            return;
        }

        try {
            setChargement(true);

            const url = utilisateurSelectionne
                ? `${API_URL}/${utilisateurSelectionne.id_utilisateur}`
                : API_URL;

            const method = utilisateurSelectionne
                ? "PUT"
                : "POST";

            const body = {
                nom_utilisateur: form.nom_utilisateur,
                nom_complet: form.nom_complet,
                id_role: Number(form.id_role),
                telephone: form.telephone,
                email: form.email,

                // Utilisateur actuellement connecté
                id_utilisateur: utilisateur?.id_utilisateur || null,
            };

            if (form.mot_de_passe.trim()) {
                body.mot_de_passe = form.mot_de_passe;
            }

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
                utilisateurSelectionne
                    ? "Utilisateur modifié avec succès."
                    : "Utilisateur créé avec succès."
            );

            await chargerUtilisateurs();

            setTimeout(() => {
                fermerModal();
            }, 800);

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
        utilisateurCible,
        nouveauStatut
    ) => {
        const confirmation = window.confirm(
            `Voulez-vous vraiment mettre "${utilisateurCible.nom_complet}" en statut ${nouveauStatut} ?`
        );

        if (!confirmation) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/${utilisateurCible.id_utilisateur}/statut`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        statut: nouveauStatut,

                        // Utilisateur actuellement connecté
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

            await chargerUtilisateurs();

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // SUPPRIMER UTILISATEUR
    // =====================================================

    const supprimerUtilisateur = async (
        utilisateurCible
    ) => {
        const confirmation = window.confirm(
            `Voulez-vous vraiment supprimer l'utilisateur "${utilisateurCible.nom_utilisateur}" ?`
        );

        if (!confirmation) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/${utilisateurCible.id_utilisateur}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        // Utilisateur actuellement connecté
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

            setMessage("Utilisateur supprimé avec succès.");

            await chargerUtilisateurs();

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // FILTRES
    // =====================================================

    const utilisateursFiltres = utilisateurs.filter(
        (utilisateur) => {
            const texte = recherche.toLowerCase();

            const correspondRecherche =
                utilisateur.nom_utilisateur
                    ?.toLowerCase()
                    .includes(texte) ||
                utilisateur.nom_complet
                    ?.toLowerCase()
                    .includes(texte) ||
                utilisateur.nom_role
                    ?.toLowerCase()
                    .includes(texte) ||
                utilisateur.email
                    ?.toLowerCase()
                    .includes(texte);

            const correspondStatut =
                statutFiltre === "TOUS" ||
                utilisateur.statut === statutFiltre;

            return (
                correspondRecherche &&
                correspondStatut
            );
        }
    );

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const totalUtilisateurs = utilisateurs.length;

    const utilisateursActifs = utilisateurs.filter(
        (u) => u.statut === "ACTIF"
    ).length;

    const utilisateursInactifs = utilisateurs.filter(
        (u) => u.statut === "INACTIF"
    ).length;

    const utilisateursBloques = utilisateurs.filter(
        (u) => u.statut === "BLOQUE"
    ).length;

    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (
        <div className="utilisateurs-page">

            <div className="utilisateurs-header">
                <div>
                    <h1>Gestion des utilisateurs</h1>

                    <p>
                        Administration des comptes, rôles
                        et accès au système.
                    </p>
                </div>

                <button
                    className="btn-ajouter-utilisateur"
                    onClick={ouvrirAjout}
                >
                    + Nouvel utilisateur
                </button>
            </div>

            {message && (
                <div className="message-succes">
                    ✓ {message}
                </div>
            )}

            {erreur && (
                <div className="message-erreur">
                    ⚠ {erreur}
                </div>
            )}

            <div className="stats-utilisateurs">

                <div className="stat-card">
                    <div className="stat-icon">👥</div>

                    <div>
                        <span>Total utilisateurs</span>
                        <strong>
                            {totalUtilisateurs}
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🟢</div>

                    <div>
                        <span>Actifs</span>
                        <strong>
                            {utilisateursActifs}
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🟠</div>

                    <div>
                        <span>Inactifs</span>
                        <strong>
                            {utilisateursInactifs}
                        </strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🔴</div>

                    <div>
                        <span>Bloqués</span>
                        <strong>
                            {utilisateursBloques}
                        </strong>
                    </div>
                </div>

            </div>

            <div className="utilisateurs-filtres">

                <div className="recherche-utilisateur">
                    <span>🔎</span>

                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
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

                    <option value="BLOQUE">
                        Bloqués
                    </option>
                </select>

            </div>

            <div className="tableau-utilisateurs">

                <div className="tableau-titre">

                    <div>
                        <h2>Utilisateurs</h2>

                        <span>
                            {utilisateursFiltres.length}
                            {" "}utilisateur(s)
                        </span>
                    </div>

                </div>

                {chargement &&
                utilisateurs.length === 0 ? (
                    <div className="chargement">
                        Chargement des utilisateurs...
                    </div>

                ) : utilisateursFiltres.length === 0 ? (

                    <div className="aucun-resultat">
                        Aucun utilisateur trouvé.
                    </div>

                ) : (

                    <div className="table-responsive">

                        <table>

                            <thead>

                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Nom complet</th>
                                    <th>Rôle</th>
                                    <th>Téléphone</th>
                                    <th>Email</th>
                                    <th>Statut</th>
                                    <th>Dernière connexion</th>
                                    <th>Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {utilisateursFiltres.map(
                                    (utilisateurLigne) => (

                                        <tr
                                            key={
                                                utilisateurLigne.id_utilisateur
                                            }
                                        >

                                            <td>

                                                <div className="cell-utilisateur">

                                                    <div className="avatar-utilisateur">
                                                        {utilisateurLigne.nom_complet
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                utilisateurLigne.nom_utilisateur
                                                            }
                                                        </strong>

                                                        <small>
                                                            ID #
                                                            {
                                                                utilisateurLigne.id_utilisateur
                                                            }
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                {
                                                    utilisateurLigne.nom_complet
                                                }
                                            </td>

                                            <td>
                                                <span className="badge-role">
                                                    {
                                                        utilisateurLigne.nom_role
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    utilisateurLigne.telephone ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    utilisateurLigne.email ||
                                                    "—"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={`badge-statut statut-${utilisateurLigne.statut?.toLowerCase()}`}
                                                >
                                                    {
                                                        utilisateurLigne.statut
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    utilisateurLigne.derniere_connexion
                                                        ? new Date(
                                                            utilisateurLigne.derniere_connexion
                                                        ).toLocaleString(
                                                            "fr-FR"
                                                        )
                                                        : "Jamais"
                                                }
                                            </td>

                                            <td>

                                                <div className="actions-utilisateur">

                                                    <button
                                                        className="btn-action modifier"
                                                        title="Modifier"
                                                        onClick={() =>
                                                            ouvrirModification(
                                                                utilisateurLigne
                                                            )
                                                        }
                                                    >
                                                        ✏️
                                                    </button>

                                                    {utilisateurLigne.statut !==
                                                        "ACTIF" && (
                                                        <button
                                                            className="btn-action activer"
                                                            title="Activer"
                                                            onClick={() =>
                                                                changerStatut(
                                                                    utilisateurLigne,
                                                                    "ACTIF"
                                                                )
                                                            }
                                                        >
                                                            ✓
                                                        </button>
                                                    )}

                                                    {utilisateurLigne.statut ===
                                                        "ACTIF" && (
                                                        <button
                                                            className="btn-action desactiver"
                                                            title="Désactiver"
                                                            onClick={() =>
                                                                changerStatut(
                                                                    utilisateurLigne,
                                                                    "INACTIF"
                                                                )
                                                            }
                                                        >
                                                            ⏸
                                                        </button>
                                                    )}

                                                    {utilisateurLigne.statut !==
                                                        "BLOQUE" && (
                                                        <button
                                                            className="btn-action bloquer"
                                                            title="Bloquer"
                                                            onClick={() =>
                                                                changerStatut(
                                                                    utilisateurLigne,
                                                                    "BLOQUE"
                                                                )
                                                            }
                                                        >
                                                            🔒
                                                        </button>
                                                    )}

                                                    <button
                                                        className="btn-action supprimer"
                                                        title="Supprimer"
                                                        onClick={() =>
                                                            supprimerUtilisateur(
                                                                utilisateurLigne
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

            {modalOuvert && (

                <div
                    className="modal-overlay"
                    onClick={fermerModal}
                >

                    <div
                        className="modal-utilisateur"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    {utilisateurSelectionne
                                        ? "Modifier l'utilisateur"
                                        : "Nouvel utilisateur"}
                                </h2>

                                <p>
                                    {utilisateurSelectionne
                                        ? "Modifiez les informations du compte."
                                        : "Créez un nouveau compte utilisateur."}
                                </p>

                            </div>

                            <button
                                className="btn-fermer-modal"
                                onClick={fermerModal}
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={enregistrerUtilisateur}
                        >

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Nom d'utilisateur *
                                    </label>

                                    <input
                                        type="text"
                                        name="nom_utilisateur"
                                        value={
                                            form.nom_utilisateur
                                        }
                                        onChange={handleChange}
                                        placeholder="Ex : reception2"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Nom complet *
                                    </label>

                                    <input
                                        type="text"
                                        name="nom_complet"
                                        value={
                                            form.nom_complet
                                        }
                                        onChange={handleChange}
                                        placeholder="Ex : Abdoulaye Ba"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Rôle *
                                    </label>

                                    <select
                                        name="id_role"
                                        value={form.id_role}
                                        onChange={handleChange}
                                        required
                                    >

                                        <option value="">
                                            Sélectionner un rôle
                                        </option>

                                        {roles.map((role) => (

                                            <option
                                                key={role.id_role}
                                                value={role.id_role}
                                            >
                                                {role.nom_role}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Mot de passe{" "}
                                        {!utilisateurSelectionne &&
                                            "*"}
                                    </label>

                                    <input
                                        type="password"
                                        name="mot_de_passe"
                                        value={
                                            form.mot_de_passe
                                        }
                                        onChange={handleChange}
                                        placeholder={
                                            utilisateurSelectionne
                                                ? "Laisser vide pour conserver"
                                                : "Minimum 6 caractères"
                                        }
                                        required={
                                            !utilisateurSelectionne
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Téléphone
                                    </label>

                                    <input
                                        type="text"
                                        name="telephone"
                                        value={
                                            form.telephone
                                        }
                                        onChange={handleChange}
                                        placeholder="Ex : 77 000 00 00"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            form.email
                                        }
                                        onChange={handleChange}
                                        placeholder="Ex : utilisateur@ngalanka.sn"
                                    />

                                </div>

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-annuler"
                                    onClick={fermerModal}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn-enregistrer"
                                    disabled={chargement}
                                >
                                    {chargement
                                        ? "Enregistrement..."
                                        : utilisateurSelectionne
                                        ? "Enregistrer les modifications"
                                        : "Créer l'utilisateur"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Utilisateurs;