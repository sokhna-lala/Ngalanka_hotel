import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./FicheClient.css";


const API_URL = "http://localhost:5000/api";

function FicheClient() {
const { id } = useParams();
const navigate = useNavigate();

const [client, setClient] = useState(null);
const [reservations, setReservations] = useState([]);
const [sejours, setSejours] = useState([]);
const [loading, setLoading] = useState(true);
const [erreur, setErreur] = useState("");

useEffect(() => {
    const chargerFicheClient = async () => {
    try {
    setLoading(true);
    setErreur("");


const [clientResponse, reservationsResponse, sejoursResponse] =
    await Promise.all([
        axios.get(`${API_URL}/clients/${id}`),
        axios.get(`${API_URL}/reservations`),
        axios.get(`${API_URL}/sejours`)
    ]);

setClient(clientResponse.data);

const toutesReservations = reservationsResponse.data || [];

setReservations(
    toutesReservations.filter(
        (reservation) =>
            Number(reservation.id_client) === Number(id)
    )
);


const tousLesSejours = sejoursResponse.data || [];
const sejoursClient = tousLesSejours.filter(
    (sejour) => Number(sejour.id_client) === Number(id)
);


setSejours(sejoursClient);



    // L'historique des séjours sera chargé
    // lorsque nous aurons vérifié la route correspondante.

    } catch (error) {
    console.error("Erreur chargement fiche client :", error);
    setErreur(
    error.response?.data?.message ||
    "Impossible de charger la fiche du client."
    );
    } finally {
    setLoading(false);
    }
    };

    chargerFicheClient();
    }, [id]);

    if (loading) {
    return (
    <div className="fiche-client-page">
    <p>Chargement de la fiche client...</p>
    </div>
    );
    }

    if (erreur || !client) {
    return (
    <div className="fiche-client-page">
    <button
    type="button"
    className="fiche-client-back"
    onClick={() => navigate("/clients")}
    >
    ← Retour aux clients
    </button>

    <p className="fiche-client-error">
    {erreur || "Client introuvable."}
    </p>
    </div>
    );
    }

    return (
    <div className="fiche-client-page">
    <div className="fiche-client-header">
    <button
    type="button"
    className="fiche-client-back"
    onClick={() => navigate("/clients")}
    >
    ← Retour aux clients
    </button>

    <div>
    <h1>Fiche client</h1>
    <p>Informations et historique du client</p>
    </div>

    <button
    type="button"
    className="fiche-client-edit"
    onClick={() =>
    navigate("/clients", {
    state: { clientAModifier: client }
    })
    }
    >
    ✏️ Modifier le client
    </button>
    </div>

    <section className="fiche-client-card">
    <div className="fiche-client-avatar">
    {(client.prenom || client.nom || "?")
    .charAt(0)
    .toUpperCase()}
    </div>

    <div className="fiche-client-identity">
    <h2>
    {client.prenom} {client.nom}
    </h2>
    <p>{client.code_client}</p>
    </div>
    </section>

    <section className="fiche-client-card">
    <h2>Informations personnelles</h2>

    <div className="fiche-client-grid">
    <div>
    <span>Téléphone</span>
    <strong>{client.telephone || "Non renseigné"}</strong>
    </div>

    <div>
    <span>Email</span>
    <strong>{client.email || "Non renseigné"}</strong>
    </div>

    <div>
    <span>Date de naissance</span>
    <strong>
    {client.date_naissance
    ? String(client.date_naissance).substring(0, 10)
    : "Non renseignée"}
    </strong>
    </div>

    <div>
    <span>Sexe</span>
    <strong>{client.sexe || "Non renseigné"}</strong>
    </div>

    <div>
    <span>Adresse</span>
    <strong>{client.adresse || "Non renseignée"}</strong>
    </div>

    <div>
    <span>Ville / Pays</span>
    <strong>
    {[client.ville, client.pays]
    .filter(Boolean)
    .join(", ") || "Non renseignés"}
    </strong>
    </div>

    <div>
    <span>Nationalité</span>
    <strong>{client.nationalite || "Non renseignée"}</strong>
    </div>

    <div>
    <span>Entreprise</span>
    <strong>{client.entreprise || "Non renseignée"}</strong>
    </div>

    <div>
    <span>Type de pièce</span>
    <strong>{client.type_piece || "Non renseigné"}</strong>
    </div>

    <div>
    <span>Numéro de pièce</span>
    <strong>{client.numero_piece || "Non renseigné"}</strong>
    </div>
    </div>

    {client.observation && (
    <div className="fiche-client-observation">
    <span>Observations</span>
    <p>{client.observation}</p>
    </div>
    )}
    </section>

    <section className="fiche-client-card">
    <h2>Réservations ({reservations.length})</h2>

    {reservations.length === 0 ? (
    <p className="fiche-client-empty">
    Aucune réservation pour ce client.
    </p>
    ) : (
    <div className="fiche-client-table-wrapper">
    <table className="fiche-client-table">
    <thead>
    <tr>
    <th>Numéro</th>
    <th>Arrivée</th>
    <th>Départ</th>
    <th>Chambre</th>
    <th>Statut</th>
    </tr>
    </thead>

    <tbody>
    {reservations.map((reservation) => (
    <tr key={reservation.id_reservation}>
    <td>{reservation.numero_reservation}</td>
    <td>
    {String(reservation.date_arrivee || "")
    .substring(0, 10)}
    </td>
    <td>
    {String(reservation.date_depart || "")
    .substring(0, 10)}
    </td>
    <td>
   {reservation.numero_chambre
    ? "Chambre " + reservation.numero_chambre
    : "Non attribuée"}
    </td>
    <td>
    <span className="fiche-client-status">
    {reservation.statut}
    </span>
    </td>
    </tr>
    ))}
    </tbody>
    </table>
    </div>
    )}
    </section>


<section className="fiche-client-card">
    <h2>Historique des séjours ({sejours.length})</h2>

    {sejours.length === 0 ? (
        <p className="fiche-client-empty">
            Aucun séjour enregistré pour ce client.
        </p>
    ) : (
        <div className="fiche-client-table-wrapper">
            <table className="fiche-client-table">
                <thead>
                    <tr>
                        <th>Numéro du séjour</th>
                        <th>Chambre</th>
                        <th>Arrivée prévue</th>
                        <th>Arrivée réelle</th>
                        <th>Départ prévu</th>
                        <th>Départ réel</th>
                        <th>Statut</th>
                    </tr>
                </thead>

                <tbody>
                    {sejours.map((sejour) => (
                        <tr key={sejour.id_sejour}>
                            <td>{sejour.numero_sejour || "—"}</td>

                            <td>
                                {sejour.numero_chambre
                                    ? "Chambre " + sejour.numero_chambre
                                    : "—"}
                            </td>

                            <td>
                                {sejour.date_arrivee_prevue
                                    ? String(sejour.date_arrivee_prevue).substring(0, 10)
                                    : "—"}
                            </td>

                            <td>
                                {sejour.date_arrivee_reelle
                                    ? String(sejour.date_arrivee_reelle).substring(0, 10)
                                    : "—"}
                            </td>

                            <td>
                                {sejour.date_depart_prevue
                                    ? String(sejour.date_depart_prevue).substring(0, 10)
                                    : "—"}
                            </td>

                            <td>
                                {sejour.date_depart_reelle
                                    ? String(sejour.date_depart_reelle).substring(0, 10)
                                    : "—"}
                            </td>

                            <td>
                                <span className="fiche-client-status">
                                    {sejour.statut || "Non renseigné"}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )}
</section>

    </div>
    );
    }

export default FicheClient;