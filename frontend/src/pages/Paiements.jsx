import { useEffect, useMemo, useState } from "react";
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
    const [historiqueFacture, setHistoriqueFacture] = useState([]);
    const [chargementHistorique, setChargementHistorique] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] =
        useState(false);

    const [formulaire, setFormulaire] =
        useState(formulaireInitial);

    const [recherche, setRecherche] = useState("");
    const [filtreMode, setFiltreMode] = useState("TOUS");

    const [paiementRecu, setPaiementRecu] =
        useState(null);

    const [enregistrement, setEnregistrement] =
        useState(false);

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
            console.error(
                "Erreur paiements :",
                err
            );

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

            const liste = Array.isArray(
                response.data
            )
                ? response.data
                : [];

            setFactures(
                liste.filter(
                    (facture) =>
                        facture.statut !== "PAYEE" &&
                        facture.statut !== "ANNULEE" &&
                        Number(
                            facture.reste_a_payer
                        ) > 0
                )
            );
        } catch (err) {
            console.error(
                "Erreur factures :",
                err
            );

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
    // FORMATAGE
    // =====================================================

    const formatMontant = (montant) => {
        return Number(
            montant || 0
        ).toLocaleString("fr-FR");
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const valeur = new Date(date);

        if (
            Number.isNaN(
                valeur.getTime()
            )
        ) {
            return "-";
        }

        return valeur.toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );
    };

    const formatDateHeure = (date) => {
        if (!date) {
            return "-";
        }

        const valeur = new Date(date);

        if (
            Number.isNaN(
                valeur.getTime()
            )
        ) {
            return "-";
        }

        return valeur.toLocaleString(
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
    // LIBELLE MODE
    // =====================================================

    const libelleMode = (mode) => {
        const modes = {
            ESPECES: "Espèces",
            WAVE: "Wave",
            ORANGE_MONEY: "Orange Money",
            FREE_MONEY: "Free Money"
        };

        return (
            modes[mode] ||
            mode ||
            "-"
        );
    };

    // =====================================================
    // CLASSE MODE
    // =====================================================

    const classeMode = (mode) => {
        return String(
            mode || ""
        )
            .toLowerCase()
            .replace(/_/g, "-");
    };

    // =====================================================
    // STATUT FACTURE
    // =====================================================

    const libelleStatut = (statut) => {
        const statuts = {
            IMPAYEE: "Impayée",
            PARTIELLE: "Partielle",
            PAYEE: "Payée",
            ANNULEE: "Annulée"
        };

        return (
            statuts[statut] ||
            statut ||
            "-"
        );
    };

    // =====================================================
    // NOUVEAU PAIEMENT
    // =====================================================

   const nouveauPaiement = () => {
    setFormulaire(formulaireInitial);

    setHistoriqueFacture([]);

    setAfficherFormulaire(true);
};
    // =====================================================
    // CHANGEMENT FORMULAIRE
    // =====================================================

    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setFormulaire(
            (ancien) => ({
                ...ancien,
                [name]: value
            })
        );
    };

    // =====================================================
    // FACTURE SELECTIONNEE
    // =====================================================

    const factureSelectionnee =
        factures.find(
            (facture) =>
                String(
                    facture.id_facture
                ) ===
                String(
                    formulaire.id_facture
                )
        );

    // =====================================================
    // CHANGEMENT FACTURE
    // =====================================================

   const handleFactureChange = async (e) => {
    const idFacture = e.target.value;

    const facture = factures.find(
        (item) =>
            String(item.id_facture) ===
            String(idFacture)
    );

    setFormulaire(
        (ancien) => ({
            ...ancien,
            id_facture: idFacture,
            montant: facture
                ? Number(facture.reste_a_payer)
                : ""
        })
    );

    await chargerHistoriqueFacture(
        idFacture
    );
};
    // =====================================================
// CHARGER L'HISTORIQUE D'UNE FACTURE
// =====================================================

const chargerHistoriqueFacture = async (idFacture) => {
    if (!idFacture) {
        setHistoriqueFacture([]);
        return;
    }

    try {
        setChargementHistorique(true);

        const response = await axios.get(
            `${API_URL}/paiements/facture/${idFacture}`
        );

        setHistoriqueFacture(
            Array.isArray(response.data)
                ? response.data
                : []
        );

    } catch (err) {
        console.error(
            "Erreur historique facture :",
            err
        );

        setHistoriqueFacture([]);

    } finally {
        setChargementHistorique(false);
    }
};
    // =====================================================
    // VALIDER ET ENCAISSER
    // =====================================================

    const enregistrerPaiement =
        async (e) => {
            e.preventDefault();

            if (
                !formulaire.id_facture
            ) {
                alert(
                    "Veuillez sélectionner une facture."
                );
                return;
            }

            const montant =
                Number(
                    formulaire.montant
                );

            if (
                !montant ||
                montant <= 0
            ) {
                alert(
                    "Le montant doit être supérieur à 0."
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

            if (
                !formulaire.mode_paiement
            ) {
                alert(
                    "Veuillez sélectionner un mode de paiement."
                );
                return;
            }

            const confirmation =
                window.confirm(
                    `Confirmer l'encaissement de ${formatMontant(
                        montant
                    )} FCFA pour la facture ${
                        factureSelectionnee?.numero_facture ||
                        ""
                    } ?`
                );

            if (!confirmation) {
                return;
            }

            try {
                setEnregistrement(
                    true
                );

                const response =
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

                const resultat =
                    response.data;

                // -----------------------------
                // Préparer le reçu
                // -----------------------------

                setPaiementRecu({
                    numero_paiement:
                        resultat.numero_paiement ||
                        "-",

                    numero_facture:
                        factureSelectionnee?.numero_facture ||
                        "-",

                    client:
                        factureSelectionnee
                            ? `${factureSelectionnee.nom || ""} ${
                                  factureSelectionnee.prenom || ""
                              }`.trim()
                            : "-",

                    montant,

                    mode_paiement:
                        formulaire.mode_paiement,

                    reference:
                        formulaire.reference.trim() ||
                        "-",

                    date_paiement:
                        new Date(),

                    montant_paye:
                        resultat.montant_paye,

                    reste_a_payer:
                        resultat.reste_a_payer,

                    statut:
                        resultat.statut,

                    observation:
                        formulaire.observation.trim() ||
                        ""
                });

                setFormulaire(
                    formulaireInitial
                );
                setHistoriqueFacture([]);

                setAfficherFormulaire(
                    false
                );

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
            } finally {
                setEnregistrement(
                    false
                );
            }
        };

    // =====================================================
    // IMPRIMER LE RECU
    // =====================================================

    const imprimerRecu = () => {
        window.print();
    };

    // =====================================================
    // IMPRIMER UN PAIEMENT EXISTANT
    // =====================================================

    const imprimerPaiementExistant =
        (paiement) => {
            setPaiementRecu({
                numero_paiement:
                    paiement.numero_paiement,

                numero_facture:
                    paiement.numero_facture ||
                    "-",

                client:
                    `${paiement.nom || ""} ${
                        paiement.prenom || ""
                    }`.trim(),

                montant:
                    Number(
                        paiement.montant
                    ),

                mode_paiement:
                    paiement.mode_paiement,

                reference:
                    paiement.reference ||
                    "-",

                date_paiement:
                    paiement.date_paiement,

                montant_paye:
                    null,

                reste_a_payer:
                    null,

                statut:
                    "VALIDE",

                observation:
                    paiement.observation ||
                    ""
            });
        };

    // =====================================================
    // FERMER RECU
    // =====================================================

    const fermerRecu = () => {
        setPaiementRecu(null);
    };

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const statistiques =
        useMemo(() => {
            const total =
                paiements.reduce(
                    (
                        somme,
                        paiement
                    ) =>
                        somme +
                        Number(
                            paiement.montant ||
                                0
                        ),
                    0
                );

            const especes =
                paiements
                    .filter(
                        (p) =>
                            p.mode_paiement ===
                            "ESPECES"
                    )
                    .reduce(
                        (
                            somme,
                            p
                        ) =>
                            somme +
                            Number(
                                p.montant ||
                                    0
                            ),
                        0
                    );

            const wave =
                paiements
                    .filter(
                        (p) =>
                            p.mode_paiement ===
                            "WAVE"
                    )
                    .reduce(
                        (
                            somme,
                            p
                        ) =>
                            somme +
                            Number(
                                p.montant ||
                                    0
                            ),
                        0
                    );

            const mobileMoney =
                paiements
                    .filter(
                        (p) =>
                            p.mode_paiement ===
                                "ORANGE_MONEY" ||
                            p.mode_paiement ===
                                "FREE_MONEY"
                    )
                    .reduce(
                        (
                            somme,
                            p
                        ) =>
                            somme +
                            Number(
                                p.montant ||
                                    0
                            ),
                        0
                    );

            const aujourdHui =
                paiements
                    .filter(
                        (p) => {
                            const date =
                                new Date(
                                    p.date_paiement
                                );

                            const maintenant =
                                new Date();

                            return (
                                date.toDateString() ===
                                maintenant.toDateString()
                            );
                        }
                    )
                    .reduce(
                        (
                            somme,
                            p
                        ) =>
                            somme +
                            Number(
                                p.montant ||
                                    0
                            ),
                        0
                    );

            return {
                total,
                especes,
                wave,
                mobileMoney,
                aujourdHui
            };
        }, [paiements]);

    // =====================================================
    // FILTRAGE
    // =====================================================

    const paiementsFiltres =
        useMemo(() => {
            const terme =
                recherche
                    .trim()
                    .toLowerCase();

            return paiements.filter(
                (paiement) => {
                    const texte = [
                        paiement.numero_paiement,
                        paiement.numero_facture,
                        paiement.nom,
                        paiement.prenom,
                        paiement.reference
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    const rechercheOK =
                        !terme ||
                        texte.includes(
                            terme
                        );

                    const modeOK =
                        filtreMode ===
                            "TOUS" ||
                        paiement.mode_paiement ===
                            filtreMode;

                    return (
                        rechercheOK &&
                        modeOK
                    );
                }
            );
        }, [
            paiements,
            recherche,
            filtreMode
        ]);

    // =====================================================
    // RENDU
    // =====================================================

    return (
        <div className="paiements-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="page-header">

                <div>
                    <div className="page-kicker">
                        COMPTABILITÉ
                    </div>

                    <h1>
                        Paiements
                    </h1>

                    <p>
                        Validez les encaissements
                        et gérez les reçus de paiement.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={
                        nouveauPaiement
                    }
                >
                    + Nouveau paiement
                </button>

            </div>

            {/* =================================================
                STATISTIQUES
            ================================================= */}

            <div className="paiements-stats">

                <div className="stat-card stat-main">

                    <div className="stat-icon">
                        💰
                    </div>

                    <div>
                        <span>
                            Total encaissé
                        </span>

                        <strong>
                            {
                                formatMontant(
                                    statistiques.total
                                )
                            }{" "}
                            FCFA
                        </strong>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        📅
                    </div>

                    <div>
                        <span>
                            Aujourd'hui
                        </span>

                        <strong>
                            {
                                formatMontant(
                                    statistiques.aujourdHui
                                )
                            }{" "}
                            FCFA
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
                            {
                                formatMontant(
                                    statistiques.especes
                                )
                            }{" "}
                            FCFA
                        </strong>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        🌊
                    </div>

                    <div>
                        <span>
                            Wave
                        </span>

                        <strong>
                            {
                                formatMontant(
                                    statistiques.wave
                                )
                            }{" "}
                            FCFA
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
                            {
                                formatMontant(
                                    statistiques.mobileMoney
                                )
                            }{" "}
                            FCFA
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                FORMULAIRE
            ================================================= */}

            {afficherFormulaire && (
                <div className="paiement-form">

                    <div className="form-header">

                        <div>
                            <div className="form-number">
                                01
                            </div>

                            <div>
                                <h2>
                                    Valider un paiement
                                </h2>

                                <p>
                                    Sélectionnez une facture
                                    et confirmez l'encaissement.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
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

                        {/* FACTURE */}

                        <div className="form-section">

                            <div className="section-heading">

                                <span>
                                    Facture à régler
                                </span>

                                <small>
                                    Factures non soldées
                                </small>

                            </div>

                            <select
                                className="invoice-select"
                                name="id_facture"
                                value={
                                    formulaire.id_facture
                                }
                                onChange={
                                    handleFactureChange
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
                                            {
                                                formatMontant(
                                                    facture.reste_a_payer
                                                )
                                            } FCFA
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                        {/* RESUME FACTURE */}

                        {factureSelectionnee && (
                            <div className="facture-summary">

                                <div className="summary-client">

                                    <span>
                                        Client
                                    </span>

                                    <strong>
                                        {
                                            factureSelectionnee.nom
                                        }{" "}
                                        {
                                            factureSelectionnee.prenom
                                        }
                                    </strong>

                                    <small>
                                        {
                                            factureSelectionnee.code_client ||
                                            "-"
                                        }
                                    </small>

                                </div>

                                <div>
                                    <span>
                                        Facture
                                    </span>

                                    <strong>
                                        {
                                            factureSelectionnee.numero_facture
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Net à payer
                                    </span>

                                    <strong>
                                        {
                                            formatMontant(
                                                factureSelectionnee.net_a_payer
                                            )
                                        } FCFA
                                    </strong>
                                </div>

                                <div className="summary-paid">
                                    <span>
                                        Déjà payé
                                    </span>

                                    <strong>
                                        {
                                            formatMontant(
                                                factureSelectionnee.montant_paye
                                            )
                                        } FCFA
                                    </strong>
                                </div>

                                <div className="summary-rest">
                                    <span>
                                        Reste à payer
                                    </span>

                                    <strong>
                                        {
                                            formatMontant(
                                                factureSelectionnee.reste_a_payer
                                            )
                                        } FCFA
                                    </strong>
                                </div>

                            </div>
                        )}
                    {/* =================================================
    HISTORIQUE DE LA FACTURE
================================================= */}

{factureSelectionnee && (
    <div className="facture-history">

        <div className="history-header">

            <div>
                <h3>
                    Historique des paiements
                </h3>

                <p>
                    Paiements déjà enregistrés
                    pour cette facture
                </p>
            </div>

            <div className="history-count">
                {historiqueFacture.length}
            </div>

        </div>

        {chargementHistorique ? (
            <div className="history-loading">
                Chargement de l'historique...
            </div>
        ) : historiqueFacture.length === 0 ? (
            <div className="history-empty">
                Aucun paiement enregistré pour cette facture.
            </div>
        ) : (
            <div className="history-list">

                {historiqueFacture.map(
                    (paiement) => (
                        <div
                            className="history-item"
                            key={
                                paiement.id_paiement
                            }
                        >

                            <div className="history-payment-icon">
                                ✓
                            </div>

                            <div className="history-payment-info">

                                <strong>
                                    {
                                        paiement.numero_paiement
                                    }
                                </strong>

                                <span>
                                    {
                                        formatDate(
                                            paiement.date_paiement
                                        )
                                    }
                                </span>

                            </div>

                            <div
                                className={`history-mode mode-${classeMode(
                                    paiement.mode_paiement
                                )}`}
                            >
                                {
                                    libelleMode(
                                        paiement.mode_paiement
                                    )
                                }
                            </div>

                            <div className="history-reference">

                                {paiement.reference
                                    ? paiement.reference
                                    : "Sans référence"}

                            </div>

                            <strong className="history-amount">
                                +
                                {
                                    formatMontant(
                                        paiement.montant
                                    )
                                }{" "}
                                FCFA
                            </strong>

                        </div>
                    )
                )}

            </div>
        )}

        <div className="history-total">

            <div>
                <span>
                    Total déjà encaissé
                </span>

                <strong>
                    {
                        formatMontant(
                            factureSelectionnee.montant_paye
                        )
                    }{" "}
                    FCFA
                </strong>
            </div>

            <div className="history-total-rest">

                <span>
                    Reste à payer
                </span>

                <strong>
                    {
                        formatMontant(
                            factureSelectionnee.reste_a_payer
                        )
                    }{" "}
                    FCFA
                </strong>

            </div>

        </div>

    </div>
)}

                        {/* PAIEMENT */}

                        <div className="form-section">

                            <div className="section-heading">

                                <span>
                                    Encaissement
                                </span>

                                <small>
                                    Informations du paiement
                                </small>

                            </div>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Montant encaissé *
                                    </label>

                                    <div className="amount-input">

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
                                            required
                                        />

                                        <span>
                                            FCFA
                                        </span>

                                    </div>

                                    {factureSelectionnee && (
                                        <small className="field-help">
                                            Maximum autorisé :{" "}
                                            {
                                                formatMontant(
                                                    factureSelectionnee.reste_a_payer
                                                )
                                            } FCFA
                                        </small>
                                    )}

                                </div>

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

                                        <option value="WAVE">
                                            Wave
                                        </option>

                                        <option value="ORANGE_MONEY">
                                            Orange Money
                                        </option>

                                        <option value="FREE_MONEY">
                                            Free Money
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
                                            formulaire.reference
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="N° transaction"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Observation
                                    </label>

                                    <input
                                        type="text"
                                        name="observation"
                                        value={
                                            formulaire.observation
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Observation éventuelle"
                                    />

                                </div>

                            </div>

                        </div>

                        {/* CONFIRMATION */}

                        {factureSelectionnee &&
                            formulaire.montant && (
                                <div className="validation-preview">

                                    <div className="preview-icon">
                                        ✓
                                    </div>

                                    <div>
                                        <span>
                                            Montant à encaisser
                                        </span>

                                        <strong>
                                            {
                                                formatMontant(
                                                    formulaire.montant
                                                )
                                            }{" "}
                                            FCFA
                                        </strong>

                                        <small>
                                            {
                                                libelleMode(
                                                    formulaire.mode_paiement
                                                )
                                            }
                                        </small>
                                    </div>

                                </div>
                            )}

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
                                disabled={
                                    enregistrement
                                }
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="btn-primary btn-validation"
                                disabled={
                                    enregistrement
                                }
                            >
                                {enregistrement
                                    ? "Enregistrement..."
                                    : "✓ Valider et encaisser"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* =================================================
                ERREUR
            ================================================= */}

            {error && (
                <div className="error-message">
                    <strong>
                        Attention :
                    </strong>{" "}
                    {error}
                </div>
            )}

            {/* =================================================
                HISTORIQUE
            ================================================= */}

            <div className="table-card">

                <div className="table-header">

                    <div>
                        <h2>
                            Historique des paiements
                        </h2>

                        <p>
                            {
                                paiementsFiltres.length
                            } paiement(s) affiché(s)
                        </p>
                    </div>

                    <div className="table-actions">

                        <div className="search-box">

                            <span>
                                🔎
                            </span>

                            <input
                                type="text"
                                placeholder="Rechercher..."
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

                        <select
                            value={
                                filtreMode
                            }
                            onChange={(e) =>
                                setFiltreMode(
                                    e.target.value
                                )
                            }
                        >

                            <option value="TOUS">
                                Tous les modes
                            </option>

                            <option value="ESPECES">
                                Espèces
                            </option>

                            <option value="WAVE">
                                Wave
                            </option>

                            <option value="ORANGE_MONEY">
                                Orange Money
                            </option>

                            <option value="FREE_MONEY">
                                Free Money
                            </option>

                        </select>

                    </div>

                </div>

                {loading ? (
                    <div className="empty-state">

                        <div className="loader"></div>

                        <p>
                            Chargement des paiements...
                        </p>

                    </div>
                ) : paiementsFiltres.length === 0 ? (
                    <div className="empty-state">

                        <div className="empty-icon">
                            💳
                        </div>

                        <h3>
                            Aucun paiement
                        </h3>

                        <p>
                            Aucun paiement ne correspond
                            aux critères sélectionnés.
                        </p>

                    </div>
                ) : (
                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Paiement
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

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {paiementsFiltres.map(
                                    (paiement) => (
                                        <tr
                                            key={
                                                paiement.id_paiement
                                            }
                                        >

                                            <td>

                                                <strong className="payment-number">
                                                    {
                                                        paiement.numero_paiement
                                                    }
                                                </strong>

                                            </td>

                                            <td>

                                                <span className="invoice-badge">
                                                    {
                                                        paiement.numero_facture ||
                                                        "-"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="client-cell">

                                                    <strong>
                                                        {
                                                            paiement.nom
                                                        }{" "}
                                                        {
                                                            paiement.prenom
                                                        }
                                                    </strong>

                                                </div>

                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        paiement.date_paiement
                                                    )
                                                }
                                            </td>

                                            <td>

                                                <strong className="montant">
                                                    +
                                                    {
                                                        formatMontant(
                                                            paiement.montant
                                                        )
                                                    }{" "}
                                                    FCFA
                                                </strong>

                                            </td>

                                            <td>

                                                <span
                                                    className={`mode-badge mode-${classeMode(
                                                        paiement.mode_paiement
                                                    )}`}
                                                >
                                                    {
                                                        libelleMode(
                                                            paiement.mode_paiement
                                                        )
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    paiement.reference ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="btn-print-small"
                                                    title="Imprimer le reçu"
                                                    onClick={() =>
                                                        imprimerPaiementExistant(
                                                            paiement
                                                        )
                                                    }
                                                >
                                                    🖨
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

            {/* =================================================
                MODAL RECU
            ================================================= */}

            {paiementRecu && (
                <div className="receipt-overlay">

                    <div className="receipt-modal">

                        <div className="receipt-modal-header">

                            <div>
                                <span>
                                    PAIEMENT VALIDÉ
                                </span>

                                <h2>
                                    Reçu de paiement
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={
                                    fermerRecu
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="receipt-print">

                            <div className="receipt-brand">

                                <div className="receipt-logo">
                                    NH
                                </div>

                                <div>
                                    <h1>
                                        NGALANKA HOTEL
                                    </h1>

                                    <p>
                                        Reçu de paiement
                                    </p>
                                </div>

                            </div>

                            <div className="receipt-status">
                                ✓ PAIEMENT VALIDÉ
                            </div>

                            <div className="receipt-reference">

                                <div>
                                    <span>
                                        N° Paiement
                                    </span>

                                    <strong>
                                        {
                                            paiementRecu.numero_paiement
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        N° Facture
                                    </span>

                                    <strong>
                                        {
                                            paiementRecu.numero_facture
                                        }
                                    </strong>
                                </div>

                            </div>

                            <div className="receipt-client">

                                <span>
                                    CLIENT
                                </span>

                                <strong>
                                    {
                                        paiementRecu.client
                                    }
                                </strong>

                            </div>

                            <div className="receipt-details">

                                <div>
                                    <span>
                                        Date
                                    </span>

                                    <strong>
                                        {
                                            formatDateHeure(
                                                paiementRecu.date_paiement
                                            )
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Mode de paiement
                                    </span>

                                    <strong>
                                        {
                                            libelleMode(
                                                paiementRecu.mode_paiement
                                            )
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Référence
                                    </span>

                                    <strong>
                                        {
                                            paiementRecu.reference ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                            </div>

                            <div className="receipt-amount">

                                <span>
                                    MONTANT ENCAISSÉ
                                </span>

                                <strong>
                                    {
                                        formatMontant(
                                            paiementRecu.montant
                                        )
                                    }{" "}
                                    FCFA
                                </strong>

                            </div>

                            {paiementRecu.reste_a_payer !==
                                null &&
                                paiementRecu.reste_a_payer !==
                                    undefined && (
                                    <div className="receipt-balance">

                                        <div>
                                            <span>
                                                Total payé
                                            </span>

                                            <strong>
                                                {
                                                    formatMontant(
                                                        paiementRecu.montant_paye
                                                    )
                                                }{" "}
                                                FCFA
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Reste à payer
                                            </span>

                                            <strong>
                                                {
                                                    formatMontant(
                                                        paiementRecu.reste_a_payer
                                                    )
                                                }{" "}
                                                FCFA
                                            </strong>
                                        </div>

                                    </div>
                                )}

                            {paiementRecu.observation && (
                                <div className="receipt-observation">

                                    <span>
                                        Observation
                                    </span>

                                    <p>
                                        {
                                            paiementRecu.observation
                                        }
                                    </p>

                                </div>
                            )}

                            <div className="receipt-footer">

                                <p>
                                    Merci pour votre confiance.
                                </p>

                                <small>
                                    NGALANKA HOTEL
                                </small>

                            </div>

                        </div>

                        <div className="receipt-actions">

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={
                                    fermerRecu
                                }
                            >
                                Fermer
                            </button>

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={
                                    imprimerRecu
                                }
                            >
                                🖨 Imprimer le reçu
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Paiements;