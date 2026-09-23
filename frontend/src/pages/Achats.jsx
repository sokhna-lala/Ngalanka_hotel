
import { useEffect, useState } from "react";
import axios from "axios";
import "./Achats.css";

function Achats() {
    const [achats, setAchats] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [produits, setProduits] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);
    const [achatSelectionne, setAchatSelectionne] = useState(null);

    const [formulaire, setFormulaire] = useState({
        id_fournisseur: "",
        numero_facture_fournisseur: "",
        observation: "",
        lignes: [
            {
                id_produit: "",
                quantite: "",
                prix_unitaire: ""
            }
        ]
    });

    // ==========================================
    // CHARGER LES ACHATS
    // ==========================================
    const chargerAchats = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/achats"
            );

            setAchats(response.data);
            setError("");

        } catch (err) {
            console.error("Erreur achats :", err);
            setError("Impossible de charger les achats.");
        }
    };

    // ==========================================
    // CHARGER FOURNISSEURS
    // ==========================================
    const chargerFournisseurs = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/fournisseurs"
            );

            setFournisseurs(response.data);

        } catch (err) {
            console.error("Erreur fournisseurs :", err);
        }
    };

    // ==========================================
    // CHARGER PRODUITS
    // ==========================================
    const chargerProduits = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/produits"
            );

            setProduits(response.data);

        } catch (err) {
            console.error("Erreur produits :", err);
        }
    };

    // ==========================================
    // CHARGEMENT INITIAL
    // ==========================================
    useEffect(() => {
        const chargerDonnees = async () => {
            setLoading(true);

            await Promise.all([
                chargerAchats(),
                chargerFournisseurs(),
                chargerProduits()
            ]);

            setLoading(false);
        };

        chargerDonnees();
    }, []);

    // ==========================================
    // GÉRER LES CHAMPS PRINCIPAUX
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire({
            ...formulaire,
            [name]: value
        });
    };

    // ==========================================
    // GÉRER UNE LIGNE D'ACHAT
    // ==========================================
    const modifierLigne = (index, champ, valeur) => {
        const nouvellesLignes = [...formulaire.lignes];

        nouvellesLignes[index] = {
            ...nouvellesLignes[index],
            [champ]: valeur
        };

        // Si on sélectionne un produit,
        // on récupère automatiquement son prix d'achat
        if (champ === "id_produit") {
            const produit = produits.find(
                (p) => String(p.id_produit) === String(valeur)
            );

            if (produit) {
                nouvellesLignes[index].prix_unitaire =
                    produit.prix_achat || "";
            }
        }

        setFormulaire({
            ...formulaire,
            lignes: nouvellesLignes
        });
    };

    // ==========================================
    // AJOUTER UNE LIGNE
    // ==========================================
    const ajouterLigne = () => {
        setFormulaire({
            ...formulaire,
            lignes: [
                ...formulaire.lignes,
                {
                    id_produit: "",
                    quantite: "",
                    prix_unitaire: ""
                }
            ]
        });
    };

    // ==========================================
    // SUPPRIMER UNE LIGNE
    // ==========================================
    const supprimerLigne = (index) => {
        if (formulaire.lignes.length === 1) {
            return;
        }

        const nouvellesLignes = formulaire.lignes.filter(
            (_, i) => i !== index
        );

        setFormulaire({
            ...formulaire,
            lignes: nouvellesLignes
        });
    };

    // ==========================================
    // NOUVEL ACHAT
    // ==========================================
    const nouvelAchat = () => {
        setAchatSelectionne(null);

        setFormulaire({
            id_fournisseur: "",
            numero_facture_fournisseur: "",
            observation: "",
            lignes: [
                {
                    id_produit: "",
                    quantite: "",
                    prix_unitaire: ""
                }
            ]
        });

        setAfficherFormulaire(true);
    };

    // ==========================================
    // FERMER FORMULAIRE
    // ==========================================
    const fermerFormulaire = () => {
        setAfficherFormulaire(false);
        setAchatSelectionne(null);
    };

    // ==========================================
    // CALCUL TOTAL
    // ==========================================
    const calculerTotal = () => {
        return formulaire.lignes.reduce((total, ligne) => {
            const quantite = Number(ligne.quantite) || 0;
            const prix = Number(ligne.prix_unitaire) || 0;

            return total + quantite * prix;
        }, 0);
    };

    // ==========================================
    // ENREGISTRER ACHAT
    // ==========================================
    const enregistrerAchat = async (e) => {
        e.preventDefault();

        if (!formulaire.id_fournisseur) {
            alert("Veuillez sélectionner un fournisseur.");
            return;
        }

        const lignesValides = formulaire.lignes.filter(
            (ligne) =>
                ligne.id_produit &&
                Number(ligne.quantite) > 0 &&
                Number(ligne.prix_unitaire) >= 0
        );

        if (lignesValides.length === 0) {
            alert("Veuillez ajouter au moins un produit valide.");
            return;
        }

        try {
            await axios.post(
                "http://localhost:5000/api/achats",
                {
                    id_fournisseur: Number(formulaire.id_fournisseur),
                    numero_facture_fournisseur:
                        formulaire.numero_facture_fournisseur || null,
                    observation:
                        formulaire.observation || null,
                    lignes: lignesValides.map((ligne) => ({
                        id_produit: Number(ligne.id_produit),
                        quantite: Number(ligne.quantite),
                        prix_unitaire: Number(ligne.prix_unitaire)
                    }))
                }
            );

            alert("Achat créé avec succès !");

            fermerFormulaire();
            chargerAchats();

        } catch (err) {
            console.error("Erreur achat :", err);

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer l'achat."
            );
        }
    };

    // ==========================================
    // VOIR DÉTAIL
    // ==========================================
    const voirDetail = async (achat) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/achats/${achat.id_achat}`
            );

            setAchatSelectionne(response.data);

        } catch (err) {
            console.error("Erreur détail achat :", err);

            alert(
                err.response?.data?.message ||
                "Impossible de charger le détail de l'achat."
            );
        }
    };

    // ==========================================
    // VALIDER ACHAT
    // ==========================================
    const validerAchat = async (achat) => {
        const confirmation = window.confirm(
            `Voulez-vous vraiment valider l'achat ${achat.numero_achat} ?\n\n` +
            "Cette validation créera automatiquement les entrées en stock."
        );

        if (!confirmation) return;

        try {
            await axios.patch(
                `http://localhost:5000/api/achats/${achat.id_achat}/valider`
            );

            alert(
                "Achat validé avec succès !\nLes produits ont été ajoutés au stock."
            );

            setAchatSelectionne(null);
            chargerAchats();

        } catch (err) {
            console.error("Erreur validation achat :", err);

            alert(
                err.response?.data?.message ||
                "Impossible de valider l'achat."
            );
        }
    };

    // ==========================================
    // FORMATAGE MONTANT
    // ==========================================
    const formaterMontant = (montant) => {
        return Number(montant || 0).toLocaleString("fr-FR") + " FCFA";
    };

    // ==========================================
    // STATISTIQUES
    // ==========================================
    const totalAchats = achats.length;

    const achatsEnAttente = achats.filter(
        (achat) => achat.statut === "EN ATTENTE"
    ).length;

    const achatsValides = achats.filter(
        (achat) => achat.statut === "VALIDE"
    ).length;

    const montantTotal = achats.reduce(
        (total, achat) => total + Number(achat.montant || 0),
        0
    );

    // ==========================================
    // AFFICHAGE
    // ==========================================
    return (
        <div className="achats-page">

            {/* ================================
                EN-TÊTE
            ================================= */}
            <div className="page-header">

                <div>
                    <h1>Achats</h1>

                    <p>
                        Gestion des achats et approvisionnements
                    </p>
                </div>

                {!afficherFormulaire && !achatSelectionne && (
                    <button
                        className="btn-primary"
                        onClick={nouvelAchat}
                    >
                        + Nouvel achat
                    </button>
                )}

            </div>


            {/* ================================
                STATISTIQUES
            ================================= */}
            {!afficherFormulaire && !achatSelectionne && (
                <div className="achats-stats">

                    <div className="stat-card">
                        <span>Total achats</span>
                        <strong>{totalAchats}</strong>
                    </div>

                    <div className="stat-card">
                        <span>En attente</span>
                        <strong>{achatsEnAttente}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Achats validés</span>
                        <strong>{achatsValides}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Montant total</span>
                        <strong>
                            {formaterMontant(montantTotal)}
                        </strong>
                    </div>

                </div>
            )}


            {/* ================================
                FORMULAIRE NOUVEL ACHAT
            ================================= */}
            {afficherFormulaire && (

                <div className="achat-form">

                    <div className="form-header">

                        <h2>Nouvel achat</h2>

                        <button
                            type="button"
                            onClick={fermerFormulaire}
                        >
                            ✕
                        </button>

                    </div>


                    <form onSubmit={enregistrerAchat}>

                        {/* FOURNISSEUR + FACTURE */}
                        <div className="form-grid">

                            <div>
                                <label>
                                    Fournisseur *
                                </label>

                                <select
                                    name="id_fournisseur"
                                    value={formulaire.id_fournisseur}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Sélectionner un fournisseur
                                    </option>

                                    {fournisseurs.map(
                                        (fournisseur) => (
                                            <option
                                                key={
                                                    fournisseur.id_fournisseur
                                                }
                                                value={
                                                    fournisseur.id_fournisseur
                                                }
                                            >
                                                {
                                                    fournisseur.raison_sociale
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>


                            <div>
                                <label>
                                    N° facture fournisseur
                                </label>

                                <input
                                    type="text"
                                    name="numero_facture_fournisseur"
                                    value={
                                        formulaire.numero_facture_fournisseur
                                    }
                                    onChange={handleChange}
                                    placeholder="Ex : FAC-2026-001"
                                />
                            </div>


                            <div className="full-width">

                                <label>
                                    Observation
                                </label>

                                <textarea
                                    name="observation"
                                    value={formulaire.observation}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Informations complémentaires..."
                                />

                            </div>

                        </div>


                        {/* PRODUITS */}
                        <div className="lignes-header">

                            <h3>
                                Produits achetés
                            </h3>

                            <button
                                type="button"
                                onClick={ajouterLigne}
                            >
                                + Ajouter un produit
                            </button>

                        </div>


                        <div className="lignes-table">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Produit</th>
                                        <th>Quantité</th>
                                        <th>Prix unitaire</th>
                                        <th>Montant</th>
                                        <th></th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {formulaire.lignes.map(
                                        (ligne, index) => {

                                            const montant =
                                                (Number(
                                                    ligne.quantite
                                                ) || 0) *
                                                (Number(
                                                    ligne.prix_unitaire
                                                ) || 0);

                                            return (
                                                <tr key={index}>

                                                    <td>
                                                        <select
                                                            value={
                                                                ligne.id_produit
                                                            }
                                                            onChange={(e) =>
                                                                modifierLigne(
                                                                    index,
                                                                    "id_produit",
                                                                    e.target.value
                                                                )
                                                            }
                                                            required
                                                        >
                                                            <option value="">
                                                                Sélectionner
                                                            </option>

                                                            {produits.map(
                                                                (
                                                                    produit
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            produit.id_produit
                                                                        }
                                                                        value={
                                                                            produit.id_produit
                                                                        }
                                                                    >
                                                                        {
                                                                            produit.code
                                                                        }{" "}
                                                                        -{" "}
                                                                        {
                                                                            produit.libelle
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </td>


                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={
                                                                ligne.quantite
                                                            }
                                                            onChange={(e) =>
                                                                modifierLigne(
                                                                    index,
                                                                    "quantite",
                                                                    e.target.value
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </td>


                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                ligne.prix_unitaire
                                                            }
                                                            onChange={(e) =>
                                                                modifierLigne(
                                                                    index,
                                                                    "prix_unitaire",
                                                                    e.target.value
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </td>


                                                    <td>
                                                        <strong>
                                                            {formaterMontant(
                                                                montant
                                                            )}
                                                        </strong>
                                                    </td>


                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                supprimerLigne(
                                                                    index
                                                                )
                                                            }
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>


                        {/* TOTAL */}
                        <div className="achat-total">

                            <span>
                                Total de l'achat
                            </span>

                            <strong>
                                {formaterMontant(
                                    calculerTotal()
                                )}
                            </strong>

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
                                Enregistrer l'achat
                            </button>

                        </div>

                    </form>

                </div>
            )}


            {/* ================================
                DÉTAIL ACHAT
            ================================= */}
            {achatSelectionne && !afficherFormulaire && (

                <div className="achat-detail">

                    <div className="form-header">

                        <div>
                            <h2>
                                Détail de l'achat
                            </h2>

                            <p>
                                {
                                    achatSelectionne.achat
                                        ?.numero_achat
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={fermerFormulaire}
                        >
                            ✕
                        </button>

                    </div>


                    <div className="detail-informations">

                        <div>
                            <span>Fournisseur</span>

                            <strong>
                                {
                                    achatSelectionne.achat
                                        ?.fournisseur
                            }
                            </strong>
                        </div>


                        <div>
                            <span>Date</span>

                            <strong>
                                {
                                    achatSelectionne.achat
                                        ?.date_achat
                                        ? new Date(
                                              achatSelectionne.achat
                                                  .date_achat
                                          ).toLocaleDateString(
                                              "fr-FR"
                                          )
                                        : "-"
                                }
                            </strong>
                        </div>


                        <div>
                            <span>Facture fournisseur</span>

                            <strong>
                                {
                                    achatSelectionne.achat
                                        ?.numero_facture_fournisseur ||
                                    "-"
                                }
                            </strong>
                        </div>


                        <div>
                            <span>Statut</span>

                            <strong>
                                {
                                    achatSelectionne.achat
                                        ?.statut
                                }
                            </strong>
                        </div>

                    </div>


                    <h3>
                        Produits
                    </h3>


                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>
                                    <th>Code</th>
                                    <th>Produit</th>
                                    <th>Unité</th>
                                    <th>Quantité</th>
                                    <th>Prix unitaire</th>
                                    <th>Montant</th>
                                </tr>

                            </thead>


                            <tbody>

                                {achatSelectionne.lignes?.map(
                                    (ligne) => (
                                        <tr
                                            key={
                                                ligne.id_ligne
                                            }
                                        >

                                            <td>
                                                {ligne.code}
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        ligne.produit
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {ligne.unite}
                                            </td>

                                            <td>
                                                {ligne.quantite}
                                            </td>

                                            <td>
                                                {formaterMontant(
                                                    ligne.prix_unitaire
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    {formaterMontant(
                                                        ligne.montant
                                                    )}
                                                </strong>
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>


                    <div className="detail-total">

                        <span>
                            Total
                        </span>

                        <strong>
                            {formaterMontant(
                                achatSelectionne.achat
                                    ?.montant
                            )}
                        </strong>

                    </div>


                    {achatSelectionne.achat?.statut ===
                        "EN ATTENTE" && (

                        <div className="detail-actions">

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() =>
                                    validerAchat(
                                        achatSelectionne.achat
                                    )
                                }
                            >
                                ✓ Valider l'achat
                            </button>

                        </div>
                    )}

                </div>
            )}


            {/* ================================
                CHARGEMENT
            ================================= */}
            {loading && (
                <p>
                    Chargement des achats...
                </p>
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
                LISTE DES ACHATS
            ================================= */}
            {!loading &&
                !error &&
                !afficherFormulaire &&
                !achatSelectionne && (

                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>
                                    <th>N° Achat</th>
                                    <th>Fournisseur</th>
                                    <th>Date</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>

                            </thead>


                            <tbody>

                                {achats.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="empty"
                                        >
                                            Aucun achat trouvé
                                        </td>

                                    </tr>

                                ) : (

                                    achats.map((achat) => (

                                        <tr
                                            key={
                                                achat.id_achat
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        achat.numero_achat
                                                    }
                                                </strong>
                                            </td>


                                            <td>
                                                {
                                                    achat.fournisseur
                                                }
                                            </td>


                                            <td>
                                                {achat.date_achat
                                                    ? new Date(
                                                          achat.date_achat
                                                      ).toLocaleDateString(
                                                          "fr-FR"
                                                      )
                                                    : "-"}
                                            </td>


                                            <td>
                                                <strong>
                                                    {formaterMontant(
                                                        achat.montant
                                                    )}
                                                </strong>
                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        achat.statut ===
                                                        "VALIDE"
                                                            ? "badge-valide"
                                                            : achat.statut ===
                                                              "ANNULE"
                                                            ? "badge-annule"
                                                            : "badge-attente"
                                                    }
                                                >
                                                    {
                                                        achat.statut
                                                    }
                                                </span>

                                            </td>


                                            <td className="actions-cell">

                                                <button
                                                    type="button"
                                                    title="Voir le détail"
                                                    onClick={() =>
                                                        voirDetail(
                                                            achat
                                                        )
                                                    }
                                                >
                                                    👁️
                                                </button>


                                                {achat.statut ===
                                                    "EN ATTENTE" && (

                                                    <button
                                                        type="button"
                                                        title="Valider l'achat"
                                                        onClick={() =>
                                                            validerAchat(
                                                                achat
                                                            )
                                                        }
                                                    >
                                                        ✓
                                                    </button>
                                                )}

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

export default Achats;

