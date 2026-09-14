import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Comptabilite.css";

const API_URL = "http://localhost:5000/api";

function Comptabilite() {
    const [dashboard, setDashboard] = useState(null);
    const [repartition, setRepartition] = useState([]);
    const [journal, setJournal] = useState([]);
    const [mensuel, setMensuel] = useState([]);

    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const chargerDonnees = async () => {
        try {
            setLoading(true);
            setError("");

            let params = {};

            if (dateDebut) {
                params.date_debut = dateDebut;
            }

            if (dateFin) {
                params.date_fin = dateFin;
            }

            const [
                dashboardResponse,
                repartitionResponse,
                journalResponse,
                mensuelResponse
            ] = await Promise.all([
                axios.get(`${API_URL}/comptabilite/dashboard`, { params }),
                axios.get(`${API_URL}/comptabilite/paiements-par-mode`, { params }),
                axios.get(`${API_URL}/comptabilite/journal`, { params }),
                axios.get(`${API_URL}/comptabilite/mensuel`, { params })
            ]);

            setDashboard(dashboardResponse.data);
            setRepartition(repartitionResponse.data);
            setJournal(journalResponse.data);
            setMensuel(mensuelResponse.data);
        } catch (err) {
            console.error("Erreur comptabilité :", err);
            setError(
                err.response?.data?.message ||
                "Impossible de charger les données comptables."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chargerDonnees();
    }, []);

    const formaterMontant = (montant) => {
        return Number(montant || 0).toLocaleString("fr-FR") + " FCFA";
    };

    const formaterDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const libelleModePaiement = (mode) => {
        const modes = {
            ESPECES: "Espèces",
            WAVE: "Wave",
            ORANGE_MONEY: "Orange Money",
            FREE_MONEY: "Free Money"
        };

        return modes[mode] || mode || "-";
    };

    const libelleTypeMouvement = (type) => {
        if (type === "ENTREE") return "Entrée";
        if (type === "SORTIE") return "Sortie";

        return type || "-";
    };

    if (loading) {
        return (
            <div className="comptabilite-page">
                <div className="comptabilite-loading">
                    Chargement des données comptables...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="comptabilite-page">
                <div className="comptabilite-error">
                    <h2>Erreur</h2>
                    <p>{error}</p>

                    <button onClick={chargerDonnees}>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="comptabilite-page">

            {/* EN-TÊTE */}
            <div className="comptabilite-header">
                <div>
                    <h1>Comptabilité</h1>
                    <p>
                        Vue d'ensemble des recettes, encaissements et mouvements
                        de caisse.
                    </p>
                </div>

                <button
                    className="btn-actualiser"
                    onClick={chargerDonnees}
                >
                    ↻ Actualiser
                </button>
            </div>

            {/* FILTRES */}
            <div className="comptabilite-filtres">

                <div className="filtre-groupe">
                    <label>Date de début</label>

                    <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                    />
                </div>

                <div className="filtre-groupe">
                    <label>Date de fin</label>

                    <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                    />
                </div>

                <button
                    className="btn-filtrer"
                    onClick={chargerDonnees}
                >
                    Appliquer
                </button>

                <button
                    className="btn-reinitialiser"
                    onClick={() => {
                        setDateDebut("");
                        setDateFin("");

                        chargerDonneesAvecDates("", "");
                    }}
                >
                    Réinitialiser
                </button>
                            </div>

            {/* KPI PRINCIPAUX */}
            {dashboard && (
                <>
                    <div className="kpi-grid">

                        <div className="kpi-card chiffre-affaires">
                            <div className="kpi-icon">💰</div>

                            <div>
                                <span className="kpi-label">
                                    Chiffre d'affaires
                                </span>

                                <strong>
                                    {formaterMontant(
                                        dashboard.finances?.chiffre_affaires
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="kpi-card encaissements">
                            <div className="kpi-icon">💳</div>

                            <div>
                                <span className="kpi-label">
                                    Total encaissements
                                </span>

                                <strong>
                                    {formaterMontant(
                                        dashboard.finances?.total_encaissements
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="kpi-card sorties">
                            <div className="kpi-icon">↗</div>

                            <div>
                                <span className="kpi-label">
                                    Total sorties
                                </span>

                                <strong>
                                    {formaterMontant(
                                        dashboard.finances?.total_sorties
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="kpi-card solde">
                            <div className="kpi-icon">🏦</div>

                            <div>
                                <span className="kpi-label">
                                    Solde caisses ouvertes
                                </span>

                                <strong>
                                    {formaterMontant(
                                        dashboard.finances?.solde_global_caisses
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="kpi-card impayes">
                            <div className="kpi-icon">⚠️</div>

                            <div>
                                <span className="kpi-label">
                                    Total impayés
                                </span>

                                <strong>
                                    {formaterMontant(
                                        dashboard.finances?.total_impayes
                                    )}
                                </strong>
                            </div>
                        </div>

                    </div>

                    {/* STATISTIQUES FACTURES */}
                    <section className="section-comptabilite">

                        <div className="section-title">
                            <h2>État des factures</h2>
                        </div>

                        <div className="factures-stats">

                            <div className="facture-stat">
                                <span>Total factures</span>
                                <strong>
                                    {dashboard.factures?.nombre || 0}
                                </strong>
                            </div>

                            <div className="facture-stat payees">
                                <span>Factures payées</span>
                                <strong>
                                    {dashboard.factures?.payees || 0}
                                </strong>
                            </div>

                            <div className="facture-stat partielles">
                                <span>Factures partielles</span>
                                <strong>
                                    {dashboard.factures?.partielles || 0}
                                </strong>
                            </div>

                        </div>

                    </section>
                </>
            )}

            {/* RÉPARTITION DES PAIEMENTS */}
            <section className="section-comptabilite">

                <div className="section-title">
                    <div>
                        <h2>Répartition des encaissements</h2>
                        <p>Montants encaissés par mode de paiement</p>
                    </div>
                </div>

                <div className="modes-grid">

                    {["ESPECES", "WAVE", "ORANGE_MONEY", "FREE_MONEY"].map(
                        (mode) => {

                            const element = repartition.find(
                                (item) =>
                                    item.mode_paiement === mode
                            );

                            const montant = element?.montant_total || 0;

                            return (
                                <div
                                    className="mode-card"
                                    key={mode}
                                >
                                    <span>
                                        {libelleModePaiement(mode)}
                                    </span>

                                    <strong>
                                        {formaterMontant(montant)}
                                    </strong>

                                    <small>
                                        {element?.nombre_paiements || 0} paiement(s)
                                    </small>
                                </div>
                            );
                        }
                    )}

                </div>

            </section>

            {/* RÉCAPITULATIF MENSUEL */}
            <section className="section-comptabilite">

                <div className="section-title">
                    <div>
                        <h2>Évolution mensuelle</h2>
                        <p>Encaissements regroupés par mois</p>
                    </div>
                </div>

                <div className="table-container">

                    <table className="comptabilite-table">

                        <thead>
                            <tr>
                                <th>Mois</th>
                                <th>Nombre de paiements</th>
                                <th>Total encaissé</th>
                            </tr>
                        </thead>

                        <tbody>

                            {mensuel.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="empty-cell">
                                        Aucun encaissement pour cette période.
                                    </td>
                                </tr>
                            ) : (
                                mensuel.map((ligne, index) => (
                                    <tr key={index}>
                                        <td>
                                            {ligne.mois || "-"}
                                        </td>

                                        <td>
                                            {ligne.nombre_paiements || 0}
                                        </td>

                                        <td className="montant-cell">
                                            {formaterMontant(
                                                ligne.total_encaissements
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* JOURNAL COMPTABLE */}
            <section className="section-comptabilite">

                <div className="section-title">
                    <div>
                        <h2>Journal des mouvements</h2>
                        <p>
                            Historique des entrées et sorties de caisse
                        </p>
                    </div>

                    <span className="journal-count">
                        {journal.length} mouvement(s)
                    </span>
                </div>

                <div className="table-container">

                    <table className="comptabilite-table">

                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Motif</th>
                                <th>Caisse</th>
                                <th>Paiement</th>
                                <th>Facture</th>
                                <th>Mode</th>
                                <th>Montant</th>
                            </tr>
                        </thead>

                        <tbody>

                            {journal.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="empty-cell"
                                    >
                                        Aucun mouvement enregistré.
                                    </td>
                                </tr>
                            ) : (
                                journal.map((mouvement, index) => (

                                    <tr key={
                                        mouvement.id_mouvement_caisse ||
                                        index
                                    }>

                                        <td>
                                            {formaterDate(
                                                mouvement.date_mouvement
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    mouvement.type_mouvement ===
                                                    "ENTREE"
                                                        ? "badge-entree"
                                                        : "badge-sortie"
                                                }
                                            >
                                                {libelleTypeMouvement(
                                                    mouvement.type_mouvement
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            {mouvement.motif || "-"}
                                        </td>

                                        <td>
                                            {mouvement.nom_caisse || "-"}
                                        </td>

                                        <td>
                                            {mouvement.numero_paiement || "-"}
                                        </td>

                                        <td>
                                            {mouvement.numero_facture || "-"}
                                        </td>

                                        <td>
                                            {libelleModePaiement(
                                                mouvement.mode_paiement
                                            )}
                                        </td>

                                        <td
                                            className={
                                                mouvement.type_mouvement ===
                                                "ENTREE"
                                                    ? "montant-entree"
                                                    : "montant-sortie"
                                            }
                                        >
                                            {formaterMontant(
                                                mouvement.montant
                                            )}
                                        </td>

                                    </tr>

                                ))
                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default Comptabilite;