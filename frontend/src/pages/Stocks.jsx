
import { useEffect, useState } from "react";
import axios from "axios";
import "./Stocks.css";

const API_URL = "http://localhost:5000/api";

function Stocks() {
    const [stocks, setStocks] = useState([]);
    const [mouvements, setMouvements] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMouvements, setLoadingMouvements] = useState(true);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [recherche, setRecherche] = useState("");

    // =====================================================
    // SORTIE DE STOCK
    // =====================================================

    const [produitSortie, setProduitSortie] = useState(null);

    const [sortieForm, setSortieForm] = useState({
        quantite: "",
        motif: "",
        reference: "",
    });

    const [loadingSortie, setLoadingSortie] = useState(false);

    // =====================================================
    // PERTE DE STOCK
    // =====================================================

    const [produitPerte, setProduitPerte] = useState(null);

    const [perteForm, setPerteForm] = useState({
        quantite: "",
        motif: "",
        reference: "",
    });

    const [loadingPerte, setLoadingPerte] = useState(false);

    // =====================================================
    // INVENTAIRE PHYSIQUE
    // =====================================================

    const [produitInventaire, setProduitInventaire] = useState(null);

    const [inventaireForm, setInventaireForm] = useState({
        stock_reel: "",
        motif: "",
        reference: "",
    });

    const [loadingInventaire, setLoadingInventaire] = useState(false);

    // =====================================================
    // CHARGER LES STOCKS
    // =====================================================

    const chargerStocks = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(`${API_URL}/stocks`);

            setStocks(response.data);
        } catch (error) {
            console.error("Erreur récupération stocks :", error);

            setError(
                error.response?.data?.message ||
                "Impossible de récupérer les stocks."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // CHARGER LES MOUVEMENTS
    // =====================================================

    const chargerMouvements = async () => {
        try {
            setLoadingMouvements(true);

            const response = await axios.get(
                `${API_URL}/stocks/mouvements`
            );

            setMouvements(response.data);
        } catch (error) {
            console.error(
                "Erreur récupération mouvements :",
                error
            );
        } finally {
            setLoadingMouvements(false);
        }
    };

    // =====================================================
    // CHARGEMENT INITIAL
    // =====================================================

    useEffect(() => {
        chargerStocks();
        chargerMouvements();
    }, []);

    // =====================================================
    // ACTUALISER
    // =====================================================

    const actualiser = () => {
        chargerStocks();
        chargerMouvements();
    };

    // =====================================================
    // RECHERCHE
    // =====================================================

    const stocksFiltres = stocks.filter((stock) => {
        const texte = recherche.toLowerCase();

        return (
            stock.libelle?.toLowerCase().includes(texte) ||
            stock.code?.toLowerCase().includes(texte)
        );
    });

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const totalProduits = stocks.length;

    const stockFaible = stocks.filter(
        (stock) => stock.etat === "STOCK FAIBLE"
    ).length;

    const ruptures = stocks.filter(
        (stock) => stock.etat === "RUPTURE"
    ).length;

    const produitsDisponibles = stocks.filter(
        (stock) => Number(stock.stock_actuel) > 0
    ).length;

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formaterDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // =====================================================
    // CLASSIFICATION DES MOUVEMENTS
    // =====================================================

    const getMouvementClass = (type) => {
        switch (type) {
            case "ENTREE":
                return "mouvement-entree";

            case "SORTIE":
                return "mouvement-sortie";

            case "PERTE":
                return "mouvement-perte";

            case "INVENTAIRE":
                return "mouvement-inventaire";

            default:
                return "";
        }
    };

    // =====================================================
    // SORTIE : OUVRIR
    // =====================================================

    const ouvrirSortie = (stock) => {
        setProduitSortie(stock);

        setSortieForm({
            quantite: "",
            motif: "",
            reference: "",
        });

        setProduitPerte(null);
        setProduitInventaire(null);

        setError("");
        setMessage("");
    };

    // =====================================================
    // SORTIE : FERMER
    // =====================================================

    const fermerSortie = () => {
        setProduitSortie(null);

        setSortieForm({
            quantite: "",
            motif: "",
            reference: "",
        });
    };

    // =====================================================
    // SORTIE : MODIFICATION
    // =====================================================

    const handleSortieChange = (e) => {
        const { name, value } = e.target;

        setSortieForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // SORTIE : ENREGISTRER
    // =====================================================

    const enregistrerSortie = async (e) => {
        e.preventDefault();

        if (!produitSortie) return;

        const quantite = Number(sortieForm.quantite);

        if (!quantite || quantite <= 0) {
            setError("La quantité doit être supérieure à 0.");
            return;
        }

        if (
            quantite >
            Number(produitSortie.stock_actuel)
        ) {
            setError(
                `Stock insuffisant. Stock disponible : ${produitSortie.stock_actuel}.`
            );
            return;
        }

        if (!sortieForm.motif.trim()) {
            setError(
                "Veuillez renseigner le motif de la sortie."
            );
            return;
        }

        try {
            setLoadingSortie(true);
            setError("");
            setMessage("");

            await axios.post(`${API_URL}/stocks/sortie`, {
                id_produit: produitSortie.id_produit,
                quantite: quantite,
                motif: sortieForm.motif.trim(),
                reference:
                    sortieForm.reference.trim() || null,
            });

            setMessage(
                `Sortie de ${quantite} unité(s) enregistrée pour "${produitSortie.libelle}".`
            );

            fermerSortie();

            await chargerStocks();
            await chargerMouvements();
        } catch (error) {
            console.error(
                "Erreur sortie stock :",
                error
            );

            setError(
                error.response?.data?.message ||
                "Impossible d'enregistrer la sortie."
            );
        } finally {
            setLoadingSortie(false);
        }
    };

    // =====================================================
    // PERTE : OUVRIR
    // =====================================================

    const ouvrirPerte = (stock) => {
        setProduitPerte(stock);

        setPerteForm({
            quantite: "",
            motif: "",
            reference: "",
        });

        setProduitSortie(null);
        setProduitInventaire(null);

        setError("");
        setMessage("");
    };

    // =====================================================
    // PERTE : FERMER
    // =====================================================

    const fermerPerte = () => {
        setProduitPerte(null);

        setPerteForm({
            quantite: "",
            motif: "",
            reference: "",
        });
    };

    // =====================================================
    // PERTE : MODIFICATION
    // =====================================================

    const handlePerteChange = (e) => {
        const { name, value } = e.target;

        setPerteForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // PERTE : ENREGISTRER
    // =====================================================

    const enregistrerPerte = async (e) => {
        e.preventDefault();

        if (!produitPerte) return;

        const quantite = Number(perteForm.quantite);

        if (!quantite || quantite <= 0) {
            setError(
                "La quantité perdue doit être supérieure à 0."
            );
            return;
        }

        if (
            quantite >
            Number(produitPerte.stock_actuel)
        ) {
            setError(
                `Stock insuffisant. Stock disponible : ${produitPerte.stock_actuel}.`
            );
            return;
        }

        if (!perteForm.motif.trim()) {
            setError(
                "Veuillez renseigner le motif de la perte."
            );
            return;
        }

        try {
            setLoadingPerte(true);
            setError("");
            setMessage("");

            const response = await axios.post(
                `${API_URL}/stocks/perte`,
                {
                    id_produit: produitPerte.id_produit,
                    quantite: quantite,
                    motif: perteForm.motif.trim(),
                    reference:
                        perteForm.reference.trim() || null,
                }
            );

            setMessage(
                `Perte de ${quantite} unité(s) enregistrée pour "${produitPerte.libelle}". Stock restant : ${response.data.nouveau_stock}.`
            );

            fermerPerte();

            await chargerStocks();
            await chargerMouvements();
        } catch (error) {
            console.error(
                "Erreur perte stock :",
                error
            );

            setError(
                error.response?.data?.message ||
                "Impossible d'enregistrer la perte."
            );
        } finally {
            setLoadingPerte(false);
        }
    };

    // =====================================================
    // INVENTAIRE : OUVRIR
    // =====================================================

    const ouvrirInventaire = (stock) => {
        setProduitInventaire(stock);

        setInventaireForm({
            stock_reel: "",
            motif: "",
            reference: "",
        });

        setProduitSortie(null);
        setProduitPerte(null);

        setError("");
        setMessage("");
    };

    // =====================================================
    // INVENTAIRE : FERMER
    // =====================================================

    const fermerInventaire = () => {
        setProduitInventaire(null);

        setInventaireForm({
            stock_reel: "",
            motif: "",
            reference: "",
        });
    };

    // =====================================================
    // INVENTAIRE : MODIFICATION
    // =====================================================

    const handleInventaireChange = (e) => {
        const { name, value } = e.target;

        setInventaireForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // INVENTAIRE : CALCUL DE L'ÉCART
    // =====================================================

    const stockActuelInventaire = produitInventaire
        ? Number(produitInventaire.stock_actuel)
        : 0;

    const stockReelSaisi =
        inventaireForm.stock_reel === ""
            ? null
            : Number(inventaireForm.stock_reel);

    const ecartInventaire =
        stockReelSaisi === null
            ? null
            : stockReelSaisi - stockActuelInventaire;

    // =====================================================
    // INVENTAIRE : ENREGISTRER
    // =====================================================

    const enregistrerInventaire = async (e) => {
        e.preventDefault();

        if (!produitInventaire) return;

        const stockReel = Number(
            inventaireForm.stock_reel
        );

        if (
            inventaireForm.stock_reel === "" ||
            Number.isNaN(stockReel) ||
            stockReel < 0
        ) {
            setError(
                "Le stock réel doit être un nombre supérieur ou égal à 0."
            );
            return;
        }

        if (!inventaireForm.motif.trim()) {
            setError(
                "Veuillez renseigner le motif de l'inventaire."
            );
            return;
        }

        if (stockReel === stockActuelInventaire) {
            setError(
                "Aucun écart détecté. Le stock réel est identique au stock du système."
            );
            return;
        }

        try {
            setLoadingInventaire(true);
            setError("");
            setMessage("");

            const response = await axios.post(
                `${API_URL}/stocks/inventaire`,
                {
                    id_produit:
                        produitInventaire.id_produit,
                    stock_reel: stockReel,
                    motif:
                        inventaireForm.motif.trim(),
                    reference:
                        inventaireForm.reference.trim() ||
                        null,
                }
            );

            setMessage(
                `Inventaire enregistré pour "${produitInventaire.libelle}". Nouveau stock : ${response.data.nouveau_stock}.`
            );

            fermerInventaire();

            await chargerStocks();
            await chargerMouvements();
        } catch (error) {
            console.error(
                "Erreur inventaire stock :",
                error
            );

            setError(
                error.response?.data?.message ||
                "Impossible d'enregistrer l'inventaire."
            );
        } finally {
            setLoadingInventaire(false);
        }
    };

    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (
        <div className="stocks-page">

            {/* =================================================
                EN-TÊTE
            ================================================= */}

            <div className="page-header">

                <div>
                    <h1>Gestion du stock</h1>

                    <p>
                        Consultez l'état actuel des produits
                        et l'historique des mouvements.
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={actualiser}
                >
                    🔄 Actualiser
                </button>

            </div>

            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {/* =================================================
                STATISTIQUES
            ================================================= */}

            <div className="stocks-stats">

                <div className="stat-card">
                    <div className="stat-label">
                        Total produits
                    </div>

                    <div className="stat-value">
                        {totalProduits}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">
                        Produits disponibles
                    </div>

                    <div className="stat-value">
                        {produitsDisponibles}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">
                        Stock faible
                    </div>

                    <div className="stat-value">
                        {stockFaible}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">
                        Ruptures
                    </div>

                    <div className="stat-value">
                        {ruptures}
                    </div>
                </div>

            </div>

            {/* =================================================
                STOCK ACTUEL
            ================================================= */}

            <div className="section-header">

                <div>
                    <h2>Stock actuel</h2>

                    <p>
                        Situation actuelle des produits.
                    </p>
                </div>

            </div>

            {/* =================================================
                RECHERCHE
            ================================================= */}

            <div className="search-container">

                <input
                    type="text"
                    placeholder="🔎 Rechercher un produit ou un code..."
                    value={recherche}
                    onChange={(e) =>
                        setRecherche(e.target.value)
                    }
                />

            </div>

            {/* =================================================
                TABLE STOCK
            ================================================= */}

            <div className="table-container">

                {loading ? (

                    <div className="empty">
                        Chargement des stocks...
                    </div>

                ) : stocksFiltres.length === 0 ? (

                    <div className="empty">
                        Aucun produit trouvé.
                    </div>

                ) : (

                    <table>

                        <thead>

                            <tr>
                                <th>Code</th>
                                <th>Produit</th>
                                <th>Unité</th>
                                <th>Prix achat</th>
                                <th>Prix vente</th>
                                <th>Stock actuel</th>
                                <th>Minimum</th>
                                <th>État</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {stocksFiltres.map((stock) => (

                                <tr
                                    key={stock.id_produit}
                                >

                                    <td>
                                        <strong>
                                            {stock.code || "-"}
                                        </strong>
                                    </td>

                                    <td>
                                        {stock.libelle}
                                    </td>

                                    <td>
                                        {stock.unite}
                                    </td>

                                    <td>
                                        {Number(
                                            stock.prix_achat
                                        ).toLocaleString(
                                            "fr-FR"
                                        )}{" "}
                                        FCFA
                                    </td>

                                    <td>
                                        {Number(
                                            stock.prix_vente
                                        ).toLocaleString(
                                            "fr-FR"
                                        )}{" "}
                                        FCFA
                                    </td>

                                    <td>
                                        <strong>
                                            {Number(
                                                stock.stock_actuel
                                            ).toLocaleString(
                                                "fr-FR"
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        {Number(
                                            stock.stock_minimum
                                        ).toLocaleString(
                                            "fr-FR"
                                        )}
                                    </td>

                                    <td>

                                        <span
                                            className={`badge ${
                                                stock.etat ===
                                                "RUPTURE"
                                                    ? "badge-rupture"
                                                    : stock.etat ===
                                                      "STOCK FAIBLE"
                                                    ? "badge-faible"
                                                    : "badge-ok"
                                            }`}
                                        >
                                            {stock.etat}
                                        </span>

                                    </td>

                                    <td>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                flexWrap:
                                                    "wrap",
                                            }}
                                        >

                                            <button
                                                className="btn-action btn-sortie"
                                                onClick={() =>
                                                    ouvrirSortie(
                                                        stock
                                                    )
                                                }
                                                disabled={
                                                    Number(
                                                        stock.stock_actuel
                                                    ) <= 0
                                                }
                                            >
                                                📤 Sortie
                                            </button>

                                            <button
                                                className="btn-action btn-perte"
                                                onClick={() =>
                                                    ouvrirPerte(
                                                        stock
                                                    )
                                                }
                                                disabled={
                                                    Number(
                                                        stock.stock_actuel
                                                    ) <= 0
                                                }
                                            >
                                                🗑️ Perte
                                            </button>

                                            <button
                                                className="btn-action btn-inventaire"
                                                onClick={() =>
                                                    ouvrirInventaire(
                                                        stock
                                                    )
                                                }
                                            >
                                                🧮 Inventaire
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                )}

            </div>

            {/* =================================================
                HISTORIQUE
            ================================================= */}

            <div className="section-header mouvements-section">

                <div>

                    <h2>
                        Historique des mouvements
                    </h2>

                    <p>
                        Toutes les entrées, sorties, pertes
                        et opérations d'inventaire.
                    </p>

                </div>

            </div>

            <div className="table-container">

                {loadingMouvements ? (

                    <div className="empty">
                        Chargement des mouvements...
                    </div>

                ) : mouvements.length === 0 ? (

                    <div className="empty">
                        Aucun mouvement de stock enregistré.
                    </div>

                ) : (

                    <table>

                        <thead>

                            <tr>
                                <th>Date</th>
                                <th>Produit</th>
                                <th>Type</th>
                                <th>Quantité</th>
                                <th>Motif</th>
                                <th>Référence</th>
                            </tr>

                        </thead>

                        <tbody>

                            {mouvements.map((mouvement) => (

                                <tr
                                    key={
                                        mouvement.id_mouvement
                                    }
                                >

                                    <td>
                                        {formaterDate(
                                            mouvement.date_mouvement
                                        )}
                                    </td>

                                    <td>
                                        <strong>
                                            {mouvement.libelle ||
                                                mouvement.produit ||
                                                "-"}
                                        </strong>
                                    </td>

                                    <td>

                                        <span
                                            className={`mouvement-badge ${getMouvementClass(
                                                mouvement.type_mouvement
                                            )}`}
                                        >
                                            {
                                                mouvement.type_mouvement
                                            }
                                        </span>

                                    </td>

                                    <td>
                                        <strong>
                                            {Number(
                                                mouvement.quantite
                                            ).toLocaleString(
                                                "fr-FR"
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        {mouvement.motif ||
                                            "-"}
                                    </td>

                                    <td>
                                        {mouvement.reference ||
                                            "-"}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                )}

            </div>

            {/* =================================================
                MODAL SORTIE
            ================================================= */}

            {produitSortie && (

                <div className="modal-overlay">

                    <div className="stock-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    📤 Sortie de stock
                                </h2>

                                <p>
                                    {
                                        produitSortie.libelle
                                    }
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={fermerSortie}
                            >
                                ✕
                            </button>

                        </div>

                        <div className="stock-info">

                            <div>
                                <span>
                                    Stock actuel
                                </span>

                                <strong>
                                    {
                                        produitSortie.stock_actuel
                                    }{" "}
                                    {
                                        produitSortie.unite
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Stock minimum
                                </span>

                                <strong>
                                    {
                                        produitSortie.stock_minimum
                                    }{" "}
                                    {
                                        produitSortie.unite
                                    }
                                </strong>
                            </div>

                        </div>

                        <form
                            onSubmit={
                                enregistrerSortie
                            }
                        >

                            <div className="form-group">

                                <label>
                                    Quantité *
                                </label>

                                <input
                                    type="number"
                                    name="quantite"
                                    min="1"
                                    max={
                                        produitSortie.stock_actuel
                                    }
                                    value={
                                        sortieForm.quantite
                                    }
                                    onChange={
                                        handleSortieChange
                                    }
                                    placeholder="Ex : 5"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Motif *
                                </label>

                                <input
                                    type="text"
                                    name="motif"
                                    value={
                                        sortieForm.motif
                                    }
                                    onChange={
                                        handleSortieChange
                                    }
                                    placeholder="Ex : Consommation restaurant"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Référence
                                </label>

                                <input
                                    type="text"
                                    name="reference"
                                    value={
                                        sortieForm.reference
                                    }
                                    onChange={
                                        handleSortieChange
                                    }
                                    placeholder="Ex : BON-001"
                                />

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={
                                        fermerSortie
                                    }
                                    disabled={
                                        loadingSortie
                                    }
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={
                                        loadingSortie
                                    }
                                >
                                    {loadingSortie
                                        ? "Enregistrement..."
                                        : "Enregistrer la sortie"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =================================================
                MODAL PERTE
            ================================================= */}

            {produitPerte && (

                <div className="modal-overlay">

                    <div className="stock-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    🗑️ Déclarer une perte
                                </h2>

                                <p>
                                    {produitPerte.libelle}
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={
                                    fermerPerte
                                }
                            >
                                ✕
                            </button>

                        </div>

                        <div className="stock-info">

                            <div>
                                <span>
                                    Stock actuel
                                </span>

                                <strong>
                                    {
                                        produitPerte.stock_actuel
                                    }{" "}
                                    {
                                        produitPerte.unite
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Stock minimum
                                </span>

                                <strong>
                                    {
                                        produitPerte.stock_minimum
                                    }{" "}
                                    {
                                        produitPerte.unite
                                    }
                                </strong>
                            </div>

                        </div>

                        <form
                            onSubmit={
                                enregistrerPerte
                            }
                        >

                            <div className="form-group">

                                <label>
                                    Quantité perdue *
                                </label>

                                <input
                                    type="number"
                                    name="quantite"
                                    min="1"
                                    max={
                                        produitPerte.stock_actuel
                                    }
                                    value={
                                        perteForm.quantite
                                    }
                                    onChange={
                                        handlePerteChange
                                    }
                                    placeholder="Ex : 3"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Motif de la perte *
                                </label>

                                <select
                                    name="motif"
                                    value={
                                        perteForm.motif
                                    }
                                    onChange={
                                        handlePerteChange
                                    }
                                    required
                                >

                                    <option value="">
                                        Sélectionner un motif
                                    </option>

                                    <option value="Produit cassé">
                                        Produit cassé
                                    </option>

                                    <option value="Produit avarié">
                                        Produit avarié
                                    </option>

                                    <option value="Produit périmé">
                                        Produit périmé
                                    </option>

                                    <option value="Produit détérioré">
                                        Produit détérioré
                                    </option>

                                    <option value="Perte inconnue">
                                        Perte inconnue
                                    </option>

                                    <option value="Autre">
                                        Autre
                                    </option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Référence
                                </label>

                                <input
                                    type="text"
                                    name="reference"
                                    value={
                                        perteForm.reference
                                    }
                                    onChange={
                                        handlePerteChange
                                    }
                                    placeholder="Ex : PERTE-001"
                                />

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={
                                        fermerPerte
                                    }
                                    disabled={
                                        loadingPerte
                                    }
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={
                                        loadingPerte
                                    }
                                >
                                    {loadingPerte
                                        ? "Enregistrement..."
                                        : "Enregistrer la perte"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =================================================
                MODAL INVENTAIRE
            ================================================= */}

            {produitInventaire && (

                <div className="modal-overlay">

                    <div className="stock-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    🧮 Inventaire physique
                                </h2>

                                <p>
                                    {
                                        produitInventaire.libelle
                                    }
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={
                                    fermerInventaire
                                }
                            >
                                ✕
                            </button>

                        </div>

                        <div className="stock-info">

                            <div>
                                <span>
                                    Stock dans le système
                                </span>

                                <strong>
                                    {
                                        stockActuelInventaire
                                    }{" "}
                                    {
                                        produitInventaire.unite
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Stock réellement compté
                                </span>

                                <strong>
                                    {stockReelSaisi === null
                                        ? "-"
                                        : stockReelSaisi}{" "}
                                    {
                                        produitInventaire.unite
                                    }
                                </strong>
                            </div>

                        </div>

                        <form
                            onSubmit={
                                enregistrerInventaire
                            }
                        >

                            <div className="form-group">

                                <label>
                                    Stock réel compté *
                                </label>

                                <input
                                    type="number"
                                    name="stock_reel"
                                    min="0"
                                    step="1"
                                    value={
                                        inventaireForm.stock_reel
                                    }
                                    onChange={
                                        handleInventaireChange
                                    }
                                    placeholder="Ex : 28"
                                    required
                                />

                            </div>

                            {/* ÉCART */}

                            {stockReelSaisi !== null && (

                                <div
                                    className="stock-info"
                                    style={{
                                        marginTop: "15px",
                                    }}
                                >

                                    <div>
                                        <span>
                                            Écart
                                        </span>

                                        <strong>
                                            {ecartInventaire > 0
                                                ? `+${ecartInventaire}`
                                                : ecartInventaire}{" "}
                                            {
                                                produitInventaire.unite
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Nouveau stock
                                        </span>

                                        <strong>
                                            {
                                                stockReelSaisi
                                            }{" "}
                                            {
                                                produitInventaire.unite
                                            }
                                        </strong>
                                    </div>

                                </div>

                            )}

                            <div className="form-group">

                                <label>
                                    Motif *
                                </label>

                                <input
                                    type="text"
                                    name="motif"
                                    value={
                                        inventaireForm.motif
                                    }
                                    onChange={
                                        handleInventaireChange
                                    }
                                    placeholder="Ex : Inventaire mensuel"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Référence
                                </label>

                                <input
                                    type="text"
                                    name="reference"
                                    value={
                                        inventaireForm.reference
                                    }
                                    onChange={
                                        handleInventaireChange
                                    }
                                    placeholder="Ex : INV-001"
                                />

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={
                                        fermerInventaire
                                    }
                                    disabled={
                                        loadingInventaire
                                    }
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={
                                        loadingInventaire ||
                                        stockReelSaisi === null ||
                                        ecartInventaire === 0
                                    }
                                >
                                    {loadingInventaire
                                        ? "Enregistrement..."
                                        : "Valider l'inventaire"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Stocks;
