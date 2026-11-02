import React, { useEffect, useState } from "react";
import "./Prestations.css";

const API_URL = "http://localhost:5000/api/prestations";

const categories = [
  { value: "PISCINE", label: "🏊 Piscine" },
  { value: "SPORT", label: "⚽ Sport" },
  { value: "LOISIR", label: "🎯 Loisir" },
  { value: "EVENEMENT", label: "🎉 Événement" },
  { value: "AUTRE", label: "✨ Autre" },
];

const initialForm = {
  libelle: "",
  categorie: "LOISIR",
  tarif: "",
  unite: "Unité",
  description: "",
};

function Prestations() {
  const [prestations, setPrestations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const chargerPrestations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Impossible de charger les prestations.");
      }

      const data = await response.json();
      setPrestations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerPrestations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.libelle.trim()) {
      setError("Le nom de la prestation est obligatoire.");
      return;
    }

    if (form.tarif === "" || Number(form.tarif) < 0) {
      setError("Le tarif doit être supérieur ou égal à 0.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          libelle: form.libelle.trim(),
          categorie: form.categorie,
          tarif: Number(form.tarif),
          unite: form.unite.trim() || "Unité",
          description: form.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Une erreur est survenue."
        );
      }

      setSuccess(
        editingId
          ? "Prestation modifiée avec succès."
          : "Prestation ajoutée avec succès."
      );

      resetForm();
      await chargerPrestations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prestation) => {
    setEditingId(prestation.id_prestation);

    setForm({
      libelle: prestation.libelle || "",
      categorie: prestation.categorie || "LOISIR",
      tarif: prestation.tarif ?? "",
      unite: prestation.unite || "Unité",
      description: prestation.description || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleToggleStatut = async (prestation) => {
    try {
      setError("");
      setSuccess("");

      const nouveauStatut =
        prestation.statut === "ACTIF" ? "INACTIF" : "ACTIF";

      const response = await fetch(
        `${API_URL}/${prestation.id_prestation}/statut`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            statut: nouveauStatut,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de modifier le statut."
        );
      }

      setSuccess(
        nouveauStatut === "ACTIF"
          ? "Prestation activée."
          : "Prestation désactivée."
      );

      await chargerPrestations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (prestation) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer « ${prestation.libelle} » ?`
    );

    if (!confirmation) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${prestation.id_prestation}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de supprimer cette prestation."
        );
      }

      setSuccess("Prestation supprimée avec succès.");

      await chargerPrestations();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatPrix = (prix) => {
    return `${Number(prix || 0).toLocaleString("fr-FR")} FCFA`;
  };

  const getCategorieLabel = (categorie) => {
    const categorieTrouvee = categories.find(
      (item) => item.value === categorie
    );

    return categorieTrouvee
      ? categorieTrouvee.label
      : categorie;
  };

  return (
    <div className="prestations-page">
      <div className="prestations-header">
        <div>
          <span className="prestations-kicker">
            NGALANKA HÔTEL
          </span>

          <h1>🏊 Piscine & Loisirs</h1>

          <p>
            Gérez les activités, loisirs et prestations proposés
            aux clients de l'hôtel.
          </p>
        </div>

        <div className="prestations-header-stat">
          <strong>{prestations.length}</strong>
          <span>Prestations</span>
        </div>
      </div>

      {error && (
        <div className="prestations-alert prestations-alert-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="prestations-alert prestations-alert-success">
          ✅ {success}
        </div>
      )}

      <div className="prestations-content">
        <section className="prestation-form-card">
          <div className="card-title">
            <div>
              <h2>
                {editingId
                  ? "Modifier la prestation"
                  : "Nouvelle prestation"}
              </h2>

              <p>
                {editingId
                  ? "Modifiez les informations de cette prestation."
                  : "Ajoutez une nouvelle activité ou prestation."}
              </p>
            </div>

            <span className="card-icon">
              {editingId ? "✏️" : "➕"}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="libelle">
                Nom de la prestation *
              </label>

              <input
                id="libelle"
                name="libelle"
                type="text"
                value={form.libelle}
                onChange={handleChange}
                placeholder="Ex : Accès piscine"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categorie">
                  Catégorie *
                </label>

                <select
                  id="categorie"
                  name="categorie"
                  value={form.categorie}
                  onChange={handleChange}
                >
                  {categories.map((categorie) => (
                    <option
                      key={categorie.value}
                      value={categorie.value}
                    >
                      {categorie.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tarif">
                  Tarif *
                </label>

                <input
                  id="tarif"
                  name="tarif"
                  type="number"
                  min="0"
                  step="1"
                  value={form.tarif}
                  onChange={handleChange}
                  placeholder="Ex : 3000"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="unite">
                Unité de facturation
              </label>

              <input
                id="unite"
                name="unite"
                type="text"
                value={form.unite}
                onChange={handleChange}
                placeholder="Ex : personne, heure, balade..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez brièvement la prestation..."
              />
            </div>

            <div className="form-actions">
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Annuler
                </button>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : editingId
                  ? "💾 Enregistrer"
                  : "➕ Ajouter la prestation"}
              </button>
            </div>
          </form>
        </section>

        <section className="prestation-list-card">
          <div className="card-title">
            <div>
              <h2>Prestations disponibles</h2>
              <p>
                Liste des activités et services proposés aux clients.
              </p>
            </div>

            <span className="card-icon">🏨</span>
          </div>

          {loading ? (
            <div className="prestations-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des prestations...</p>
            </div>
          ) : prestations.length === 0 ? (
            <div className="prestations-empty">
              <div className="empty-icon">🏊</div>
              <h3>Aucune prestation</h3>
              <p>
                Ajoutez votre première activité ou prestation.
              </p>
            </div>
          ) : (
            <div className="prestations-grid">
              {prestations.map((prestation) => (
                <article
                  className={`prestation-card ${
                    prestation.statut !== "ACTIF"
                      ? "prestation-inactive"
                      : ""
                  }`}
                  key={prestation.id_prestation}
                >
                  <div className="prestation-card-top">
                    <span className="prestation-category">
                      {getCategorieLabel(prestation.categorie)}
                    </span>

                    <span
                      className={`status-badge ${
                        prestation.statut === "ACTIF"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {prestation.statut === "ACTIF"
                        ? "ACTIF"
                        : "INACTIF"}
                    </span>
                  </div>

                  <div className="prestation-icon">
                    {prestation.categorie === "PISCINE"
                      ? "🏊"
                      : prestation.categorie === "SPORT"
                      ? "⚽"
                      : prestation.categorie === "EVENEMENT"
                      ? "🎉"
                      : prestation.categorie === "LOISIR"
                      ? "🎯"
                      : "✨"}
                  </div>

                  <h3>{prestation.libelle}</h3>

                  {prestation.description && (
                    <p className="prestation-description">
                      {prestation.description}
                    </p>
                  )}

                  <div className="prestation-price">
                    <strong>
                      {formatPrix(prestation.tarif)}
                    </strong>

                    <span>
                      / {prestation.unite || "Unité"}
                    </span>
                  </div>

                  <div className="prestation-actions">
                    <button
                      type="button"
                      className="action-btn action-edit"
                      onClick={() => handleEdit(prestation)}
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      type="button"
                      className="action-btn action-status"
                      onClick={() =>
                        handleToggleStatut(prestation)
                      }
                    >
                      {prestation.statut === "ACTIF"
                        ? "⏸️ Désactiver"
                        : "▶️ Activer"}
                    </button>

                    <button
                      type="button"
                      className="action-btn action-delete"
                      onClick={() => handleDelete(prestation)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Prestations;