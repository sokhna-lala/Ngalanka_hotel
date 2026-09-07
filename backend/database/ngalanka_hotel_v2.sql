-- ============================================================
-- NGALANKA HOTEL - BASE DE DONNÉES V2
-- SGBD : MariaDB / MySQL
-- Application : React + Node.js + Express
-- Version : 2.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS ngalanka_hotel
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ngalanka_hotel;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SUPPRESSION DES ANCIENNES TABLES
-- ============================================================

DROP VIEW IF EXISTS v_dashboard_hotel;
DROP VIEW IF EXISTS v_occupation_chambres;
DROP VIEW IF EXISTS v_reservations_a_venir;
DROP VIEW IF EXISTS v_chiffre_affaires;
DROP VIEW IF EXISTS v_solde_factures;

DROP TABLE IF EXISTS journal_audit;
DROP TABLE IF EXISTS parametres;

DROP TABLE IF EXISTS mouvements_caisse;
DROP TABLE IF EXISTS caisses;

DROP TABLE IF EXISTS paiements;
DROP TABLE IF EXISTS lignes_facture;
DROP TABLE IF EXISTS factures;

DROP TABLE IF EXISTS consommations_prestation;
DROP TABLE IF EXISTS prestations;

DROP TABLE IF EXISTS lignes_commande;
DROP TABLE IF EXISTS commandes;
DROP TABLE IF EXISTS produits;
DROP TABLE IF EXISTS categories_produit;

DROP TABLE IF EXISTS mouvements_stock;
DROP TABLE IF EXISTS lignes_achat;
DROP TABLE IF EXISTS achats;
DROP TABLE IF EXISTS fournisseurs;

DROP TABLE IF EXISTS reservations_salle;
DROP TABLE IF EXISTS salles_seminaire;

DROP TABLE IF EXISTS maintenances;

DROP TABLE IF EXISTS conges;
DROP TABLE IF EXISTS presences;
DROP TABLE IF EXISTS employes;

DROP TABLE IF EXISTS sejours;
DROP TABLE IF EXISTS reservations;

DROP TABLE IF EXISTS chambres;
DROP TABLE IF EXISTS types_chambre;

DROP TABLE IF EXISTS clients;

DROP TABLE IF EXISTS utilisateurs;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE roles (
    id_role INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    statut ENUM('ACTIF','INACTIF') NOT NULL DEFAULT 'ACTIF',
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


INSERT INTO roles (nom_role, description) VALUES
('ADMINISTRATEUR', 'Accès complet à l''application'),
('DIRECTEUR', 'Gestion générale et rapports'),
('RECEPTIONNISTE', 'Réservations, arrivées, départs et clients'),
('CAISSIER', 'Facturation et caisse'),
('RESTAURANT', 'Gestion du restaurant et des commandes'),
('BAR', 'Gestion du bar'),
('STOCK', 'Gestion des stocks et achats'),
('PERSONNEL', 'Gestion du personnel'),
('MAINTENANCE', 'Gestion des interventions techniques');


-- ============================================================
-- 2. UTILISATEURS
-- ============================================================

CREATE TABLE utilisateurs (
    id_utilisateur INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nom_utilisateur VARCHAR(50) NOT NULL UNIQUE,

    mot_de_passe VARCHAR(255) NOT NULL,

    nom_complet VARCHAR(120) NOT NULL,

    id_role INT UNSIGNED NOT NULL,

    telephone VARCHAR(30),

    email VARCHAR(120),

    statut ENUM('ACTIF','INACTIF','BLOQUE')
        NOT NULL DEFAULT 'ACTIF',

    derniere_connexion DATETIME NULL,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    date_modification DATETIME NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_utilisateur_role
        FOREIGN KEY (id_role)
        REFERENCES roles(id_role)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_utilisateur_role (id_role),
    INDEX idx_utilisateur_statut (statut)

) ENGINE=InnoDB;


-- Mot de passe temporaire uniquement pour installation.
-- À remplacer par un hash bcrypt depuis Node.js.

INSERT INTO utilisateurs
(nom_utilisateur, mot_de_passe, nom_complet, id_role, telephone, email)
VALUES
(
    'admin',
    'admin123',
    'Administrateur NGALANKA',
    1,
    '770000000',
    'admin@ngalankahotel.com'
),
(
    'reception',
    'reception123',
    'Réception NGALANKA',
    3,
    '771111111',
    'reception@ngalankahotel.com'
),
(
    'caisse',
    'caisse123',
    'Caisse NGALANKA',
    4,
    '772222222',
    'caisse@ngalankahotel.com'
);


-- ============================================================
-- 3. CLIENTS
-- ============================================================

CREATE TABLE clients (
    id_client INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code_client VARCHAR(30) NOT NULL UNIQUE,

    nom VARCHAR(80) NOT NULL,

    prenom VARCHAR(100),

    sexe ENUM('M','F','AUTRE') DEFAULT NULL,

    date_naissance DATE NULL,

    telephone VARCHAR(30),

    email VARCHAR(120),

    adresse VARCHAR(255),

    ville VARCHAR(100),

    pays VARCHAR(100) DEFAULT 'Sénégal',

    nationalite VARCHAR(100) DEFAULT 'Sénégalaise',

    type_piece ENUM(
        'CNI',
        'PASSEPORT',
        'PERMIS',
        'CARTE_SEJOUR',
        'AUTRE'
    ) DEFAULT NULL,

    numero_piece VARCHAR(80),

    entreprise VARCHAR(150),

    observation TEXT,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    date_modification DATETIME NULL
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_client_piece (
        type_piece,
        numero_piece
    ),

    INDEX idx_client_nom (nom),

    INDEX idx_client_telephone (telephone),

    INDEX idx_client_email (email)

) ENGINE=InnoDB;


-- ============================================================
-- 4. TYPES DE CHAMBRES
-- ============================================================

CREATE TABLE types_chambre (
    id_type INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    libelle VARCHAR(80) NOT NULL UNIQUE,

    description TEXT,

    capacite INT UNSIGNED NOT NULL DEFAULT 2,

    nombre_lits INT UNSIGNED NOT NULL DEFAULT 1,

    tarif_base DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM('ACTIF','INACTIF')
        NOT NULL DEFAULT 'ACTIF',

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


INSERT INTO types_chambre
(libelle, description, capacite, nombre_lits, tarif_base)
VALUES
(
    'Chambre simple',
    'Chambre standard de l''hôtel',
    2,
    1,
    30000
),
(
    'Suite',
    'Suite confortable avec prestations supérieures',
    4,
    2,
    50000
),
(
    'Appartement',
    'Appartement familial',
    6,
    3,
    75000
);


-- ============================================================
-- 5. CHAMBRES
-- ============================================================

CREATE TABLE chambres (
    id_chambre INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero VARCHAR(20) NOT NULL UNIQUE,

    id_type INT UNSIGNED NOT NULL,

    etage VARCHAR(50),

    description TEXT,

    tarif DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'DISPONIBLE',
        'OCCUPEE',
        'RESERVEE',
        'NETTOYAGE',
        'HORS_SERVICE'
    ) NOT NULL DEFAULT 'DISPONIBLE',

    observation TEXT,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    date_modification DATETIME NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_chambre_type
        FOREIGN KEY (id_type)
        REFERENCES types_chambre(id_type)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_chambre_type (id_type),

    INDEX idx_chambre_statut (statut)

) ENGINE=InnoDB;


-- 48 chambres simples
INSERT INTO chambres
(numero, id_type, etage, tarif)
SELECT
    CONCAT('1', LPAD(n,2,'0')),
    1,
    'Rez-de-chaussée',
    30000
FROM (
    SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
    UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
    UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
    UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18
    UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21
    UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
    UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27
    UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
    UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33
    UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL SELECT 36
    UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39
    UNION ALL SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42
    UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45
    UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48
) AS x;


INSERT INTO chambres
(numero, id_type, etage, tarif)
VALUES
('S01',2,'Bloc Suites',50000),
('S02',2,'Bloc Suites',50000),
('S03',2,'Bloc Suites',50000),
('S04',2,'Bloc Suites',50000),
('S05',2,'Bloc Suites',50000),
('S06',2,'Bloc Suites',50000),

('A01',3,'Bloc Appartements',75000),
('A02',3,'Bloc Appartements',75000),
('A03',3,'Bloc Appartements',75000),
('A04',3,'Bloc Appartements',75000),
('A05',3,'Bloc Appartements',75000),
('A06',3,'Bloc Appartements',75000),
('A07',3,'Bloc Appartements',75000);


-- ============================================================
-- 6. RESERVATIONS
-- ============================================================

CREATE TABLE reservations (
    id_reservation INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero_reservation VARCHAR(30) NOT NULL UNIQUE,

    id_client INT UNSIGNED NOT NULL,

    date_reservation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    date_arrivee DATE NOT NULL,

    date_depart DATE NOT NULL,

    nb_adultes INT UNSIGNED NOT NULL DEFAULT 1,

    nb_enfants INT UNSIGNED NOT NULL DEFAULT 0,

    statut ENUM(
        'EN_ATTENTE',
        'CONFIRMEE',
        'ANNULEE',
        'NO_SHOW',
        'TERMINEE'
    ) NOT NULL DEFAULT 'EN_ATTENTE',

    montant_prevu DECIMAL(12,2) NOT NULL DEFAULT 0,

    avance DECIMAL(12,2) NOT NULL DEFAULT 0,

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    date_modification DATETIME NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_client
        FOREIGN KEY (id_client)
        REFERENCES clients(id_client)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_reservation_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_reservation_dates
        (date_arrivee, date_depart),

    INDEX idx_reservation_statut
        (statut),

    INDEX idx_reservation_client
        (id_client)

) ENGINE=InnoDB;


-- ============================================================
-- 7. DETAILS DES CHAMBRES RESERVEES
-- ============================================================

CREATE TABLE reservation_chambres (
    id_reservation_chambre INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_reservation INT UNSIGNED NOT NULL,

    id_chambre INT UNSIGNED NOT NULL,

    tarif_nuit DECIMAL(12,2) NOT NULL DEFAULT 0,

    nombre_nuits INT UNSIGNED NOT NULL DEFAULT 1,

    montant DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_reservation_chambre_reservation
        FOREIGN KEY (id_reservation)
        REFERENCES reservations(id_reservation)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_reservation_chambre_chambre
        FOREIGN KEY (id_chambre)
        REFERENCES chambres(id_chambre)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_reservation_chambre_reservation
        (id_reservation),

    INDEX idx_reservation_chambre_chambre
        (id_chambre)

) ENGINE=InnoDB;


-- ============================================================
-- 8. SEJOURS / CHECK-IN / CHECK-OUT
-- ============================================================

CREATE TABLE sejours (
    id_sejour INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero_sejour VARCHAR(30) NOT NULL UNIQUE,

    id_client INT UNSIGNED NOT NULL,

    id_reservation INT UNSIGNED NULL,

    id_chambre INT UNSIGNED NOT NULL,

    date_arrivee_prevue DATE NOT NULL,

    date_arrivee_reelle DATETIME NULL,

    date_depart_prevue DATE NOT NULL,

    date_depart_reelle DATETIME NULL,

    nombre_nuits INT UNSIGNED NOT NULL DEFAULT 0,

    nombre_adultes INT UNSIGNED NOT NULL DEFAULT 1,

    nombre_enfants INT UNSIGNED NOT NULL DEFAULT 0,

    statut ENUM(
        'EN_ATTENTE',
        'EN_COURS',
        'TERMINE',
        'ANNULE'
    ) NOT NULL DEFAULT 'EN_ATTENTE',

    caution DECIMAL(12,2) NOT NULL DEFAULT 0,

    observation TEXT,

    utilisateur_checkin INT UNSIGNED NULL,

    utilisateur_checkout INT UNSIGNED NULL,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sejour_client
        FOREIGN KEY (id_client)
        REFERENCES clients(id_client)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_sejour_reservation
        FOREIGN KEY (id_reservation)
        REFERENCES reservations(id_reservation)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_sejour_chambre
        FOREIGN KEY (id_chambre)
        REFERENCES chambres(id_chambre)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_sejour_checkin
        FOREIGN KEY (utilisateur_checkin)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_sejour_checkout
        FOREIGN KEY (utilisateur_checkout)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_sejour_client (id_client),

    INDEX idx_sejour_chambre (id_chambre),

    INDEX idx_sejour_statut (statut)

) ENGINE=InnoDB;


-- ============================================================
-- 9. CATEGORIES RESTAURANT / BAR
-- ============================================================

CREATE TABLE categories_produit (
    id_categorie INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    libelle VARCHAR(100) NOT NULL UNIQUE,

    type ENUM(
        'RESTAURANT',
        'BAR',
        'AUTRE'
    ) NOT NULL DEFAULT 'RESTAURANT',

    description TEXT,

    statut ENUM('ACTIF','INACTIF')
        NOT NULL DEFAULT 'ACTIF',

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


INSERT INTO categories_produit
(libelle,type)
VALUES
('Plats','RESTAURANT'),
('Entrées','RESTAURANT'),
('Desserts','RESTAURANT'),
('Petit déjeuner','RESTAURANT'),
('Boissons','BAR'),
('Cocktails','BAR'),
('Vins','BAR'),
('Bières','BAR');


-- ============================================================
-- 10. PRODUITS
-- ============================================================

CREATE TABLE produits (
    id_produit INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_categorie INT UNSIGNED NOT NULL,

    code VARCHAR(30) UNIQUE,

    libelle VARCHAR(150) NOT NULL,

    prix_vente DECIMAL(12,2) NOT NULL DEFAULT 0,

    prix_achat DECIMAL(12,2) NOT NULL DEFAULT 0,

    unite VARCHAR(30) NOT NULL DEFAULT 'Unité',

    stock_minimum DECIMAL(12,2) NOT NULL DEFAULT 0,

    description TEXT,

    statut ENUM('ACTIF','INACTIF')
        NOT NULL DEFAULT 'ACTIF',

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_produit_categorie
        FOREIGN KEY (id_categorie)
        REFERENCES categories_produit(id_categorie)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE=InnoDB;


INSERT INTO produits
(id_categorie,code,libelle,prix_vente,prix_achat,unite,stock_minimum)
VALUES
(1,'PL001','Poulet grillé',7500,4500,'Plat',5),
(1,'PL002','Poisson braisé',8000,5000,'Plat',5),
(3,'DE001','Salade de fruits',2500,1500,'Portion',5),
(4,'PD001','Petit déjeuner',5000,2500,'Formule',10),
(5,'BO001','Eau minérale 1,5 L',1000,500,'Bouteille',20),
(5,'BO002','Jus de bissap',1500,800,'Verre',10),
(5,'BO003','Jus de bouye',1500,800,'Verre',10);


-- ============================================================
-- 11. COMMANDES RESTAURANT / BAR / CHAMBRE
-- ============================================================

CREATE TABLE commandes (
    id_commande INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero_commande VARCHAR(30) NOT NULL UNIQUE,

    id_client INT UNSIGNED NULL,

    id_sejour INT UNSIGNED NULL,

    id_chambre INT UNSIGNED NULL,

    table_numero VARCHAR(20),

    type_commande ENUM(
        'RESTAURANT',
        'BAR',
        'ROOM_SERVICE',
        'AUTRE'
    ) NOT NULL DEFAULT 'RESTAURANT',

    date_commande DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    montant_total DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'OUVERTE',
        'EN_PREPARATION',
        'SERVIE',
        'FACTUREE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'OUVERTE',

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_commande_client
        FOREIGN KEY (id_client)
        REFERENCES clients(id_client)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_commande_sejour
        FOREIGN KEY (id_sejour)
        REFERENCES sejours(id_sejour)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_commande_chambre
        FOREIGN KEY (id_chambre)
        REFERENCES chambres(id_chambre)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_commande_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_commande_date (date_commande),

    INDEX idx_commande_statut (statut),

    INDEX idx_commande_sejour (id_sejour)

) ENGINE=InnoDB;


CREATE TABLE lignes_commande (
    id_ligne INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_commande INT UNSIGNED NOT NULL,

    id_produit INT UNSIGNED NOT NULL,

    quantite DECIMAL(10,2) NOT NULL DEFAULT 1,

    prix_unitaire DECIMAL(12,2) NOT NULL DEFAULT 0,

    montant DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_ligne_commande
        FOREIGN KEY (id_commande)
        REFERENCES commandes(id_commande)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ligne_produit
        FOREIGN KEY (id_produit)
        REFERENCES produits(id_produit)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE=InnoDB;


-- ============================================================
-- 12. SALLES DE SEMINAIRE
-- ============================================================

CREATE TABLE salles_seminaire (
    id_salle INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nom VARCHAR(100) NOT NULL UNIQUE,

    capacite INT UNSIGNED NOT NULL DEFAULT 0,

    description TEXT,

    tarif_journee DECIMAL(12,2) NOT NULL DEFAULT 0,

    tarif_demi_journee DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'DISPONIBLE',
        'OCCUPEE',
        'HORS_SERVICE'
    ) NOT NULL DEFAULT 'DISPONIBLE',

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


INSERT INTO salles_seminaire
(nom,capacite,description,tarif_journee,tarif_demi_journee)
VALUES
(
    'Salle de séminaire A',
    50,
    'Salle principale pour réunions et séminaires',
    150000,
    90000
),
(
    'Salle de séminaire B',
    30,
    'Salle secondaire pour formations et réunions',
    100000,
    60000
);


-- ============================================================
-- 13. RESERVATIONS SALLES
-- ============================================================

CREATE TABLE reservations_salle (
    id_reservation_salle INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero_reservation VARCHAR(30) NOT NULL UNIQUE,

    id_salle INT UNSIGNED NOT NULL,

    id_client INT UNSIGNED NOT NULL,

    date_debut DATE NOT NULL,

    date_fin DATE NOT NULL,

    heure_debut TIME,

    heure_fin TIME,

    objet VARCHAR(255) NOT NULL,

    nombre_participants INT UNSIGNED NOT NULL DEFAULT 1,

    montant DECIMAL(12,2) NOT NULL DEFAULT 0,

    avance DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'EN_ATTENTE',
        'CONFIRMEE',
        'ANNULEE',
        'TERMINEE'
    ) NOT NULL DEFAULT 'EN_ATTENTE',

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_res_salle
        FOREIGN KEY (id_salle)
        REFERENCES salles_seminaire(id_salle)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_res_salle_client
        FOREIGN KEY (id_client)
        REFERENCES clients(id_client)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_res_salle_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_res_salle_dates
        (date_debut,date_fin),

    INDEX idx_res_salle_statut
        (statut)

) ENGINE=InnoDB;


-- ============================================================
-- 14. PISCINE / LOISIRS / PRESTATIONS
-- ============================================================

CREATE TABLE prestations (
    id_prestation INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    libelle VARCHAR(120) NOT NULL UNIQUE,

    categorie ENUM(
        'PISCINE',
        'SPORT',
        'LOISIR',
        'EVENEMENT',
        'AUTRE'
    ) NOT NULL DEFAULT 'AUTRE',

    tarif DECIMAL(12,2) NOT NULL DEFAULT 0,

    unite VARCHAR(30) NOT NULL DEFAULT 'Unité',

    description TEXT,

    statut ENUM('ACTIF','INACTIF')
        NOT NULL DEFAULT 'ACTIF',

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


INSERT INTO prestations
(libelle,categorie,tarif,unite)
VALUES
('Accès piscine','PISCINE',3000,'Personne'),
('Mini terrain de football','SPORT',10000,'Heure'),
('Calèche','LOISIR',15000,'Balade'),
('Organisation événement','EVENEMENT',0,'Forfait');


CREATE TABLE consommations_prestation (
    id_consommation INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_client INT UNSIGNED NOT NULL,

    id_sejour INT UNSIGNED NULL,

    id_prestation INT UNSIGNED NOT NULL,

    date_consommation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    quantite DECIMAL(10,2) NOT NULL DEFAULT 1,

    prix_unitaire DECIMAL(12,2) NOT NULL DEFAULT 0,

    montant DECIMAL(12,2) NOT NULL DEFAULT 0,

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_cons_prest_client
        FOREIGN KEY (id_client)
        REFERENCES clients(id_client)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_cons_prest_sejour
        FOREIGN KEY (id_sejour)
        REFERENCES sejours(id_sejour)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_cons_prest_prestation
        FOREIGN KEY (id_prestation)
        REFERENCES prestations(id_prestation)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_cons_prest_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL

) ENGINE=InnoDB;


-- ============================================================
-- 15. FOURNISSEURS
-- ============================================================

CREATE TABLE fournisseurs (
    id_fournisseur INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    raison_sociale VARCHAR(150) NOT NULL,

    telephone VARCHAR(30),

    email VARCHAR(120),

    adresse VARCHAR(255),

    ville VARCHAR(100),

    pays VARCHAR(100) DEFAULT 'Sénégal',

    contact VARCHAR(120),

    observation TEXT,

    statut ENUM('ACTIF','INACTIF')
        NOT NULL DEFAULT 'ACTIF',

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


-- ============================================================
-- 16. ACHATS
-- ============================================================

CREATE TABLE achats (
    id_achat INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero_achat VARCHAR(30) NOT NULL UNIQUE,

    id_fournisseur INT UNSIGNED NOT NULL,

    numero_facture_fournisseur VARCHAR(50),

    date_achat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    montant DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'BROUILLON',
        'VALIDE',
        'ANNULE'
    ) NOT NULL DEFAULT 'BROUILLON',

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_achat_fournisseur
        FOREIGN KEY (id_fournisseur)
        REFERENCES fournisseurs(id_fournisseur)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_achat_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL

) ENGINE=InnoDB;


CREATE TABLE lignes_achat (
    id_ligne INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_achat INT UNSIGNED NOT NULL,

    id_produit INT UNSIGNED NOT NULL,

    quantite DECIMAL(12,2) NOT NULL DEFAULT 0,

    prix_unitaire DECIMAL(12,2) NOT NULL DEFAULT 0,

    montant DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_ligne_achat
        FOREIGN KEY (id_achat)
        REFERENCES achats(id_achat)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ligne_achat_produit
        FOREIGN KEY (id_produit)
        REFERENCES produits(id_produit)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE=InnoDB;


-- ============================================================
-- 17. STOCK
-- ============================================================

CREATE TABLE mouvements_stock (
    id_mouvement INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_produit INT UNSIGNED NOT NULL,

    date_mouvement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    type_mouvement ENUM(
        'ENTREE',
        'SORTIE',
        'INVENTAIRE',
        'PERTE',
        'TRANSFERT'
    ) NOT NULL,

    quantite DECIMAL(12,2) NOT NULL,

    motif VARCHAR(255),

    reference VARCHAR(100),

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_mouvement_produit
        FOREIGN KEY (id_produit)
        REFERENCES produits(id_produit)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_mouvement_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_mouvement_date (date_mouvement),

    INDEX idx_mouvement_produit (id_produit)

) ENGINE=InnoDB;


-- ============================================================
-- 18. PERSONNEL
-- ============================================================

CREATE TABLE employes (
    id_employe INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    matricule VARCHAR(30) NOT NULL UNIQUE,

    nom VARCHAR(80) NOT NULL,

    prenom VARCHAR(100),

    sexe ENUM('M','F','AUTRE') DEFAULT NULL,

    date_naissance DATE NULL,

    telephone VARCHAR(30),

    email VARCHAR(120),

    adresse VARCHAR(255),

    fonction VARCHAR(100),

    service VARCHAR(100),

    date_embauche DATE,

    salaire DECIMAL(12,2) DEFAULT 0,

    statut ENUM(
        'ACTIF',
        'INACTIF',
        'SUSPENDU'
    ) NOT NULL DEFAULT 'ACTIF',

    observation TEXT,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


-- ============================================================
-- 19. PRESENCES
-- ============================================================

CREATE TABLE presences (
    id_presence INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_employe INT UNSIGNED NOT NULL,

    date_presence DATE NOT NULL,

    heure_entree TIME,

    heure_sortie TIME,

    statut ENUM(
        'PRESENT',
        'ABSENT',
        'RETARD',
        'CONGE'
    ) NOT NULL DEFAULT 'PRESENT',

    observation TEXT,

    CONSTRAINT fk_presence_employe
        FOREIGN KEY (id_employe)
        REFERENCES employes(id_employe)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    UNIQUE KEY uk_presence
        (id_employe,date_presence)

) ENGINE=InnoDB;


-- ============================================================
-- 20. CONGES
-- ============================================================

CREATE TABLE conges (
    id_conge INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_employe INT UNSIGNED NOT NULL,

    date_debut DATE NOT NULL,

    date_fin DATE NOT NULL,

    type_conge VARCHAR(80) NOT NULL,

    motif TEXT,

    statut ENUM(
        'EN_ATTENTE',
        'ACCEPTE',
        'REFUSE',
        'TERMINE'
    ) NOT NULL DEFAULT 'EN_ATTENTE',

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_conge_employe
        FOREIGN KEY (id_employe)
        REFERENCES employes(id_employe)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_conge_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL

) ENGINE=InnoDB;


-- ============================================================
-- 21. MAINTENANCE
-- ============================================================

CREATE TABLE maintenances (
    id_maintenance INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    reference VARCHAR(30) NOT NULL UNIQUE,

    type_cible ENUM(
        'CHAMBRE',
        'SALLE_SEMINAIRE',
        'PISCINE',
        'RESTAURANT',
        'BAR',
        'EQUIPEMENT',
        'AUTRE'
    ) NOT NULL,

    id_chambre INT UNSIGNED NULL,

    id_salle INT UNSIGNED NULL,

    description TEXT NOT NULL,

    type_panne VARCHAR(100),

    priorite ENUM(
        'FAIBLE',
        'NORMALE',
        'URGENTE',
        'CRITIQUE'
    ) NOT NULL DEFAULT 'NORMALE',

    technicien VARCHAR(120),

    date_signalement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    date_intervention DATETIME NULL,

    date_fin DATETIME NULL,

    cout DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'SIGNALEE',
        'EN_COURS',
        'TERMINEE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'SIGNALEE',

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_maintenance_chambre
        FOREIGN KEY (id_chambre)
        REFERENCES chambres(id_chambre)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_maintenance_salle
        FOREIGN KEY (id_salle)
        REFERENCES salles_seminaire(id_salle)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_maintenance_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_maintenance_statut (statut),

    INDEX idx_maintenance_priorite (priorite)

) ENGINE=InnoDB;


-- ============================================================
-- 22. FACTURES
-- ============================================================

CREATE TABLE factures (
    id_facture INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero_facture VARCHAR(30) NOT NULL UNIQUE,

    id_client INT UNSIGNED NOT NULL,

    id_sejour INT UNSIGNED NULL,

    date_facture DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    montant_total DECIMAL(12,2) NOT NULL DEFAULT 0,

    remise DECIMAL(12,2) NOT NULL DEFAULT 0,

    taxe DECIMAL(12,2) NOT NULL DEFAULT 0,

    net_a_payer DECIMAL(12,2) NOT NULL DEFAULT 0,

    montant_paye DECIMAL(12,2) NOT NULL DEFAULT 0,

    reste_a_payer DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'BROUILLON',
        'PARTIELLE',
        'PAYEE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'BROUILLON',

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_facture_client
        FOREIGN KEY (id_client)
        REFERENCES clients(id_client)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_facture_sejour
        FOREIGN KEY (id_sejour)
        REFERENCES sejours(id_sejour)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_facture_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_facture_date (date_facture),

    INDEX idx_facture_statut (statut),

    INDEX idx_facture_client (id_client)

) ENGINE=InnoDB;


-- ============================================================
-- 23. LIGNES FACTURES
-- ============================================================

CREATE TABLE lignes_facture (
    id_ligne INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_facture INT UNSIGNED NOT NULL,

    type_ligne ENUM(
        'CHAMBRE',
        'RESTAURANT',
        'BAR',
        'PISCINE',
        'LOISIR',
        'SEMINAIRE',
        'AUTRE'
    ) NOT NULL DEFAULT 'AUTRE',

    reference_id INT UNSIGNED NULL,

    designation VARCHAR(255) NOT NULL,

    quantite DECIMAL(10,2) NOT NULL DEFAULT 1,

    prix_unitaire DECIMAL(12,2) NOT NULL DEFAULT 0,

    remise DECIMAL(12,2) NOT NULL DEFAULT 0,

    montant DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_ligne_facture
        FOREIGN KEY (id_facture)
        REFERENCES factures(id_facture)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_ligne_facture_type (type_ligne)

) ENGINE=InnoDB;


-- ============================================================
-- 24. PAIEMENTS
-- ============================================================

CREATE TABLE paiements (
    id_paiement INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    numero_paiement VARCHAR(30) NOT NULL UNIQUE,

    id_facture INT UNSIGNED NOT NULL,

    date_paiement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    montant DECIMAL(12,2) NOT NULL,

    mode_paiement ENUM(
        'ESPECES',
        'WAVE',
        'ORANGE_MONEY',
        'FREE_MONEY',
        'CARTE',
        'VIREMENT',
        'CHEQUE',
        'AUTRE'
    ) NOT NULL,

    reference VARCHAR(100),

    observation TEXT,

    id_utilisateur INT UNSIGNED NULL,

    CONSTRAINT fk_paiement_facture
        FOREIGN KEY (id_facture)
        REFERENCES factures(id_facture)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_paiement_utilisateur
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_paiement_date (date_paiement),

    INDEX idx_paiement_mode (mode_paiement)

) ENGINE=InnoDB;


-- ============================================================
-- 25. CAISSES
-- ============================================================

CREATE TABLE caisses (
    id_caisse INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nom_caisse VARCHAR(100) NOT NULL UNIQUE,

    solde_initial DECIMAL(12,2) NOT NULL DEFAULT 0,

    solde_actuel DECIMAL(12,2) NOT NULL DEFAULT 0,

    statut ENUM(
        'OUVERTE',
        'FERMEE'
    ) NOT NULL DEFAULT 'FERMEE',

    utilisateur_ouverture INT UNSIGNED NULL,

    date_ouverture DATETIME NULL,

    date_fermeture DATETIME NULL,

    observation TEXT,

    CONSTRAINT fk_caisse_user_ouverture
        FOREIGN KEY (utilisateur_ouverture)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL

) ENGINE=InnoDB;


INSERT INTO caisses
(nom_caisse,solde_initial,solde_actuel)
VALUES
('Caisse principale',0,0);


-- ============================================================
-- 26. MOUVEMENTS CAISSE
-- ============================================================

CREATE TABLE mouvements_caisse (
    id_mouvement_caisse INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_caisse INT UNSIGNED NOT NULL,

    id_paiement INT UNSIGNED NULL,

    type_mouvement ENUM(
        'ENTREE',
        'SORTIE'
    ) NOT NULL,

    montant DECIMAL(12,2) NOT NULL,

    motif VARCHAR(255) NOT NULL,

    reference VARCHAR(100),

    date_mouvement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_utilisateur INT UNSIGNED NULL,

    observation TEXT,

    CONSTRAINT fk_mouvement_caisse
        FOREIGN KEY (id_caisse)
        REFERENCES caisses(id_caisse)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_mouvement_caisse_paiement
        FOREIGN KEY (id_paiement)
        REFERENCES paiements(id_paiement)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_mouvement_caisse_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_mouvement_caisse_date
        (date_mouvement),

    INDEX idx_mouvement_caisse_type
        (type_mouvement)

) ENGINE=InnoDB;


-- ============================================================
-- 27. PARAMETRES DE L'HOTEL
-- ============================================================

CREATE TABLE parametres (
    id_parametre INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    cle VARCHAR(100) NOT NULL UNIQUE,

    valeur TEXT,

    description VARCHAR(255),

    type_valeur ENUM(
        'TEXTE',
        'NOMBRE',
        'BOOLEAN',
        'JSON'
    ) NOT NULL DEFAULT 'TEXTE',

    date_modification DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB;


INSERT INTO parametres
(cle,valeur,description,type_valeur)
VALUES
('nom_hotel','NGALANKA HOTEL','Nom de l''établissement','TEXTE'),
('adresse_hotel','','Adresse de l''hôtel','TEXTE'),
('telephone_hotel','','Téléphone de l''hôtel','TEXTE'),
('email_hotel','','Email de l''hôtel','TEXTE'),
('devise','FCFA','Devise utilisée','TEXTE'),
('taux_tva','0','Taux de TVA','NOMBRE'),
('heure_checkin','14:00','Heure standard d''arrivée','TEXTE'),
('heure_checkout','12:00','Heure standard de départ','TEXTE');


-- ============================================================
-- 28. JOURNAL D'AUDIT
-- ============================================================

CREATE TABLE journal_audit (
    id_audit BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_utilisateur INT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    table_cible VARCHAR(100),

    id_cible VARCHAR(100),

    description TEXT,

    ancienne_valeur JSON NULL,

    nouvelle_valeur JSON NULL,

    adresse_ip VARCHAR(45),

    user_agent TEXT,

    date_action DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_audit_user (id_utilisateur),

    INDEX idx_audit_date (date_action),

    INDEX idx_audit_action (action)

) ENGINE=InnoDB;


-- ============================================================
-- 29. RAPPORT : ETAT DES CHAMBRES
-- ============================================================

CREATE VIEW v_occupation_chambres AS
SELECT
    COUNT(*) AS total_chambres,

    SUM(statut = 'DISPONIBLE') AS disponibles,

    SUM(statut = 'OCCUPEE') AS occupees,

    SUM(statut = 'RESERVEE') AS reservees,

    SUM(statut = 'NETTOYAGE') AS nettoyage,

    SUM(statut = 'HORS_SERVICE') AS hors_service,

    ROUND(
        SUM(statut IN ('OCCUPEE','RESERVEE'))
        / COUNT(*) * 100,
        2
    ) AS taux_occupation

FROM chambres;


-- ============================================================
-- 30. RESERVATIONS A VENIR
-- ============================================================

CREATE VIEW v_reservations_a_venir AS
SELECT
    r.id_reservation,

    r.numero_reservation,

    c.code_client,

    c.nom,

    c.prenom,

    c.telephone,

    r.date_arrivee,

    r.date_depart,

    r.nb_adultes,

    r.nb_enfants,

    r.statut,

    r.montant_prevu,

    r.avance

FROM reservations r

INNER JOIN clients c
    ON c.id_client = r.id_client

WHERE r.statut IN (
    'EN_ATTENTE',
    'CONFIRMEE'
)

ORDER BY r.date_arrivee;


-- ============================================================
-- 31. CHIFFRE D'AFFAIRES
-- ============================================================

CREATE VIEW v_chiffre_affaires AS
SELECT

    DATE(date_facture) AS jour,

    SUM(net_a_payer) AS chiffre_affaires,

    SUM(montant_paye) AS encaissements,

    SUM(reste_a_payer) AS creances

FROM factures

WHERE statut <> 'ANNULEE'

GROUP BY DATE(date_facture)

ORDER BY jour DESC;


-- ============================================================
-- 32. SOLDE DES FACTURES
-- ============================================================

CREATE VIEW v_solde_factures AS
SELECT

    f.id_facture,

    f.numero_facture,

    f.date_facture,

    c.nom,

    c.prenom,

    f.net_a_payer,

    f.montant_paye,

    f.reste_a_payer,

    f.statut

FROM factures f

INNER JOIN clients c
    ON c.id_client = f.id_client

WHERE f.statut <> 'ANNULEE';


-- ============================================================
-- 33. DASHBOARD GENERAL
-- ============================================================

CREATE VIEW v_dashboard_hotel AS
SELECT

    (
        SELECT COUNT(*)
        FROM chambres
    ) AS total_chambres,

    (
        SELECT COUNT(*)
        FROM chambres
        WHERE statut = 'DISPONIBLE'
    ) AS chambres_disponibles,

    (
        SELECT COUNT(*)
        FROM chambres
        WHERE statut = 'OCCUPEE'
    ) AS chambres_occupees,

    (
        SELECT COUNT(*)
        FROM reservations
        WHERE statut = 'CONFIRMEE'
        AND date_arrivee = CURDATE()
    ) AS arrivees_du_jour,

    (
        SELECT COUNT(*)
        FROM sejours
        WHERE statut = 'EN_COURS'
        AND date_depart_prevue = CURDATE()
    ) AS departs_du_jour,

    (
        SELECT COUNT(*)
        FROM clients
    ) AS total_clients,

    (
        SELECT COALESCE(SUM(net_a_payer),0)
        FROM factures
        WHERE DATE(date_facture) = CURDATE()
        AND statut <> 'ANNULEE'
    ) AS chiffre_affaires_jour,

    (
        SELECT COALESCE(SUM(montant),0)
        FROM paiements
        WHERE DATE(date_paiement) = CURDATE()
    ) AS encaissements_jour,

    (
        SELECT COUNT(*)
        FROM maintenances
        WHERE statut IN ('SIGNALEE','EN_COURS')
    ) AS maintenances_en_cours;


-- ============================================================
-- 34. CONTROLE INITIAL
-- ============================================================

SELECT 'Roles' AS element, COUNT(*) AS total
FROM roles

UNION ALL

SELECT 'Utilisateurs', COUNT(*)
FROM utilisateurs

UNION ALL

SELECT 'Clients', COUNT(*)
FROM clients

UNION ALL

SELECT 'Types de chambres', COUNT(*)
FROM types_chambre

UNION ALL

SELECT 'Chambres', COUNT(*)
FROM chambres

UNION ALL

SELECT 'Salles de séminaire', COUNT(*)
FROM salles_seminaire

UNION ALL

SELECT 'Produits restaurant/bar', COUNT(*)
FROM produits

UNION ALL

SELECT 'Prestations piscine/loisirs', COUNT(*)
FROM prestations

UNION ALL

SELECT 'Employés', COUNT(*)
FROM employes

UNION ALL

SELECT 'Caisses', COUNT(*)
FROM caisses;


-- ============================================================
-- FIN NGALANKA HOTEL V2
-- ============================================================