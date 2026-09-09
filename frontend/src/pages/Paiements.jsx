import { useEffect, useState } from "react";
import axios from "axios";
import "./Paiements.css";

const API_URL = "http://localhost:5000/api";

const formulaireInitial = {
    id_facture: "",
    montant: "",
    mode_paiement: "ESPECES",
    reference: "",
    observation: ""
};

function Paiements() {
    const [paiements, setPaiements] = useState([]);
    const [factures, setFactures] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);

    const [formulaire, setFormulaire] = useState(
        formulaireInitial
    );

    // =====================================================
    // CHARGER LES PAIEMENTS
    // =====================================================
    const chargerPaiements = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${API_URL}/paiements`
            );

            setPaiements(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

            setError("");

        } catch (err) {
            console.error("Erreur paiements :", err);

            setError(
                err.response?.data?.message ||
                "Impossible de charger les paiements."
            );

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // CHARGER LES FACTURES
    // =====================================================
    const chargerFactures = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/factures`
            );

            const liste = Array.isArray(response.data)
                ? response.data
                : [];

            // On affiche uniquement les factures
            // qui ont encore un montant à payer
            setFactures(
                liste.filter(
                    (facture) =>
                        facture.statut !== "PAYEE" &&
                        facture.statut !== "ANNULEE" &&
                        Number(facture.reste_a_payer) > 0
                )
            );

        } catch (err) {
            console.error("Erreur factures :", err);

            setFactures([]);
        }
    };

    // =====================================================
    // CHARGEMENT INITIAL
    // =====================================================
    useEffect(() => {
        chargerPaiements();
        chargerFactures();
    }, []);

    // =====================================================
    // CHANGEMENT FORMULAIRE
    // =====================================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire({
            ...formulaire,
            [name]: value
        });
    };

    // =====================================================
    // FACTURE SÉLECTIONNÉE
    // =====================================================
    const factureSelectionnee = factures.find(
        (facture) =>
            String(facture.id_facture) ===
            String(formulaire.id_facture)
    );

    // =====================================================
    // FORMAT MONTANT
    // =====================================================
    const formatMontant = (montant) => {
        return Number(montant || 0).toLocaleString(
            "fr-FR"
        );
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================
    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "fr-FR"
        );
    };

    // =====================================================
    // ENREGISTRER PAIEMENT
    // =====================================================
    const enregistrerPaiement = async (e) => {
        e.preventDefault();

        try {
            if (!formulaire.id_facture) {
                alert("Veuillez sélectionner une facture.");
                return;
            }

            const montant = Number(formulaire.montant);

            if (!montant || montant <= 0) {
                alert(
                    "Le montant du paiement doit être supérieur à 0."
                );
                return;
            }

            if (
                factureSelectionnee &&
                montant >
                    Number(
                        factureSelectionnee.reste_a_payer
                    )
            ) {
                alert(
                    "Le montant dépasse le reste à payer de la facture."
                );
                return;
            }

            await axios.post(
                `${API_URL}/paiements`,
                {
                    id_facture:
                        formulaire.id_facture,

                    montant,

                    mode_paiement:
                        formulaire.mode_paiement,

                    reference:
                        formulaire.reference.trim() ||
                        null,

                    observation:
                        formulaire.observation.trim() ||
                        null
                }
            );

            alert(
                "Paiement enregistré avec succès !"
            );

            setFormulaire(formulaireInitial);
            setAfficherFormulaire(false);

            await chargerPaiements();
            await chargerFactures();

        } catch (err) {
            console.error(
                "Erreur enregistrement paiement :",
                err
            );

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer le paiement."
            );
        }
    };

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const totalPaiements = paiements.reduce(
        (total, paiement) =>
            total + Number(paiement.montant || 0),
        0
    );

    const paiementsEspeces = paiements
        .filter(
            (paiement) =>
                paiement.mode_paiement === "ESPECES"
        )
        .reduce(
            (total, paiement) =>
                total + Number(paiement.montant || 0),
            0
        );

    const paiementsCarte = paiements
        .filter(
            (paiement) =>
                paiement.mode_paiement === "CARTE"
        )
        .reduce(
            (total, paiement) =>
                total + Number(paiement.montant || 0),
            0
        );

    const paiementsMobile = paiements
        .filter(
            (paiement) =>
                paiement.mode_paiement === "MOBILE_MONEY"
        )
        .reduce(
            (total, paiement) =>
                total + Number(paiement.montant || 0),
            0
        );

    return (
        <div className="paiements-page">

            {/* =====================================================
                EN-TÊTE
            ===================================================== */}

            <div className="page-header">

                <div>
                    <h1>Paiements</h1>

                    <p>
                        Gestion des encaissements de l'hôtel
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => {
                        setFormulaire(
                            formulaireInitial
                        );

                        setAfficherFormulaire(true);
                    }}
                >
                    + Nouveau paiement
                </button>

            </div>

            {/* =====================================================
                STATISTIQUES
            ===================================================== */}

            <div className="paiements-stats">

                <div className="stat-card">

                    <div className="stat-icon">
                        💰
                    </div>

                    <div>
                        <span>
                            Total encaissé
                        </span>

                        <strong>
                            {formatMontant(
                                totalPaiements
                            )} FCFA
                        </strong>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        💵
                    </div>

                    <div>
                        <span>
                            Espèces
                        </span>

                        <strong>
                            {formatMontant(
                                paiementsEspeces
                            )} FCFA
                        </strong>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        💳
                    </div>

                    <div>
                        <span>
                            Carte
                        </span>

                        <strong>
                            {formatMontant(
                                paiementsCarte
                            )} FCFA
                        </strong>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        📱
                    </div>

                    <div>
                        <span>
                            Mobile Money
                        </span>

                        <strong>
                            {formatMontant(
                                paiementsMobile
                            )} FCFA
                        </strong>
                    </div>

                </div>

            </div>

            {/* =====================================================
                FORMULAIRE
            ===================================================== */}

            {afficherFormulaire && (

                <div className="paiement-form">

                    <div className="form-header">

                        <div>
                            <h2>
                                Nouveau paiement
                            </h2>

                            <p>
                                Enregistrer un encaissement
                            </p>
                        </div>

                        <button
                            className="btn-close"
                            onClick={() => {
                                setAfficherFormulaire(
                                    false
                                );

                                setFormulaire(
                                    formulaireInitial
                                );
                            }}
                        >
                            ×
                        </button>

                    </div>

                    <form
                        onSubmit={
                            enregistrerPaiement
                        }
                    >

                        <div className="form-grid">

                            {/* FACTURE */}

                            <div className="form-group full">

                                <label>
                                    Facture *
                                </label>

                                <select
                                    name="id_facture"
                                    value={
                                        formulaire.id_facture
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                >

                                    <option value="">
                                        Sélectionner une facture
                                    </option>

                                    {factures.map(
                                        (facture) => (
                                            <option
                                                key={
                                                    facture.id_facture
                                                }
                                                value={
                                                    facture.id_facture
                                                }
                                            >
                                                {
                                                    facture.numero_facture
                                                }{" "}
                                                —{" "}
                                                {
                                                    facture.nom
                                                }{" "}
                                                {
                                                    facture.prenom
                                                }{" "}
                                                — Reste :{" "}
                                                {formatMontant(
                                                    facture.reste_a_payer
                                                )}{" "}
                                                FCFA
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* INFORMATIONS FACTURE */}

                            {factureSelectionnee && (

                                <div className="facture-info">

                                    <div>
                                        <span>
                                            Total facture
                                        </span>

                                        <strong>
                                            {formatMontant(
                                                factureSelectionnee.net_a_payer
                                            )}{" "}
                                            FCFA
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Déjà payé
                                        </span>

                                        <strong>
                                            {formatMontant(
                                                factureSelectionnee.montant_paye
                                            )}{" "}
                                            FCFA
                                        </strong>
                                    </div>

                                    <div className="reste">

                                        <span>
                                            Reste à payer
                                        </span>

                                        <strong>
                                            {formatMontant(
                                                factureSelectionnee.reste_a_payer
                                            )}{" "}
                                            FCFA
                                        </strong>

                                    </div>

                                </div>

                            )}

                            {/* MONTANT */}

                            <div className="form-group">

                                <label>
                                    Montant *
                                </label>

                                <input
                                    type="number"
                                    name="montant"
                                    value={
                                        formulaire.montant
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="1"
                                    max={
                                        factureSelectionnee
                                            ? factureSelectionnee.reste_a_payer
                                            : undefined
                                    }
                                    placeholder="Ex : 50000"
                                    required
                                />

                            </div>

                            {/* MODE */}

                            <div className="form-group">

                                <label>
                                    Mode de paiement *
                                </label>

                                <select
                                    name="mode_paiement"
                                    value={
                                        formulaire.mode_paiement
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                >

                                    <option value="ESPECES">
                                        Espèces
                                    </option>

                                    <option value="CARTE">
                                        Carte bancaire
                                    </option>

                                    <option value="MOBILE_MONEY">
                                        Mobile Money
                                    </option>

                                    <option value="CHEQUE">
                                        Chèque
                                    </option>

                                    <option value="VIREMENT">
                                        Virement
                                    </option>

                                </select>

                            </div>

                            {/* RÉFÉRENCE */}

                            <div className="form-group">

                                <label>
                                    Référence
                                </label>

                                <input
                                    type="text"
                                    name="reference"
                                    value={
                                        formulaire.reference
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="N° transaction / référence"
                                />

                            </div>

                            {/* OBSERVATION */}

                            <div className="form-group full">

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
                                    placeholder="Observation éventuelle..."
                                    rows="3"
                                />

                            </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setAfficherFormulaire(
                                        false
                                    );

                                    setFormulaire(
                                        formulaireInitial
                                    );
                                }}
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                Enregistrer le paiement
                            </button>

                        </div>

                    </form>

                </div>

            )}

            {/* =====================================================
                MESSAGE ERREUR
            ===================================================== */}

            {error && (

                <div className="error-message">
                    {error}
                </div>

            )}

            {/* =====================================================
                TABLEAU
            ===================================================== */}

            <div className="table-card">

                <div className="table-header">

                    <div>
                        <h2>
                            Historique des paiements
                        </h2>

                        <p>
                            {paiements.length} paiement
                            {paiements.length > 1
                                ? "s"
                                : ""}{" "}
                            enregistré
                            {paiements.length > 1
                                ? "s"
                                : ""}
                        </p>
                    </div>

                </div>

                {loading ? (

                    <div className="loading">
                        Chargement des paiements...
                    </div>

                ) : paiements.length === 0 ? (

                    <div className="empty-state">

                        <div className="empty-icon">
                            💳
                        </div>

                        <h3>
                            Aucun paiement
                        </h3>

                        <p>
                            Aucun paiement n'a encore
                            été enregistré.
                        </p>

                    </div>

                ) : (

                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        N° Paiement
                                    </th>

                                    <th>
                                        Facture
                                    </th>

                                    <th>
                                        Client
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Montant
                                    </th>

                                    <th>
                                        Mode
                                    </th>

                                    <th>
                                        Référence
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {paiements.map(
                                    (paiement) => (

                                        <tr
                                            key={
                                                paiement.id_paiement
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        paiement.numero_paiement
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    paiement.numero_facture
                                                }
                                            </td>

                                            <td>

                                                {
                                                    paiement.nom
                                                }{" "}

                                                {
                                                    paiement.prenom
                                                }

                                            </td>

                                            <td>
                                                {formatDate(
                                                    paiement.date_paiement
                                                )}
                                            </td>

                                            <td>

                                                <strong className="montant">

                                                    {formatMontant(
                                                        paiement.montant
                                                    )}{" "}
                                                    FCFA

                                                </strong>

                                            </td>

                                            <td>

                                                <span
                                                    className={`badge badge-${String(
                                                        paiement.mode_paiement
                                                    )
                                                        .toLowerCase()
                                                        .replace(
                                                            /_/g,
                                                            "-"
                                                        )}`}
                                                >
                                                    {
                                                        paiement.mode_paiement
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    paiement.reference ||
                                                    "-"
                                                }
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

export default Paiements;