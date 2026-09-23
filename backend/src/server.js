
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const clientsRoutes = require("./routes/clients");
const reservationsRoutes = require("./routes/reservations");
const chambresRoutes = require("./routes/chambres");
const facturesRoutes = require("./routes/factures");
const sejoursRoutes = require("./routes/sejours");
const comptabiliteRoutes = require("./routes/comptabilite");
const paiementsRoutes = require("./routes/paiements");
const caissesRoutes = require("./routes/caisses");

// Routes Administration
const utilisateursRoutes = require("./routes/utilisateurs");
const employesRoutes = require("./routes/employes");
const servicesRoutes = require("./routes/services");
const fonctionsRoutes = require("./routes/fonctions");
const parametresRoutes = require("./routes/parametres");
const auditRoutes = require("./routes/audit");

// Routes Stocks / Achats
const produitsRoutes = require("./routes/produits");
const fournisseursRoutes = require("./routes/fournisseurs");
const achatsRoutes = require("./routes/achats");
const stocksRoutes = require("./routes/stocks");

const app = express();

// ==========================================
// PORT
// ==========================================

const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// ROUTE PRINCIPALE
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "API Ngalanka Hotel opérationnelle"
    });
});

// ==========================================
// ROUTES API
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/chambres", chambresRoutes);
app.use("/api/factures", facturesRoutes);
app.use("/api/sejours", sejoursRoutes);
app.use("/api/comptabilite", comptabiliteRoutes);
app.use("/api/paiements", paiementsRoutes);
app.use("/api/caisses", caissesRoutes);

// Administration
app.use("/api/utilisateurs", utilisateursRoutes);
app.use("/api/employes", employesRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/fonctions", fonctionsRoutes);
app.use("/api/parametres", parametresRoutes);
app.use("/api/audit", auditRoutes);

// Stocks / Achats
app.use("/api/produits", produitsRoutes);
app.use("/api/fournisseurs", fournisseursRoutes);
app.use("/api/achats", achatsRoutes);
app.use("/api/stocks", stocksRoutes);

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});

