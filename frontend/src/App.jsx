```jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layouts";
import ServicesFonctions from "./pages/ServicesFonctions";

import { useAuth } from "./context/AuthContext";

import Clients from "./pages/Clients";
import Reservations from "./pages/Reservations";
import Chambres from "./pages/Chambres";
import Sejours from "./pages/Sejours";
import Factures from "./pages/Factures";
import Paiements from "./pages/Paiements";
import Caisse from "./pages/Caisse";
import Comptabilite from "./pages/Comptabilite";

// Administration
import Utilisateurs from "./pages/Utilisateurs";
import Personnel from "./pages/Personnel";
import Parametres from "./pages/Parametres";
import JournalAudit from "./pages/JournalAudit";

// Stocks / Achats
import Produits from "./pages/Produits.jsx";
import Fournisseurs from "./pages/Fournisseurs";
import Achats from "./pages/Achats";
import Stocks from "./pages/Stocks";

function ProtectedRoute({ children }) {
    const { estConnecte } = useAuth();

    if (!estConnecte) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function App() {
    return (
        <Routes>

            {/* ==========================
                LOGIN
            ========================== */}

            <Route
                path="/"
                element={<Login />}
            />

            {/* ==========================
                APPLICATION PROTÉGÉE
            ========================== */}

            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >

                {/* ==========================
                    DASHBOARD
                ========================== */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                {/* ==========================
                    HÉBERGEMENT
                ========================== */}

                <Route
                    path="/clients"
                    element={<Clients />}
                />

                <Route
                    path="/chambres"
                    element={<Chambres />}
                />

                <Route
                    path="/reservations"
                    element={<Reservations />}
                />

                <Route
                    path="/sejours"
                    element={<Sejours />}
                />

                {/* ==========================
                    FINANCES
                ========================== */}

                <Route
                    path="/comptabilite"
                    element={<Comptabilite />}
                />

                <Route
                    path="/factures"
                    element={<Factures />}
                />

                <Route
                    path="/paiements"
                    element={<Paiements />}
                />

                <Route
                    path="/caisse"
                    element={<Caisse />}
                />

                {/* ==========================
                    RESTAURANT & BAR
                ========================== */}

                <Route
                    path="/restaurant"
                    element={<h1>Restaurant / Bar</h1>}
                />

                {/* ==========================
                    LOISIRS & ÉVÉNEMENTS
                ========================== */}

                <Route
                    path="/prestations"
                    element={<h1>Piscine & Loisirs</h1>}
                />

                <Route
                    path="/seminaires"
                    element={<h1>Salles de séminaire</h1>}
                />

                {/* ==========================
                    GESTION DES STOCKS
                ========================== */}

                <Route
                    path="/produits"
                    element={<Produits />}
                />

                <Route
                    path="/stocks"
                    element={<Stocks />}
                />

                <Route
                    path="/fournisseurs"
                    element={<Fournisseurs />}
                />

                <Route
                    path="/achats"
                    element={<Achats />}
                />

                {/* ==========================
                    ADMINISTRATION
                ========================== */}

                <Route
                    path="/personnel"
                    element={<Personnel />}
                />

                <Route
                    path="/services-fonctions"
                    element={<ServicesFonctions />}
                />

                <Route
                    path="/utilisateurs"
                    element={<Utilisateurs />}
                />

                <Route
                    path="/parametres"
                    element={<Parametres />}
                />

                <Route
                    path="/journal-audit"
                    element={<JournalAudit />}
                />

            </Route>

            {/* ==========================
                ROUTE INCONNUE
            ========================== */}

            <Route
                path="*"
                element={<Navigate to="/dashboard" replace />}
            />

        </Routes>
    );
}

export default App;
```
