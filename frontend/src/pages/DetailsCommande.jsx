
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./DetailsCommande.css";

const API = "http://localhost:5000/api";

function DetailsCommande() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [commande, setCommande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        chargerCommande();
    }, [id]);

    const chargerCommande = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API}/commandes/${id}`
            );

            setCommande(response.data);
        } catch (error) {
            console.error(
                "Erreur récupération détails commande :",
                error
            );

            setError(
                error.response?.data?.message ||
                "Impossible de récupérer les détails de la commande."
            );
        } finally {
            setLoading(false);
        }
    };

    const formaterMontant = (montant) => {
        return (
            Number(montant || 0).toLocaleString("fr-FR") +
            " FCFA"
        );
    };

    const formaterDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatutClass = (statut) => {
        switch (statut) {
            case "OUVERTE":
                return "statut ouverte";

            case "EN_PREPARATION":
                return "statut preparation";

            case "SERVIE":
                return "statut servie";

            case "PAYEE":
                return "statut payee";

            case "ANNULEE":
                return "statut annulee";

            default:
                return "statut";
        }
    };

    /*
    =========================================
    IMPRESSION DU REÇU
    =========================================
    */
  const imprimerRecu = () => {
    if (!commande) return;

    const lignes = commande.lignes || [];

    const produitsHTML = lignes.length > 0
        ? lignes.map((ligne) => `
            <tr>
                <td>${ligne.libelle || "-"}</td>
                <td>${ligne.quantite || 0}${ligne.unite ? ` ${ligne.unite}` : ""}</td>
                <td>${formaterMontant(ligne.prix_unitaire)}</td>
                <td>${formaterMontant(ligne.montant)}</td>
            </tr>
        `).join("")
        : `
            <tr>
                <td colspan="4">
                    Aucun produit
                </td>
            </tr>
        `;

    const fenetre = window.open(
        "",
        "_blank",
        "width=800,height=900"
    );

    if (!fenetre) {
        alert(
            "La fenêtre d'impression a été bloquée par le navigateur."
        );
        return;
    }

    fenetre.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>

            <meta charset="UTF-8">

            <title>
                Reçu ${commande.numero_commande || ""}
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000;
                    background: #fff;
                }

                .recu {
                    width: 100%;
                    max-width: 700px;
                    margin: 0 auto;
                }

                .header {
                    text-align: center;
                    border-bottom: 2px dashed #000;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }

                .header h1 {
                    margin: 0;
                    font-size: 26px;
                }

                .header p {
                    margin: 5px 0;
                    font-size: 14px;
                }

                .header h2 {
                    margin-top: 15px;
                    font-size: 18px;
                }

                .informations {
                    border-bottom: 1px dashed #000;
                    padding-bottom: 12px;
                    margin-bottom: 15px;
                }

                .information {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 7px;
                    font-size: 14px;
                }

                .information strong {
                    text-align: right;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 13px;
                }

                th {
                    border-bottom: 1px solid #000;
                    padding: 8px 4px;
                    text-align: left;
                }

                td {
                    padding: 8px 4px;
                    border-bottom: 1px dotted #999;
                }

                th:nth-child(2),
                td:nth-child(2) {
                    text-align: center;
                }

                th:nth-child(3),
                td:nth-child(3),
                th:nth-child(4),
                td:nth-child(4) {
                    text-align: right;
                }

                .total {
                    display: flex;
                    justify-content: space-between;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    margin-top: 20px;
                    padding: 12px 4px;
                    font-size: 20px;
                    font-weight: bold;
                }

                .observation {
                    margin-top: 20px;
                    font-size: 13px;
                }

                .footer {
                    text-align: center;
                    border-top: 1px dashed #000;
                    margin-top: 25px;
                    padding-top: 15px;
                    font-size: 12px;
                }

                @media print {

                    body {
                        padding: 0;
                    }

                    .recu {
                        max-width: none;
                    }

                }

            </style>

        </head>

        <body>

            <div class="recu">

                <div class="header">

                    <h1>
                        NGALANKA HÔTEL
                    </h1>

                    <p>
                        LOMPOUL SUR MER
                    </p>

                    <h2>
                        REÇU DE COMMANDE
                    </h2>

                </div>


                <div class="informations">

                    <div class="information">
                        <span>Commande :</span>
                        <strong>
                            ${commande.numero_commande || "-"}
                        </strong>
                    </div>

                    <div class="information">
                        <span>Date :</span>
                        <strong>
                            ${formaterDate(commande.date_commande)}
                        </strong>
                    </div>

                    <div class="information">
                        <span>Type :</span>
                        <strong>
                            ${commande.type_commande || "-"}
                        </strong>
                    </div>

                    ${
                        commande.table_numero
                            ? `
                                <div class="information">
                                    <span>Table :</span>
                                    <strong>
                                        ${commande.table_numero}
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                    ${
                        commande.id_chambre
                            ? `
                                <div class="information">
                                    <span>Chambre :</span>
                                    <strong>
                                        #${commande.id_chambre}
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                    ${
                        commande.id_client
                            ? `
                                <div class="information">
                                    <span>Client :</span>
                                    <strong>
                                        Client #${commande.id_client}
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                    ${
                        commande.id_sejour
                            ? `
                                <div class="information">
                                    <span>Séjour :</span>
                                    <strong>
                                        #${commande.id_sejour}
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                </div>


                <table>

                    <thead>

                        <tr>
                            <th>Produit</th>
                            <th>Qté</th>
                            <th>Prix</th>
                            <th>Total</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${produitsHTML}

                    </tbody>

                </table>


                <div class="total">

                    <span>
                        TOTAL
                    </span>

                    <strong>
                        ${formaterMontant(
                            commande.montant_total
                        )}
                    </strong>

                </div>


                ${
                    commande.observation
                        ? `
                            <div class="observation">

                                <strong>
                                    Observation :
                                </strong>

                                <p>
                                    ${commande.observation}
                                </p>

                            </div>
                        `
                        : ""
                }


                <div class="footer">

                    <p>
                        Merci de votre visite
                    </p>

                    <p>
                        NGALANKA HÔTEL - LOMPOUL SUR MER
                    </p>

                </div>

            </div>

        </body>
        </html>
    `);

    fenetre.document.close();

    fenetre.focus();

    setTimeout(() => {
        fenetre.print();
    }, 500);
};

    if (loading) {
        return (
            <div className="details-commande-page">
                <div className="details-loading">
                    Chargement des détails...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="details-commande-page">
                <div className="details-error">
                    <p>{error}</p>

                    <button
                        onClick={() => navigate("/commandes")}
                    >
                        Retour aux commandes
                    </button>
                </div>
            </div>
        );
    }

    if (!commande) {
        return null;
    }

    return (
        <div className="details-commande-page">

            {/* =========================================
                EN-TÊTE
            ========================================== */}
            <div className="details-header no-print">

                <div>
                    <button
                        className="btn-retour"
                        onClick={() => navigate("/commandes")}
                    >
                        ← Retour
                    </button>

                    <h1>
                        Détails de la commande
                    </h1>

                    <p>
                        Informations complètes de la commande
                    </p>
                </div>

                <div className="numero-commande">
                    <span>Commande</span>

                    <strong>
                        {commande.numero_commande}
                    </strong>
                </div>

            </div>

            {/* =========================================
                BOUTON IMPRESSION
            ========================================== */}
            <div className="actions-commande no-print">

                <button
                    className="btn-imprimer"
                    onClick={imprimerRecu}
                >
                    🖨️ Imprimer le reçu
                </button>

            </div>

            {/* =========================================
                ZONE DU REÇU
            ========================================== */}
            <div className="recu-impression">

                {/* EN-TÊTE DU REÇU */}
                <div className="recu-header">

                    <h1>
                        NGALANKA HÔTEL
                    </h1>

                    <p>
                        LOMPOUL SUR MER
                    </p>

                    <h2>
                        REÇU DE COMMANDE
                    </h2>

                </div>

                {/* INFORMATIONS DE LA COMMANDE */}
                <div className="recu-informations">

                    <div>
                        <span>Commande :</span>
                        <strong>
                            {commande.numero_commande || "-"}
                        </strong>
                    </div>

                    <div>
                        <span>Date :</span>
                        <strong>
                            {formaterDate(
                                commande.date_commande
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Type :</span>
                        <strong>
                            {commande.type_commande || "-"}
                        </strong>
                    </div>

                    {commande.table_numero && (
                        <div>
                            <span>Table :</span>
                            <strong>
                                {commande.table_numero}
                            </strong>
                        </div>
                    )}

                    {commande.id_chambre && (
                        <div>
                            <span>Chambre :</span>
                            <strong>
                                {`#${commande.id_chambre}`}
                            </strong>
                        </div>
                    )}

                    {commande.id_client && (
                        <div>
                            <span>Client :</span>
                            <strong>
                                {`Client #${commande.id_client}`}
                            </strong>
                        </div>
                    )}

                    {commande.id_sejour && (
                        <div>
                            <span>Séjour :</span>
                            <strong>
                                {`#${commande.id_sejour}`}
                            </strong>
                        </div>
                    )}

                </div>

                {/* PRODUITS DU REÇU */}
                <div className="recu-produits">

                    <table>

                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Qté</th>
                                <th>Prix</th>
                                <th>Total</th>
                            </tr>
                        </thead>

                        <tbody>

                            {commande.lignes &&
                            commande.lignes.length > 0 ? (
                                commande.lignes.map((ligne) => (
                                    <tr key={ligne.id_ligne}>

                                        <td>
                                            {ligne.libelle}
                                        </td>

                                        <td>
                                            {ligne.quantite}
                                            {ligne.unite
                                                ? ` ${ligne.unite}`
                                                : ""}
                                        </td>

                                        <td>
                                            {formaterMontant(
                                                ligne.prix_unitaire
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                {formaterMontant(
                                                    ligne.montant
                                                )}
                                            </strong>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">
                                        Aucun produit.
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                {/* TOTAL */}
                <div className="recu-total">

                    <span>
                        TOTAL
                    </span>

                    <strong>
                        {formaterMontant(
                            commande.montant_total
                        )}
                    </strong>

                </div>

                {/* OBSERVATION */}
                {commande.observation && (
                    <div className="recu-observation">

                        <strong>
                            Observation :
                        </strong>

                        <p>
                            {commande.observation}
                        </p>

                    </div>
                )}

                {/* PIED DU REÇU */}
                <div className="recu-footer">

                    <p>
                        Merci de votre visite
                    </p>

                    <p>
                        NGALANKA HÔTEL - LOMPOUL SUR MER
                    </p>

                </div>

            </div>

            {/* =========================================
                INFORMATIONS GENERALES
            ========================================== */}
            <div className="commande-infos no-print">

                <div className="info-card">
                    <span className="info-label">
                        Numéro
                    </span>

                    <strong>
                        {commande.numero_commande || "-"}
                    </strong>
                </div>

                <div className="info-card">
                    <span className="info-label">
                        Type
                    </span>

                    <strong>
                        {commande.type_commande || "-"}
                    </strong>
                </div>

                <div className="info-card">
                    <span className="info-label">
                        Date
                    </span>

                    <strong>
                        {formaterDate(
                            commande.date_commande
                        )}
                    </strong>
                </div>

                <div className="info-card">
                    <span className="info-label">
                        Statut
                    </span>

                    <span
                        className={getStatutClass(
                            commande.statut
                        )}
                    >
                        {commande.statut || "OUVERTE"}
                    </span>
                </div>

            </div>

            {/* =========================================
                CLIENT / TABLE / CHAMBRE
            ========================================== */}
            <div className="details-section no-print">

                <div className="section-title">
                    <h2>
                        Informations de consommation
                    </h2>
                </div>

                <div className="consommation-grid">

                    <div>
                        <span>Client</span>

                        <strong>
                            {commande.id_client
                                ? `Client #${commande.id_client}`
                                : "Client non renseigné"}
                        </strong>
                    </div>

                    <div>
                        <span>Chambre</span>

                        <strong>
                            {commande.id_chambre
                                ? `Chambre #${commande.id_chambre}`
                                : "Aucune"}
                        </strong>
                    </div>

                    <div>
                        <span>Table</span>

                        <strong>
                            {commande.table_numero || "Aucune"}
                        </strong>
                    </div>

                    <div>
                        <span>Séjour</span>

                        <strong>
                            {commande.id_sejour
                                ? `Séjour #${commande.id_sejour}`
                                : "Aucun"}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =========================================
                PRODUITS
            ========================================== */}
            <div className="details-section no-print">

                <div className="section-title">

                    <div>
                        <h2>
                            Produits commandés
                        </h2>

                        <p>
                            {commande.lignes?.length || 0}
                            {" "}
                            produit(s)
                        </p>
                    </div>

                </div>

                {commande.lignes &&
                commande.lignes.length > 0 ? (
                    <div className="table-container">

                        <table>

                            <thead>
                                <tr>
                                    <th>Produit</th>
                                    <th>Code</th>
                                    <th>Quantité</th>
                                    <th>Prix unitaire</th>
                                    <th>Montant</th>
                                </tr>
                            </thead>

                            <tbody>

                                {commande.lignes.map((ligne) => (
                                    <tr key={ligne.id_ligne}>

                                        <td>
                                            <strong>
                                                {ligne.libelle}
                                            </strong>
                                        </td>

                                        <td>
                                            {ligne.code || "-"}
                                        </td>

                                        <td>
                                            {ligne.quantite}
                                            {ligne.unite
                                                ? ` ${ligne.unite}`
                                                : ""}
                                        </td>

                                        <td>
                                            {formaterMontant(
                                                ligne.prix_unitaire
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                {formaterMontant(
                                                    ligne.montant
                                                )}
                                            </strong>
                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                ) : (
                    <div className="aucune-ligne">
                        Aucun produit dans cette commande.
                    </div>
                )}

            </div>

            {/* =========================================
                TOTAL
            ========================================== */}
            <div className="total-commande no-print">

                <span>
                    Total de la commande
                </span>

                <strong>
                    {formaterMontant(
                        commande.montant_total
                    )}
                </strong>

            </div>

            {/* =========================================
                OBSERVATION
            ========================================== */}
            {commande.observation && (
                <div className="details-section observation no-print">

                    <div className="section-title">
                        <h2>
                            Observation
                        </h2>
                    </div>

                    <p>
                        {commande.observation}
                    </p>

                </div>
            )}

        </div>
    );
}

export default DetailsCommande;

