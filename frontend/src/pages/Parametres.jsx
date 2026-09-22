import React, { useEffect, useState } from "react";
import "./Parametres.css";

const API_URL = "http://localhost:5000/api/parametres";

function Parametres() {
    const [parametres, setParametres] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");

    const [modalOuvert, setModalOuvert] = useState(false);
    const [parametreSelectionne, setParametreSelectionne] = useState(null);
    const [valeur, setValeur] = useState("");

    // =====================================================
    // CHARGEMENT
    // =====================================================

    useEffect(() => {
        chargerParametres();
    }, []);

    const chargerParametres = async () => {
        try {
            setChargement(true);
            setErreur("");

            const response = await fetch(API_URL);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors du chargement des paramètres"
                );
            }

            setParametres(data);
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        } finally {
            setChargement(false);
        }
    };

    // =====================================================
    // OUVRIR MODIFICATION
    // =====================================================

    const ouvrirModification = (parametre) => {
        setParametreSelectionne(parametre);
        setValeur(parametre.valeur ?? "");
        setErreur("");
        setMessage("");
        setModalOuvert(true);
    };

    // =====================================================
    // FERMER MODAL
    // =====================================================

    const fermerModal = () => {
        setModalOuvert(false);
        setParametreSelectionne(null);
        setValeur("");
    };

    // =====================================================
    // ENREGISTRER
    // =====================================================

    const enregistrer = async (e) => {
        e.preventDefault();

        if (!parametreSelectionne) {
            return;
        }

        try {
            setErreur("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/${parametreSelectionne.id_parametre}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        valeur,
                        description:
                            parametreSelectionne.description,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Erreur lors de la modification"
                );
            }

            setMessage("Paramètre modifié avec succès.");

            await chargerParametres();

            setTimeout(() => {
                fermerModal();
            }, 600);
        } catch (error) {
            console.error(error);
            setErreur(error.message);
        }
    };

    // =====================================================
    // NOM AFFICHÉ
    // =====================================================

    const getNomParametre = (cle) => {
        const noms = {
            nom_hotel: "Nom de l'hôtel",
            adresse_hotel: "Adresse de l'hôtel",
            telephone_hotel: "Téléphone",
            email_hotel: "Adresse e-mail",
            devise: "Devise",
            taux_tva: "Taux de TVA",
            heure_checkin: "Heure de check-in",
            heure_checkout: "Heure de check-out",
        };

        return noms[cle] || cle;
    };

    // =====================================================
    // ICÔNE
    // =====================================================

    const getIcone = (cle) => {
        const icones = {
            nom_hotel: "🏨",
            adresse_hotel: "📍",
            telephone_hotel: "📞",
            email_hotel: "✉️",
            devise: "💰",
            taux_tva: "📊",
            heure_checkin: "🕐",
            heure_checkout: "🕐",
        };

        return icones[cle] || "⚙️";
    };

    // =====================================================
    // TYPE DE CHAMP
    // =====================================================

    const getInputType = (parametre) => {
        if (parametre.type_valeur === "NOMBRE") {
            return "number";
        }

        if (
            parametre.cle === "heure_checkin" ||
            parametre.cle === "heure_checkout"
        ) {
            return "time";
        }

        if (parametre.cle === "email_hotel") {
            return "email";
        }

        return "text";
    };

    // =====================================================
    // RENDU
    // =====================================================

    return (
        <div className="parametres-page">

            {/* HEADER */}
            <div className="parametres-header">
                <div>
                    <h1>Paramètres</h1>

                    <p>
                        Configurez les informations générales de
                        Ngalanka Hôtel.
                    </p>
                </div>
            </div>

            {/* MESSAGE */}
            {message && (
                <div className="param-message succes">
                    ✓ {message}
                </div>
            )}

            {erreur && (
                <div className="param-message erreur">
                    ⚠ {erreur}
                </div>
            )}

            {/* CONTENU */}
            {chargement ? (
                <div className="param-chargement">
                    Chargement des paramètres...
                </div>
            ) : (
                <div className="parametres-grid">

                    {parametres.map((parametre) => (
                        <div
                            className="parametre-card"
                            key={parametre.id_parametre}
                        >

                            <div className="parametre-icon">
                                {getIcone(parametre.cle)}
                            </div>

                            <div className="parametre-contenu">

                                <div className="parametre-titre">
                                    <h3>
                                        {getNomParametre(
                                            parametre.cle
                                        )}
                                    </h3>

                                    <span>
                                        {parametre.type_valeur}
                                    </span>
                                </div>

                                <div className="parametre-valeur">
                                    {parametre.valeur ||
                                        "Non configuré"}
                                </div>

                                {parametre.description && (
                                    <p>
                                        {parametre.description}
                                    </p>
                                )}

                            </div>

                            <button
                                className="parametre-modifier"
                                onClick={() =>
                                    ouvrirModification(parametre)
                                }
                                title="Modifier"
                            >
                                ✏️
                            </button>

                        </div>
                    ))}

                </div>
            )}

            {/* MODAL */}
            {modalOuvert &&
                parametreSelectionne && (
                    <div
                        className="param-modal-overlay"
                        onClick={fermerModal}
                    >
                        <div
                            className="param-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="param-modal-header">

                                <div>
                                    <h2>
                                        Modifier le paramètre
                                    </h2>

                                    <p>
                                        {
                                            getNomParametre(
                                                parametreSelectionne.cle
                                            )
                                        }
                                    </p>
                                </div>

                                <button
                                    className="param-modal-close"
                                    onClick={fermerModal}
                                >
                                    ×
                                </button>

                            </div>

                            <form onSubmit={enregistrer}>

                                <div className="param-form-group">

                                    <label>
                                        Valeur
                                    </label>

                                    <input
                                        type={getInputType(
                                            parametreSelectionne
                                        )}
                                        value={valeur}
                                        onChange={(e) =>
                                            setValeur(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                <div className="param-info">

                                    <strong>
                                        Clé technique :
                                    </strong>

                                    <span>
                                        {
                                            parametreSelectionne.cle
                                        }
                                    </span>

                                </div>

                                <div className="param-modal-actions">

                                    <button
                                        type="button"
                                        className="param-btn-annuler"
                                        onClick={fermerModal}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        type="submit"
                                        className="param-btn-enregistrer"
                                    >
                                        Enregistrer
                                    </button>

                                </div>

                            </form>

                        </div>
                    </div>
                )}

        </div>
    );
}

export default Parametres;