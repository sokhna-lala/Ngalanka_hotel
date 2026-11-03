import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api/dashboard/stats";

function Dashboard() {


    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [termeRecherche, setTermeRecherche] = useState("");
    const [resultatsRecherche, setResultatsRecherche] = useState(null);
    const [rechercheEnCours, setRechercheEnCours] = useState(false);
    const [erreurRecherche, setErreurRecherche] = useState("");



    const rechercherGlobalement = async (terme) => {
    setTermeRecherche(terme);
    setErreurRecherche("");

    if (terme.trim().length < 2) {
        setResultatsRecherche(null);
        return;
    }

    try {
        setRechercheEnCours(true);

        const response = await fetch(
            `http://localhost:5000/api/dashboard/recherche?q=${encodeURIComponent(terme.trim())}`
        );

        if (!response.ok) {
            throw new Error("La recherche a échoué.");
        }

        const data = await response.json();
        setResultatsRecherche(data);

    } catch (error) {
        console.error("Erreur de recherche :", error);
        setErreurRecherche("Impossible d'effectuer la recherche.");
        setResultatsRecherche(null);

    } finally {
        setRechercheEnCours(false);
    }
};

    // =====================================================
    // Charger les statistiques
    // =====================================================

    const chargerDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(
                    "Impossible de récupérer les statistiques"
                );
            }

            const data = await response.json();

            setStats(data);

        } catch (err) {

            console.error(
                "Erreur chargement dashboard :",
                err
            );

            setError(
                "Impossible de charger les statistiques du dashboard."
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // Chargement initial
    // =====================================================

    useEffect(() => {

        chargerDashboard();

    }, []);


    // =====================================================
    // Formatage des montants
    // =====================================================

    const formatMontant = (montant) => {

        return new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: 0
        }).format(
            Number(montant || 0)
        ) + " FCFA";

    };


    // =====================================================
    // Données chambres
    // =====================================================

    const chambres = stats?.chambres || {};

    const chambresParType =
        chambres.par_type || [];


    // =====================================================
    // Chargement
    // =====================================================

    if (loading) {

        return (
            <div className="dashboard-page">

                <div className="dashboard-loading">

                    <div className="dashboard-spinner"></div>

                    <p>
                        Chargement du tableau de bord...
                    </p>

                </div>

            </div>
        );

    }



    // =====================================================
    // Erreur
    // =====================================================

    if (error) {

        return (
            <div className="dashboard-page">

                <div className="dashboard-error">

                    <div className="dashboard-error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Tableau de bord indisponible
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        className="dashboard-retry"
                        onClick={chargerDashboard}
                    >
                        🔄 Réessayer
                    </button>

                </div>

            </div>
        );

    }


    if (!stats) {
        return null;
    }


    // =====================================================
    // DASHBOARD
    // =====================================================

    return (

        <div className="dashboard-page">


            {/* =================================================
                STATISTIQUES PRINCIPALES
            ================================================= */}

            <section className="dashboard-main-stats">
                 <section className="dashboard-search-section">
    <h2>🔎 Recherche rapide</h2>
    <p>Rechercher un client, une réservation ou une chambre.</p>

    <input
        type="search"
        className="dashboard-search-input"
        placeholder="Nom, téléphone, réservation ou chambre..."
        value={termeRecherche}
        onChange={(e) => rechercherGlobalement(e.target.value)}
    />

    {rechercheEnCours && <p>Recherche en cours...</p>}

    {erreurRecherche && (
        <p className="dashboard-search-error">{erreurRecherche}</p>
    )}

    {resultatsRecherche && (
        <div className="dashboard-search-results">

<h3>Clients</h3>
{resultatsRecherche.clients.map((client) => (
    <div
        key={client.id_client}
        className="dashboard-search-result"
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/clients/${client.id_client}`)}
        onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/clients/${client.id_client}`);
            }
        }}
        style={{ cursor: "pointer" }}
    >
        <strong>
            {client.prenom} {client.nom}
        </strong>
        <span>{client.telephone}</span>
    </div>
))}


            <h3>Réservations</h3>
            {resultatsRecherche.reservations.map((reservation) => (
                <div key={reservation.id_reservation} className="dashboard-search-result">
                    <strong>{reservation.numero_reservation}</strong>
                    <span>{reservation.prenom} {reservation.nom}</span>
                    <small>Statut : {reservation.statut}</small>
                </div>
            ))}

            <h3>Chambres</h3>
            {resultatsRecherche.chambres.map((chambre) => (
                <div key={chambre.id_chambre} className="dashboard-search-result">
                    <strong>Chambre {chambre.numero}</strong>
                    <span>{chambre.type_chambre}</span>
                    <small>Statut : {chambre.statut}</small>
                </div>
            ))}
        </div>
    )}
</section>


                <div className="section-header">

                    <div>

                        <h2>
                            📊 Vue d'ensemble
                        </h2>

                        <p>
                            Activité actuelle de l'hôtel
                        </p>

                    </div>

                </div>


                <div className="stats-grid">


                    {/* ================================
                        CLIENTS
                    ================================= */}

                    <div className="stat-card">

                        <div className="stat-icon purple">
                            👥
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Clients
                            </span>

                            <strong>
                                {stats.total_clients}
                            </strong>

                            <small>
                                Clients enregistrés
                            </small>

                        </div>

                    </div>


                    {/* ================================
                        RÉSERVATIONS
                    ================================= */}

                    <div className="stat-card">

                        <div className="stat-icon cyan">
                            📝
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Réservations
                            </span>

                            <strong>
                                {stats.reservations}
                            </strong>

                            <small>
                                Réservations à venir
                            </small>

                        </div>

                    </div>


                    {/* ================================
                        ARRIVÉES
                    ================================= */}

                    <div className="stat-card">

                        <div className="stat-icon teal">
                            🛬
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Arrivées aujourd'hui
                            </span>

                            <strong>
                                {stats.arrivees_du_jour}
                            </strong>

                            <small>
                                Check-in prévus
                            </small>

                        </div>

                    </div>


                    {/* ================================
                        DÉPARTS
                    ================================= */}

                    <div className="stat-card">

                        <div className="stat-icon gray">
                            🛫
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Départs aujourd'hui
                            </span>

                            <strong>
                                {stats.departs_du_jour}
                            </strong>

                            <small>
                                Check-out prévus
                            </small>

                        </div>

                    </div>




                    {/* ================================
                        NETTOYAGE
                    ================================= */}

                    <div className="stat-card">

                        <div className="stat-icon orange">
                            🧹
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Chambres en nettoyage
                            </span>

                            <strong>
                                {chambres.nettoyage}
                            </strong>

                            <small>
                                À préparer
                            </small>

                        </div>

                    </div>


                    {/* ================================
                        MAINTENANCE
                    ================================= */}

                    <div className="stat-card">

                        <div className="stat-icon red">
                            🔧
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Maintenance
                            </span>

                            <strong>
                                {stats.maintenances_en_cours}
                            </strong>

                            <small>
                                Interventions en cours
                            </small>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                ÉTAT DES CHAMBRES
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <div>

                        <h2>
                            🏨 État des chambres
                        </h2>

                        <p>
                            Répartition par type et par statut
                        </p>

                    </div>

                </div>


                <div className="room-types-grid">

                    {chambresParType.map((type) => (

                        <div
                            className="room-type-card"
                            key={type.id_type}
                        >

                            {/* ============================
                                EN-TÊTE DU TYPE
                            ============================= */}

                            <div className="room-type-header">

                                <div className="room-type-icon">
                                    🛏️
                                </div>

                                <div>

                                    <h3>
                                        {type.libelle}
                                    </h3>

                                    <span>
                                        {type.total} chambre
                                        {type.total > 1 ? "s" : ""}
                                    </span>

                                </div>

                            </div>


                            {/* ============================
                                TOTAL
                            ============================= */}

                            <div className="room-type-total">

                                <strong>
                                    {type.total}
                                </strong>

                                <span>
                                    chambres au total
                                </span>

                            </div>


                            {/* ============================
                                STATUTS
                            ============================= */}

                            <div className="room-status-list">


                                {/* Disponibles */}

                                <div className="room-status-item">

                                    <span>

                                        <i className="status-dot available"></i>

                                        Disponibles

                                    </span>

                                    <strong>
                                        {type.disponibles}
                                    </strong>

                                </div>


                                {/* Occupées */}

                                <div className="room-status-item">

                                    <span>

                                        <i className="status-dot occupied"></i>

                                        Occupées

                                    </span>

                                    <strong>
                                        {type.occupees}
                                    </strong>

                                </div>


                                {/* Réservées */}

                                <div className="room-status-item">

                                    <span>

                                        <i className="status-dot reserved"></i>

                                        Réservées

                                    </span>

                                    <strong>
                                        {type.reservees}
                                    </strong>

                                </div>


                                {/* Nettoyage */}

                                <div className="room-status-item">

                                    <span>

                                        <i className="status-dot cleaning"></i>

                                        Nettoyage

                                    </span>

                                    <strong>
                                        {type.nettoyage}
                                    </strong>

                                </div>


                                {/* Hors service */}

                                <div className="room-status-item">

                                    <span>

                                        <i className="status-dot out"></i>

                                        Hors service

                                    </span>

                                    <strong>
                                        {type.hors_service}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </section>


            {/* =================================================
                RÉSUMÉ CHAMBRES
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <div>

                        <h2>
                            📌 Résumé de l'hébergement
                        </h2>

                        <p>
                            Situation globale du parc hôtelier
                        </p>

                    </div>

                </div>


                <div className="room-summary-grid">


                    {/* Total */}

                    <div className="room-summary-card">

                        <div className="summary-icon blue">
                            🏨
                        </div>

                        <div>

                            <span>
                                Total chambres
                            </span>

                            <strong>
                                {chambres.total}
                            </strong>

                        </div>

                    </div>


                    {/* Disponibles */}

                    <div className="room-summary-card">

                        <div className="summary-icon green">
                            🟢
                        </div>

                        <div>

                            <span>
                                Disponibles
                            </span>

                            <strong>
                                {chambres.disponibles}
                            </strong>

                        </div>

                    </div>


                    {/* Occupées */}

                    <div className="room-summary-card">

                        <div className="summary-icon red">
                            🔴
                        </div>

                        <div>

                            <span>
                                Occupées
                            </span>

                            <strong>
                                {chambres.occupees}
                            </strong>

                        </div>

                    </div>


                    {/* Réservées */}

                    <div className="room-summary-card">

                        <div className="summary-icon orange">
                            📅
                        </div>

                        <div>

                            <span>
                                Réservées
                            </span>

                            <strong>
                                {chambres.reservees}
                            </strong>

                        </div>

                    </div>


                    {/* Nettoyage */}

                    <div className="room-summary-card">

                        <div className="summary-icon cyan">
                            🧹
                        </div>

                        <div>

                            <span>
                                Nettoyage
                            </span>

                            <strong>
                                {chambres.nettoyage}
                            </strong>

                        </div>

                    </div>


                    {/* Hors service */}

                    <div className="room-summary-card">

                        <div className="summary-icon gray">
                            🔧
                        </div>

                        <div>

                            <span>
                                Hors service
                            </span>

                            <strong>
                                {chambres.hors_service}
                            </strong>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                ALERTES
            ================================================= */}

            <section className="dashboard-section dashboard-alerts">

                <div className="section-header">

                    <div>

                        <h2>
                            🔔 Alertes et informations
                        </h2>

                        <p>
                            Éléments nécessitant votre attention
                        </p>

                    </div>

                </div>


                <div className="alerts-grid">


                    {/* Factures */}

                    <div className="alert-card">

                        <div className="alert-icon">
                            💳
                        </div>

                        <div>

                            <strong>
                                {stats.factures_impayees?.nombre || 0}
                            </strong>

                            <span>

                                facture
                                {(stats.factures_impayees?.nombre || 0) > 1
                                    ? "s"
                                    : ""
                                }

                                {" "}impayée
                                {(stats.factures_impayees?.nombre || 0) > 1
                                    ? "s"
                                    : ""
                                }

                            </span>

                            <small>
                                {formatMontant(
                                    stats.factures_impayees?.montant || 0
                                )}
                            </small>

                        </div>

                    </div>


                    {/* Nettoyage */}

                    <div className="alert-card">

                        <div className="alert-icon">
                            🧹
                        </div>

                        <div>

                            <strong>
                                {chambres.nettoyage}
                            </strong>

                            <span>

                                chambre
                                {chambres.nettoyage > 1
                                    ? "s"
                                    : ""
                                }

                                {" "}en nettoyage

                            </span>

                            <small>
                                À préparer
                            </small>

                        </div>

                    </div>


                    {/* Maintenance */}

                    <div className="alert-card">

                        <div className="alert-icon">
                            🔧
                        </div>

                        <div>

                            <strong>
                                {stats.maintenances_en_cours}
                            </strong>

                            <span>

                                maintenance
                                {stats.maintenances_en_cours > 1
                                    ? "s"
                                    : ""
                                }

                                {" "}en cours

                            </span>

                            <small>
                                À surveiller
                            </small>

                        </div>

                    </div>


                </div>

            </section>


            {/* =================================================
                ACTUALISATION
            ================================================= */}

            <div className="dashboard-footer">

                <button
                    className="dashboard-refresh"
                    onClick={chargerDashboard}
                >
                    🔄 Actualiser les données
                </button>

            </div>


        </div>

    );

}


export default Dashboard;