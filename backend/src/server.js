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


// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});