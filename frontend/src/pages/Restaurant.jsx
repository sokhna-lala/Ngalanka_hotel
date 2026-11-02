import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Restaurant.css";

const API = "http://localhost:5000/api";

function Restaurant() {
    const navigate = useNavigate();

    const [produits, setProduits] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    const [recherche, setRecherche] = useState("");
    const [categorieActive, setCategorieActive] = useState("TOUS");

    // =====================================================
    // CHARGER LES PRODUITS
    // =====================================================
    const chargerProduits = async () => {
        try {
            setChargement(true);
            setErreur("");

            const response = await axios.get(
                `${API}/produits`
            );

            const produitsRestaurant =
                response.data.filter(
                    (produit) =>
                        produit.type_categorie === "RESTAURANT"
                );

            setProduits(produitsRestaurant);
        } catch (error) {
            console.error(
                "Erreur chargement restaurant :",
                error
            );

            setErreur(
                "Impossible de charger les produits du restaurant."
            );
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        chargerProduits();
    }, []);

    // =====================================================
    // CATÉGORIES
    // =====================================================
    const categories = useMemo(() => {
        return [
            ...new Set(
                produits
                    .map((produit) => produit.categorie)
                    .filter(Boolean)
            ),
        ];
    }, [produits]);

    // =====================================================
    // PRODUITS FILTRÉS
    // =====================================================
    const produitsFiltres = useMemo(() => {
        const texte =
            recherche.toLowerCase().trim();

        return produits.filter((produit) => {
            const correspondRecherche =
                !texte ||
                produit.libelle
                    ?.toLowerCase()
                    .includes(texte) ||
                produit.code
                    ?.toLowerCase()
                    .includes(texte);

            const correspondCategorie =
                categorieActive === "TOUS" ||
                produit.categorie === categorieActive;

            return (
                correspondRecherche &&
                correspondCategorie
            );
        });
    }, [
        produits,
        recherche,
        categorieActive,
    ]);

    // =====================================================
    // FORMAT PRIX
    // =====================================================
    const formatPrix = (prix) => {
        return (
            Number(prix || 0).toLocaleString("fr-FR") +
            " FCFA"
        );
    };

    // =====================================================
    // STOCK
    // =====================================================
    const produitDisponible = (produit) => {
        return (
            produit.statut === "ACTIF" &&
            Number(produit.stock_actuel || 0) > 0
        );
    };

    // =====================================================
    // COMMANDER
    // =====================================================
    const commanderProduit = (produit) => {
        if (!produitDisponible(produit)) {
            return;
        }

        navigate("/commandes", {
            state: {
                ouvrirFormulaire: true,
                produit: {
                    id_produit: produit.id_produit,
                    libelle: produit.libelle,
                    prix_vente: Number(
                        produit.prix_vente || 0
                    ),
                },
                typeCommande: "RESTAURANT",
            },
        });
    };

    // =====================================================
    // AFFICHAGE
    // =====================================================
    return (
        <div className="restaurant-page">

            {/* =================================================
                EN-TÊTE
            ================================================= */}
            <div className="restaurant-header">

                <div>
                    <h1>🍽️ Restaurant</h1>

                    <p>
                        Gestion du menu et des produits
                        du restaurant
                    </p>
                </div>

                <button
                    className="btn-commandes"
                    onClick={() =>
                        navigate("/commandes")
                    }
                >
                    📋 Voir les commandes
                </button>

            </div>

            {/* =================================================
                STATISTIQUES
            ================================================= */}
            <div className="restaurant-stats">

                <div className="restaurant-stat-card">
                    <span>
                        Produits
                    </span>

                    <strong>
                        {produits.length}
                    </strong>
                </div>

                <div className="restaurant-stat-card">
                    <span>
                        Catégories
                    </span>

                    <strong>
                        {categories.length}
                    </strong>
                </div>

                <div className="restaurant-stat-card">
                    <span>
                        Disponibles
                    </span>

                    <strong>
                        {
                            produits.filter(
                                (produit) =>
                                    produitDisponible(
                                        produit
                                    )
                            ).length
                        }
                    </strong>
                </div>

                <div className="restaurant-stat-card">
                    <span>
                        Indisponibles
                    </span>

                    <strong>
                        {
                            produits.filter(
                                (produit) =>
                                    !produitDisponible(
                                        produit
                                    )
                            ).length
                        }
                    </strong>
                </div>

            </div>

            {/* =================================================
                RECHERCHE
            ================================================= */}
            <div className="restaurant-toolbar">

                <input
                    type="text"
                    placeholder="🔍 Rechercher un plat..."
                    value={recherche}
                    onChange={(e) =>
                        setRecherche(
                            e.target.value
                        )
                    }
                />

            </div>

            {/* =================================================
                CATÉGORIES
            ================================================= */}
            <div className="restaurant-categories">

                <button
                    className={
                        categorieActive === "TOUS"
                            ? "categorie-active"
                            : ""
                    }
                    onClick={() =>
                        setCategorieActive("TOUS")
                    }
                >
                    Tous
                </button>

                {categories.map(
                    (categorie) => (
                        <button
                            key={categorie}
                            className={
                                categorieActive ===
                                categorie
                                    ? "categorie-active"
                                    : ""
                            }
                            onClick={() =>
                                setCategorieActive(
                                    categorie
                                )
                            }
                        >
                            {categorie}
                        </button>
                    )
                )}

            </div>

            {/* =================================================
                CHARGEMENT
            ================================================= */}
            {chargement && (
                <div className="restaurant-message">
                    Chargement des produits...
                </div>
            )}

            {/* =================================================
                ERREUR
            ================================================= */}
            {erreur && (
                <div className="restaurant-error">
                    {erreur}
                </div>
            )}

            {/* =================================================
                PRODUITS
            ================================================= */}
            {!chargement &&
                !erreur &&
                produitsFiltres.length > 0 && (

                    <div className="restaurant-grid">

                        {produitsFiltres.map(
                            (produit) => {

                                const disponible =
                                    produitDisponible(
                                        produit
                                    );

                                return (
                                    <div
                                        className="restaurant-product-card"
                                        key={
                                            produit.id_produit
                                        }
                                    >

                                        <div className="product-icon">
                                            🍽️
                                        </div>

                                        <div className="product-content">

                                            <div className="product-top">

                                                <span className="product-category">
                                                    {
                                                        produit.categorie ||
                                                        "Restaurant"
                                                    }
                                                </span>

                                                <span
                                                    className={
                                                        disponible
                                                            ? "product-status disponible"
                                                            : "product-status rupture"
                                                    }
                                                >
                                                    {disponible
                                                        ? "Disponible"
                                                        : "Indisponible"}
                                                </span>

                                            </div>

                                            <h3>
                                                {
                                                    produit.libelle
                                                }
                                            </h3>

                                            {produit.code && (
                                                <small>
                                                    Code :{" "}
                                                    {
                                                        produit.code
                                                    }
                                                </small>
                                            )}

                                            <div className="product-bottom">

                                                <strong>
                                                    {
                                                        formatPrix(
                                                            produit.prix_vente
                                                        )
                                                    }
                                                </strong>

                                                <span>
                                                    Stock :{" "}
                                                    {
                                                        produit.stock_actuel ??
                                                        0
                                                    }
                                                </span>

                                            </div>

                                            <button
                                                type="button"
                                                className="btn-commander-produit"
                                                disabled={
                                                    !disponible
                                                }
                                                onClick={() =>
                                                    commanderProduit(
                                                        produit
                                                    )
                                                }
                                            >
                                                {disponible
                                                    ? "🛒 Commander"
                                                    : "Indisponible"}
                                            </button>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            {/* =================================================
                AUCUN PRODUIT
            ================================================= */}
            {!chargement &&
                !erreur &&
                produitsFiltres.length === 0 && (

                    <div className="restaurant-empty">

                        <div className="empty-icon">
                            🍽️
                        </div>

                        <h2>
                            Aucun produit restaurant
                        </h2>

                        <p>
                            Aucun produit avec la
                            catégorie « RESTAURANT »
                            n'a encore été enregistré.
                        </p>

                    </div>
                )}

        </div>
    );
}

export default Restaurant;