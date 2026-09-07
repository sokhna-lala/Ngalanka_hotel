
import { useEffect, useState } from "react";
import axios from "axios";
import "./Factures.css";

const API_URL = "http://localhost:5000/api";

const creerFormulaireInitial = () => ({
    id_client: "",
    id_sejour: "",
    remise: 0,
    taxe: 0,
    observation: "",
    lignes: [
        {
            type_ligne: "AUTRE",
            reference_id: "",
            designation: "",
            quantite: 1,
            prix_unitaire: 0,
            remise: 0
        }
    ]
});

function Factures() {
    const [factures, setFactures] = useState([]);
    const [clients, setClients] = useState([]);
    const [sejours, setSejours] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);
    const [factureEnModification, setFactureEnModification] = useState(null);

    const [formulaire, setFormulaire] = useState(
        creerFormulaireInitial()
    );

    // =====================================================
    // CHARGER LES FACTURES
    // =====================================================
    const chargerFactures = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${API_URL}/factures`
            );

            setFactures(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

            setError("");
        } catch (err) {
            console.error("Erreur factures :", err);

            setError(
                err.response?.data?.message ||
                "Impossible de charger les factures."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // CHARGER LES CLIENTS
    // =====================================================
    const chargerClients = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/clients`
            );

            setClients(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            console.error("Erreur clients :", err);
        }
    };

    // =====================================================
    // CHARGER LES SÉJOURS
    // =====================================================
    const chargerSejours = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/sejours`
            );

            setSejours(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            console.warn(
                "La route des séjours n'est pas encore disponible."
            );

            setSejours([]);
        }
    };

    // =====================================================
    // CHARGEMENT INITIAL
    // =====================================================
    useEffect(() => {
        chargerFactures();
        chargerClients();
        chargerSejours();
    }, []);

    // =====================================================
    // NOUVELLE FACTURE
    // =====================================================
    const nouvelleFacture = () => {
        setFactureEnModification(null);
        setFormulaire(creerFormulaireInitial());
        setAfficherFormulaire(true);
    };

    // =====================================================
    // MODIFIER UNE FACTURE
    // =====================================================
    const modifierFacture = async (facture) => {
        try {
            const response = await axios.get(
                `${API_URL}/factures/${facture.id_facture}`
            );

            const data = response.data;

            setFactureEnModification(facture);

            setFormulaire({
                id_client: data.facture?.id_client || "",
                id_sejour: data.facture?.id_sejour || "",
                remise: Number(data.facture?.remise) || 0,
                taxe: Number(data.facture?.taxe) || 0,
                observation: data.facture?.observation || "",

                lignes:
                    Array.isArray(data.lignes) &&
                    data.lignes.length > 0
                        ? data.lignes.map((ligne) => ({
                              type_ligne:
                                  ligne.type_ligne || "AUTRE",

                              reference_id:
                                  ligne.reference_id || "",

                              designation:
                                  ligne.designation || "",

                              quantite:
                                  Number(ligne.quantite) || 1,

                              prix_unitaire:
                                  Number(ligne.prix_unitaire) || 0,

                              remise:
                                  Number(ligne.remise) || 0
                          }))
                        : creerFormulaireInitial().lignes
            });

            setAfficherFormulaire(true);
        } catch (err) {
            console.error(
                "Erreur récupération facture :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible de récupérer la facture."
            );
        }
    };

    // =====================================================
    // VOIR UNE FACTURE
    // =====================================================
    const voirFacture = async (facture) => {
        try {
            const response = await axios.get(
                `${API_URL}/factures/${facture.id_facture}`
            );

            const data = response.data;

            const factureDetail = data.facture;

            alert(
                `Facture : ${factureDetail.numero_facture}\n\n` +
                `Client : ${factureDetail.nom || ""} ${factureDetail.prenom || ""}\n` +
                `Séjour : ${factureDetail.numero_sejour || "-"}\n` +
                `Date : ${formatDate(factureDetail.date_facture)}\n\n` +
                `Total : ${formatMontant(
                    factureDetail.montant_total
                )} FCFA\n` +
                `Remise : ${formatMontant(
                    factureDetail.remise
                )} FCFA\n` +
                `Taxe : ${formatMontant(
                    factureDetail.taxe
                )} FCFA\n` +
                `Net à payer : ${formatMontant(
                    factureDetail.net_a_payer
                )} FCFA\n` +
                `Payé : ${formatMontant(
                    factureDetail.montant_paye
                )} FCFA\n` +
                `Reste : ${formatMontant(
                    factureDetail.reste_a_payer
                )} FCFA\n` +
                `Statut : ${factureDetail.statut}`
            );
        } catch (err) {
            console.error(
                "Erreur consultation facture :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible de consulter la facture."
            );
        }
    };

    // =====================================================
    // CHANGEMENT FORMULAIRE
    // =====================================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire((ancien) => ({
            ...ancien,
            [name]: value
        }));
    };

    // =====================================================
    // CHANGEMENT D'UNE LIGNE
    // =====================================================
    const handleLigneChange = (index, e) => {
        const { name, value } = e.target;

        setFormulaire((ancien) => {
            const lignes = [...ancien.lignes];

            lignes[index] = {
                ...lignes[index],
                [name]: value
            };

            return {
                ...ancien,
                lignes
            };
        });
    };

    // =====================================================
    // AJOUTER UNE LIGNE
    // =====================================================
    const ajouterLigne = () => {
        setFormulaire((ancien) => ({
            ...ancien,
            lignes: [
                ...ancien.lignes,
                {
                    type_ligne: "AUTRE",
                    reference_id: "",
                    designation: "",
                    quantite: 1,
                    prix_unitaire: 0,
                    remise: 0
                }
            ]
        }));
    };

    // =====================================================
    // SUPPRIMER UNE LIGNE
    // =====================================================
    const supprimerLigne = (index) => {
        if (formulaire.lignes.length <= 1) {
            return;
        }

        setFormulaire((ancien) => ({
            ...ancien,
            lignes: ancien.lignes.filter(
                (_, i) => i !== index
            )
        }));
    };

    // =====================================================
    // CALCUL MONTANT D'UNE LIGNE
    // =====================================================
    const calculerMontantLigne = (ligne) => {
        const quantite =
            Number(ligne.quantite) || 0;

        const prixUnitaire =
            Number(ligne.prix_unitaire) || 0;

        const remise =
            Number(ligne.remise) || 0;

        return Math.max(
            0,
            quantite * prixUnitaire - remise
        );
    };

    // =====================================================
    // CALCUL TOTAL
    // =====================================================
    const calculerTotal = () => {
        return formulaire.lignes.reduce(
            (total, ligne) =>
                total + calculerMontantLigne(ligne),
            0
        );
    };

    const montantTotal = calculerTotal();

    const remiseFacture =
        Number(formulaire.remise) || 0;

    const taxeFacture =
        Number(formulaire.taxe) || 0;

    const netAPayer = Math.max(
        0,
        montantTotal -
            remiseFacture +
            taxeFacture
    );

    // =====================================================
    // ENREGISTRER / MODIFIER
    // =====================================================
    const enregistrerFacture = async (e) => {
        e.preventDefault();

        // Vérification client
        if (!formulaire.id_client) {
            alert("Veuillez sélectionner un client.");
            return;
        }

        // Vérification des lignes
        if (
            !Array.isArray(formulaire.lignes) ||
            formulaire.lignes.length === 0
        ) {
            alert(
                "La facture doit contenir au moins une ligne."
            );
            return;
        }

        // Vérification désignation
        const ligneInvalide =
            formulaire.lignes.find(
                (ligne) =>
                    !ligne.designation ||
                    !ligne.designation.trim()
            );

        if (ligneInvalide) {
            alert(
                "Toutes les lignes doivent avoir une désignation."
            );
            return;
        }

        try {
            const donnees = {
                id_client: Number(
                    formulaire.id_client
                ),

                id_sejour:
                    formulaire.id_sejour
                        ? Number(
                              formulaire.id_sejour
                          )
                        : null,

                remise:
                    Number(formulaire.remise) || 0,

                taxe:
                    Number(formulaire.taxe) || 0,

                observation:
                    formulaire.observation || "",

                lignes: formulaire.lignes.map(
                    (ligne) => ({
                        type_ligne:
                            ligne.type_ligne ||
                            "AUTRE",

                        reference_id:
                            ligne.reference_id
                                ? Number(
                                      ligne.reference_id
                                  )
                                : null,

                        designation:
                            ligne.designation.trim(),

                        quantite:
                            Number(
                                ligne.quantite
                            ) || 0,

                        prix_unitaire:
                            Number(
                                ligne.prix_unitaire
                            ) || 0,

                        remise:
                            Number(
                                ligne.remise
                            ) || 0
                    })
                )
            };

            if (factureEnModification) {
                await axios.put(
                    `${API_URL}/factures/${factureEnModification.id_facture}`,
                    donnees
                );

                alert(
                    "Facture modifiée avec succès."
                );
            } else {
                await axios.post(
                    `${API_URL}/factures`,
                    donnees
                );

                alert(
                    "Facture créée avec succès."
                );
            }

            fermerFormulaire();
            await chargerFactures();
        } catch (err) {
            console.error(
                "Erreur facture :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer la facture."
            );
        }
    };

    // =====================================================
    // FERMER FORMULAIRE
    // =====================================================
    const fermerFormulaire = () => {
        setAfficherFormulaire(false);
        setFactureEnModification(null);
        setFormulaire(creerFormulaireInitial());
    };

    // =====================================================
    // FORMATAGE MONTANT
    // =====================================================
    const formatMontant = (montant) => {
        return Number(montant || 0).toLocaleString(
            "fr-FR"
        );
    };

    // =====================================================
    // FORMATAGE DATE
    // =====================================================
    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const dateFormatee = new Date(date);

        if (Number.isNaN(dateFormatee.getTime())) {
            return "-";
        }

        return dateFormatee.toLocaleDateString(
            "fr-FR"
        );
    };

    // =====================================================
    // RENDU
    // =====================================================
    return (
        <div className="factures-page">

            {/* =========================
                EN-TÊTE
            ========================== */}

            <div className="page-header">

                <div>
                    <h1>Factures</h1>

                    <p>
                        Gestion des factures et paiements
                    </p>
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={nouvelleFacture}
                >
                    + Nouvelle facture
                </button>

            </div>

            {/* =========================
                FORMULAIRE
            ========================== */}

            {afficherFormulaire && (
                <div className="facture-form">

                    <div className="form-header">

                        <div>

                            <h2>
                                {factureEnModification
                                    ? "Modifier la facture"
                                    : "Nouvelle facture"}
                            </h2>

                            {factureEnModification && (
                                <p>
                                    {
                                        factureEnModification.numero_facture
                                    }
                                </p>
                            )}

                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={fermerFormulaire}
                        >
                            ✕
                        </button>

                    </div>

                    <form
                        onSubmit={enregistrerFacture}
                    >

                        {/* =========================
                            CLIENT / SÉJOUR
                        ========================== */}

                        <div className="form-grid">

                            <div>

                                <label>
                                    Client *
                                </label>

                                <select
                                    name="id_client"
                                    value={
                                        formulaire.id_client
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                >

                                    <option value="">
                                        Sélectionner un client
                                    </option>

                                    {clients.map(
                                        (client) => (
                                            <option
                                                key={
                                                    client.id_client
                                                }
                                                value={
                                                    client.id_client
                                                }
                                            >
                                                {
                                                    client.nom
                                                }{" "}
                                                {
                                                    client.prenom
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            <div>

                                <label>
                                    Séjour
                                </label>

                                <select
                                    name="id_sejour"
                                    value={
                                        formulaire.id_sejour
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="">
                                        Aucun séjour
                                    </option>

                                    {sejours.map(
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
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                        {/* =========================
                            LIGNES
                        ========================== */}

                        <div className="lignes-header">

                            <h3>
                                Lignes de facture
                            </h3>

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={ajouterLigne}
                            >
                                + Ajouter une ligne
                            </button>

                        </div>

                        <div className="lignes-container">

                            {formulaire.lignes.map(
                                (ligne, index) => (
                                    <div
                                        className="ligne-facture"
                                        key={index}
                                    >

                                        {/* TYPE */}

                                        <div>

                                            <label>
                                                Type
                                            </label>

                                            <select
                                                name="type_ligne"
                                                value={
                                                    ligne.type_ligne
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleLigneChange(
                                                        index,
                                                        e
                                                    )
                                                }
                                            >

                                                <option value="CHAMBRE">
                                                    Chambre
                                                </option>

                                                <option value="RESTAURANT">
                                                    Restaurant
                                                </option>

                                                <option value="BAR">
                                                    Bar
                                                </option>

                                                <option value="PISCINE">
                                                    Piscine
                                                </option>

                                                <option value="LOISIR">
                                                    Loisir
                                                </option>

                                                <option value="SEMINAIRE">
                                                    Séminaire
                                                </option>

                                                <option value="AUTRE">
                                                    Autre
                                                </option>

                                            </select>

                                        </div>

                                        {/* DESIGNATION */}

                                        <div>

                                            <label>
                                                Désignation *
                                            </label>

                                            <input
                                                type="text"
                                                name="designation"
                                                value={
                                                    ligne.designation
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleLigneChange(
                                                        index,
                                                        e
                                                    )
                                                }
                                                placeholder="Ex : Chambre 101"
                                                required
                                            />

                                        </div>

                                        {/* QUANTITE */}

                                        <div>

                                            <label>
                                                Quantité
                                            </label>

                                            <input
                                                type="number"
                                                name="quantite"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    ligne.quantite
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleLigneChange(
                                                        index,
                                                        e
                                                    )
                                                }
                                            />

                                        </div>

                                        {/* PRIX */}

                                        <div>

                                            <label>
                                                Prix unitaire
                                            </label>

                                            <input
                                                type="number"
                                                name="prix_unitaire"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    ligne.prix_unitaire
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleLigneChange(
                                                        index,
                                                        e
                                                    )
                                                }
                                            />

                                        </div>

                                        {/* REMISE */}

                                        <div>

                                            <label>
                                                Remise
                                            </label>

                                            <input
                                                type="number"
                                                name="remise"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    ligne.remise
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleLigneChange(
                                                        index,
                                                        e
                                                    )
                                                }
                                            />

                                        </div>

                                        {/* MONTANT */}

                                        <div className="ligne-montant">

                                            <label>
                                                Montant
                                            </label>

                                            <strong>
                                                {formatMontant(
                                                    calculerMontantLigne(
                                                        ligne
                                                    )
                                                )}{" "}
                                                FCFA
                                            </strong>

                                        </div>

                                        {/* SUPPRIMER */}

                                        <button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() =>
                                                supprimerLigne(
                                                    index
                                                )
                                            }
                                            title="Supprimer la ligne"
                                        >
                                            🗑️
                                        </button>

                                    </div>
                                )
                            )}

                        </div>

                        {/* =========================
                            TOTAUX
                        ========================== */}

                        <div className="totaux-facture">

                            <div>

                                <span>
                                    Montant total
                                </span>

                                <strong>
                                    {formatMontant(
                                        montantTotal
                                    )}{" "}
                                    FCFA
                                </strong>

                            </div>

                            <div>

                                <label>
                                    Remise globale
                                </label>

                                <input
                                    type="number"
                                    name="remise"
                                    min="0"
                                    step="0.01"
                                    value={
                                        formulaire.remise
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                            <div>

                                <label>
                                    Taxe
                                </label>

                                <input
                                    type="number"
                                    name="taxe"
                                    min="0"
                                    step="0.01"
                                    value={
                                        formulaire.taxe
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                            <div className="net-a-payer">

                                <span>
                                    Net à payer
                                </span>

                                <strong>
                                    {formatMontant(
                                        netAPayer
                                    )}{" "}
                                    FCFA
                                </strong>

                            </div>

                        </div>

                        {/* =========================
                            OBSERVATION
                        ========================== */}

                        <div className="full-width">

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
                                rows="3"
                                placeholder="Observation..."
                            />

                        </div>

                        {/* =========================
                            ACTIONS
                        ========================== */}

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
                                {factureEnModification
                                    ? "Modifier la facture"
                                    : "Enregistrer la facture"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* =========================
                TABLEAU
            ========================== */}

            {!afficherFormulaire && (
                <>
                    {loading && (
                        <p>
                            Chargement des factures...
                        </p>
                    )}

                    {error && (
                        <p className="error-message">
                            {error}
                        </p>
                    )}

                    {!loading && !error && (
                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>N° Facture</th>
                                        <th>Client</th>
                                        <th>Séjour</th>
                                        <th>Date</th>
                                        <th>Total</th>
                                        <th>Net à payer</th>
                                        <th>Payé</th>
                                        <th>Reste</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {factures.length === 0 ? (
                                        <tr>

                                            <td
                                                colSpan="10"
                                                className="empty"
                                            >
                                                Aucune facture enregistrée
                                            </td>

                                        </tr>
                                    ) : (
                                        factures.map(
                                            (facture) => (
                                                <tr
                                                    key={
                                                        facture.id_facture
                                                    }
                                                >

                                                    <td>
                                                        <strong>
                                                            {
                                                                facture.numero_facture
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {
                                                            facture.nom
                                                        }{" "}
                                                        {
                                                            facture.prenom
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            facture.numero_sejour ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            facture.date_facture
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatMontant(
                                                            facture.montant_total
                                                        )}{" "}
                                                        FCFA
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {formatMontant(
                                                                facture.net_a_payer
                                                            )}{" "}
                                                            FCFA
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {formatMontant(
                                                            facture.montant_paye
                                                        )}{" "}
                                                        FCFA
                                                    </td>

                                                    <td>
                                                        {formatMontant(
                                                            facture.reste_a_payer
                                                        )}{" "}
                                                        FCFA
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`statut statut-${String(
                                                                facture.statut ||
                                                                    ""
                                                            ).toLowerCase()}`}
                                                        >
                                                            {
                                                                facture.statut
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="actions">

                                                            <button
                                                                type="button"
                                                                className="btn-action"
                                                                title="Voir"
                                                                onClick={() =>
                                                                    voirFacture(
                                                                        facture
                                                                    )
                                                                }
                                                            >
                                                                👁️
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn-action"
                                                                title="Modifier"
                                                                onClick={() =>
                                                                    modifierFacture(
                                                                        facture
                                                                    )
                                                                }
                                                            >
                                                                ✏️
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            )
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}
                </>
            )}

        </div>
    );
}

export default Factures;

