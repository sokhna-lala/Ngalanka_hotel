
import { useEffect, useState } from "react";
import axios from "axios";
import "./Fournisseurs.css";

function Fournisseurs() {
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [fournisseurEnModification, setFournisseurEnModification] =
        useState(null);

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);
    const [recherche, setRecherche] = useState("");

    const formulaireInitial = {
        raison_sociale: "",
        telephone: "",
        email: "",
        adresse: "",
        ville: "",
        pays: "Sénégal",
        contact: "",
        observation: "",
        statut: "ACTIF"
    };

    const [formulaire, setFormulaire] = useState(formulaireInitial);

    // ==========================================
    // CHARGER LES FOURNISSEURS
    // ==========================================
    const chargerFournisseurs = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                "http://localhost:5000/api/fournisseurs"
            );

            setFournisseurs(response.data);
            setError("");

        } catch (err) {
            console.error("Erreur fournisseurs :", err);
            setError("Impossible de charger les fournisseurs.");

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // CHARGEMENT INITIAL
    // ==========================================
    useEffect(() => {
        chargerFournisseurs();
    }, []);

    // ==========================================
    // GÉRER LES CHAMPS
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire({
            ...formulaire,
            [name]: value
        });
    };

    // ==========================================
    // NOUVEAU FOURNISSEUR
    // ==========================================
    const nouveauFournisseur = () => {
        setFournisseurEnModification(null);
        setFormulaire(formulaireInitial);
        setAfficherFormulaire(true);
    };

    // ==========================================
    // MODIFIER FOURNISSEUR
    // ==========================================
    const modifierFournisseur = (fournisseur) => {
        setFournisseurEnModification(fournisseur);

        setFormulaire({
            raison_sociale: fournisseur.raison_sociale || "",
            telephone: fournisseur.telephone || "",
            email: fournisseur.email || "",
            adresse: fournisseur.adresse || "",
            ville: fournisseur.ville || "",
            pays: fournisseur.pays || "Sénégal",
            contact: fournisseur.contact || "",
            observation: fournisseur.observation || "",
            statut: fournisseur.statut || "ACTIF"
        });

        setAfficherFormulaire(true);
    };

    // ==========================================
    // FERMER FORMULAIRE
    // ==========================================
    const fermerFormulaire = () => {
        setAfficherFormulaire(false);
        setFournisseurEnModification(null);
        setFormulaire(formulaireInitial);
    };

    // ==========================================
    // AJOUTER / MODIFIER
    // ==========================================
    const enregistrerFournisseur = async (e) => {
        e.preventDefault();

        try {
            if (fournisseurEnModification) {

                await axios.put(
                    `http://localhost:5000/api/fournisseurs/${fournisseurEnModification.id_fournisseur}`,
                    formulaire
                );

                alert("Fournisseur modifié avec succès !");

            } else {

                await axios.post(
                    "http://localhost:5000/api/fournisseurs",
                    formulaire
                );

                alert("Fournisseur ajouté avec succès !");
            }

            fermerFormulaire();
            chargerFournisseurs();

        } catch (err) {
            console.error("Erreur fournisseur :", err);

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer le fournisseur"
            );
        }
    };

    // ==========================================
    // ACTIVER / DÉSACTIVER
    // ==========================================
    const changerStatut = async (fournisseur) => {
        const nouveauStatut =
            fournisseur.statut === "ACTIF"
                ? "INACTIF"
                : "ACTIF";

        const action =
            nouveauStatut === "ACTIF"
                ? "activer"
                : "désactiver";

        const confirmation = window.confirm(
            `Voulez-vous vraiment ${action} ce fournisseur ?`
        );

        if (!confirmation) return;

        try {
            await axios.patch(
                `http://localhost:5000/api/fournisseurs/${fournisseur.id_fournisseur}/statut`,
                {
                    statut: nouveauStatut
                }
            );

            alert(
                `Fournisseur ${
                    nouveauStatut === "ACTIF"
                        ? "activé"
                        : "désactivé"
                } avec succès !`
            );

            chargerFournisseurs();

        } catch (err) {
            console.error("Erreur statut :", err);

            alert(
                err.response?.data?.message ||
                "Impossible de modifier le statut"
            );
        }
    };

    // ==========================================
    // RECHERCHE
    // ==========================================
    const fournisseursFiltres = fournisseurs.filter((fournisseur) => {
        const texte = recherche.toLowerCase();

        return (
            fournisseur.raison_sociale
                ?.toLowerCase()
                .includes(texte) ||

            fournisseur.telephone
                ?.toLowerCase()
                .includes(texte) ||

            fournisseur.email
                ?.toLowerCase()
                .includes(texte) ||

            fournisseur.ville
                ?.toLowerCase()
                .includes(texte) ||

            fournisseur.contact
                ?.toLowerCase()
                .includes(texte)
        );
    });

    // ==========================================
    // STATISTIQUES
    // ==========================================
    const totalFournisseurs = fournisseurs.length;

    const fournisseursActifs = fournisseurs.filter(
        (fournisseur) => fournisseur.statut === "ACTIF"
    ).length;

    const fournisseursInactifs = fournisseurs.filter(
        (fournisseur) => fournisseur.statut === "INACTIF"
    ).length;

    return (
        <div className="fournisseurs-page">

            {/* ================================
                EN-TÊTE
            ================================= */}
            <div className="page-header">

                <div>
                    <h1>Fournisseurs</h1>

                    <p>
                        Gestion des fournisseurs de l'hôtel
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={nouveauFournisseur}
                >
                    + Nouveau fournisseur
                </button>

            </div>


            {/* ================================
                STATISTIQUES
            ================================= */}
            {!afficherFormulaire && (
                <div className="fournisseurs-stats">

                    <div className="stat-card">
                        <span>Total fournisseurs</span>
                        <strong>{totalFournisseurs}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Fournisseurs actifs</span>
                        <strong>{fournisseursActifs}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Fournisseurs inactifs</span>
                        <strong>{fournisseursInactifs}</strong>
                    </div>

                </div>
            )}


            {/* ================================
                FORMULAIRE
            ================================= */}
            {afficherFormulaire && (

                <div className="fournisseur-form">

                    <div className="form-header">

                        <h2>
                            {fournisseurEnModification
                                ? "Modifier le fournisseur"
                                : "Nouveau fournisseur"}
                        </h2>

                        <button
                            type="button"
                            onClick={fermerFormulaire}
                        >
                            ✕
                        </button>

                    </div>


                    <form onSubmit={enregistrerFournisseur}>

                        <div className="form-grid">

                            {/* RAISON SOCIALE */}
                            <div>
                                <label>Raison sociale *</label>

                                <input
                                    type="text"
                                    name="raison_sociale"
                                    value={formulaire.raison_sociale}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex : Senelec Distribution"
                                />
                            </div>


                            {/* CONTACT */}
                            <div>
                                <label>Personne à contacter</label>

                                <input
                                    type="text"
                                    name="contact"
                                    value={formulaire.contact}
                                    onChange={handleChange}
                                    placeholder="Nom du contact"
                                />
                            </div>


                            {/* TÉLÉPHONE */}
                            <div>
                                <label>Téléphone</label>

                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formulaire.telephone}
                                    onChange={handleChange}
                                    placeholder="Ex : 77 000 00 00"
                                />
                            </div>


                            {/* EMAIL */}
                            <div>
                                <label>Email</label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formulaire.email}
                                    onChange={handleChange}
                                    placeholder="Ex : contact@entreprise.com"
                                />
                            </div>


                            {/* ADRESSE */}
                            <div>
                                <label>Adresse</label>

                                <input
                                    type="text"
                                    name="adresse"
                                    value={formulaire.adresse}
                                    onChange={handleChange}
                                    placeholder="Adresse du fournisseur"
                                />
                            </div>


                            {/* VILLE */}
                            <div>
                                <label>Ville</label>

                                <input
                                    type="text"
                                    name="ville"
                                    value={formulaire.ville}
                                    onChange={handleChange}
                                    placeholder="Ex : Dakar"
                                />
                            </div>


                            {/* PAYS */}
                            <div>
                                <label>Pays</label>

                                <input
                                    type="text"
                                    name="pays"
                                    value={formulaire.pays}
                                    onChange={handleChange}
                                    placeholder="Ex : Sénégal"
                                />
                            </div>


                            {/* STATUT */}
                            {fournisseurEnModification && (
                                <div>
                                    <label>Statut</label>

                                    <select
                                        name="statut"
                                        value={formulaire.statut}
                                        onChange={handleChange}
                                    >
                                        <option value="ACTIF">
                                            Actif
                                        </option>

                                        <option value="INACTIF">
                                            Inactif
                                        </option>
                                    </select>
                                </div>
                            )}


                            {/* OBSERVATION */}
                            <div className="full-width">

                                <label>Observation</label>

                                <textarea
                                    name="observation"
                                    value={formulaire.observation}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Informations complémentaires..."
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
                            >
                                {fournisseurEnModification
                                    ? "Enregistrer les modifications"
                                    : "Enregistrer le fournisseur"}
                            </button>

                        </div>

                    </form>

                </div>
            )}


            {/* ================================
                RECHERCHE
            ================================= */}
            {!afficherFormulaire && (

                <div className="search-container">

                    <input
                        type="text"
                        placeholder="🔍 Rechercher un fournisseur..."
                        value={recherche}
                        onChange={(e) =>
                            setRecherche(e.target.value)
                        }
                    />

                </div>
            )}


            {/* ================================
                CHARGEMENT
            ================================= */}
            {loading && (
                <p>Chargement des fournisseurs...</p>
            )}


            {/* ================================
                ERREUR
            ================================= */}
            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}


            {/* ================================
                TABLEAU
            ================================= */}
            {!loading && !error && !afficherFormulaire && (

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>
                                <th>Fournisseur</th>
                                <th>Contact</th>
                                <th>Téléphone</th>
                                <th>Email</th>
                                <th>Ville</th>
                                <th>Pays</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>

                        </thead>


                        <tbody>

                            {fournisseursFiltres.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="empty"
                                    >
                                        Aucun fournisseur trouvé
                                    </td>

                                </tr>

                            ) : (

                                fournisseursFiltres.map((fournisseur) => (

                                    <tr
                                        key={
                                            fournisseur.id_fournisseur
                                        }
                                    >

                                        <td>
                                            <strong>
                                                {
                                                    fournisseur.raison_sociale
                                                }
                                            </strong>

                                            <br />

                                            <small>
                                                {
                                                    fournisseur.adresse ||
                                                    "-"
                                                }
                                            </small>
                                        </td>


                                        <td>
                                            {fournisseur.contact || "-"}
                                        </td>


                                        <td>
                                            {fournisseur.telephone || "-"}
                                        </td>


                                        <td>
                                            {fournisseur.email || "-"}
                                        </td>


                                        <td>
                                            {fournisseur.ville || "-"}
                                        </td>


                                        <td>
                                            {fournisseur.pays || "-"}
                                        </td>


                                        <td>

                                            <span
                                                className={
                                                    fournisseur.statut ===
                                                    "ACTIF"
                                                        ? "badge-actif"
                                                        : "badge-inactif"
                                                }
                                            >
                                                {fournisseur.statut}
                                            </span>

                                        </td>


                                        <td className="actions-cell">

                                            <button
                                                type="button"
                                                title="Modifier le fournisseur"
                                                onClick={() =>
                                                    modifierFournisseur(
                                                        fournisseur
                                                    )
                                                }
                                            >
                                                ✏️
                                            </button>


                                            <button
                                                type="button"
                                                title={
                                                    fournisseur.statut ===
                                                    "ACTIF"
                                                        ? "Désactiver"
                                                        : "Activer"
                                                }
                                                onClick={() =>
                                                    changerStatut(
                                                        fournisseur
                                                    )
                                                }
                                            >
                                                {
                                                    fournisseur.statut ===
                                                    "ACTIF"
                                                        ? "🔴"
                                                        : "🟢"
                                                }
                                            </button>

                                        </td>

                                    </tr>

                                ))
                            )}

                        </tbody>

                    </table>

                </div>
            )}

        </div>
    );
}

export default Fournisseurs;

