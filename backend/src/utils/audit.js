const pool = require("../config/database");

/**
 * Enregistre une action dans le journal d'audit.
 */
async function enregistrerAudit({
    id_utilisateur = null,
    action,
    table_cible = null,
    id_cible = null,
    description = null,
    ancienne_valeur = null,
    nouvelle_valeur = null,
    adresse_ip = null,
    user_agent = null
}) {
    try {
        const ancienneJSON =
            ancienne_valeur !== null
                ? JSON.stringify(ancienne_valeur)
                : null;

        const nouvelleJSON =
            nouvelle_valeur !== null
                ? JSON.stringify(nouvelle_valeur)
                : null;

        await pool.execute(
            `INSERT INTO journal_audit
            (
                id_utilisateur,
                action,
                table_cible,
                id_cible,
                description,
                ancienne_valeur,
                nouvelle_valeur,
                adresse_ip,
                user_agent
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_utilisateur,
                action,
                table_cible,
                id_cible,
                description,
                ancienneJSON,
                nouvelleJSON,
                adresse_ip,
                user_agent
            ]
        );

        return true;
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'audit :", error);
        return false;
    }
}

module.exports = enregistrerAudit;