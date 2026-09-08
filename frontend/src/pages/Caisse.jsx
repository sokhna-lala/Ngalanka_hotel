import { useEffect, useState } from "react";
import axios from "axios";
import "./Caisse.css";

const API_URL = "http://localhost:5000/api";

function Caisse() {
    const [caisses, setCaisses] = useState([]);
    const [mouvements, setMouvements] = useState([]);

    const [caisseSelectionnee, setCaisseSelectionnee] = useState(null);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        type_mouvement: "ENTREE",
        montant: "",
        motif: "",
        reference: "",
        observation: ""
    });

    // =====================================================
    // Charger les caisses
    // =====================================================
    const chargerCaisses = async () => {
        try {
            setLoading(true);
            setErreur("");

            const response = await axios.get(
                `${API_URL}/caisses`
            );

            setCaisses(response.data);

            if (response.data.length > 0) {
                const caisseOuverte =
                    response.data.find(
                        (caisse) =>
                            caisse.statut === "OUVERTE"
                    );

                setCaisseSelectionnee(
                    caisseOuverte || response.data[0]
                );
            }

        } catch (error) {
            console.error(error);

            setErreur(
                "Impossible de récupérer les caisses"
            );

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // Charger les mouvements
    // =====================================================
    const chargerMouvements = async (idCaisse) => {
        try {
            const response = await axios.get(
                `${API_URL}/caisses/${idCaisse}/mouvements`
            );

            setMouvements(response.data);

        } catch (error) {
            console.error(error);

            setErreur(
                "Impossible de récupérer les mouvements"
            );
        }
    };

    useEffect(() => {
        chargerCaisses();
    }, []);

    useEffect(() => {
        if (caisseSelectionnee) {
            chargerMouvements(
                caisseSelectionnee.id_caisse
            );
        }
    }, [caisseSelectionnee]);

    // =====================================================
    // Sélection caisse
    // =====================================================
    const changerCaisse = (event) => {
        const id = Number(event.target.value);

        const caisse = caisses.find(
            (item) => item.id_caisse === id
        );

        setCaisseSelectionnee(caisse || null);
        setMessage("");
        setErreur("");
    };

    // =====================================================
    // Gestion formulaire
    // =====================================================
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm({
            ...form,
            [name]: value
        });
    };

    // =====================================================
    // Ouvrir la caisse
    // =====================================================
    const ouvrirCaisse = async () => {
        if (!caisseSelectionnee) {
            return;
        }

        try {
            setMessage("");
            setErreur("");

            await axios.put(
                `${API_URL}/caisses/${caisseSelectionnee.id_caisse}/ouvrir`,
                {
                    solde_initial:
                        caisseSelectionnee.solde_initial
                }
            );

            setMessage(
                "Caisse ouverte avec succès"
            );

            await chargerCaisses();

        } catch (error) {
            console.error(error);

            setErreur(
                error.response?.data?.message ||
                "Impossible d'ouvrir la caisse"
            );
        }
    };

    // =====================================================
    // Fermer la caisse
    // =====================================================
    const fermerCaisse = async () => {
        if (!caisseSelectionnee) {
            return;
        }

        const confirmation = window.confirm(
            "Voulez-vous vraiment fermer cette caisse ?"
        );

        if (!confirmation) {
            return;
        }

        try {
            setMessage("");
            setErreur("");

            await axios.put(
                `${API_URL}/caisses/${caisseSelectionnee.id_caisse}/fermer`
            );

            setMessage(
                "Caisse fermée avec succès"
            );

            await chargerCaisses();

        } catch (error) {
            console.error(error);

            setErreur(
                error.response?.data?.message ||
                "Impossible de fermer la caisse"
            );
        }
    };

    // =====================================================
    // Ajouter mouvement
    // =====================================================
    const ajouterMouvement = async (event) => {
        event.preventDefault();

        if (!caisseSelectionnee) {
            setErreur("Aucune caisse sélectionnée");
            return;
        }

        if (caisseSelectionnee.statut !== "OUVERTE") {
            setErreur(
                "La caisse doit être ouverte"
            );
            return;
        }

        try {
            setMessage("");
            setErreur("");

            await axios.post(
                `${API_URL}/caisses/${caisseSelectionnee.id_caisse}/mouvements`,
                {
                    type_mouvement:
                        form.type_mouvement,

                    montant: Number(form.montant),

                    motif: form.motif,

                    reference:
                        form.reference || null,

                    observation:
                        form.observation || null
                }
            );

            setMessage(
                "Mouvement enregistré avec succès"
            );

            setForm({
                type_mouvement: "ENTREE",
                montant: "",
                motif: "",
                reference: "",
                observation: ""
            });

            setShowForm(false);

            await chargerCaisses();

        } catch (error) {
            console.error(error);

            setErreur(
                error.response?.data?.message ||
                "Impossible d'enregistrer le mouvement"
            );
        }
    };

    // =====================================================
    // Format montant
    // =====================================================
    const formatMontant = (montant) => {
        return Number(montant || 0).toLocaleString(
            "fr-FR"
        ) + " FCFA";
    };

    // =====================================================
    // Calcul entrées / sorties
    // =====================================================
    const totalEntrees = mouvements
        .filter(
            (m) => m.type_mouvement === "ENTREE"
        )
        .reduce(
            (total, m) =>
                total + Number(m.montant || 0),
            0
        );

    const totalSorties = mouvements
        .filter(
            (m) => m.type_mouvement === "SORTIE"
        )
        .reduce(
            (total, m) =>
                total + Number(m.montant || 0),
            0
        );

    // =====================================================
    // Affichage
    // =====================================================
    if (loading) {
        return (
            <div className="caisse-page">
                <div className="caisse-loading">
                    Chargement des caisses...
                </div>
            </div>
        );
    }

    return (
        <div className="caisse-page">

            {/* ============================= */}
            {/* HEADER */}
            {/* ============================= */}

            <div className="caisse-header">

                <div>
                    <h1>Gestion de caisse</h1>

                    <p>
                        Suivi des entrées, sorties et
                        opérations de caisse
                    </p>
                </div>

                {caisseSelectionnee && (
                    <select
                        value={
                            caisseSelectionnee.id_caisse
                        }
                        onChange={changerCaisse}
                        className="caisse-select"
                    >
                        {caisses.map((caisse) => (
                            <option
                                key={caisse.id_caisse}
                                value={caisse.id_caisse}
                            >
                                {caisse.nom_caisse}
                            </option>
                        ))}
                    </select>
                )}

            </div>


            {/* ============================= */}
            {/* MESSAGES */}
            {/* ============================= */}

            {message && (
                <div className="caisse-message success">
                    {message}
                </div>
            )}

            {erreur && (
                <div className="caisse-message error">
                    {erreur}
                </div>
            )}


            {!caisseSelectionnee ? (

                <div className="caisse-empty">
                    <h2>Aucune caisse disponible</h2>

                    <p>
                        Créez d'abord une caisse
                        depuis le système.
                    </p>
                </div>

            ) : (

                <>

                    {/* ============================= */}
                    {/* STATISTIQUES */}
                    {/* ============================= */}

                    <div className="caisse-stats">

                        <div className="caisse-card solde">

                            <div className="card-icon">
                                💰
                            </div>

                            <div>
                                <span>
                                    Solde actuel
                                </span>

                                <strong>
                                    {formatMontant(
                                        caisseSelectionnee.solde_actuel
                                    )}
                                </strong>
                            </div>

                        </div>


                        <div className="caisse-card">

                            <div className="card-icon">
                                📥
                            </div>

                            <div>
                                <span>
                                    Total entrées
                                </span>

                                <strong>
                                    {formatMontant(
                                        totalEntrees
                                    )}
                                </strong>
                            </div>

                        </div>


                        <div className="caisse-card">

                            <div className="card-icon">
                                📤
                            </div>

                            <div>
                                <span>
                                    Total sorties
                                </span>

                                <strong>
                                    {formatMontant(
                                        totalSorties
                                    )}
                                </strong>
                            </div>

                        </div>


                        <div className="caisse-card">

                            <div className="card-icon">
                                📊
                            </div>

                            <div>
                                <span>
                                    Statut
                                </span>

                                <strong
                                    className={
                                        caisseSelectionnee.statut ===
                                        "OUVERTE"
                                            ? "statut-ouvert"
                                            : "statut-ferme"
                                    }
                                >
                                    {caisseSelectionnee.statut}
                                </strong>
                            </div>

                        </div>

                    </div>


                    {/* ============================= */}
                    {/* ACTIONS */}
                    {/* ============================= */}

                    <div className="caisse-actions">

                        {caisseSelectionnee.statut ===
                        "OUVERTE" ? (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={() =>
                                        setShowForm(
                                            !showForm
                                        )
                                    }
                                >
                                    + Nouveau mouvement
                                </button>

                                <button
                                    className="btn btn-danger"
                                    onClick={
                                        fermerCaisse
                                    }
                                >
                                    Fermer la caisse
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={ouvrirCaisse}
                            >
                                Ouvrir la caisse
                            </button>
                        )}

                    </div>


                    {/* ============================= */}
                    {/* FORMULAIRE */}
                    {/* ============================= */}

                    {showForm &&
                        caisseSelectionnee.statut ===
                            "OUVERTE" && (

                        <form
                            className="mouvement-form"
                            onSubmit={
                                ajouterMouvement
                            }
                        >

                            <h2>
                                Nouveau mouvement
                            </h2>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Type de mouvement
                                    </label>

                                    <select
                                        name="type_mouvement"
                                        value={
                                            form.type_mouvement
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="ENTREE">
                                            Entrée
                                        </option>

                                        <option value="SORTIE">
                                            Sortie
                                        </option>
                                    </select>

                                </div>


                                <div className="form-group">

                                    <label>
                                        Montant
                                    </label>

                                    <input
                                        type="number"
                                        name="montant"
                                        min="1"
                                        step="0.01"
                                        value={
                                            form.montant
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex : 50000"
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Motif
                                    </label>

                                    <input
                                        type="text"
                                        name="motif"
                                        value={
                                            form.motif
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex : Achat fournitures"
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
                                            form.reference
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Référence"
                                    />

                                </div>

                            </div>


                            <div className="form-group">

                                <label>
                                    Observation
                                </label>

                                <textarea
                                    name="observation"
                                    value={
                                        form.observation
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Observation facultative"
                                    rows="3"
                                />

                            </div>


                            <div className="form-buttons">

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Enregistrer
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowForm(
                                            false
                                        )
                                    }
                                >
                                    Annuler
                                </button>

                            </div>

                        </form>
                    )}


                    {/* ============================= */}
                    {/* HISTORIQUE */}
                    {/* ============================= */}

                    <div className="mouvements-section">

                        <div className="section-header">

                            <div>
                                <h2>
                                    Historique des mouvements
                                </h2>

                                <p>
                                    {mouvements.length} mouvement(s)
                                </p>
                            </div>

                        </div>


                        {mouvements.length === 0 ? (

                            <div className="no-mouvements">
                                Aucun mouvement enregistré
                            </div>

                        ) : (

                            <div className="table-container">

                                <table>

                                    <thead>

                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Motif</th>
                                            <th>Référence</th>
                                            <th>Paiement</th>
                                            <th>Montant</th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {mouvements.map(
                                            (mouvement) => (

                                                <tr
                                                    key={
                                                        mouvement.id_mouvement_caisse
                                                    }
                                                >

                                                    <td>
                                                        {new Date(
                                                            mouvement.date_mouvement
                                                        ).toLocaleString(
                                                            "fr-FR"
                                                        )}
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={
                                                                mouvement.type_mouvement ===
                                                                "ENTREE"
                                                                    ? "badge entree"
                                                                    : "badge sortie"
                                                            }
                                                        >
                                                            {mouvement.type_mouvement}
                                                        </span>

                                                    </td>

                                                    <td>
                                                        {
                                                            mouvement.motif
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            mouvement.reference ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            mouvement.numero_paiement ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td
                                                        className={
                                                            mouvement.type_mouvement ===
                                                            "ENTREE"
                                                                ? "montant-entree"
                                                                : "montant-sortie"
                                                        }
                                                    >
                                                        {mouvement.type_mouvement ===
                                                        "ENTREE"
                                                            ? "+"
                                                            : "-"}{" "}
                                                        {formatMontant(
                                                            mouvement.montant
                                                        )}
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </>
            )}

        </div>
    );
}

export default Caisse;