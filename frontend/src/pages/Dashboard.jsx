import "./Dashboard.css";

import hotelBanner from "../assets/hotel-banner.png";

function Dashboard() {

    return (

        <div className="dashboard-page">

            {/* =====================================
                BANNIÈRE HÔTEL
            ====================================== */}

            <section
                className="hotel-banner"
                style={{
                    backgroundImage: `url(${hotelBanner})`
                }}
            >

                {/* OVERLAY */}

                <div className="hotel-overlay">

                    <div className="hotel-welcome">

                        <span className="welcome-text">
                            BIENVENUE À
                        </span>

                        <h1>
                            NGALANKA HÔTEL
                        </h1>

                        <p>
                            📍 Lompoul sur Mer
                        </p>

                    </div>

                </div>

            </section>


            {/* =====================================
                CARTES STATISTIQUES
            ====================================== */}

            <section className="stats-grid">

                {/* CHAMBRES */}

                <div className="stat-card stat-blue">

                    <div className="stat-icon">
                        🛏️
                    </div>

                    <div className="stat-content">

                        <span>
                            Chambres totales
                        </span>

                        <h2>
                            61
                        </h2>

                        <p>
                            48 Simples, 6 Suites,
                            7 Appartements
                        </p>

                    </div>

                </div>


                {/* DISPONIBLES */}

                <div className="stat-card stat-green">

                    <div className="stat-icon">
                        🛏️
                    </div>

                    <div className="stat-content">

                        <span>
                            Chambres disponibles
                        </span>

                        <h2>
                            27
                        </h2>

                        <div className="progress">

                            <div
                                className="progress-bar green"
                                style={{ width: "44%" }}
                            />

                        </div>

                    </div>

                </div>


                {/* OCCUPÉES */}

                <div className="stat-card stat-red">

                    <div className="stat-icon">
                        👥
                    </div>

                    <div className="stat-content">

                        <span>
                            Chambres occupées
                        </span>

                        <h2>
                            29
                        </h2>

                        <div className="progress">

                            <div
                                className="progress-bar red"
                                style={{ width: "47%" }}
                            />

                        </div>

                    </div>

                </div>


                {/* RÉSERVATIONS */}

                <div className="stat-card stat-orange">

                    <div className="stat-icon">
                        📅
                    </div>

                    <div className="stat-content">

                        <span>
                            Réservations
                        </span>

                        <h2>
                            5</h2>

                        <p>
                            En attente
                        </p>

                    </div>

                </div>


                {/* ARRIVÉES */}

                <div className="stat-card stat-purple">

                    <div className="stat-icon">
                        📥
                    </div>

                    <div className="stat-content">

                        <span>
                            Arrivées du jour
                        </span>

                        <h2>
                            06
                        </h2>

                        <p>
                            Ce jour
                        </p>

                    </div>

                </div>


                {/* DÉPARTS */}

                <div className="stat-card stat-cyan">

                    <div className="stat-icon">
                        📤
                    </div>

                    <div className="stat-content">

                        <span>
                            Départs du jour
                        </span>

                        <h2>
                            04
                        </h2>

                        <p>
                            Ce jour
                        </p>

                    </div>

                </div>


                {/* CHIFFRE D'AFFAIRES */}

                <div className="stat-card stat-gold">

                    <div className="stat-icon">
                        💰
                    </div>

                    <div className="stat-content">

                        <span>
                            Chiffre d'affaires
                        </span>

                        <h2>
                            1 250 000
                        </h2>

                        <p>
                            FCFA
                        </p>

                    </div>

                </div>

            </section>

        </div>

    );
}

export default Dashboard;