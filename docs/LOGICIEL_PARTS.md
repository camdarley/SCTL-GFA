# Logiciel Parts - Analyse du Code Original

> Application C++ Builder de gestion des actionnaires et des parts sociales (Sctl/)

---

## 1. Concepts Fondamentaux

### 1.1 Le Modèle Métier

Le système gère des **parts sociales** détenues par des **sociétaires (actionnaires)** dans plusieurs **structures juridiques**. Voici le schéma conceptuel :

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    PERSONNE     │       │   MOUVEMENT     │       │      ACTE       │
│  (Actionnaire)  │◄──────│  (Transaction)  │──────►│  (Juridique)    │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  NUMERO_PART    │◄──────│   (Lien via     │       │   STRUCTURE     │
│  (Part unique)  │       │    IdMouvement) │       │  (GFA/TSL/Assoc)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### 1.2 Constantes Fondamentales

```cpp
// Main.h - Types de structures juridiques
#define TYPE_GFA      2    // Groupement Foncier Agricole
#define TYPE_ASSOC    5    // Association
#define TYPE_TSL      6    // Terres Solidaires du Larzac
#define ALL_TYPES     0    // Tous les types (filtre désactivé)
```

---

## 2. Structures de Données

### 2.1 Actionnaire (Table Personnes)

| Champ | Type | Description |
|-------|------|-------------|
| `IdPersonne` | int | Identifiant unique (PK) |
| `Civilite` | String | M., Mme, etc. |
| `Nom` | String | Nom de famille |
| `Prenom` | String | Prénom |
| `Adresse` | String | Adresse ligne 1 |
| `Adresse2` | String | Adresse ligne 2 |
| `CodePostal` | String | Code postal |
| `Ville` | String | Ville |
| `Tel` | String | Téléphone fixe |
| `Port` | String | Téléphone portable |
| `Fax` | String | Numéro de fax |
| `Mail` | String | Adresse email |
| `Comment` | String | Commentaires libres |
| `Divers` | String | Informations diverses |
| `Couleur` | int | Couleur d'affichage (pour personnes morales) |

**Attributs booléens d'état :**

| Attribut | Signification |
|----------|---------------|
| `Npai` | N'habite Pas à l'Adresse Indiquée |
| `Decede` | Personne décédée |
| `CR` | Courrier Retourné |
| `PasConvocAG` | Ne pas convoquer aux AG |
| `PasConvoqTSL` | Ne pas convoquer TSL |
| `Termine` | Dossier terminé (soldé) |
| `Fondateur` | Membre fondateur |
| `DeDroit` | Membre de droit |
| `Adherent` | Adhérent |
| `MisDoffice` | Mis d'office |
| `EstPersonneMorale` | Personne morale (vs physique) |
| `DcdNotarie` | Décès notarié |
| `Apport` | A fait un apport |
| `CNI` | Carte d'identité fournie |

---

### 2.2 Numéro de Part (Table NumeroParts / NewNumeroParts)

Chaque part sociale est **individuellement numérotée et tracée**. C'est l'entité centrale du système.

| Champ | Type | Description |
|-------|------|-------------|
| `IdNumPart` | int | Identifiant unique de l'enregistrement |
| `NumPart` | int | **Le numéro de la part** (ex: part n°1, n°2, n°3...) |
| `IdPersonne` | int | Le propriétaire actuel |
| `IdMouvement` | int | Le mouvement qui a créé/transféré cette part |
| `Termine` | bool | Part terminée/soldée |
| `Distribue` | bool | Part distribuée |
| `Etat` | int | Code d'état de la part |
| `IdGfa` | int | Structure GFA (IDs 11-14 uniquement) |
| `IdTSLouAssoc` | int | Structure TSL ou Association (autres IDs) |

#### IMPORTANT - Distinction IdGfa vs IdTSLouAssoc

La table `NumeroParts` utilise **deux champs distincts** pour le lien avec les structures juridiques. C'est le point le plus complexe du modèle :

```cpp
// DataBase.cpp lignes 1180-1197 - Logique de sauvegarde des numéros de parts

// si IdGfa n'est pas compris entre 11 et 14 (Id des gfa)
// il s'agit de l'identifiant d'une nouvelle structure
if(( AIdGfa >= 11 ) && ( AIdGfa <= 14 ))
{
    hIdGfa = AIdGfa;        // Stocker dans IdGfa
    hIdTSLouAssoc = 0;      // Laisser IdTSLouAssoc vide
}
else
{
    hIdGfa = 0;             // Laisser IdGfa vide
    hIdTSLouAssoc = AIdGfa; // Stocker dans IdTSLouAssoc
}

StrSql = "INSERT INTO NumeroParts ( IdMouvement, "+hNomChamp+", IdPersonne, DateMvt, Termine, IdGfa, IdTSLouAssoc )";
```

**Résumé de la logique :**

| Champ | IDs valides | Type de structure | Usage |
|-------|-------------|-------------------|-------|
| `IdGfa` | 11, 12, 13, 14 | Les 4 GFA historiques originaux | Utilisé UNIQUEMENT pour ces IDs |
| `IdTSLouAssoc` | Tous les autres | TSL, Associations, nouveaux GFA | Utilisé pour TOUTES les autres structures |

**Implications pour la migration** : Lors de la migration vers PostgreSQL, utiliser `IdTSLouAssoc` comme source principale pour le lien avec les structures, avec `IdGfa` en fallback pour les rares cas où les IDs 11-14 sont utilisés.

---

### 2.3 Mouvement (Table Mouvements / NewMouvements)

Un mouvement représente une **transaction** sur des parts. C'est l'historique des opérations.

| Champ | Type | Description |
|-------|------|-------------|
| `IdMouvement` | int | Identifiant unique (PK) |
| `IdPersonne` | int | L'actionnaire concerné (FK) |
| `IdActe` | int | L'acte juridique qui justifie le mouvement (FK) |
| `IdGfa` | int | Structure concernée (utilise la même logique que NumeroParts) |
| `NbParts` | int | Nombre de parts concernées |
| `Mouvement` | bool | **Le sens : true = Acquisition (+), false = Cession (-)** |
| `IdTypeApport` | int | Type d'apport (numéraire, nature, etc.) |
| `IdTypeRembourse` | int | Type de remboursement |
| `DateMvt` | DateTime | Date de l'opération |

#### Le concept du "Sens" (Mouvement)

C'est fondamental pour comprendre les mouvements :

| Valeur | Sens | Signification | Icône UI |
|--------|------|---------------|----------|
| `true` | **+** | La personne REÇOIT des parts (acquisition) | `ImgPlus` |
| `false` | **-** | La personne CÈDE des parts (cession) | `ImgMoins` |

#### ATTENTION - Champ DateMvt vide dans les données originales

L'analyse de la base Access originale (`TSL.mdb`) révèle que le champ `DateMvt` (date de l'opération) est **systématiquement vide** pour tous les mouvements. Cette donnée n'a jamais été saisie dans l'application originale.

```csv
# Extrait de l'export Access - Toutes les dates sont vides
IdMouvement,IdPersonne,IdActe,IdGfa,NbParts,Mouvement,IdTypeApport,DateMvt,IdTypeRembourse
851,512,20,12,1,1,0,,0
852,513,20,12,1,1,0,,0
```

**Implications pour l'interface** : Pour afficher une date dans l'historique des mouvements, il faut utiliser la `date_acte` de l'acte associé comme fallback lorsque `date_operation` est null.

---

### 2.4 Acte (Table Actes / NewActes)

Un acte est le **document juridique** qui autorise un ou plusieurs mouvements.

| Champ | Type | Description |
|-------|------|-------------|
| `IdActe` | int | Identifiant unique (PK) |
| `Code` | String | Code court (ex: "AGE2024", "CES22") |
| `Date` | DateTime | Date de l'acte |
| `Commentaire` | String | Description/libellé |
| `IdGfa` | int | Structure juridique concernée |
| `Mouvement` | bool | Sens par défaut des mouvements de cet acte |
| `Definitif` | bool | Acte définitif (vs provisoire) |

---

### 2.5 Structure Juridique (Table Libelle)

Les structures sont stockées dans la table `Libelle` avec un type.

| Champ | Type | Description |
|-------|------|-------------|
| `IdLibelle` | int | Identifiant unique (PK) |
| `Libelle` | String | Nom (ex: "GFA du Larzac", "TSL") |
| `Type` | int | TYPE_GFA (2), TYPE_ASSOC (5), TYPE_TSL (6) |

**Structures identifiées dans le code :**

| ID | Type | Structure |
|----|------|-----------|
| 11-14 | GFA | Les 4 GFA historiques originaux |
| 39-42 | Association | Associations |
| 43-46 | TSL | Terres Solidaires du Larzac |
| 47+ | Divers | Autres structures ajoutées ultérieurement |

---

### 2.6 Personnes Morales et Membres

Une personne peut être une **personne morale** (flag `EstPersonneMorale`). Dans ce cas, elle peut avoir des **membres** (autres personnes physiques).

La relation est gérée via une table de liaison implicite ou des requêtes spécifiques :

```cpp
// DataBase.h - Fonctions de gestion des membres
TmStream *SqlListeMembresDePersonneMorale(int *pNb, int AIdPersMorale, ...);
bool SqlAjouterMembreAPersonneMorale(int AIdPersMorale, int AIdMembre);
bool SqlSupprimerMembreDePersonneMorale(int AIdPersMorale, int AIdMembre);
```

Un actionnaire peut détenir des parts :
- **En nom propre** : `IdPersonne` directement dans NumeroParts
- **Via une personne morale** : Champ `IdGfa` de NewNumeroParts réutilisé pour stocker l'ancien membre lors d'un basculement

---

## 3. Flux de Cession de Parts

### 3.1 Processus Complet

Voici comment fonctionne un transfert de parts entre deux personnes :

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CESSION DE PARTS : A → B                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ÉTAPE 1: Création de l'acte juridique                               │
│  ─────────────────────────────────────                               │
│  → Nouvel acte avec code et date                                     │
│                                                                      │
│  ÉTAPE 2: Mouvement côté CÉDANT (A) - Sens MOINS                     │
│  ───────────────────────────────────────────────                     │
│  → Création mouvement: IdPersonne=A, Mouvement=false, NbParts=N      │
│  → Fonction: SqlCreerLesNumPartsCedeesSensMoins()                    │
│  → Les parts sont marquées comme "terminées" pour A                  │
│                                                                      │
│  ÉTAPE 3: Mouvement côté CESSIONNAIRE (B) - Sens PLUS                │
│  ─────────────────────────────────────────────────────               │
│  → Création mouvement: IdPersonne=B, Mouvement=true, NbParts=N       │
│  → Fonction: SqlCreerLesNumPartsCedeesSensPlus()                     │
│  → Nouvelles lignes NumeroParts créées pour B                        │
│                                                                      │
│  RÉSULTAT: Les mêmes numéros de parts changent de propriétaire       │
│  → A perd les parts (mouvement -)                                    │
│  → B gagne les parts (mouvement +)                                   │
│  → Traçabilité complète via IdMouvement                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Fonctions SQL Impliquées

```cpp
// DataBase.h - Fonctions de cession
bool SqlCreerLesNumPartsCedeesSensMoins(TList *pListParts, int AIdPersonne, int AIdNewMvt, int AIdStruct);
bool SqlCreerLesNumPartsCedeesSensPlus(TList *pListParts, int AIdPersonne, int AIdNewMvt, int AIdStruct);
bool SqlMarquerLesPartsCedees(TList *pListParts);
bool SqlMarquerLesNewPartsCedees(TList *pListParts);
```

### 3.3 Exemple Concret

**Scénario** : Jean DUPONT (IdPersonne=1) cède 3 parts (n°15, 16, 17) à Marie MARTIN (IdPersonne=2)

```
AVANT:
  NumeroParts:
    - IdNumPart=100, NumPart=15, IdPersonne=1, IdMouvement=50
    - IdNumPart=101, NumPart=16, IdPersonne=1, IdMouvement=50
    - IdNumPart=102, NumPart=17, IdPersonne=1, IdMouvement=50

APRÈS LA CESSION:
  Actes:
    - IdActe=80, Code="CES2024", Date=2024-01-15

  Mouvements:
    - IdMouvement=200, IdPersonne=1, IdActe=80, NbParts=3, Mouvement=FALSE (cession)
    - IdMouvement=201, IdPersonne=2, IdActe=80, NbParts=3, Mouvement=TRUE (acquisition)

  NumeroParts (nouvelles lignes pour MARTIN):
    - IdNumPart=200, NumPart=15, IdPersonne=2, IdMouvement=201
    - IdNumPart=201, NumPart=16, IdPersonne=2, IdMouvement=201
    - IdNumPart=202, NumPart=17, IdPersonne=2, IdMouvement=201

  NumeroParts (anciennes lignes DUPONT marquées terminées):
    - IdNumPart=100, NumPart=15, IdPersonne=1, IdMouvement=200, Termine=TRUE
    - IdNumPart=101, NumPart=16, IdPersonne=1, IdMouvement=200, Termine=TRUE
    - IdNumPart=102, NumPart=17, IdPersonne=1, IdMouvement=200, Termine=TRUE
```

**Point important** : Dans l'ancien système, une cession **duplique les lignes NumeroParts** - les anciennes sont marquées `Termine=TRUE`, les nouvelles sont créées pour le cessionnaire.

---

## 4. Calcul des Totaux de Parts

### 4.1 Logique de Comptage

Le calcul du nombre de parts d'un actionnaire doit :
1. **Compter uniquement les parts actives** : `Termine = FALSE`
2. **Distinguer les parts en nom propre** vs **via personne morale**
3. **Grouper par structure** si nécessaire

```cpp
// DataBase.h - Fonctions de comptage
int SqlNbPartsDeActionnaire(int AIdPersonne);
bool SqlNbNewPartsDeActionnaire(bool EstPersonneMorale, int AIdPersonne,
                                int *pTotalNpropre, int *pTotalPersMorale,
                                int *pTotalAVenir, int *pTotalAVenirPM);
```

### 4.2 Requête Type pour Comptage

```sql
-- Compter les parts actives d'un actionnaire
SELECT COUNT(*)
FROM NumeroParts
WHERE IdPersonne = :AIdPersonne
  AND Termine = FALSE    -- IMPORTANT: exclure les parts terminées
  AND Distribue = TRUE;  -- Optionnel: selon le contexte
```

### 4.3 Affichage dans l'Interface

L'interface affiche plusieurs totaux :
- `edNewNbParts` : Parts en nom propre
- `edNewNbPartsPersMorale` : Parts via personne morale
- `edNewNbPartsAVenir` : Parts à venir (non encore distribuées)
- `edNewTotalParts` : Total général

---

## 5. Interfaces Utilisateur

### 5.1 Fenêtre Principale (Main.h - TmMdiMain)

Application MDI (Multiple Document Interface) avec menu hiérarchique :

```
┌─────────────────────────────────────────────────────────────┐
│ SCTL - Gestion des Actionnaires                    [_][□][X]│
├─────────────────────────────────────────────────────────────┤
│ Fichier │ Actionnaires │ Mouvements │ Actes │ Outils │ ?    │
├─────────────────────────────────────────────────────────────┤
│ [Toolbar]                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────────┐  ┌──────────────────┐                │
│   │ Fiche Actionnaire│  │ Parts Restantes  │                │
│   │                  │  │                  │                │
│   └──────────────────┘  └──────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Fiche Actionnaire (Action.h - TmAction)

Formulaire principal avec onglets :

```
┌─────────────────────────────────────────────────────────────┐
│ Fiche Actionnaire                                  [_][□][X]│
├─────────────────────────────────────────────────────────────┤
│ [Sauver] [Supprimer] [Rafraîchir] [Fusion] [...]            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┬────────────┬─────────────┬──────────────────┐   │
│ │ Général │ Liste Parts│ Membres PM  │ Total Parts      │   │
│ └─────────┴────────────┴─────────────┴──────────────────┘   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Civilité: [___] Nom: [___________] Prénom: [_________]  │ │
│ │ Adresse:  [_________________________________________]   │ │
│ │ CP: [_____] Ville: [________________________________]   │ │
│ │ Tél: [__________] Port: [__________] Fax: [________]    │ │
│ │ Email: [__________________________________________]     │ │
│ │                                                         │ │
│ │ ☐ NPAI  ☐ Décédé  ☐ CR  ☐ Pas Convoc AG                 │ │
│ │ ☐ Fondateur  ☐ De droit  ☐ Adhérent  ☐ Mis d'office     │ │
│ │ ☐ Personne Morale                                       │ │
│ │                                                         │ │
│ │ Parts nom propre: [___]  Via PM: [___]  Total: [___]    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Onglets :**

| Onglet | Contenu | Composant |
|--------|---------|-----------|
| `tsGeneral` | Informations personnelles | Champs de saisie |
| `tsListeParts` | Liste des parts en nom propre | `sgListeParts` (TStringGrid) |
| `tsListeMembres` | Membres (si personne morale) | `sgMembres` (TStringGrid) |
| `tsListeTotalParts` | Synthèse par structure | `sgListeTotalParts` |
| `tsListePartsPersMorale` | Parts via personnes morales | `sgListePartsPM` |

### 5.3 Cession de Parts (MvtCession.h - TmMvtCession)

Interface de transfert de parts entre actionnaires :

```
┌─────────────────────────────────────────────────────────────┐
│ Cession de Parts                                   [_][□][X]│
├─────────────────────────────────────────────────────────────┤
│ ┌─── Source (Cédant) ──────────────────────────────────────┐│
│ │ Nom: DUPONT Jean           GFA: GFA du Larzac            ││
│ │ Adresse: 12 rue du Larzac  Date Acte: [01/01/2024]       ││
│ │ Code Acte: [AGE2024]       Type Remboursement: [___▼]    ││
│ │ [─] Sens: Cession                                        ││
│ └──────────────────────────────────────────────────────────┘│
│                        ═══════▶                             │
│ ┌─── Destination (Cessionnaire) ───────────────────────────┐│
│ │ Nom: [______________]      GFA: [________________]       ││
│ │ Date Acte: [__________]    Type Apport: [________▼]      ││
│ │ [+] Sens: Acquisition                                    ││
│ │ Via Personne Morale: [___________________▼]              ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌─── Parts à céder ────────────────────────────────────────┐│
│ │ │ N° │ Structure │ État │ Sélection │                    ││
│ │ │ 15 │ GFA 1     │ Actif│    ☑      │                    ││
│ │ │ 16 │ GFA 1     │ Actif│    ☑      │                    ││
│ │ │ 17 │ GFA 1     │ Actif│    ☐      │                    ││
│ └──────────────────────────────────────────────────────────┘│
│                    [Valider] [Annuler]                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Historique (Histo.h - TmHisto)

Consultation de l'historique des mouvements d'une part :

```
┌─────────────────────────────────────────────────────────────┐
│ Historique des Parts                               [_][□][X]│
├─────────────────────────────────────────────────────────────┤
│ Actionnaire: DUPONT Jean     Structure: GFA du Larzac       │
│ Nb Parts: 5                  Code Acte: AGE2020             │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Numéros de Parts ─┐  ┌─ Historique ─────────────────────┐│
│ │ Part n°15          │  │ Date     │ Acte  │ Sens │ Nom    ││
│ │ Part n°16          │  ├──────────┼───────┼──────┼────────┤│
│ │ Part n°18          │  │ 01/01/20 │ AGE20 │ [+]  │ DUPONT ││
│ │ Part n°22          │  │ 15/06/22 │ CES22 │ [−]  │ MARTIN ││
│ │ Part n°23          │  │ ...      │ ...   │ ...  │ ...    ││
│ └────────────────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Colonnes de l'historique :**

```cpp
// Histo.h - Colonnes ID (données internes)
enum NumColId { ID_HISTO, ID_NUMPART, TERMINE, ID_ACTION, ID_MVT, VAL_ETAT, VAL_DISTRIB };

// Colonnes affichées
enum NumColStr { DATE_OPER, DATE_ACTE, CODE_ACTE, SENS, NOM, PRENOM, ETAT, DISTRIBUE };
```

### 5.5 Recherche Multicritères (MultiCrit.h - TmMultiCrit)

Interface de recherche avancée avec plusieurs onglets pour :
- Recherche par critères (nom, adresse, statuts...)
- Résultats de recherche
- Vérification de chronologie
- Détection d'anomalies (parts orphelines, mouvements sans acte...)

---

## 6. Base de Données

### 6.1 Type et Format

Les données sont stockées dans une base **Microsoft Access** (fichier `.mdb`). L'accès se fait via le **BDE (Borland Database Engine)** avec le pilote DAO/ODBC pour Access.

### 6.2 Configuration de Connexion

```cpp
// Main.cpp - Initialisation de la connexion
mSqlAccess = new TmSqlAccess;
mSqlAccess->AliasDataBase = "TerresSolidairesLarzac";
mDB = mSqlAccess;
```

### 6.3 Localisation du Fichier

| Base | Chemin | Contenu |
|------|--------|---------|
| `TSL.mdb` | `Sctl/Bases/TSL.mdb` | Actionnaires, parts, mouvements, actes |

### 6.4 Tables Principales

| Table | Description |
|-------|-------------|
| `Personnes` | Actionnaires (physiques et moraux) |
| `NumeroParts` | Numéros de parts sociales (ancien système) |
| `NewNumeroParts` | Numéros de parts (nouveau système) |
| `Mouvements` | Historique des mouvements (ancien) |
| `NewMouvements` | Historique des mouvements (nouveau) |
| `Actes` | Actes juridiques (ancien) |
| `NewActes` | Actes juridiques (nouveau) |
| `Libelle` | Structures juridiques (GFA, TSL, Association) |
| `TypeApport` | Types d'apport |
| `TypeRemboursement` | Types de remboursement |
| `Couleurs` | Configuration des couleurs UI |
| `Config` | Paramètres de l'application |
| `TableLog` | Journal des opérations |

### 6.5 Outils pour Lire les Fichiers .mdb sur macOS

```bash
# Installation
brew install mdbtools

# Lister les tables
mdb-tables Sctl/Bases/TSL.mdb

# Exporter une table en CSV
mdb-export Sctl/Bases/TSL.mdb Personnes > personnes.csv

# Voir le schéma complet
mdb-schema Sctl/Bases/TSL.mdb
```

---

## 7. Schéma des Relations

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MODÈLE DE DONNÉES                           │
└─────────────────────────────────────────────────────────────────────┘

  PERSONNES                    MOUVEMENTS                    ACTES
  ──────────                   ──────────                    ─────
  IdPersonne (PK)              IdMouvement (PK)              IdActe (PK)
  Nom                          IdPersonne (FK) ◄─────────┐   Code
  Prenom                       IdActe (FK) ──────────────┼──►Date
  Adresse...                   NbParts                   │   Commentaire
  EstPersonneMorale            Mouvement (bool=sens)     │   IdGfa (FK)
  Npai, Decede, Termine...     IdTypeApport              │   Definitif
                               IdTypeRembourse           │
         │                     DateMvt                   │
         │                     IdGfa                     │
         │                            │                  │
         ▼                            ▼                  │
  ┌──────────────────────────────────────────────────────┘
  │
  │  NUMERO_PARTS
  │  ─────────────
  │  IdNumPart (PK)
  │  NumPart (le numéro de la part: 1, 2, 3...)
  └─►IdPersonne (FK) ──── Propriétaire actuel
     IdMouvement (FK) ─── Mouvement de création/transfert
     IdGfa ────────────── Structure (IDs 11-14 seulement)
     IdTSLouAssoc ─────── Structure (tous les autres IDs)
     Termine ──────────── Part soldée (TRUE = ne plus compter)
     Distribue
     Etat


  STRUCTURES (table Libelle)
  ──────────
  IdLibelle (PK)
  Libelle (nom: "GFA du Larzac", "TSL", etc.)
  Type (2=GFA, 5=Assoc, 6=TSL)
```

---

## 8. Points d'Attention pour Migration

### 8.1 Problèmes de l'Architecture Actuelle

| Problème | Impact |
|----------|--------|
| Double champ `IdGfa` / `IdTSLouAssoc` | Complexité inutile, logique conditionnelle partout |
| Duplication des lignes `NumeroParts` à chaque cession | Explosion des données, historique fragmenté |
| `DateMvt` souvent vide | Incohérence, fallback sur `DateActe` nécessaire |
| Pas de contraintes d'intégrité FK | Données orphelines possibles |
| Mélange de tables "old" et "new" | Dette technique accumulée |
| Champ `Termine` critique pour comptage | Oubli = comptage erroné |

### 8.2 Logique Métier Critique à Préserver

1. **Unicité des parts** : Chaque numéro de part est unique au sein d'une structure
2. **Mouvements symétriques** : Une cession crée TOUJOURS 2 mouvements (- chez le cédant, + chez le cessionnaire)
3. **Calcul des totaux** : Compter uniquement les parts avec `Termine = FALSE`
4. **Double champ structure** : Utiliser `IdTSLouAssoc` en priorité, `IdGfa` en fallback pour IDs 11-14
5. **DateMvt souvent vide** : Utiliser `DateActe` comme fallback pour l'affichage

### 8.3 Contraintes d'Intégrité à Implémenter

- Un numéro de part appartient à un seul actionnaire actif
- Tout mouvement doit être lié à un acte
- Les cessions créent deux mouvements symétriques
- La somme des parts actives doit rester constante

### 8.4 États et Transitions

```
                    ┌─────────────┐
                    │   Actif     │
                    │ Termine=0   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │   NPAI    │    │  Décédé   │    │  Terminé  │
   │           │    │           │    │ Termine=1 │
   └───────────┘    └───────────┘    └───────────┘
```

---

## 9. Fonctions SQL Principales (DataBase.h)

### 9.1 Actionnaires

| Fonction | Description |
|----------|-------------|
| `SqlLoadUnActionnaire(id)` | Charge un actionnaire par ID |
| `SqlListeDesActionnaires(...)` | Liste avec filtres et tri |
| `SqlDeleteActionnaire(id)` | Supprime un actionnaire |
| `SqlNbPartsDeActionnaire(id)` | Compte les parts d'un actionnaire |

### 9.2 Numéros de Parts

| Fonction | Description |
|----------|-------------|
| `SqlSaveNumeroParts(...)` | Crée des numéros de parts |
| `SqlSaveNewNumeroParts(...)` | Version "new" |
| `SqlRetraitNumeroParts(...)` | Marque des parts comme retirées |
| `SqlHistoriqueDePart(idNumPart)` | Historique d'une part |
| `SqlNewHistoriqueDePart(idNumPart)` | Version "new" |

### 9.3 Cessions

| Fonction | Description |
|----------|-------------|
| `SqlCreerLesNumPartsCedeesSensMoins(...)` | Cession côté cédant |
| `SqlCreerLesNumPartsCedeesSensPlus(...)` | Acquisition côté cessionnaire |
| `SqlCreerLesNewNumPartsCedeesSensMoins(...)` | Version "new" côté cédant |
| `SqlCreerLesNewNumPartsCedeesSensPlus(...)` | Version "new" côté cessionnaire |
| `SqlMarquerLesPartsCedees(pListParts)` | Marque les parts comme terminées |

### 9.4 Mouvements et Actes

| Fonction | Description |
|----------|-------------|
| `SqlSaveUnMouvement(stream, pIdMvt)` | Crée un mouvement |
| `SqlSaveUnNewMouvement(stream, pIdMvt)` | Version "new" |
| `SqlNewListeActes(...)` | Liste les actes avec filtres |
| `SqlSauveNewActe(...)` | Crée un acte |

---

## Annexe : Composants Tiers Utilisés

| Composant | Fournisseur | Usage |
|-----------|-------------|-------|
| TB97 | Jordan Russell | Barres d'outils |
| TStringGrid | Borland VCL | Grilles de données |
| TtsGrid | Third-party | Grilles avancées |
| QuickReport | QSoftware | Rapports |
| BDE | Borland | Accès base Access via ODBC |
