import { useEffect, useMemo, useState } from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";
import axios from "axios";
import "./Commandes.css";

const API = "http://localhost:5000/api";

function Commandes() {
    const navigate = useNavigate();
    const location = useLocation();

    // =====================================================
    // DONNÉES
    // =====================================================
    const [commandes, setCommandes] = useState([]);
    const [produits, setProduits] = useState([]);
    const [sejoursActifs, setSejoursActifs] = useState([]);

    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");

    // =====================================================
    // FORMULAIRE
    // =====================================================
    const [afficherFormulaire, setAfficherFormulaire] =
        useState(false);

    const [typeCommande, setTypeCommande] =
        useState("RESTAURANT");

    const [typeClient, setTypeClient] =
        useState("PASSAGE");

    const [sejourSelectionne, setSejourSelectionne] =
        useState("");

    const [tableNumero, setTableNumero] =
        useState("");

    const [observation, setObservation] =
        useState("");

    const [lignes, setLignes] =
        useState([]);

    const [produitSelectionne, setProduitSelectionne] =
        useState("");

    const [quantite, setQuantite] =
        useState(1);

    const [recherche, setRecherche] =
        useState("");

    const [commandeDepuisRestaurant, setCommandeDepuisRestaurant] =
        useState(false);

    // =====================================================
    // CHARGER LES DONNÉES
    // =====================================================
    useEffect(() => {
        chargerDonnees();
    }, []);

    const chargerDonnees = async () => {
        try {
            setChargement(true);
            setErreur("");

            const [
                commandesResponse,
                produitsResponse,
                sejoursResponse
            ] = await Promise.all([
                axios.get(`${API}/commandes`),
                axios.get(`${API}/produits`),
                axios.get(
                    `${API}/commandes/sejours-actifs`
                )
            ]);

            setCommandes(
                commandesResponse.data
            );

            setProduits(
                produitsResponse.data
            );

            setSejoursActifs(
                sejoursResponse.data
            );

        } catch (error) {
            console.error(
                "Erreur chargement données :",
                error
            );

            setErreur(
                error.response?.data?.message ||
                "Impossible de charger les données"
            );
        } finally {
            setChargement(false);
        }
    };

    // =====================================================
    // PRODUIT TRANSMIS DEPUIS RESTAURANT
    // =====================================================
    useEffect(() => {
        if (!location.state?.ouvrirFormulaire) {
            return;
        }

        const produit =
            location.state?.produit;

        if (produit) {
            setAfficherFormulaire(true);

            setTypeCommande(
                location.state?.typeCommande ||
                "RESTAURANT"
            );

            setTypeClient("PASSAGE");

            setSejourSelectionne("");

            setTableNumero("");

            setObservation("");

            setLignes([
                {
                    id_produit:
                        produit.id_produit,

                    libelle:
                        produit.libelle,

                    prix_vente:
                        Number(
                            produit.prix_vente || 0
                        ),

                    quantite: 1
                }
            ]);

            setProduitSelectionne("");

            setQuantite(1);

            setCommandeDepuisRestaurant(true);

            setErreur("");
            setMessage("");
        }

        // Nettoyage du state de navigation
        navigate("/commandes", {
            replace: true,
            state: {}
        });

    }, [
        location.state,
        navigate
    ]);

    // =====================================================
    // PRODUITS DISPONIBLES
    // =====================================================
    const produitsDisponibles = useMemo(() => {
        return produits.filter((produit) => {

            // Produit inactif
            if (
                produit.statut &&
                produit.statut !== "ACTIF"
            ) {
                return false;
            }

            // Restaurant
            if (
                typeCommande ===
                "RESTAURANT"
            ) {
                return (
                    !produit.type_categorie ||
                    produit.type_categorie ===
                        "RESTAURANT" ||
                    produit.type_categorie ===
                        "AUTRE"
                );
            }

            // Bar
            if (
                typeCommande === "BAR"
            ) {
                return (
                    !produit.type_categorie ||
                    produit.type_categorie ===
                        "BAR" ||
                    produit.type_categorie ===
                        "AUTRE"
                );
            }

            return true;
        });
    }, [
        produits,
        typeCommande
    ]);

    // =====================================================
    // SÉJOUR SÉLECTIONNÉ
    // =====================================================
    const sejourActuel = useMemo(() => {
        return sejoursActifs.find(
            (sejour) =>
                String(
                    sejour.id_sejour
                ) ===
                String(
                    sejourSelectionne
                )
        );
    }, [
        sejoursActifs,
        sejourSelectionne
    ]);

    // =====================================================
    // TOTAL COMMANDE
    // =====================================================
    const totalCommande = useMemo(() => {
        return lignes.reduce(
            (total, ligne) =>
                total +
                Number(
                    ligne.quantite
                ) *
                Number(
                    ligne.prix_vente
                ),
            0
        );
    }, [lignes]);

    // =====================================================
    // AJOUTER UN PRODUIT
    // =====================================================
    const ajouterProduit = () => {

        if (!produitSelectionne) {
            setErreur(
                "Sélectionnez un produit"
            );
            return;
        }

        const produit =
            produits.find(
                (item) =>
                    String(
                        item.id_produit
                    ) ===
                    String(
                        produitSelectionne
                    )
            );

        if (!produit) {
            setErreur(
                "Produit introuvable"
            );
            return;
        }

        const qte =
            Number(quantite);

        if (
            !Number.isFinite(qte) ||
            qte <= 0
        ) {
            setErreur(
                "La quantité doit être supérieure à 0"
            );
            return;
        }

        const ligneExistante =
            lignes.find(
                (ligne) =>
                    ligne.id_produit ===
                    produit.id_produit
            );

        if (ligneExistante) {

            setLignes(
                lignes.map(
                    (ligne) =>
                        ligne.id_produit ===
                        produit.id_produit
                            ? {
                                  ...ligne,
                                  quantite:
                                      Number(
                                          ligne.quantite
                                      ) + qte
                              }
                            : ligne
                )
            );

        } else {

            setLignes([
                ...lignes,
                {
                    id_produit:
                        produit.id_produit,

                    libelle:
                        produit.libelle,

                    prix_vente:
                        Number(
                            produit.prix_vente ||
                            0
                        ),

                    quantite: qte
                }
            ]);
        }

        setProduitSelectionne("");
        setQuantite(1);
        setErreur("");
    };

    // =====================================================
    // MODIFIER QUANTITÉ
    // =====================================================
    const modifierQuantite = (
        idProduit,
        nouvelleQuantite
    ) => {

        const qte =
            Number(
                nouvelleQuantite
            );

        if (
            !Number.isFinite(qte) ||
            qte <= 0
        ) {
            return;
        }

        setLignes(
            lignes.map(
                (ligne) =>
                    ligne.id_produit ===
                    idProduit
                        ? {
                              ...ligne,
                              quantite: qte
                          }
                        : ligne
            )
        );
    };

    // =====================================================
    // SUPPRIMER LIGNE
    // =====================================================
    const supprimerLigne = (
        idProduit
    ) => {
        setLignes(
            lignes.filter(
                (ligne) =>
                    ligne.id_produit !==
                    idProduit
            )
        );
    };

    // =====================================================
    // CHANGEMENT TYPE COMMANDE
    // =====================================================
    const changerTypeCommande = (
        nouveauType
    ) => {

        setTypeCommande(
            nouveauType
        );

        setProduitSelectionne("");

        /*
         * Room service = obligatoirement
         * un client hébergé.
         */
        if (
            nouveauType ===
            "ROOM_SERVICE"
        ) {
            setTypeClient(
                "HEBERGE"
            );
        }
    };

    // =====================================================
    // CHANGEMENT TYPE CLIENT
    // =====================================================
    const changerTypeClient = (
        nouveauType
    ) => {

        setTypeClient(
            nouveauType
        );

        /*
         * Si client de passage,
         * on efface le séjour.
         */
        if (
            nouveauType ===
            "PASSAGE"
        ) {
            setSejourSelectionne("");
        }
    };

    // =====================================================
    // CRÉER COMMANDE
    // =====================================================
    const creerCommande = async (
        e
    ) => {

        e.preventDefault();

        try {

            setErreur("");
            setMessage("");

            // ---------------------------------------------
            // Vérification produits
            // ---------------------------------------------
            if (
                lignes.length === 0
            ) {
                setErreur(
                    "Ajoutez au moins un produit à la commande"
                );
                return;
            }

            // ---------------------------------------------
            // Room service
            // ---------------------------------------------
            if (
                typeCommande ===
                "ROOM_SERVICE"
            ) {

                if (
                    !sejourSelectionne
                ) {
                    setErreur(
                        "Sélectionnez un séjour pour le room service"
                    );
                    return;
                }
            }

            // ---------------------------------------------
            // Client hébergé
            // ---------------------------------------------
            if (
                typeClient ===
                    "HEBERGE" &&
                !sejourSelectionne
            ) {
                setErreur(
                    "Sélectionnez le séjour du client hébergé"
                );
                return;
            }

            // ---------------------------------------------
            // Table
            // ---------------------------------------------
            if (
                typeCommande !==
                    "ROOM_SERVICE" &&
                !tableNumero.trim()
            ) {
                setErreur(
                    "Le numéro de table est obligatoire"
                );
                return;
            }

            // ---------------------------------------------
            // Corps requête
            // ---------------------------------------------
            const body = {

                type_commande:
                    typeCommande,

                id_client:
                    sejourActuel?.id_client ||
                    null,

                id_sejour:
                    sejourActuel?.id_sejour ||
                    null,

                id_chambre:
                    sejourActuel?.id_chambre ||
                    null,

                table_numero:
                    tableNumero.trim() ||
                    null,

                observation:
                    observation.trim() ||
                    null,

                lignes:
                    lignes.map(
                        (ligne) => ({
                            id_produit:
                                ligne.id_produit,

                            quantite:
                                ligne.quantite
                        })
                    )
            };

            // ---------------------------------------------
            // ENVOI AU BACKEND
            // ---------------------------------------------
            const response =
                await axios.post(
                    `${API}/commandes`,
                    body
                );

            setMessage(
                `${response.data.numero_commande} créée avec succès`
            );

            // ---------------------------------------------
            // RECHARGER COMMANDES
            // ---------------------------------------------
            const commandesResponse =
                await axios.get(
                    `${API}/commandes`
                );

            setCommandes(
                commandesResponse.data
            );

            // ---------------------------------------------
            // RÉINITIALISER
            // ---------------------------------------------
            reinitialiserFormulaire();

        } catch (error) {

            console.error(
                "Erreur création commande :",
                error
            );

            setErreur(
                error.response?.data?.message ||
                "Erreur lors de la création de la commande"
            );
        }
    };

    // =====================================================
    // RÉINITIALISER FORMULAIRE
    // =====================================================
    const reinitialiserFormulaire =
        () => {

            setAfficherFormulaire(
                false
            );

            setCommandeDepuisRestaurant(
                false
            );

            setTypeCommande(
                "RESTAURANT"
            );

            setTypeClient(
                "PASSAGE"
            );

            setSejourSelectionne(
                ""
            );

            setTableNumero(
                ""
            );

            setObservation(
                ""
            );

            setLignes([]);

            setProduitSelectionne(
                ""
            );

            setQuantite(1);
        };

    // =====================================================
    // MODIFIER STATUT
    // =====================================================
    const modifierStatut = async (
        idCommande,
        statut
    ) => {

        try {

            setErreur("");
            setMessage("");

            await axios.patch(
                `${API}/commandes/${idCommande}/statut`,
                {
                    statut
                }
            );

            setCommandes(
                (prev) =>
                    prev.map(
                        (commande) =>
                            commande.id_commande ===
                            idCommande
                                ? {
                                      ...commande,
                                      statut
                                  }
                                : commande
                    )
            );

            setMessage(
                "Statut modifié avec succès"
            );

        } catch (error) {

            console.error(
                "Erreur modification statut :",
                error
            );

            setErreur(
                error.response?.data?.message ||
                "Erreur lors de la modification du statut"
            );
        }
    };

    // =====================================================
    // RECHERCHE
    // =====================================================
    const commandesFiltrees =
        commandes.filter(
            (commande) => {

                const rechercheTexte =
                    recherche
                        .toLowerCase()
                        .trim();

                if (
                    !rechercheTexte
                ) {
                    return true;
                }

                return (

                    commande.numero_commande
                        ?.toLowerCase()
                        .includes(
                            rechercheTexte
                        ) ||

                    commande.type_commande
                        ?.toLowerCase()
                        .includes(
                            rechercheTexte
                        ) ||

                    commande.nom_client
                        ?.toLowerCase()
                        .includes(
                            rechercheTexte
                        ) ||

                    commande.numero_chambre
                        ?.toLowerCase()
                        .includes(
                            rechercheTexte
                        ) ||

                    commande.numero_sejour
                        ?.toLowerCase()
                        .includes(
                            rechercheTexte
                        ) ||

                    commande.table_numero
                        ?.toLowerCase()
                        .includes(
                            rechercheTexte
                        ) ||

                    commande.statut
                        ?.toLowerCase()
                        .includes(
                            rechercheTexte
                        )
                );
            }
        );

    // =====================================================
    // FORMAT PRIX
    // =====================================================
    const formatPrix = (
        prix
    ) => {

        return (
            new Intl.NumberFormat(
                "fr-FR"
            ).format(
                Number(
                    prix || 0
                )
            ) + " F"
        );
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================
    const formatDate = (
        date
    ) => {

        if (!date) {
            return "-";
        }

        return new Date(
            date
        ).toLocaleString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    // =====================================================
    // AFFICHAGE
    // =====================================================
    return (
        <div className="commandes-page">

            {/* =================================================
                EN-TÊTE
            ================================================= */}
            <div className="commandes-header">

                <div>
                    <h1>
                        Commandes
                    </h1>

                    <p>
                        Gestion des commandes du
                        restaurant et du bar
                    </p>
                </div>

                <button
                    className="btn-nouvelle-commande"
                    onClick={() => {

                        setAfficherFormulaire(
                            true
                        );

                        setCommandeDepuisRestaurant(
                            false
                        );

                        setErreur("");
                        setMessage("");

                        setLignes([]);

                    }}
                >
                    + Nouvelle commande
                </button>

            </div>

            {/* =================================================
                MESSAGES
            ================================================= */}
            {erreur && (
                <div className="message erreur">
                    {erreur}
                </div>
            )}

            {message && (
                <div className="message succes">
                    {message}
                </div>
            )}

            {/* =================================================
                STATISTIQUES
            ================================================= */}
            <div className="commandes-stats">

                <div className="stat-card">
                    <span>
                        Total commandes
                    </span>

                    <strong>
                        {commandes.length}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        Ouvertes
                    </span>

                    <strong>
                        {
                            commandes.filter(
                                (c) =>
                                    c.statut ===
                                    "OUVERTE"
                            ).length
                        }
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        En préparation
                    </span>

                    <strong>
                        {
                            commandes.filter(
                                (c) =>
                                    c.statut ===
                                    "EN_PREPARATION"
                            ).length
                        }
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        Facturées
                    </span>

                    <strong>
                        {
                            commandes.filter(
                                (c) =>
                                    c.statut ===
                                    "FACTUREE"
                            ).length
                        }
                    </strong>
                </div>

            </div>

            {/* =================================================
                FORMULAIRE
            ================================================= */}
            {afficherFormulaire && (

                <div className="commande-form-card">

                    <div className="form-header">

                        <div>

                            <h2>
                                Nouvelle commande
                            </h2>

                            <p>
                                Restaurant, bar ou room service
                            </p>

                        </div>

                        <button
                            type="button"
                            className="btn-fermer"
                            onClick={
                                reinitialiserFormulaire
                            }
                        >
                            ×
                        </button>

                    </div>

                    {commandeDepuisRestaurant && (
                        <div
                            className="message succes"
                            style={{
                                marginBottom:
                                    "15px"
                            }}
                        >
                            🍽️ Produit ajouté depuis
                            le restaurant.
                        </div>
                    )}

                    <form
                        onSubmit={
                            creerCommande
                        }
                    >

                        {/* =================================================
                            TYPE COMMANDE
                        ================================================= */}
                        <div className="form-grid">

                            <div className="form-group">

                                <label>
                                    Type de commande
                                </label>

                                <select
                                    value={
                                        typeCommande
                                    }
                                    onChange={(e) =>
                                        changerTypeCommande(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="RESTAURANT">
                                        Restaurant
                                    </option>

                                    <option value="BAR">
                                        Bar
                                    </option>

                                    <option value="ROOM_SERVICE">
                                        Room service
                                    </option>

                                    <option value="AUTRE">
                                        Autre
                                    </option>

                                </select>

                            </div>

                            {/* =================================================
                                TYPE CLIENT
                            ================================================= */}
                            {typeCommande !==
                                "ROOM_SERVICE" && (

                                <div className="form-group">

                                    <label>
                                        Type de client
                                    </label>

                                    <select
                                        value={
                                            typeClient
                                        }
                                        onChange={(e) =>
                                            changerTypeClient(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="PASSAGE">
                                            Client de passage
                                        </option>

                                        <option value="HEBERGE">
                                            Client hébergé
                                        </option>

                                    </select>

                                </div>
                            )}

                            {/* =================================================
                                SÉJOUR
                            ================================================= */}
                            {(typeClient ===
                                "HEBERGE" ||
                                typeCommande ===
                                    "ROOM_SERVICE") && (

                                <div className="form-group">

                                    <label>
                                        Séjour
                                    </label>

                                    <select
                                        value={
                                            sejourSelectionne
                                        }
                                        onChange={(e) =>
                                            setSejourSelectionne(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Sélectionner un séjour
                                        </option>

                                        {sejoursActifs.map(
                                            (sejour) => (
                                                <option
                                                    key={
                                                        sejour.id_sejour
                                                    }
                                                    value={
                                                        sejour.id_sejour
                                                    }
                                                >
                                                    {
                                                        sejour.numero_sejour
                                                    }{" "}
                                                    —{" "}
                                                    {
                                                        sejour.nom_client
                                                    }{" "}
                                                    — Chambre{" "}
                                                    {
                                                        sejour.numero_chambre
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>
                            )}

                            {/* =================================================
                                CLIENT
                            ================================================= */}
                            {sejourActuel && (

                                <div className="form-group">

                                    <label>
                                        Client
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            sejourActuel.nom_client
                                        }
                                        readOnly
                                    />

                                </div>
                            )}

                            {/* =================================================
                                CHAMBRE
                            ================================================= */}
                            {sejourActuel && (

                                <div className="form-group">

                                    <label>
                                        Chambre
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            sejourActuel.numero_chambre
                                        }
                                        readOnly
                                    />

                                </div>
                            )}

                            {/* =================================================
                                TABLE
                            ================================================= */}
                            {typeCommande !==
                                "ROOM_SERVICE" && (

                                <div className="form-group">

                                    <label>
                                        Numéro de table
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            tableNumero
                                        }
                                        onChange={(e) =>
                                            setTableNumero(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ex : 05"
                                    />

                                </div>
                            )}

                            {/* =================================================
                                OBSERVATION
                            ================================================= */}
                            <div className="form-group form-group-full">

                                <label>
                                    Observation
                                </label>

                                <textarea
                                    value={
                                        observation
                                    }
                                    onChange={(e) =>
                                        setObservation(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Observation facultative..."
                                    rows="3"
                                />

                            </div>

                        </div>

                        {/* =================================================
                            PRODUITS
                        ================================================= */}
                        <div className="ajout-produit">

                            <h3>
                                Ajouter des produits
                            </h3>

                            <div className="ajout-produit-ligne">

                                <select
                                    value={
                                        produitSelectionne
                                    }
                                    onChange={(e) =>
                                        setProduitSelectionne(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="">
                                        Sélectionner un produit
                                    </option>

                                    {produitsDisponibles.map(
                                        (produit) => (

                                            <option
                                                key={
                                                    produit.id_produit
                                                }
                                                value={
                                                    produit.id_produit
                                                }
                                            >
                                                {
                                                    produit.libelle
                                                }{" "}
                                                —{" "}
                                                {formatPrix(
                                                    produit.prix_vente
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={
                                        quantite
                                    }
                                    onChange={(e) =>
                                        setQuantite(
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="btn-ajouter-produit"
                                    onClick={
                                        ajouterProduit
                                    }
                                >
                                    Ajouter
                                </button>

                            </div>

                        </div>

                        {/* =================================================
                            LIGNES
                        ================================================= */}
                        <div className="lignes-commande">

                            {lignes.length === 0 ? (

                                <div className="aucune-ligne">
                                    Aucun produit ajouté
                                </div>

                            ) : (

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                Produit
                                            </th>

                                            <th>
                                                Prix
                                            </th>

                                            <th>
                                                Quantité
                                            </th>

                                            <th>
                                                Montant
                                            </th>

                                            <th></th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {lignes.map(
                                            (ligne) => (

                                                <tr
                                                    key={
                                                        ligne.id_produit
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            ligne.libelle
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatPrix(
                                                            ligne.prix_vente
                                                        )}
                                                    </td>

                                                    <td>

                                                        <input
                                                            className="input-quantite"
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={
                                                                ligne.quantite
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                modifierQuantite(
                                                                    ligne.id_produit,
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                    </td>

                                                    <td>

                                                        <strong>
                                                            {formatPrix(
                                                                ligne.quantite *
                                                                    ligne.prix_vente
                                                            )}
                                                        </strong>

                                                    </td>

                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="btn-supprimer-ligne"
                                                            onClick={() =>
                                                                supprimerLigne(
                                                                    ligne.id_produit
                                                                )
                                                            }
                                                        >
                                                            ×
                                                        </button>

                                                    </td>

                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>

                            )}

                        </div>

                        {/* =================================================
                            TOTAL
                        ================================================= */}
                        <div className="commande-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                {formatPrix(
                                    totalCommande
                                )}
                            </strong>

                        </div>

                        {/* =================================================
                            ACTIONS
                        ================================================= */}
                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-annuler"
                                onClick={
                                    reinitialiserFormulaire
                                }
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="btn-enregistrer"
                            >
                                Enregistrer la commande
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* =================================================
                LISTE DES COMMANDES
            ================================================= */}
            <div className="commandes-card">

                <div className="liste-header">

                    <div>

                        <h2>
                            Liste des commandes
                        </h2>

                        <p>
                            {
                                commandesFiltrees.length
                            }{" "}
                            commande(s)
                        </p>

                    </div>

                    <input
                        type="text"
                        className="recherche-commande"
                        placeholder="Rechercher une commande, un client, une chambre..."
                        value={
                            recherche
                        }
                        onChange={(e) =>
                            setRecherche(
                                e.target.value
                            )
                        }
                    />

                </div>

                {chargement ? (

                    <div className="etat-page">
                        Chargement des commandes...
                    </div>

                ) : commandesFiltrees.length === 0 ? (

                    <div className="etat-page">
                        Aucune commande trouvée.
                    </div>

                ) : (

                    <div className="table-responsive">

                        <table className="commandes-table">

                            <thead>

                                <tr>

                                    <th>
                                        N°
                                    </th>

                                    <th>
                                        Type
                                    </th>

                                    <th>
                                        Client
                                    </th>

                                    <th>
                                        Chambre
                                    </th>

                                    <th>
                                        Séjour
                                    </th>

                                    <th>
                                        Table
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Total
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

                                {commandesFiltrees.map(
                                    (commande) => (

                                        <tr
                                            key={
                                                commande.id_commande
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        commande.numero_commande
                                                    }
                                                </strong>

                                            </td>

                                            <td>

                                                <span
                                                    className={`type-badge ${commande.type_commande?.toLowerCase()}`}
                                                >
                                                    {
                                                        commande.type_commande
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    commande.nom_client ||
                                                    "Client de passage"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    commande.numero_chambre ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    commande.numero_sejour ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    commande.table_numero ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    commande.date_commande
                                                )}
                                            </td>

                                            <td>

                                                <strong>
                                                    {formatPrix(
                                                        commande.montant_total
                                                    )}
                                                </strong>

                                            </td>

                                            <td>

                                                <select
                                                    className={`statut-select statut-${commande.statut?.toLowerCase()}`}
                                                    value={
                                                        commande.statut
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        modifierStatut(
                                                            commande.id_commande,
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="OUVERTE">
                                                        OUVERTE
                                                    </option>

                                                    <option value="EN_PREPARATION">
                                                        EN PRÉPARATION
                                                    </option>

                                                    <option value="SERVIE">
                                                        SERVIE
                                                    </option>

                                                    <option value="FACTUREE">
                                                        FACTURÉE
                                                    </option>

                                                </select>

                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="btn-details"
                                                    onClick={() =>
                                                        navigate(
                                                            `/commandes/${commande.id_commande}`
                                                        )
                                                    }
                                                >
                                                    Voir détails
                                                </button>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}

export default Commandes;