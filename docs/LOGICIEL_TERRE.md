# Logiciel Terre - Analyse du Code Original

> Application Delphi de gestion du cadastre et des fermages (D3Dev/Ghis/)

---

## 1. Vue d'ensemble

### 1.1 Présentation

Le **Logiciel Terre** (nom technique: **Sctl2**) gère le patrimoine foncier des structures agricoles :
- **GFA** : Groupement Foncier Agricole
- **SCTL** : Société Civile des Terres du Larzac

### 1.2 Fonctionnalités principales

| Domaine | Description |
|---------|-------------|
| **Cadastre** | Référencement des parcelles et de leurs caractéristiques |
| **Fermages** | Calcul des loyers dus par les exploitants agricoles |
| **Exploitants** | Gestion des agriculteurs et de leurs baux |
| **Rapports** | Impressions et exports par exploitant, commune, etc. |

### 1.3 Architecture de données

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    COMMUNE      │       │    PARCELLE     │       │  SUBDIVISION    │
│  (Référentiel)  │──────►│  (Cadastrale)   │──────►│  (Affectation)  │
└─────────────────┘       └────────┬────────┘       └────────┬────────┘
                                   │                         │
         ┌─────────────────────────┘                         │
         ▼                                                   ▼
┌─────────────────┐                                 ┌─────────────────┐
│    LIEU-DIT     │                                 │   EXPLOITANT    │
│  (Localisation) │                                 │  (Agriculteur)  │
└─────────────────┘                                 └─────────────────┘
```

---

## 2. Fenêtres et Interfaces

### 2.1 Liste complète des formulaires

L'application contient **30+ formulaires** identifiés dans `Sctl2.dpr` :

| Formulaire | Fichier | Description |
|------------|---------|-------------|
| **TmFichePrincipale** | `Uprincipale.pas` | Fenêtre principale, menu et navigation |
| **TAboutBox** | `UAbout.pas` | À propos de l'application |
| **TmListCalculs** | `UCalculs.pas` | Grille cadastre/fermage avec calculs |
| **TmSExcel** | `USExcel.pas` | Export Excel |
| **TmSauvegarde** | `USauvegarde.pas` | Sauvegarde des données |
| **TmReferences** | `UReferences.pas` | Gestion des tables de référence |
| **TmNewParcelles** | `UNewParcelles.pas` | Création/édition de parcelles |
| **TmExploitUnit** | `UExploitUnit.pas` | Fiche exploitant détaillée (3 onglets) |
| **TmParcelleUnit** | `UParcelleUnit.pas` | Fiche parcelle avec subdivisions |
| **TmNewPrintParExp** | `UNewPrintParExp.pas` | Impressions par exploitant/commune |
| **TmLocalisation** | `ULocalisation.pas` | Gestion des lieux-dits |
| **TmPrintExploit** | `UPrintExploit.pas` | Impression liste exploitants |
| **TmExploitant** | `UExploitant.pas` | Liste des exploitants |
| **TmTypeCadastre** | `UTypeCadastre.pas` | Gestion types cadastraux |
| **TmClasseCadastre** | `UClasseCadastre.pas` | Gestion classes cadastrales |
| **TmTypeFermage** | `UTypeFermage.pas` | Gestion types de fermage |
| **TmPrintCadastre** | `UPrintCad.pas` | Impression cadastre |
| **TmCadValues** | `UCadValues.pas` | Valeurs cadastrales par commune |
| **TmNewSubdiv** | `UNewSubdiv.pas` | Création/édition subdivisions |
| **TmSExploitants** | `USExploitants.pas` | Sélection exploitants |
| **TmSubdivision** | `USubdivision.pas` | Gestion subdivisions |
| **TmValeurPoints** | `UValeurPoints.pas` | Valeurs des points fermage |
| **TmPrintRecap** | `UPrintRecap.pas` | Récapitulatifs |
| **TmGfa** | `UGfa.pas` | Gestion structures GFA |
| **TmRecad** | `URecad.pas` | Recadastrage |
| **TmPrintSubdivCad** | `UPrintSubdivCad.pas` | Impression subdivisions cadastre |
| **TmRepAffecSurface** | `URepAffecSurface.pas` | Répartition/affectation surfaces |
| **TmRepSurface** | `URepSurface.pas` | Répartition surfaces |
| **TmSelectGfa** | `USelectGfa.pas` | Sélection structure GFA |
| **TmSCommune** | `USCommune.pas` | Sélection commune |
| **TmSPsg** | `USPsg.pas` | Sélection PSG |
| **TmPSG** | `UPSG.pas` | Gestion PSG (Plan Simple de Gestion) |

### 2.2 Fenêtre Principale (TmFichePrincipale)

**Fichier**: `Uprincipale.pas`

#### Menu Structure

```
Fichier
├── Charger (F5)
├── Enregistrer (F6)
├── Export vers Excel
├── Sauvegarde...
└── Quitter

Cadastre
├── Parcelle → Ajouter, Modifier, Supprimer
├── Parcelles par commune (F2)
├── Subdivisions cadastre
├── Recadastrage
└── Commune et lieux-dits

Exploitants
├── Liste des exploitants
├── Fiche exploitant
├── Fermages
└── Recherche

Références
├── Types cadastraux
├── Classes cadastrales
├── Types de fermage
├── Valeurs points GFA/SCTL
├── Communes
└── Structures (GFA)

Calculs
├── Calcul fermages
├── Récapitulatif par exploitant
└── Récapitulatif par commune

Impressions
├── Liste cadastre
├── Par exploitant
├── Par commune
├── Récapitulatifs
└── Export PDF/Excel

Options
├── Configuration
├── Couleurs GFA/SCTL
└── Paramètres
```

#### Variables Globales de Configuration

```pascal
// Uprincipale.pas
var
  G_ValeurSuppGFA  : Double;   // Pourcentage supplément GFA
  G_ValeurSuppSCTL : Double;   // Pourcentage supplément SCTL
  G_ColorSCTL      : Integer;  // Couleur affichage SCTL
  G_ColorGFA       : Integer;  // Couleur affichage GFA
  G_LibelleGFA     : String;   // Libellé personnalisé GFA
  G_LibelleSCTL    : String;   // Libellé personnalisé SCTL
```

### 2.3 Fiche Exploitant (TmExploitUnit)

**Fichier**: `UExploitUnit.pas`

Interface à **3 onglets** :

| Onglet | Contenu |
|--------|---------|
| **Fiche exploitant** | Nom, prénom, adresse, téléphone, email |
| **Cadastre** | Liste des parcelles exploitées (vue cadastrale) |
| **Fermage** | Liste des parcelles avec calcul fermage |

#### Champs de bail par structure

Pour chaque structure (GFA et SCTL) :
- Date début bail
- Date fin bail
- Numéro avenant
- Date avenant
- Valeur du point
- Supplément durée (checkbox)

### 2.4 Fiche Parcelle (TmParcelleUnit)

**Fichier**: `UParcelleUnit.pas`

Gestion des parcelles avec :
- Informations générales (commune, référence cadastrale, lieu-dit)
- Liste des subdivisions cadastrales
- Calcul automatique des surfaces totales
- Affichage du revenu cadastral

### 2.5 Grille de Calculs (TmListCalculs)

**Fichier**: `UCalculs.pas`

Composant **TtsGrid** (grille personnalisée) affichant toutes les colonnes cadastre/fermage.

```pascal
TmColonne = (
  mColNone, mColLig, mColNumCom, mColNomCom, mColParcelle,
  mColComment, mColGfa, mColLieuDit, mColDivision, mColSubdivision,
  mColTypeCad, mColClassCad, mColHectare, mColRevenu, mColExploitant,
  mColSctl, mColSurface,
  mColDebBailGfa, mColFinBailGfa, mColNumAveGfa, mColDateAveGfa,
  mColValPointGfa, mColSuppDureeGfa,
  mColDebBailSctl, mColFinBailSctl, mColNumAveSctl, mColDateAveSctl,
  mColValPointSctl, mColSuppDureeSctl,
  mColIdSubdivision, mColIdParcelle, mColIdTypeCad, mColIdClassCad,
  mColIdCommune, mColIdGfa, mColIdLieuDit, mColIdExploitant, mColAdresse
);
```

### 2.6 Impressions (TmNewPrintParExp)

**Fichier**: `UNewPrintParExp.pas`

#### Types de rapports

| Type | Description |
|------|-------------|
| **Par exploitant** | Toutes les parcelles d'un exploitant |
| **Par commune** | Toutes les parcelles d'une commune |
| **Récapitulatif** | Synthèse des fermages |

#### Filtres disponibles

- Structure : GFA / SCTL / Toutes
- Statut agricole : Agriculteur / Non-agriculteur / Tous
- Commune : Sélection spécifique ou toutes

---

## 3. Calcul du Montant de Fermage

### 3.1 Formule Principale

Le calcul du fermage est basé sur un **système de points** :

```pascal
// UBib.pas - Fonction de calcul du fermage
function Bib_CalculerMontantFermage(
  APointFermage: Double;      // Nombre de points fermage
  ASurface: Double;           // Surface en m²
  ADuree: Double;             // Durée (non utilisé dans calcul)
  ASctl: Boolean;             // true = SCTL, false = GFA
  AValeurPointGFA: Double;    // Valeur du point GFA
  AValeurPointSCTL: Double;   // Valeur du point SCTL
  ASuppGFA: Boolean;          // Supplément durée GFA actif
  ASuppSCTL: Boolean          // Supplément durée SCTL actif
): Double;
begin
  // Base : (points × surface) / 10000 (conversion m² → hectares)
  Result := (APointFermage * ASurface) / 10000;

  if ASctl then
  begin
    // Fermage SCTL
    Result := Result * AValeurPointSCTL;
    if ASuppSCTL then
      Result := Result + ((Result * G_ValeurSuppSCTL) / 100);
  end
  else
  begin
    // Fermage GFA
    Result := Result * AValeurPointGFA;
    if ASuppGFA then
      Result := Result + ((Result * G_ValeurSuppGFA) / 100);
  end;
end;
```

### 3.2 Logique de Calcul

```
FORMULE DE BASE:
  Montant = (Points × Surface_m²) / 10000 × Valeur_Point

SI supplément durée actif:
  Montant = Montant + (Montant × Pourcentage_Supplément / 100)
```

### 3.3 Variables Globales

| Variable | Description |
|----------|-------------|
| `G_ValeurSuppGFA` | Pourcentage de supplément GFA |
| `G_ValeurSuppSCTL` | Pourcentage de supplément SCTL |

### 3.4 Exemple de Calcul

```
Données:
  - Points fermage: 150
  - Surface: 25000 m² (2.5 ha)
  - Valeur point SCTL: 2.50 €
  - Supplément SCTL actif: Oui (5%)

Calcul:
  Base = (150 × 25000) / 10000 = 375
  Montant = 375 × 2.50 = 937.50 €
  Supplément = 937.50 × 5 / 100 = 46.88 €
  Total = 937.50 + 46.88 = 984.38 €
```

---

## 4. Base de Données

### 4.1 Informations Générales

| Propriété | Valeur |
|-----------|--------|
| **Type** | Microsoft Access (.mdb) |
| **Fichier** | `Sctl-Gfa.mdb` |
| **Chemin** | `D3Dev/Ghis/Base/Sctl-Gfa.mdb` |
| **Connexion** | ODBC |

### 4.2 Liste Complète des Tables (19 tables)

| Table | Description | Champs principaux |
|-------|-------------|-------------------|
| **Parcelle** | Données cadastrales principales | IdParcelle, PARCELLE, SURFACE, REVENU, SCTL, IdGfa, IdCommune, IdLieuDit |
| **SubdivCadastre** | Subdivisions cadastrales | IdSubdivCadastre, DIVISION, SUBDIVISION, SURFACE, REVENU, IdParcelle, IdTypeCadastre, IdClasseCadastre, IdExploitant |
| **Subdivision** | Subdivisions fermage | IdSubdivision, DIVISION, SUBDIVISION, SURFACE, PointFermage, DureeFermage, IdParcelle, IdExploitant |
| **Exploita** | Exploitants agricoles | IdExploitant, NOM, PRENOM, ADRESSE, CP, VILLE, TEL, EMAIL, AGRICULTEUR, DebBailGfa, FinBailGfa, DebBailSctl, FinBailSctl, etc. |
| **Commune** | Référentiel communes | IdCommune, NUMERO, COMMUNE |
| **LieuDit** | Lieux-dits par commune | IdLieuDit, LIEUDIT, IdCommune |
| **NumGfa** | Structures GFA | IdGfa, NUMGFA, LIBELLE |
| **TypeCadastre** | Types cadastraux | IdTypeCadastre, CODE, LIBELLE |
| **ClassCadastre** | Classes cadastrales | IdClasseCadastre, CODE, LIBELLE |
| **Fermage** | Types de fermage | IdFermage, LIBELLE |
| **ValeurPointGFA** | Valeurs points GFA/année | IdValeurPointGFA, ANNEE, VALEUR |
| **ValeurPointSCTL** | Valeurs points SCTL/année | IdValeurPointSCTL, ANNEE, VALEUR |
| **CadValeur** | Valeurs cadastrales | IdCadValeur, IdCommune, IdTypeCadastre, IdClasseCadastre, VALEUR |
| **Config** | Configuration système | Clé/Valeur |
| **Options** | Options utilisateur | Diverses options |
| **Coef** | Coefficients de calcul | Coefficients divers |
| **ForPrintSctl** | Table temporaire impression | Données d'impression |
| **Recad** | Recadastrage | Historique recadastrage |
| **PSG** | Plan Simple de Gestion | IdPSG, LIBELLE |
| **ParcelleSup** | Données supplémentaires | Champs additionnels parcelles |

### 4.3 Schéma Relationnel Complet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MODÈLE DE DONNÉES SCTL-GFA                           │
└─────────────────────────────────────────────────────────────────────────────┘

  COMMUNE                         PARCELLE
  ─────────                       ──────────
  IdCommune (PK)         ┌───────►IdParcelle (PK)
  NUMERO                 │        PARCELLE (varchar)
  COMMUNE (varchar)      │        SURFACE (double)
         │               │        REVENU (double)
         │               │        SCTL (boolean)
         ▼               │        IdGfa (FK)─────────────────► NumGfa
  ┌──────────────┐       │        IdCommune (FK)◄──────────┐    ─────────
  │   LIEU-DIT   │       │        IdLieuDit (FK)◄────────┐ │    IdGfa (PK)
  │ ──────────── │       │                               │ │    NUMGFA
  │ IdLieuDit(PK)│       │                               │ │    LIBELLE
  │ LIEUDIT      │───────┼───────────────────────────────┘ │
  │ IdCommune(FK)│◄──────┼─────────────────────────────────┘
  └──────────────┘       │
                         │
                         │
  ┌──────────────────────┴────────────────────────────────────┐
  │                                                           │
  ▼                                                           ▼
  SubdivCadastre                                        Subdivision
  ──────────────                                        ────────────
  IdSubdivCadastre (PK)                                 IdSubdivision (PK)
  DIVISION                                              DIVISION
  SUBDIVISION                                           SUBDIVISION
  SURFACE                                               SURFACE
  REVENU                                                PointFermage
  IdParcelle (FK)◄────────────────────────────────────► IdParcelle (FK)
  IdTypeCadastre (FK)────► TypeCadastre                 DureeFermage
  IdClasseCadastre (FK)──► ClassCadastre                IdExploitant (FK)──┐
  IdExploitant (FK)───────────────────────────────────────────────────────┤
                                                                          │
                                                                          ▼
  ValeurPointGFA              ValeurPointSCTL                        Exploita
  ──────────────              ───────────────                        ─────────
  IdValeurPointGFA (PK)       IdValeurPointSCTL (PK)                 IdExploitant (PK)
  ANNEE                       ANNEE                                  NOM, PRENOM
  VALEUR                      VALEUR                                 ADRESSE, CP, VILLE
                                                                     TEL, EMAIL
                                                                     AGRICULTEUR (bool)
                                                                     DebBailGfa, FinBailGfa
                                                                     DebBailSctl, FinBailSctl
                                                                     NumAveGfa, DateAveGfa
                                                                     NumAveSctl, DateAveSctl
                                                                     ValPointGfa, ValPointSctl
                                                                     SuppGfa, SuppSctl
```

### 4.4 Outils pour Lire les Fichiers .mdb sur macOS

```bash
# Installation
brew install mdbtools

# Lister les tables
mdb-tables D3Dev/Ghis/Base/Sctl-Gfa.mdb

# Exporter une table en CSV
mdb-export D3Dev/Ghis/Base/Sctl-Gfa.mdb Parcelle > parcelle.csv

# Voir le schéma complet
mdb-schema D3Dev/Ghis/Base/Sctl-Gfa.mdb

# Exporter toutes les tables
for table in $(mdb-tables -1 D3Dev/Ghis/Base/Sctl-Gfa.mdb); do
  mdb-export D3Dev/Ghis/Base/Sctl-Gfa.mdb "$table" > "${table}.csv"
done
```

---

## 5. Couche d'Accès aux Données

### 5.1 Classe TmSqlAccess

**Fichier**: `USqlAccess.pas`

Classe centralisée pour toutes les opérations base de données.

#### Méthodes principales par entité

| Entité | Méthodes |
|--------|----------|
| **Parcelle** | `Sql_InsertParcelle`, `Sql_UpdateParcelle`, `Sql_DeleteParcelle`, `Sql_GetParcelles`, `Sql_GetParcelleById` |
| **SubdivCadastre** | `Sql_InsertSubdivCadastre`, `Sql_UpdateSubdivCadastre`, `Sql_DeleteSubdivCadastre`, `Sql_GetSubdivCadastres` |
| **Subdivision** | `Sql_InsertSubdivision`, `Sql_UpdateSubdivision`, `Sql_DeleteSubdivision`, `Sql_GetSubdivisions` |
| **Exploitant** | `Sql_InsertExploitant`, `Sql_UpdateExploitant`, `Sql_DeleteExploitant`, `Sql_GetExploitants`, `Sql_GetExploitantById` |
| **Commune** | `Sql_InsertCommune`, `Sql_UpdateCommune`, `Sql_DeleteCommune`, `Sql_GetCommunes` |
| **LieuDit** | `Sql_InsertLieuDit`, `Sql_UpdateLieuDit`, `Sql_DeleteLieuDit`, `Sql_GetLieuDits` |
| **TypeCadastre** | `Sql_InsertTypeCadastre`, `Sql_UpdateTypeCadastre`, `Sql_DeleteTypeCadastre`, `Sql_GetTypeCadastres` |
| **ClasseCadastre** | `Sql_InsertClasseCadastre`, `Sql_UpdateClasseCadastre`, `Sql_DeleteClasseCadastre`, `Sql_GetClasseCadastres` |
| **ValeurPoints** | `Sql_InsertValeurPointGFA`, `Sql_UpdateValeurPointGFA`, `Sql_GetValeurPointsGFA`, `Sql_InsertValeurPointSCTL`, `Sql_UpdateValeurPointSCTL`, `Sql_GetValeurPointsSCTL` |
| **NumGfa** | `Sql_InsertNumGfa`, `Sql_UpdateNumGfa`, `Sql_DeleteNumGfa`, `Sql_GetNumGfas` |

### 5.2 Fonctions Utilitaires (UBib.pas)

| Fonction | Description |
|----------|-------------|
| `Bib_CalculerMontantFermage` | Calcul du montant de fermage |
| `Bib_SurfaceEnHectare` | Conversion m² → hectares |
| `Bib_HectareEnSurface` | Conversion hectares → m² |
| `Bib_LoadComboCommune` | Charger ComboBox communes |
| `Bib_LoadComboLieuDit` | Charger ComboBox lieux-dits |
| `Bib_LoadComboExploitant` | Charger ComboBox exploitants |
| `Bib_LoadComboTypeCadastre` | Charger ComboBox types cadastre |
| `Bib_LoadComboClasseCadastre` | Charger ComboBox classes cadastre |
| `Bib_LoadComboTypeFermage` | Charger ComboBox types fermage |
| `Bib_LoadComboNumGfa` | Charger ComboBox structures GFA |

---

## 6. Fonctionnalités Métier

### 6.1 Gestion du Cadastre

| Fonctionnalité | Description |
|----------------|-------------|
| **Création parcelle** | Nouvelle parcelle avec commune, référence, lieu-dit |
| **Subdivisions cadastre** | Division d'une parcelle avec type/classe cadastre |
| **Affectation exploitant** | Attribution d'une subdivision à un exploitant |
| **Calcul surfaces** | Somme automatique des surfaces subdivisions |
| **Recadastrage** | Historique des modifications cadastrales |

### 6.2 Gestion des Fermages

| Fonctionnalité | Description |
|----------------|-------------|
| **Points fermage** | Attribution de points par subdivision |
| **Calcul montant** | Formule : (points × surface / 10000) × valeur_point |
| **Supplément durée** | Majoration pourcentage pour baux longs |
| **Distinction GFA/SCTL** | Valeurs points et suppléments séparés |
| **Historique annuel** | Valeurs points par année |

### 6.3 Gestion des Exploitants

| Fonctionnalité | Description |
|----------------|-------------|
| **Fiche exploitant** | Coordonnées complètes |
| **Statut agriculteur** | Distinction agriculteur/non-agriculteur |
| **Baux GFA et SCTL** | Dates, avenants, valeurs séparées |
| **Liste parcelles** | Visualisation cadastre et fermage |

### 6.4 Rapports et Exports

| Type | Description |
|------|-------------|
| **Par exploitant** | Détail fermage pour un exploitant |
| **Par commune** | Toutes parcelles d'une commune |
| **Récapitulatif** | Synthèse globale des fermages |
| **Export Excel** | Export données vers Excel |
| **Impression** | Génération rapports papier |

---

## 7. Points d'Attention pour Migration

### 7.1 Spécificités du Domaine

| Aspect | Détail |
|--------|--------|
| **Indépendance** | Base de données séparée du logiciel Parts |
| **Valeurs annuelles** | Points fermage changent chaque année |
| **Double gestion** | GFA et SCTL avec baux distincts |
| **Surface en m²** | Calculs en m², affichage en hectares |
| **Deux types subdivisions** | Cadastre (SubdivCadastre) et Fermage (Subdivision) |

### 7.2 Logique Métier à Préserver

1. **Calcul de fermage** : `(points × surface / 10000) × valeur_point`
2. **Suppléments** : Application conditionnelle des suppléments durée
3. **Distinction GFA/SCTL** : Baux et valeurs de points séparés
4. **Hiérarchie géographique** : Commune → Lieu-dit → Parcelle → Subdivision

### 7.3 Contraintes d'Intégrité

- Une parcelle appartient à une seule commune
- Un lieu-dit est lié à une commune
- Une subdivision est liée à une parcelle
- Un exploitant peut exploiter plusieurs subdivisions
- Les valeurs de points sont uniques par année

### 7.4 Tables à Migrer

| Priorité | Tables | Raison |
|----------|--------|--------|
| **Haute** | Commune, NumGfa, Exploita | Données de référence principales |
| **Haute** | Parcelle, SubdivCadastre, Subdivision | Données métier core |
| **Moyenne** | TypeCadastre, ClassCadastre, LieuDit | Référentiels secondaires |
| **Moyenne** | ValeurPointGFA, ValeurPointSCTL | Historique des valeurs |
| **Basse** | Config, Options, Coef | Configuration système |
| **À évaluer** | ForPrintSctl, Recad, PSG | Tables spécifiques |

### 7.5 Lien avec le Logiciel Parts

Les deux logiciels partagent le concept de **Structure** (GFA, SCTL) :

| Logiciel Parts | Logiciel Terre |
|----------------|----------------|
| Actionnaires | Exploitants |
| Parts sociales | Parcelles cadastrales |
| Mouvements | Baux et fermages |
| Capital social | Patrimoine foncier |

**Point d'articulation** : La structure (GFA, SCTL) est l'entité commune qui relie les deux domaines.

---

## 8. Annexes

### 8.1 Structure des Colonnes de Grille

#### Colonnes d'Identification

| Colonne | Type | Description |
|---------|------|-------------|
| `mColIdSubdivision` | int | ID subdivision |
| `mColIdParcelle` | int | ID parcelle |
| `mColIdTypeCad` | int | ID type cadastral |
| `mColIdClassCad` | int | ID classe cadastrale |
| `mColIdCommune` | int | ID commune |
| `mColIdGfa` | int | ID structure (GFA/SCTL) |
| `mColIdLieuDit` | int | ID lieu-dit |
| `mColIdExploitant` | int | ID exploitant |

#### Colonnes d'Affichage

| Colonne | Type | Description |
|---------|------|-------------|
| `mColNumCom` | string | Numéro commune |
| `mColNomCom` | string | Nom commune |
| `mColParcelle` | string | Référence cadastrale |
| `mColLieuDit` | string | Nom du lieu-dit |
| `mColTypeCad` | string | Type cadastral |
| `mColClassCad` | string | Classe cadastrale |
| `mColExploitant` | string | Nom exploitant |

#### Colonnes de Données

| Colonne | Type | Description |
|---------|------|-------------|
| `mColHectare` | decimal | Surface en hectares |
| `mColSurface` | decimal | Surface en m² |
| `mColRevenu` | decimal | Revenu cadastral |
| `mColSctl` | boolean | Appartient à SCTL |

#### Colonnes de Bail

| Colonne GFA | Colonne SCTL | Description |
|-------------|--------------|-------------|
| `mColDebBailGfa` | `mColDebBailSctl` | Début bail |
| `mColFinBailGfa` | `mColFinBailSctl` | Fin bail |
| `mColNumAveGfa` | `mColNumAveSctl` | Numéro avenant |
| `mColDateAveGfa` | `mColDateAveSctl` | Date avenant |
| `mColValPointGfa` | `mColValPointSctl` | Valeur point |
| `mColSuppDureeGfa` | `mColSuppDureeSctl` | Supplément durée |

### 8.2 Fichiers Sources Principaux

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `Uprincipale.pas` | ~1800 | Fenêtre principale et menu |
| `USqlAccess.pas` | ~2500 | Couche accès données (60+ méthodes) |
| `UCalculs.pas` | ~1200 | Grille et calculs |
| `UBib.pas` | ~800 | Fonctions utilitaires |
| `UExploitUnit.pas` | ~600 | Fiche exploitant |
| `UParcelleUnit.pas` | ~500 | Fiche parcelle |
| `UNewPrintParExp.pas` | ~700 | Impressions |
