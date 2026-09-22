import React, { useEffect, useMemo, useState } from "react";
import "./JournalAudit.css";

const API_URL = "http://localhost:5000/api/audit";

function JournalAudit() {
    const [audits, setAudits] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    const [recherche, setRecherche] = useState("");
    const [filtreAction, setFiltreAction] = useState("TOUTES");
    const [filtreTable, setFiltreTable] = useState("TOUTES");

    const [auditSelectionne, setAuditSelectionne] = useState(null);

    // =====================================================
    // CHARGEMENT DU JOURNAL
    // =====================================================

    useEffect(() => {
        chargerAudits();
    }, []);

    const chargerAudits = async () => {
        try {
            setChargement(true);
            setErreur("");

            const response = await fetch(API_URL);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors du chargement du journal"
                );
            }

            setAudits(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erreur chargement audit :", error);

            setErreur(
                error.message ||
                "Impossible de charger le journal d'audit"
            );
        } finally {
            setChargement(false);
        }
    };

    // =====================================================
    // FILTRES
    // =====================================================

    const actionsDisponibles = useMemo(() => {
        return [
            ...new Set(
                audits
                    .map((audit) => audit.action)
                    .filter(Boolean)
            ),
        ].sort();
    }, [audits]);

    const tablesDisponibles = useMemo(() => {
        return [
            ...new Set(
                audits
                    .map((audit) => audit.table_cible)
                    .filter(Boolean)
            ),
        ].sort();
    }, [audits]);

    const auditsFiltres = useMemo(() => {
        const terme = recherche
            .trim()
            .toLowerCase();

        return audits.filter((audit) => {
            const correspondRecherche =
                !terme ||
                String(
                    audit.nom_utilisateur || ""
                )
                    .toLowerCase()
                    .includes(terme) ||
                String(
                    audit.nom_complet || ""
                )
                    .toLowerCase()
                    .includes(terme) ||
                String(
                    audit.action || ""
                )
                    .toLowerCase()
                    .includes(terme) ||
                String(
                    audit.table_cible || ""
                )
                    .toLowerCase()
                    .includes(terme) ||
                String(
                    audit.description || ""
                )
                    .toLowerCase()
                    .includes(terme);

            const correspondAction =
                filtreAction === "TOUTES" ||
                audit.action === filtreAction;

            const correspondTable =
                filtreTable === "TOUTES" ||
                audit.table_cible === filtreTable;

            return (
                correspondRecherche &&
                correspondAction &&
                correspondTable
            );
        });
    }, [
        audits,
        recherche,
        filtreAction,
        filtreTable,
    ]);

    // =====================================================
    // FORMATAGE DATE
    // =====================================================

    const formaterDate = (date) => {
        if (!date) {
            return "-";
        }

        const valeur = new Date(date);

        if (Number.isNaN(valeur.getTime())) {
            return date;
        }

        return valeur.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // =====================================================
    // COULEUR / STYLE ACTION
    // =====================================================

    const getClasseAction = (action) => {
        const valeur = String(action || "")
            .toUpperCase();

        if (
            valeur.includes("SUPPRESSION") ||
            valeur.includes("DELETE")
        ) {
            return "audit-action-danger";
        }

        if (
            valeur.includes("MODIFICATION") ||
            valeur.includes("UPDATE")
        ) {
            return "audit-action-warning";
        }

        if (
            valeur.includes("CREATION") ||
            valeur.includes("CREATE")
        ) {
            return "audit-action-success";
        }

        if (
            valeur.includes("CONNEXION") ||
            valeur.includes("LOGIN")
        ) {
            return "audit-action-info";
        }

        return "audit-action-neutral";
    };

    // =====================================================
    // FORMATAGE JSON
    // =====================================================

    const formaterValeur = (valeur) => {
        if (
            valeur === null ||
            valeur === undefined ||
            valeur === ""
        ) {
            return "Aucune donnée";
        }

        try {
            const objet =
                typeof valeur === "string"
                    ? JSON.parse(valeur)
                    : valeur;

            return JSON.stringify(
                objet,
                null,
                2
            );
        } catch {
            return String(valeur);
        }
    };

    // =====================================================
    // STATISTIQUES
    // =====================================================

    const nombreActions = audits.length;

    const nombreUtilisateurs = new Set(
        audits
            .map((audit) => audit.id_utilisateur)
            .filter(Boolean)
    ).size;

    const nombreAujourdHui = audits.filter(
        (audit) => {
            if (!audit.date_action) {
                return false;
            }

            const dateAudit =
                new Date(audit.date_action);

            const maintenant = new Date();

            return (
                dateAudit.getDate() ===
                    maintenant.getDate() &&
                dateAudit.getMonth() ===
                    maintenant.getMonth() &&
                dateAudit.getFullYear() ===
                    maintenant.getFullYear()
            );
        }
    ).length;

    // =====================================================
    // RENDU
    // =====================================================

    return (
        <div className="journal-audit-page">

            {/* HEADER */}
            <div className="audit-header">
                <div>
                    <h1>Journal d'audit</h1>

                    <p>
                        Consultez l'historique des actions
                        effectuées dans le système.
                    </p>
                </div>

                <button
                    className="audit-refresh-btn"
                    onClick={chargerAudits}
                    disabled={chargement}
                >
                    ↻ Actualiser
                </button>
            </div>

            {/* STATISTIQUES */}
            <div className="audit-stats">

                <div className="audit-stat-card">
                    <div className="audit-stat-icon">
                        📋
                    </div>

                    <div>
                        <span>Total des actions</span>
                        <strong>{nombreActions}</strong>
                    </div>
                </div>

                <div className="audit-stat-card">
                    <div className="audit-stat-icon">
                        👤
                    </div>

                    <div>
                        <span>Utilisateurs actifs dans le journal</span>
                        <strong>
                            {nombreUtilisateurs}
                        </strong>
                    </div>
                </div>

                <div className="audit-stat-card">
                    <div className="audit-stat-icon">
                        🕐
                    </div>

                    <div>
                        <span>Actions aujourd'hui</span>
                        <strong>
                            {nombreAujourdHui}
                        </strong>
                    </div>
                </div>
            </div>

            {/* ERREUR */}
            {erreur && (
                <div className="audit-message erreur">
                    ⚠ {erreur}
                </div>
            )}

            {/* FILTRES */}
            <div className="audit-filtres">

                <div className="audit-recherche">
                    <span>🔎</span>

                    <input
                        type="text"
                        placeholder="Rechercher une action, un utilisateur..."
                        value={recherche}
                        onChange={(e) =>
                            setRecherche(
                                e.target.value
                            )
                        }
                    />
                </div>

                <select
                    value={filtreAction}
                    onChange={(e) =>
                        setFiltreAction(
                            e.target.value
                        )
                    }
                >
                    <option value="TOUTES">
                        Toutes les actions
                    </option>

                    {actionsDisponibles.map(
                        (action) => (
                            <option
                                key={action}
                                value={action}
                            >
                                {action}
                            </option>
                        )
                    )}
                </select>

                <select
                    value={filtreTable}
                    onChange={(e) =>
                        setFiltreTable(
                            e.target.value
                        )
                    }
                >
                    <option value="TOUTES">
                        Toutes les tables
                    </option>

                    {tablesDisponibles.map(
                        (table) => (
                            <option
                                key={table}
                                value={table}
                            >
                                {table}
                            </option>
                        )
                    )}
                </select>

                {(recherche ||
                    filtreAction !== "TOUTES" ||
                    filtreTable !== "TOUTES") && (
                    <button
                        className="audit-reset-btn"
                        onClick={() => {
                            setRecherche("");
                            setFiltreAction("TOUTES");
                            setFiltreTable("TOUTES");
                        }}
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* TABLEAU */}
            <div className="audit-card">

                <div className="audit-card-header">
                    <div>
                        <h2>
                            Historique des opérations
                        </h2>

                        <span>
                            {auditsFiltres.length} entrée(s)
                        </span>
                    </div>
                </div>

                {chargement ? (
                    <div className="audit-loading">
                        Chargement du journal...
                    </div>
                ) : auditsFiltres.length === 0 ? (
                    <div className="audit-empty">
                        <div className="audit-empty-icon">
                            🔐
                        </div>

                        <strong>
                            Aucun événement trouvé
                        </strong>

                        <p>
                            Le journal ne contient aucune
                            entrée correspondant à vos critères.
                        </p>
                    </div>
                ) : (
                    <div className="audit-table-container">

                        <table className="audit-table">

                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Utilisateur</th>
                                    <th>Action</th>
                                    <th>Cible</th>
                                    <th>Description</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {auditsFiltres.map(
                                    (audit) => (
                                        <tr
                                            key={
                                                audit.id_audit
                                            }
                                        >
                                            <td>
                                                <div className="audit-date">
                                                    {formaterDate(
                                                        audit.date_action
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="audit-user">
                                                    <div className="audit-user-avatar">
                                                        👤
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {audit.nom_utilisateur ||
                                                                "Système"}
                                                        </strong>

                                                        <span>
                                                            {audit.nom_complet ||
                                                                "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`audit-action ${getClasseAction(
                                                        audit.action
                                                    )}`}
                                                >
                                                    {
                                                        audit.action
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="audit-cible">
                                                    <strong>
                                                        {audit.table_cible ||
                                                            "-"}
                                                    </strong>

                                                    {audit.id_cible && (
                                                        <span>
                                                            ID :{" "}
                                                            {
                                                                audit.id_cible
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="audit-description">
                                                    {audit.description ||
                                                        "Aucune description"}
                                                </div>
                                            </td>

                                            <td>
                                                <button
                                                    className="audit-details-btn"
                                                    onClick={() =>
                                                        setAuditSelectionne(
                                                            audit
                                                        )
                                                    }
                                                >
                                                    👁️
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

            {/* MODAL DETAILS */}
            {auditSelectionne && (
                <div
                    className="audit-modal-overlay"
                    onClick={() =>
                        setAuditSelectionne(null)
                    }
                >
                    <div
                        className="audit-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="audit-modal-header">

                            <div>
                                <h2>
                                    Détails de l'action
                                </h2>

                                <p>
                                    Audit #
                                    {
                                        auditSelectionne.id_audit
                                    }
                                </p>
                            </div>

                            <button
                                className="audit-modal-close"
                                onClick={() =>
                                    setAuditSelectionne(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="audit-modal-content">

                            <div className="audit-detail-grid">

                                <div className="audit-detail">
                                    <span>
                                        Utilisateur
                                    </span>

                                    <strong>
                                        {auditSelectionne.nom_utilisateur ||
                                            "Système"}
                                    </strong>
                                </div>

                                <div className="audit-detail">
                                    <span>
                                        Rôle
                                    </span>

                                    <strong>
                                        {auditSelectionne.nom_role ||
                                            "-"}
                                    </strong>
                                </div>

                                <div className="audit-detail">
                                    <span>
                                        Action
                                    </span>

                                    <strong>
                                        {
                                            auditSelectionne.action
                                        }
                                    </strong>
                                </div>

                                <div className="audit-detail">
                                    <span>
                                        Date
                                    </span>

                                    <strong>
                                        {formaterDate(
                                            auditSelectionne.date_action
                                        )}
                                    </strong>
                                </div>

                                <div className="audit-detail">
                                    <span>
                                        Table cible
                                    </span>

                                    <strong>
                                        {auditSelectionne.table_cible ||
                                            "-"}
                                    </strong>
                                </div>

                                <div className="audit-detail">
                                    <span>
                                        ID cible
                                    </span>

                                    <strong>
                                        {auditSelectionne.id_cible ||
                                            "-"}
                                    </strong>
                                </div>

                            </div>

                            <div className="audit-detail-block">
                                <h3>
                                    Description
                                </h3>

                                <p>
                                    {auditSelectionne.description ||
                                        "Aucune description"}
                                </p>
                            </div>

                            <div className="audit-detail-block">
                                <h3>
                                    Ancienne valeur
                                </h3>

                                <pre>
                                    {formaterValeur(
                                        auditSelectionne.ancienne_valeur
                                    )}
                                </pre>
                            </div>

                            <div className="audit-detail-block">
                                <h3>
                                    Nouvelle valeur
                                </h3>

                                <pre>
                                    {formaterValeur(
                                        auditSelectionne.nouvelle_valeur
                                    )}
                                </pre>
                            </div>

                            <div className="audit-detail-block">
                                <h3>
                                    Informations techniques
                                </h3>

                                <div className="audit-technique">

                                    <div>
                                        <span>
                                            Adresse IP
                                        </span>

                                        <strong>
                                            {auditSelectionne.adresse_ip ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Navigateur
                                        </span>

                                        <strong>
                                            {auditSelectionne.user_agent ||
                                                "-"}
                                        </strong>
                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default JournalAudit;