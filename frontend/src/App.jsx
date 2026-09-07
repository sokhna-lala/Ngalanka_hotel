import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layouts";

import { useAuth } from "./context/AuthContext";

import Clients from "./pages/Clients";
import Reservations from "./pages/Reservations";
import Chambres from "./pages/Chambres";
import Sejours from "./pages/Sejours";
import Factures from "./pages/Factures";

function ProtectedRoute({ children }) {
const { estConnecte } = useAuth();

if (!estConnecte) {
return <Navigate to="/" replace />;
}

return children;
}

function App() {
return ( <Routes>

```
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
      path="/factures"
      element={<Factures />}
    />

    <Route
      path="/paiements"
      element={<h1>Paiements</h1>}
    />

    <Route
      path="/caisse"
      element={<h1>Caisse</h1>}
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
      element={<h1>Produits</h1>}
    />

    <Route
      path="/stocks"
      element={<h1>Stock</h1>}
    />

    <Route
      path="/fournisseurs"
      element={<h1>Fournisseurs</h1>}
    />

    <Route
      path="/achats"
      element={<h1>Achats</h1>}
    />


    {/* ==========================
        ADMINISTRATION
    ========================== */}

    <Route
      path="/personnel"
      element={<h1>Personnel</h1>}
    />

    <Route
      path="/utilisateurs"
      element={<h1>Utilisateurs</h1>}
    />

    <Route
      path="/parametres"
      element={<h1>Paramètres</h1>}
    />
    <Route
  path="/caisse"
  element={<h1>Caisse</h1>}
/>

<Route
  path="/produits"
  element={<h1>Produits</h1>}
/>

<Route
  path="/fournisseurs"
  element={<h1>Fournisseurs</h1>}
/>

<Route
  path="/achats"
  element={<h1>Achats</h1>}
/>

<Route
  path="/personnel"
  element={<h1>Personnel</h1>}
/>

<Route
  path="/parametres"
  element={<h1>Paramètres</h1>}
/>

  </Route>



  <Route
    path="*"
    element={<Navigate to="/dashboard" replace />}
  />

</Routes>


);
}

export default App;
