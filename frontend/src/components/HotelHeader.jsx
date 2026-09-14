import React from "react";
import "./HotelHeader.css";

function HotelHeader() {
    return (
        <header className="hotel-header">

            {/* BARRE SUPÉRIEURE */}


            {/* BANNIÈRE */}
            <div className="hotel-hero">

                <div className="hotel-hero-overlay">

                    <div className="hotel-welcome">
                        BIENVENUE À
                    </div>

                    <h1>
                        NGALANKA HÔTEL
                    </h1>

                    <div className="hotel-location">
                        📍 Lompoul sur Mer
                    </div>

                </div>

            </div>

        </header>
    );
}

export default HotelHeader;