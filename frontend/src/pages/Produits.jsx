
import { useEffect, useState } from "react";
import axios from "axios";
import "./Produits.css";

function Produits() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [produitEnModification, setProduitEnModification] = useState(null);
    const [afficherFormulaire, setAfficherFormulaire] = useState(false);

    const [recherche, setRecherche] = useState("");

    const formulaireInitial = {
        code: "",
        libelle: "",
        prix_vente: "",
        prix_achat: "",
        unite: "",
        stock_minimum: "",
        description: "",
        statut: "ACTIF"
    };

    const [formulaire, setFormulaire] = useState(formulaireInitial);

    // ==========================================
    // CHARGER LES PRODUITS
    // ==========================================
    const chargerProduits = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                "http://localhost:5000/api/produits"
            );

            setProduits(response.data);
            setError("");

        } catch (err) {
            console.error(err);
            setError("Impossible de charger les produits.");

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // CHARGEMENT INITIAL
    // ==========================================
    useEffect(() => {
        chargerProduits();
    }, []);

    // ==========================================
    // GÉRER LES CHAMPS DU FORMULAIRE
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire({
            ...formulaire,
            [name]: value
        });
    };

    // ==========================================
    // OUVRIR FORMULAIRE AJOUT
    // ==========================================
    const nouveauProduit = () => {
        setProduitEnModification(null);
        setFormulaire(formulaireInitial);
        setAfficherFormulaire(true);
    };

    // ==========================================
    // OUVRIR FORMULAIRE MODIFICATION
    // ==========================================
    const modifierProduit = (produit) => {
        setProduitEnModification(produit);

        setFormulaire({
            code: produit.code || "",
            libelle: produit.libelle || "",
            prix_vente: produit.prix_vente || "",
            prix_achat: produit.prix_achat || "",
            unite: produit.unite || "",
            stock_minimum: produit.stock_minimum || "",
            description: produit.description || "",
            statut: produit.statut || "ACTIF"
        });

        setAfficherFormulaire(true);
    };

    // ==========================================
    // FERMER FORMULAIRE
    // ==========================================
    const fermerFormulaire = () => {
        setAfficherFormulaire(false);
        setProduitEnModification(null);
        setFormulaire(formulaireInitial);
    };

    // ==========================================
    // AJOUTER / MODIFIER UN PRODUIT
    // ==========================================
    const enregistrerProduit = async (e) => {
        e.preventDefault();

        try {
            if (produitEnModification) {

                await axios.put(
                    `http://localhost:5000/api/produits/${produitEnModification.id_produit}`,
                    formulaire
                );

                alert("Produit modifié avec succès !");

            } else {

                await axios.post(
                    "http://localhost:5000/api/produits",
                    formulaire
                );

                alert("Produit ajouté avec succès !");
            }

            fermerFormulaire();
            chargerProduits();

        } catch (err) {
            console.error("Erreur produit :", err);

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer le produit"
            );
        }
    };

    // ==========================================
    // SUPPRIMER UN PRODUIT
    // ==========================================
    const supprimerProduit = async (produit) => {
        const confirmation = window.confirm(
            `Voulez-vous vraiment supprimer le produit "${produit.libelle}" ?`
        );

        if (!confirmation) return;

        try {
            await axios.delete(
                `http://localhost:5000/api/produits/${produit.id_produit}`
            );

            alert("Produit supprimé avec succès !");

            chargerProduits();

        } catch (err) {
            console.error("Erreur suppression produit :", err);

            alert(
                err.response?.data?.message ||
                "Impossible de supprimer le produit"
            );
        }
    };

    // ==========================================
    // ACTIVER / DÉSACTIVER
    // ==========================================
    const changerStatut = async (produit) => {
        const nouveauStatut =
            produit.statut === "ACTIF"
                ? "INACTIF"
                : "ACTIF";

        const action =
            nouveauStatut === "ACTIF"
                ? "activer"
                : "désactiver";

        const confirmation = window.confirm(
            `Voulez-vous vraiment ${action} ce produit ?`
        );

        if (!confirmation) return;

        try {
            await axios.patch(
                `http://localhost:5000/api/produits/${produit.id_produit}/statut`,
                {
                    statut: nouveauStatut
                }
            );

            alert(
                `Produit ${
                    nouveauStatut === "ACTIF"
                        ? "activé"
                        : "désactivé"
                } avec succès !`
            );

            chargerProduits();

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
    const produitsFiltres = produits.filter((produit) => {
        const texte = recherche.toLowerCase();

        return (
            produit.libelle?.toLowerCase().includes(texte) ||
            produit.code?.toLowerCase().includes(texte)
        );
    });

    // ==========================================
    // FORMAT PRIX
    // ==========================================
    const formatPrix = (prix) => {
        return Number(prix || 0).toLocaleString("fr-FR") + " FCFA";
    };

    // ==========================================
    // STATISTIQUES
    // ==========================================
    const totalProduits = produits.length;

    const produitsActifs = produits.filter(
        (produit) => produit.statut === "ACTIF"
    ).length;

    const stockFaible = produits.filter(
        (produit) =>
            Number(produit.stock_actuel) <=
            Number(produit.stock_minimum)
    ).length;

    return (
        <div className="produits-page">

            {/* ================================
                EN-TÊTE
            ================================= */}
            <div className="page-header">

                <div>
                    <h1>Produits</h1>

                    <p>
                        Gestion des produits et du stock de l'hôtel
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={nouveauProduit}
                >
                    + Nouveau produit
                </button>

            </div>

            {/* ================================
                STATISTIQUES
            ================================= */}
            {!afficherFormulaire && (
                <div className="produits-stats">

                    <div className="stat-card">
                        <span>Total produits</span>
                        <strong>{totalProduits}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Produits actifs</span>
                        <strong>{produitsActifs}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Stock faible</span>
                        <strong>{stockFaible}</strong>
                    </div>

                </div>
            )}

            {/* ================================
                FORMULAIRE
            ================================= */}
            {afficherFormulaire && (

                <div className="produit-form">

                    <div className="form-header">

                        <h2>
                            {produitEnModification
                                ? "Modifier le produit"
                                : "Nouveau produit"}
                        </h2>

                        <button
                            type="button"
                            onClick={fermerFormulaire}
                        >
                            ✕
                        </button>

                    </div>

                    <form onSubmit={enregistrerProduit}>

                        <div className="form-grid">

                            {/* CODE */}
                            <div>
                                <label>Code produit</label>

                                <input
                                    type="text"
                                    name="code"
                                    value={formulaire.code}
                                    onChange={handleChange}
                                    placeholder="Ex : BO004"
                                />
                            </div>

                            {/* LIBELLÉ */}
                            <div>
                                <label>Libellé *</label>

                                <input
                                    type="text"
                                    name="libelle"
                                    value={formulaire.libelle}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex : Coca Cola"
                                />
                            </div>

                            {/* UNITÉ */}
                            <div>
                                <label>Unité</label>

                                <input
                                    type="text"
                                    name="unite"
                                    value={formulaire.unite}
                                    onChange={handleChange}
                                    placeholder="Ex : Bouteille"
                                />
                            </div>

                            {/* PRIX VENTE */}
                            <div>
                                <label>Prix de vente (FCFA)</label>

                                <input
                                    type="number"
                                    name="prix_vente"
                                    value={formulaire.prix_vente}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            {/* PRIX ACHAT */}
                            <div>
                                <label>Prix d'achat (FCFA)</label>

                                <input
                                    type="number"
                                    name="prix_achat"
                                    value={formulaire.prix_achat}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            {/* STOCK MINIMUM */}
                            <div>
                                <label>Stock minimum</label>

                                <input
                                    type="number"
                                    name="stock_minimum"
                                    value={formulaire.stock_minimum}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            {/* STATUT */}
                            {produitEnModification && (
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

                            {/* DESCRIPTION */}
                            <div className="full-width">

                                <label>Description</label>

                                <textarea
                                    name="description"
                                    value={formulaire.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Description du produit..."
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
                                {produitEnModification
                                    ? "Enregistrer les modifications"
                                    : "Enregistrer le produit"}
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
                        placeholder="🔍 Rechercher un produit..."
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
                <p>Chargement des produits...</p>
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
                                <th>Code</th>
                                <th>Produit</th>
                                <th>Prix vente</th>
                                <th>Stock actuel</th>
                                <th>Stock minimum</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {produitsFiltres.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="7"
                                        className="empty"
                                    >
                                        Aucun produit trouvé
                                    </td>
                                </tr>

                            ) : (

                                produitsFiltres.map((produit) => (

                                    <tr
                                        key={produit.id_produit}
                                        className={
                                            Number(produit.stock_actuel) <=
                                            Number(produit.stock_minimum)
                                                ? "stock-faible-row"
                                                : ""
                                        }
                                    >

                                        <td>
                                            {produit.code || "-"}
                                        </td>

                                        <td>
                                            <strong>
                                                {produit.libelle}
                                            </strong>

                                            <br />

                                            <small>
                                                {produit.unite || "-"}
                                            </small>
                                        </td>

                                        <td>
                                            {formatPrix(
                                                produit.prix_vente
                                            )}
                                        </td>

                                        <td>
                                            {produit.stock_actuel}
                                        </td>

                                        <td>
                                            {produit.stock_minimum}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    produit.statut === "ACTIF"
                                                        ? "badge-actif"
                                                        : "badge-inactif"
                                                }
                                            >
                                                {produit.statut}
                                            </span>
                                        </td>

                                        <td className="actions-cell">

                                            {/* MODIFIER */}
                                            <button
                                                type="button"
                                                title="Modifier le produit"
                                                onClick={() =>
                                                    modifierProduit(produit)
                                                }
                                            >
                                                ✏️
                                            </button>

                                            {/* ACTIVER / DÉSACTIVER */}
                                            <button
                                                type="button"
                                                title={
                                                    produit.statut === "ACTIF"
                                                        ? "Désactiver"
                                                        : "Activer"
                                                }
                                                onClick={() =>
                                                    changerStatut(produit)
                                                }
                                            >
                                                {produit.statut === "ACTIF"
                                                    ? "🔴"
                                                    : "🟢"}
                                            </button>

                                            {/* SUPPRIMER */}
                                            <button
                                                type="button"
                                                className="btn-delete"
                                                title="Supprimer le produit"
                                                onClick={() =>
                                                    supprimerProduit(produit)
                                                }
                                            >
                                                🗑️
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

export default Produits;


