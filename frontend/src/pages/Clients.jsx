import { useEffect, useState } from "react";
import axios from "axios";
import "./Clients.css";

function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clientEnModification, setClientEnModification] = useState(null);
    const [afficherFormulaire, setAfficherFormulaire] = useState(false);

    const [formulaire, setFormulaire] = useState({
        code_client: "",
        nom: "",
        prenom: "",
        sexe: "",
        date_naissance: "",
        telephone: "",
        email: "",
        adresse: "",
        ville: "",
        pays: "Sénégal",
        nationalite: "Sénégalaise",
        type_piece: "",
        numero_piece: "",
        entreprise: "",
        observation: ""
    });

    const modifierClient = (client) => {
    setClientEnModification(client);

    setFormulaire({
        code_client: client.code_client || "",
        nom: client.nom || "",
        prenom: client.prenom || "",
        sexe: client.sexe || "",
        date_naissance: client.date_naissance
            ? client.date_naissance.substring(0, 10)
            : "",
        telephone: client.telephone || "",
        email: client.email || "",
        adresse: client.adresse || "",
        ville: client.ville || "",
        pays: client.pays || "Sénégal",
        nationalite: client.nationalite || "Sénégalaise",
        type_piece: client.type_piece || "",
        numero_piece: client.numero_piece || "",
        entreprise: client.entreprise || "",
        observation: client.observation || ""
    });

    setAfficherFormulaire(true);
};

    const chargerClients = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                "http://localhost:5000/api/clients"
            );

            setClients(response.data);
            setError("");

        } catch (err) {
            console.error(err);
            setError("Impossible de charger les clients.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chargerClients();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire({
            ...formulaire,
            [name]: value
        });
    };

   const enregistrerClient = async (e) => {
    e.preventDefault();

    try {
        if (clientEnModification) {

            await axios.put(
                `http://localhost:5000/api/clients/${clientEnModification.id_client}`,
                formulaire
            );

            alert("Client modifié avec succès !");

        } else {

            await axios.post(
                "http://localhost:5000/api/clients",
                formulaire
            );

            alert("Client ajouté avec succès !");
        }

        setAfficherFormulaire(false);
        setClientEnModification(null);

        setFormulaire({
            code_client: "",
            nom: "",
            prenom: "",
            sexe: "",
            date_naissance: "",
            telephone: "",
            email: "",
            adresse: "",
            ville: "",
            pays: "Sénégal",
            nationalite: "Sénégalaise",
            type_piece: "",
            numero_piece: "",
            entreprise: "",
            observation: ""
        });

        chargerClients();

    } catch (err) {
        console.error("Erreur client :", err);

        alert(
            err.response?.data?.message ||
            "Impossible d'enregistrer le client"
        );
    }
};

    return (
        <div className="clients-page">

            {/* EN-TÊTE */}

            <div className="page-header">

                <div>
                    <h1>Clients</h1>
                    <p>Gestion des clients de l'hôtel</p>
                </div>

                 <button
               className="btn-primary"
              onClick={() => {
              setClientEnModification(null);
                   setAfficherFormulaire(true);
              }}
                  >
           + Nouveau client
           </button>
            </div>


            {/* FORMULAIRE */}

            {afficherFormulaire && (

                <div className="client-form">

    <div className="form-header">

        <h2>
            {clientEnModification
                ? "Modifier le client"
                : "Nouveau client"}
        </h2>

        <button
            type="button"
            onClick={() => {
                setAfficherFormulaire(false);
                setClientEnModification(null);
            }}
        >
            ✕
        </button>

    </div>

                    <form onSubmit={enregistrerClient}>

                        <div className="form-grid">

                            <div>
                                <label>
                                    Code client *
                                </label>

                                <input
                                    type="text"
                                    name="code_client"
                                    value={formulaire.code_client}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex : CLT-0001"
                                />
                            </div>


                            <div>
                                <label>
                                    Nom *
                                </label>

                                <input
                                    type="text"
                                    name="nom"
                                    value={formulaire.nom}
                                    onChange={handleChange}
                                    required
                                />
                            </div>


                            <div>
                                <label>
                                    Prénom
                                </label>

                                <input
                                    type="text"
                                    name="prenom"
                                    value={formulaire.prenom}
                                    onChange={handleChange}
                                />
                            </div>


                            <div>
                                <label>
                                    Sexe
                                </label>

                                <select
                                    name="sexe"
                                    value={formulaire.sexe}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Sélectionner
                                    </option>

                                    <option value="M">
                                        Masculin
                                    </option>

                                    <option value="F">
                                        Féminin
                                    </option>

                                    <option value="AUTRE">
                                        Autre
                                    </option>
                                </select>
                            </div>


                            <div>
                                <label>
                                    Date de naissance
                                </label>

                                <input
                                    type="date"
                                    name="date_naissance"
                                    value={formulaire.date_naissance}
                                    onChange={handleChange}
                                />
                            </div>


                            <div>
                                <label>
                                    Téléphone
                                </label>

                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formulaire.telephone}
                                    onChange={handleChange}
                                    placeholder="77 000 00 00"
                                />
                            </div>


                            <div>
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formulaire.email}
                                    onChange={handleChange}
                                />
                            </div>


                            <div>
                                <label>
                                    Ville
                                </label>

                                <input
                                    type="text"
                                    name="ville"
                                    value={formulaire.ville}
                                    onChange={handleChange}
                                    placeholder="Dakar"
                                />
                            </div>


                            <div>
                                <label>
                                    Pays
                                </label>

                                <input
                                    type="text"
                                    name="pays"
                                    value={formulaire.pays}
                                    onChange={handleChange}
                                />
                            </div>


                            <div>
                                <label>
                                    Nationalité
                                </label>

                                <input
                                    type="text"
                                    name="nationalite"
                                    value={formulaire.nationalite}
                                    onChange={handleChange}
                                />
                            </div>


                            <div>
                                <label>
                                    Type de pièce
                                </label>

                                <select
                                    name="type_piece"
                                    value={formulaire.type_piece}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Sélectionner
                                    </option>

                                    <option value="CNI">
                                        CNI
                                    </option>

                                    <option value="PASSEPORT">
                                        Passeport
                                    </option>

                                    <option value="PERMIS">
                                        Permis
                                    </option>

                                    <option value="CARTE_SEJOUR">
                                        Carte de séjour
                                    </option>

                                    <option value="AUTRE">
                                        Autre
                                    </option>
                                </select>
                            </div>


                            <div>
                                <label>
                                    Numéro de pièce
                                </label>

                                <input
                                    type="text"
                                    name="numero_piece"
                                    value={formulaire.numero_piece}
                                    onChange={handleChange}
                                />
                            </div>


                            <div>
                                <label>
                                    Entreprise
                                </label>

                                <input
                                    type="text"
                                    name="entreprise"
                                    value={formulaire.entreprise}
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="full-width">
                                <label>
                                    Adresse
                                </label>

                                <input
                                    type="text"
                                    name="adresse"
                                    value={formulaire.adresse}
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="full-width">
                                <label>
                                    Observation
                                </label>

                                <textarea
                                    name="observation"
                                    value={formulaire.observation}
                                    onChange={handleChange}
                                    rows="3"
                                />
                            </div>

                        </div>


                        <div className="form-actions">

                                <button
                         type="button"
                  onClick={() => {
               setAfficherFormulaire(false);
                   setClientEnModification(null);
                      }}
                         >
                           Annuler
                        </button>

                              <button
                           type="submit"
                           className="btn-primary"
                          >
                         {clientEnModification
                         ? "Enregistrer les modifications"
                          : "Enregistrer le client"}
                        </button>

                        </div>

                    </form>

                </div>

            )}


            {/* RECHERCHE */}

            {!afficherFormulaire && (

                <div className="search-container">

                    <input
                        type="text"
                        placeholder="🔍 Rechercher un client..."
                    />

                </div>

            )}


            {/* TABLEAU */}

            {loading && (
                <p>Chargement des clients...</p>
            )}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {!loading && !error && !afficherFormulaire && (

                <div className="table-container">

                    <table>

                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Nom</th>
                                <th>Téléphone</th>
                                <th>Email</th>
                                <th>Ville</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {clients.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="empty"
                                    >
                                        Aucun client enregistré
                                    </td>
                                </tr>

                            ) : (

                                clients.map((client) => (

                                    <tr key={client.id_client}>

                                        <td>
                                            {client.code_client}
                                        </td>

                                        <td>
                                            {client.nom}{" "}
                                            {client.prenom || ""}
                                        </td>

                                        <td>
                                            {client.telephone || "-"}
                                        </td>

                                        <td>
                                            {client.email || "-"}
                                        </td>

                                        <td>
                                            {client.ville || "-"}
                                        </td>

                                             <td>
                                               <button
                                               type="button"
                                             title="Modifier le client"
                                          onClick={() => modifierClient(client)}
                                     >
                                   ✏️
                                   </button>
                                  </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </div>
    );
}

export default Clients;