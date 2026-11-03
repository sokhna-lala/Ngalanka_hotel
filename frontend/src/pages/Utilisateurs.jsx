import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Utilisateurs.css";

const API_URL = "http://localhost:5000/api/utilisateurs";

const initialForm = {
    id_employe: "",
    nom_utilisateur: "",
    mot_de_passe: "",
    id_role: "",
};

function Utilisateurs() {
    const { utilisateur } = useAuth();

    const [utilisateurs, setUtilisateurs] = useState([]);
    const [roles, setRoles] = useState([]);
    const [personnel, setPersonnel] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);

    const [recherche, setRecherche] = useState("");
    const [statutFiltre, setStatutFiltre] = useState("TOUS");

    const [chargement, setChargement] = useState(false);
    const [chargementPersonnel, setChargementPersonnel] = useState(false);

    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    const [modalOuvert, setModalOuvert] = useState(false);

    // =====================================================
    // CHARGEMENT INITIAL
    // =====================================================

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
    // CHARGER LE PERSONNEL DISPONIBLE
    // =====================================================

    const chargerPersonnel = async (idUtilisateur = null) => {
        try {
            setChargementPersonnel(true);

            let url = `${API_URL}/personnel`;

            if (idUtilisateur) {
                url += `?id_utilisateur=${idUtilisateur}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors du chargement du personnel"
                );
            }

            setPersonnel(data);

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        } finally {
            setChargementPersonnel(false);
        }
    };

    // =====================================================
    // OUVRIR AJOUT
    // =====================================================

    const ouvrirAjout = async () => {
        setUtilisateurSelectionne(null);
        setForm(initialForm);
        setMessage("");
        setErreur("");
        setModalOuvert(true);

        await chargerPersonnel();
    };

    // =====================================================
    // OUVRIR MODIFICATION
    // =====================================================

    const ouvrirModification = async (utilisateurCible) => {
        setUtilisateurSelectionne(utilisateurCible);

        setForm({
            id_employe: utilisateurCible.id_employe || "",
            nom_utilisateur:
                utilisateurCible.nom_utilisateur || "",
            mot_de_passe: "",
            id_role: utilisateurCible.id_role || "",
        });

        setMessage("");
        setErreur("");
        setModalOuvert(true);

        await chargerPersonnel(
            utilisateurCible.id_utilisateur
        );
    };

    // =====================================================
    // FERMER MODAL
    // =====================================================

    const fermerModal = () => {
        setModalOuvert(false);
        setUtilisateurSelectionne(null);
        setForm(initialForm);
        setPersonnel([]);
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
    // EMPLOYÉ SÉLECTIONNÉ
    // =====================================================

    const employeSelectionne = personnel.find(
        (employe) =>
            String(employe.id_employe) ===
            String(form.id_employe)
    );

    // =====================================================
    // CRÉER / MODIFIER UN UTILISATEUR
    // =====================================================

    const enregistrerUtilisateur = async (e) => {
        e.preventDefault();

        setMessage("");
        setErreur("");

        // -----------------------------
        // Vérification personnel
        // -----------------------------

        if (!form.id_employe) {
            setErreur(
                "Veuillez sélectionner une personne du personnel."
            );
            return;
        }

        // -----------------------------
        // Vérification nom utilisateur
        // -----------------------------

        if (!form.nom_utilisateur.trim()) {
            setErreur(
                "Le nom d'utilisateur est obligatoire."
            );
            return;
        }

        // -----------------------------
        // Vérification rôle
        // -----------------------------

        if (!form.id_role) {
            setErreur("Veuillez sélectionner un rôle.");
            return;
        }

        // -----------------------------
        // Vérification mot de passe
        // -----------------------------

        if (
            !utilisateurSelectionne &&
            !form.mot_de_passe.trim()
        ) {
            setErreur(
                "Le mot de passe est obligatoire."
            );
            return;
        }

        if (
            form.mot_de_passe.trim() &&
            form.mot_de_passe.length < 6
        ) {
            setErreur(
                "Le mot de passe doit contenir au moins 6 caractères."
            );
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
                id_employe: Number(form.id_employe),
                nom_utilisateur:
                    form.nom_utilisateur.trim(),
                id_role: Number(form.id_role),

                // Utilisateur actuellement connecté
                id_utilisateur:
                    utilisateur?.id_utilisateur || null,
            };

            if (form.mot_de_passe.trim()) {
                body.mot_de_passe =
                    form.mot_de_passe;
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
                            utilisateur?.id_utilisateur ||
                            null,
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
                "Statut modifié avec succès."
            );

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
                            utilisateur?.id_utilisateur ||
                            null,
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
                "Utilisateur supprimé avec succès."
            );

            await chargerUtilisateurs();

        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // FILTRES
    // =====================================================

    const utilisateursFiltres =
        utilisateurs.filter((utilisateurLigne) => {
            const texte =
                recherche.toLowerCase();

            const correspondRecherche =
                utilisateurLigne.nom_utilisateur
                    ?.toLowerCase()
                    .includes(texte) ||

                utilisateurLigne.nom_complet
                    ?.toLowerCase()
                    .includes(texte) ||

                utilisateurLigne.nom_role
                    ?.toLowerCase()
                    .includes(texte) ||

                utilisateurLigne.email
                    ?.toLowerCase()
                    .includes(texte) ||

                utilisateurLigne.matricule
                    ?.toLowerCase()
                    .includes(texte) ||

                utilisateurLigne.fonction
                    ?.toLowerCase()
                    .includes(texte) ||

                utilisateurLigne.service
                    ?.toLowerCase()
                    .includes(texte);

            const correspondStatut =
                statutFiltre === "TOUS" ||
                utilisateurLigne.statut ===
                    statutFiltre;

            return (
                correspondRecherche &&
                correspondStatut
            );
        });

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const totalUtilisateurs =
        utilisateurs.length;

    const utilisateursActifs =
        utilisateurs.filter(
            (u) => u.statut === "ACTIF"
        ).length;

    const utilisateursInactifs =
        utilisateurs.filter(
            (u) => u.statut === "INACTIF"
        ).length;

    const utilisateursBloques =
        utilisateurs.filter(
            (u) => u.statut === "BLOQUE"
        ).length;

    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (
        <div className="utilisateurs-page">

            {/* ================= HEADER ================= */}

            <div className="utilisateurs-header">

                <div>
                    <h1>
                        Gestion des utilisateurs
                    </h1>

                    <p>
                        Administration des comptes,
                        rôles et accès au système.
                    </p>
                </div>

                <button
                    className="btn-ajouter-utilisateur"
                    onClick={ouvrirAjout}
                >
                    + Nouvel utilisateur
                </button>

            </div>


            {/* ================= MESSAGES ================= */}

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


            {/* ================= STATISTIQUES ================= */}

            <div className="stats-utilisateurs">

                <div className="stat-card">
                    <div className="stat-icon">
                        👥
                    </div>

                    <div>
                        <span>
                            Total utilisateurs
                        </span>

                        <strong>
                            {totalUtilisateurs}
                        </strong>
                    </div>
                </div>


                <div className="stat-card">
                    <div className="stat-icon">
                        🟢
                    </div>

                    <div>
                        <span>
                            Actifs
                        </span>

                        <strong>
                            {utilisateursActifs}
                        </strong>
                    </div>
                </div>


                <div className="stat-card">
                    <div className="stat-icon">
                        🟠
                    </div>

                    <div>
                        <span>
                            Inactifs
                        </span>

                        <strong>
                            {utilisateursInactifs}
                        </strong>
                    </div>
                </div>


                <div className="stat-card">
                    <div className="stat-icon">
                        🔴
                    </div>

                    <div>
                        <span>
                            Bloqués
                        </span>

                        <strong>
                            {utilisateursBloques}
                        </strong>
                    </div>
                </div>

            </div>


            {/* ================= FILTRES ================= */}

            <div className="utilisateurs-filtres">

                <div className="recherche-utilisateur">

                    <span>🔎</span>

                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur, personnel, rôle..."
                        value={recherche}
                        onChange={(e) =>
                            setRecherche(
                                e.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={statutFiltre}
                    onChange={(e) =>
                        setStatutFiltre(
                            e.target.value
                        )
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


            {/* ================= TABLEAU ================= */}

            <div className="tableau-utilisateurs">

                <div className="tableau-titre">

                    <div>

                        <h2>
                            Utilisateurs
                        </h2>

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

                                    <th>
                                        Utilisateur
                                    </th>

                                    <th>
                                        Personnel
                                    </th>

                                    <th>
                                        Fonction / Service
                                    </th>

                                    <th>
                                        Rôle
                                    </th>

                                    <th>
                                        Téléphone
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Statut
                                    </th>

                                    <th>
                                        Dernière connexion
                                    </th>

                                    <th>
                                        Actions
                                    </th>

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

                                            {/* UTILISATEUR */}

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


                                            {/* PERSONNEL */}

                                            <td>

                                                {utilisateurLigne.id_employe ? (

                                                    <div>

                                                        <strong>
                                                            {
                                                                utilisateurLigne.nom_employe
                                                            }{" "}
                                                            {
                                                                utilisateurLigne.prenom_employe
                                                            }
                                                        </strong>

                                                        <small
                                                            style={{
                                                                display: "block",
                                                                marginTop: "4px",
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            {
                                                                utilisateurLigne.matricule
                                                            }
                                                        </small>

                                                    </div>

                                                ) : (

                                                    <span>
                                                        Non associé
                                                    </span>

                                                )}

                                            </td>


                                            {/* FONCTION / SERVICE */}

                                            <td>

                                                {utilisateurLigne.id_employe ? (

                                                    <div>

                                                        <strong>
                                                            {
                                                                utilisateurLigne.fonction ||
                                                                "—"
                                                            }
                                                        </strong>

                                                        <small
                                                            style={{
                                                                display: "block",
                                                                marginTop: "4px",
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            {
                                                                utilisateurLigne.service ||
                                                                "—"
                                                            }
                                                        </small>

                                                    </div>

                                                ) : (

                                                    "—"

                                                )}

                                            </td>


                                            {/* RÔLE */}

                                            <td>

                                                <span className="badge-role">

                                                    {
                                                        utilisateurLigne.nom_role
                                                    }

                                                </span>

                                            </td>


                                            {/* TÉLÉPHONE */}

                                            <td>

                                                {
                                                    utilisateurLigne.telephone ||
                                                    "—"
                                                }

                                            </td>


                                            {/* EMAIL */}

                                            <td>

                                                {
                                                    utilisateurLigne.email ||
                                                    "—"
                                                }

                                            </td>


                                            {/* STATUT */}

                                            <td>

                                                <span
                                                    className={`badge-statut statut-${utilisateurLigne.statut?.toLowerCase()}`}
                                                >
                                                    {
                                                        utilisateurLigne.statut
                                                    }
                                                </span>

                                            </td>


                                            {/* DERNIÈRE CONNEXION */}

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


                                            {/* ACTIONS */}

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


            {/* ================= MODAL ================= */}

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

                        {/* HEADER MODAL */}

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
                                        : "Associez un compte à une personne du personnel."}

                                </p>

                            </div>


                            <button
                                className="btn-fermer-modal"
                                onClick={fermerModal}
                            >
                                ×
                            </button>

                        </div>


                        {/* FORMULAIRE */}

                        <form
                            onSubmit={
                                enregistrerUtilisateur
                            }
                        >

                            <div className="form-grid">

                                {/* PERSONNEL */}

                                <div className="form-group">

                                    <label>
                                        Personnel *
                                    </label>

                                    <select
                                        name="id_employe"
                                        value={
                                            form.id_employe
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            chargementPersonnel
                                        }
                                    >

                                        <option value="">

                                            {chargementPersonnel
                                                ? "Chargement du personnel..."
                                                : "Sélectionner une personne"}

                                        </option>

                                        {personnel.map(
                                            (employe) => (

                                                <option
                                                    key={
                                                        employe.id_employe
                                                    }
                                                    value={
                                                        employe.id_employe
                                                    }
                                                >

                                                    {
                                                        employe.prenom
                                                    }{" "}
                                                    {
                                                        employe.nom
                                                    }
                                                    {" — "}
                                                    {
                                                        employe.matricule
                                                    }

                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                {/* INFORMATIONS EMPLOYÉ */}

                                {employeSelectionne && (

                                    <div
                                        className="form-group"
                                        style={{
                                            gridColumn:
                                                "1 / -1",
                                            padding:
                                                "14px 16px",
                                            borderRadius:
                                                "10px",
                                            background:
                                                "#f5f7fa",
                                            border:
                                                "1px solid #e1e5eb",
                                        }}
                                    >

                                        <strong
                                            style={{
                                                display:
                                                    "block",
                                                marginBottom:
                                                    "8px",
                                            }}
                                        >
                                            👤{" "}
                                            {
                                                employeSelectionne.prenom
                                            }{" "}
                                            {
                                                employeSelectionne.nom
                                            }
                                        </strong>

                                        <div
                                            style={{
                                                display:
                                                    "grid",
                                                gridTemplateColumns:
                                                    "repeat(2, minmax(0, 1fr))",
                                                gap: "6px 20px",
                                                fontSize:
                                                    "13px",
                                            }}
                                        >

                                            <span>
                                                <strong>
                                                    Matricule :
                                                </strong>{" "}
                                                {
                                                    employeSelectionne.matricule
                                                }
                                            </span>

                                            <span>
                                                <strong>
                                                    Fonction :
                                                </strong>{" "}
                                                {
                                                    employeSelectionne.fonction ||
                                                    "—"
                                                }
                                            </span>

                                            <span>
                                                <strong>
                                                    Service :
                                                </strong>{" "}
                                                {
                                                    employeSelectionne.service ||
                                                    "—"
                                                }
                                            </span>

                                            <span>
                                                <strong>
                                                    Téléphone :
                                                </strong>{" "}
                                                {
                                                    employeSelectionne.telephone ||
                                                    "—"
                                                }
                                            </span>

                                            <span>
                                                <strong>
                                                    Email :
                                                </strong>{" "}
                                                {
                                                    employeSelectionne.email ||
                                                    "—"
                                                }
                                            </span>

                                        </div>

                                    </div>

                                )}


                                {/* NOM UTILISATEUR */}

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
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex : mamadou.diop"
                                        required
                                    />

                                </div>


                                {/* RÔLE */}

                                <div className="form-group">

                                    <label>
                                        Rôle *
                                    </label>

                                    <select
                                        name="id_role"
                                        value={
                                            form.id_role
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Sélectionner un rôle
                                        </option>

                                        {roles.map(
                                            (role) => (

                                                <option
                                                    key={
                                                        role.id_role
                                                    }
                                                    value={
                                                        role.id_role
                                                    }
                                                >
                                                    {
                                                        role.nom_role
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                {/* MOT DE PASSE */}

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
                                        onChange={
                                            handleChange
                                        }
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

                            </div>


                            {/* NOTE */}

                            <div
                                style={{
                                    marginTop: "10px",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    background:
                                        "#fff8e6",
                                    border:
                                        "1px solid #f0dfaa",
                                    fontSize: "13px",
                                }}
                            >

                                ℹ️ Le nom complet, le téléphone
                                et l'e-mail sont automatiquement
                                récupérés depuis la fiche du
                                personnel sélectionné.

                            </div>


                            {/* ACTIONS */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-annuler"
                                    onClick={
                                        fermerModal
                                    }
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