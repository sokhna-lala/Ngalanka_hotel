import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Layouts.css";
function Layouts() {
const { utilisateur, deconnecter } = useAuth();
const navigate = useNavigate();

const [hebergementOuvert, setHebergementOuvert] = useState(true);
const [financesOuvert, setFinancesOuvert] = useState(false);
const [stockOuvert, setStockOuvert] = useState(false);
const [administrationOuvert, setAdministrationOuvert] = useState(false);
const [loisirsOuvert, setLoisirsOuvert] = useState(false);


// ==========================================
// DÉCONNEXION
// ==========================================

const handleDeconnexion = () => {
deconnecter();
navigate("/");
};

return ( <div className="app-layout">

```
  {/* ======================================
      MENU LATÉRAL
  ====================================== */}

  <aside className="sidebar">

    {/* LOGO */}

    <div className="logo">
      <h2>NGALANKA</h2>
      <span>HOTEL</span>
    </div>


    {/* ======================================
        NAVIGATION
    ====================================== */}

    <nav className="sidebar-nav">

      {/* DASHBOARD */}

      <NavLink to="/dashboard">
        🏠 Dashboard
      </NavLink>


      {/* ======================================
          HÉBERGEMENT
      ====================================== */}

      <div className="menu-section">

        <button
          type="button"
          className="menu-parent"
          onClick={() =>
            setHebergementOuvert(!hebergementOuvert)
          }
        >
          <span>🏨 Hébergement</span>

          <span>
            {hebergementOuvert ? "⌃" : "⌄"}
          </span>
        </button>


        {hebergementOuvert && (

          <div className="submenu">

            <NavLink to="/clients">
              👥 Clients
            </NavLink>

            <NavLink to="/chambres">
              🛏️ Chambres
            </NavLink>

            <NavLink to="/reservations">
              📅 Réservations
            </NavLink>

            <NavLink to="/sejours">
              🧳 Séjours
            </NavLink>

          </div>

        )}

      </div>


      {/* ======================================
          FINANCES
      ====================================== */}

      <div className="menu-section">

        <button
          type="button"
          className="menu-parent"
          onClick={() =>
            setFinancesOuvert(!financesOuvert)
          }
        >
          <span>Comptablité</span>

          <span>
            {financesOuvert ? "⌃" : "⌄"}
          </span>
        </button>


        {financesOuvert && (

          <div className="submenu">

            <NavLink to="/factures">
              🧾 Factures
            </NavLink>

            <NavLink to="/paiements">
              💳 Paiements
            </NavLink>

            <NavLink to="/caisse">
              💵 Caisse
            </NavLink>

          </div>

        )}

      </div>


      {/* ======================================
          RESTAURANT & BAR
      ====================================== */}

      <NavLink to="/restaurant">
        🍽️ Restaurant / Bar
      </NavLink>


    {/* ======================================
    LOISIRS & ÉVÉNEMENTS
====================================== */}

<div className="menu-section">

  <button
    type="button"
    className="menu-parent"
    onClick={() => setLoisirsOuvert(!loisirsOuvert)}
  >
    <span>🎯 Loisirs & Événements</span>

    <span>
      {loisirsOuvert ? "⌃" : "⌄"}
    </span>
  </button>

  {loisirsOuvert && (

    <div className="submenu">

      <NavLink to="/prestations">
        🏊 Piscine & Loisirs
      </NavLink>

      <NavLink to="/seminaires">
        🏢 Salles de séminaire
      </NavLink>

    </div>

  )}

</div>
      


      {/* ======================================
          STOCK
      ====================================== */}

      <div className="menu-section">

        <button
          type="button"
          className="menu-parent"
          onClick={() =>
            setStockOuvert(!stockOuvert)
          }
        >
          <span>📦 Stock</span>

          <span>
            {stockOuvert ? "⌃" : "⌄"}
          </span>
        </button>


        {stockOuvert && (

          <div className="submenu">

            <NavLink to="/stocks">
              📊 Gestion du stock
            </NavLink>

            <NavLink to="/produits">
              📦 Produits
            </NavLink>

            <NavLink to="/fournisseurs">
              🚚 Fournisseurs
            </NavLink>

            <NavLink to="/achats">
              🛒 Achats
            </NavLink>

          </div>

        )}

      </div>


      {/* ======================================
          ADMINISTRATION
      ====================================== */}

      <div className="menu-section">

        <button
          type="button"
          className="menu-parent"
          onClick={() =>
            setAdministrationOuvert(!administrationOuvert)
          }
        >
          <span>⚙️ Administration</span>

          <span>
            {administrationOuvert ? "⌃" : "⌄"}
          </span>
        </button>


        {administrationOuvert && (

          <div className="submenu">

            <NavLink to="/personnel">
              👨‍💼 Personnel
            </NavLink>

            <NavLink to="/utilisateurs">
              👤 Utilisateurs
            </NavLink>

            <NavLink to="/parametres">
              ⚙️ Paramètres
            </NavLink>

          </div>

        )}

      </div>


    </nav>


    {/* ======================================
        BAS DU MENU
    ====================================== */}

    <div className="sidebar-bottom">

      <button
        type="button"
        onClick={handleDeconnexion}
      >
        🚪 Déconnexion
      </button>

    </div>

  </aside>


  {/* ======================================
      CONTENU PRINCIPAL
  ====================================== */}

  <main className="main-content">

    {/* TOPBAR */}

    <header className="topbar">

      <div>
        <h3>NGALANKA HOTEL</h3>
      </div>


      <div className="user-info">

        <span>
          👤 {utilisateur?.nom_complet}
        </span>

        <small>
          {utilisateur?.nom_role || "Utilisateur"}
        </small>

      </div>

    </header>


    {/* CONTENU DES PAGES */}

    <section className="page-content">
      <Outlet />
    </section>

  </main>

</div>


);
}

export default Layouts;
