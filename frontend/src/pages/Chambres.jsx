import { useEffect, useState } from "react";
import axios from "axios";
import "./Chambres.css";

function Chambres() {
    const [chambres, setChambres] = useState([]);
    const [types, setTypes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [afficherFormulaire, setAfficherFormulaire] = useState(false);
    const [chambreEnModification, setChambreEnModification] = useState(null);
    const [chambreEnDetails, setChambreEnDetails] = useState(null);

    const [formulaire, setFormulaire] = useState({
        numero: "",
        id_type: "",
        etage: "",
        description: "",
        tarif: "",
        statut: "DISPONIBLE",
        observation: ""
    });

    // ==========================================
    // RÉINITIALISER LE FORMULAIRE
    // ==========================================

    const reinitialiserFormulaire = () => {
        setFormulaire({
            numero: "",
            id_type: "",
            etage: "",
            description: "",
            tarif: "",
            statut: "DISPONIBLE",
            observation: ""
        });
    };

    // ==========================================
    // CHARGER LES CHAMBRES
    // ==========================================

    const chargerChambres = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                "http://localhost:5000/api/chambres"
            );

            setChambres(response.data);
            setError("");

        } catch (err) {
            console.error("Erreur chargement chambres :", err);

            setError(
                err.response?.data?.message ||
                "Impossible de charger les chambres."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // CHARGER LES TYPES DE CHAMBRES
    // ==========================================

    const chargerTypes = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/chambres/types/liste"
            );

            setTypes(response.data);

        } catch (err) {
            console.error("Erreur chargement types :", err);

            setError(
                err.response?.data?.message ||
                "Impossible de charger les types de chambres."
            );
        }
    };

    // ==========================================
    // CHARGEMENT INITIAL
    // ==========================================

    useEffect(() => {
        chargerChambres();
        chargerTypes();
    }, []);

    // ==========================================
    // VOIR UNE CHAMBRE
    // ==========================================

    const voirChambre = (chambre) => {
        setChambreEnDetails(chambre);
    };

    // ==========================================
    // MODIFIER UNE CHAMBRE
    // ==========================================

    const modifierChambre = (chambre) => {
        setChambreEnModification(chambre);

        setFormulaire({
            numero: chambre.numero || "",
            id_type: chambre.id_type || "",
            etage: chambre.etage || "",
            description: chambre.description || "",
            tarif: chambre.tarif || "",
            statut: chambre.statut || "DISPONIBLE",
            observation: chambre.observation || ""
        });

        setAfficherFormulaire(true);
    };

    // ==========================================
    // NOUVELLE CHAMBRE
    // ==========================================

    const nouvelleChambre = () => {
        setChambreEnModification(null);

        reinitialiserFormulaire();

        setAfficherFormulaire(true);
    };

    // ==========================================
    // CHANGEMENT DU FORMULAIRE
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulaire((ancienFormulaire) => ({
            ...ancienFormulaire,
            [name]: value
        }));
    };

    // ==========================================
    // FERMER LE FORMULAIRE
    // ==========================================

    const fermerFormulaire = () => {
        setAfficherFormulaire(false);

        setChambreEnModification(null);

        reinitialiserFormulaire();
    };

    // ==========================================
    // ENREGISTRER / MODIFIER
    // ==========================================

    const enregistrerChambre = async (e) => {
        e.preventDefault();

        try {

            if (chambreEnModification) {

                await axios.put(
                    `http://localhost:5000/api/chambres/${chambreEnModification.id_chambre}`,
                    formulaire
                );

                alert("Chambre modifiée avec succès !");

            } else {

                await axios.post(
                    "http://localhost:5000/api/chambres",
                    formulaire
                );

                alert("Chambre ajoutée avec succès !");
            }

            fermerFormulaire();

            await chargerChambres();

        } catch (err) {

            console.error("Erreur chambre :", err);

            alert(
                err.response?.data?.message ||
                "Impossible d'enregistrer la chambre."
            );
        }
    };

    // ==========================================
    // FORMATAGE DU TARIF
    // ==========================================

    const formaterTarif = (tarif) => {
        return Number(tarif || 0).toLocaleString("fr-FR");
    };

    // ==========================================
    // NOM DU STATUT
    // ==========================================

    const afficherStatut = (statut) => {

        const statuts = {
            DISPONIBLE: "Disponible",
            OCCUPEE: "Occupée",
            RESERVEE: "Réservée",
            NETTOYAGE: "Nettoyage",
            HORS_SERVICE: "Hors service"
        };

        return statuts[statut] || statut;
    };

    return (
        <div className="chambres-page">

            {/* ======================================
                EN-TÊTE
            ======================================= */}

            <div className="page-header">

                <div>
                    <h1>Chambres</h1>

                    <p>
                        Gestion des chambres de l'hôtel
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={nouvelleChambre}
                >
                    + Nouvelle chambre
                </button>

            </div>


            {/* ======================================
                FORMULAIRE
            ======================================= */}

            {afficherFormulaire && (

                <div className="chambre-form">

                    <div className="form-header">

                        <div>

                            <h2>
                                {chambreEnModification
                                    ? "Modifier la chambre"
                                    : "Nouvelle chambre"}
                            </h2>

                            <p>
                                {chambreEnModification
                                    ? "Modifier les informations de la chambre"
                                    : "Ajouter une nouvelle chambre"}
                            </p>

                        </div>

                        <button
                            type="button"
                            className="form-close"
                            onClick={fermerFormulaire}
                        >
                            ✕
                        </button>

                    </div>


                    <form onSubmit={enregistrerChambre}>

                        <div className="form-grid">

                            {/* NUMÉRO */}

                            <div>

                                <label>
                                    Numéro *
                                </label>

                                <input
                                    type="text"
                                    name="numero"
                                    value={formulaire.numero}
                                    onChange={handleChange}
                                    placeholder="Ex : 201"
                                    required
                                />

                            </div>


                            {/* TYPE */}

                            <div>

                                <label>
                                    Type de chambre *
                                </label>

                                <select
                                    name="id_type"
                                    value={formulaire.id_type}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Sélectionner
                                    </option>

                                    {types.map((type) => (

                                        <option
                                            key={type.id_type}
                                            value={type.id_type}
                                        >
                                            {type.libelle}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            {/* ÉTAGE */}

                            <div>

                                <label>
                                    Étage
                                </label>

                                <input
                                    type="text"
                                    name="etage"
                                    value={formulaire.etage}
                                    onChange={handleChange}
                                    placeholder="Ex : 1er étage"
                                />

                            </div>


                            {/* TARIF */}

                            <div>

                                <label>
                                    Tarif par nuit *
                                </label>

                                <input
                                    type="number"
                                    name="tarif"
                                    value={formulaire.tarif}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                />

                            </div>


                            {/* STATUT */}

                            <div>

                                <label>
                                    Statut
                                </label>

                                <select
                                    name="statut"
                                    value={formulaire.statut}
                                    onChange={handleChange}
                                >

                                    <option value="DISPONIBLE">
                                        Disponible
                                    </option>

                                    <option value="OCCUPEE">
                                        Occupée
                                    </option>

                                    <option value="RESERVEE">
                                        Réservée
                                    </option>

                                    <option value="NETTOYAGE">
                                        Nettoyage
                                    </option>

                                    <option value="HORS_SERVICE">
                                        Hors service
                                    </option>

                                </select>

                            </div>


                            {/* DESCRIPTION */}

                            <div className="full-width">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={formulaire.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Description de la chambre..."
                                />

                            </div>


                            {/* OBSERVATION */}

                            <div className="full-width">

                                <label>
                                    Observation
                                </label>

                                <textarea
                                    name="observation"
                                    value={formulaire.observation}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Observation..."
                                />

                            </div>

                        </div>


                        {/* ACTIONS FORMULAIRE */}

                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={fermerFormulaire}
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                {chambreEnModification
                                    ? "Modifier la chambre"
                                    : "Enregistrer la chambre"}
                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* ======================================
                LISTE DES CHAMBRES
            ======================================= */}

            {!afficherFormulaire && (

                <>

                    {loading && (
                        <p className="loading-message">
                            Chargement des chambres...
                        </p>
                    )}


                    {error && (

                        <p className="error-message">
                            {error}
                        </p>

                    )}


                    {!loading && !error && (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>

                                        <th>Numéro</th>
                                        <th>Type</th>
                                        <th>Étage</th>
                                        <th>Capacité</th>
                                        <th>Lits</th>
                                        <th>Tarif / nuit</th>
                                        <th>Statut</th>
                                        <th>Actions</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {chambres.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="8"
                                                className="empty"
                                            >
                                                Aucune chambre enregistrée
                                            </td>

                                        </tr>

                                    ) : (

                                        chambres.map((chambre) => (

                                            <tr
                                                key={chambre.id_chambre}
                                            >

                                                {/* NUMÉRO */}

                                                <td>

                                                    <strong>
                                                        {chambre.numero}
                                                    </strong>

                                                </td>


                                                {/* TYPE */}

                                                <td>
                                                    {chambre.type_chambre}
                                                </td>


                                                {/* ÉTAGE */}

                                                <td>
                                                    {chambre.etage || "-"}
                                                </td>


                                                {/* CAPACITÉ */}

                                                <td>
                                                    {chambre.capacite} personnes
                                                </td>


                                                {/* LITS */}

                                                <td>
                                                    {chambre.nombre_lits}
                                                </td>


                                                {/* TARIF */}

                                                <td>

                                                    {formaterTarif(
                                                        chambre.tarif
                                                    )}{" "}
                                                    FCFA

                                                </td>


                                                {/* STATUT */}

                                                <td>

                                                    <span
                                                        className={`statut statut-${String(
                                                            chambre.statut
                                                        ).toLowerCase()}`}
                                                    >
                                                        {afficherStatut(
                                                            chambre.statut
                                                        )}
                                                    </span>

                                                </td>


                                                {/* ACTIONS */}

                                                <td className="actions-cell">

                                                    <button
                                                        type="button"
                                                        className="btn-action btn-view"
                                                        onClick={() =>
                                                            voirChambre(chambre)
                                                        }
                                                        title="Voir les détails"
                                                    >
                                                        👁️
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="btn-action btn-edit"
                                                        onClick={() =>
                                                            modifierChambre(
                                                                chambre
                                                            )
                                                        }
                                                        title="Modifier"
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

                </>

            )}


            {/* ======================================
                FENÊTRE DÉTAILS
            ======================================= */}

            {chambreEnDetails && (

                <div
                    className="details-overlay"
                    onClick={() => setChambreEnDetails(null)}
                >

                    <div
                        className="details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* HEADER */}

                        <div className="details-header">

                            <div>

                                <h2>
                                    Chambre {chambreEnDetails.numero}
                                </h2>

                                <p>
                                    Détails de la chambre
                                </p>

                            </div>

                            <button
                                type="button"
                                className="details-close"
                                onClick={() =>
                                    setChambreEnDetails(null)
                                }
                            >
                                ✕
                            </button>

                        </div>


                        {/* CONTENU */}

                        <div className="details-content">

                            <div className="detail-item">

                                <span>
                                    Numéro
                                </span>

                                <strong>
                                    {chambreEnDetails.numero}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Type
                                </span>

                                <strong>
                                    {chambreEnDetails.type_chambre}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Étage
                                </span>

                                <strong>
                                    {chambreEnDetails.etage || "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Capacité
                                </span>

                                <strong>
                                    {chambreEnDetails.capacite} personnes
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Nombre de lits
                                </span>

                                <strong>
                                    {chambreEnDetails.nombre_lits}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Tarif par nuit
                                </span>

                                <strong>
                                    {formaterTarif(
                                        chambreEnDetails.tarif
                                    )}{" "}
                                    FCFA
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Statut
                                </span>

                                <span
                                    className={`statut statut-${String(
                                        chambreEnDetails.statut
                                    ).toLowerCase()}`}
                                >
                                    {afficherStatut(
                                        chambreEnDetails.statut
                                    )}
                                </span>

                            </div>


                            <div className="detail-item detail-full">

                                <span>
                                    Description
                                </span>

                                <p>
                                    {chambreEnDetails.description ||
                                        "Aucune description"}
                                </p>

                            </div>


                            <div className="detail-item detail-full">

                                <span>
                                    Observation
                                </span>

                                <p>
                                    {chambreEnDetails.observation ||
                                        "Aucune observation"}
                                </p>

                            </div>

                        </div>


                        {/* FOOTER */}

                        <div className="details-footer">

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() =>
                                    setChambreEnDetails(null)
                                }
                            >
                                Fermer
                            </button>


                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => {

                                    const chambre =
                                        chambreEnDetails;

                                    setChambreEnDetails(null);

                                    modifierChambre(chambre);

                                }}
                            >
                                ✏️ Modifier
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Chambres;