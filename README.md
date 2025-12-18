# GERSA - Gestion des Parts et Fermages

Application de gestion des parts sociales et des fermages pour les structures foncières agricoles (GFA, TSL, Associations).

Basée sur le template [Full Stack FastAPI](https://github.com/fastapi/full-stack-fastapi-template), cette application modernise les anciens systèmes de gestion développés en C++ Builder et Delphi.

## Fonctionnalités

### Gestion des Actionnaires (Parts sociales)
- **Personnes** : Gestion des actionnaires (personnes physiques et morales)
- **Parts** : Suivi des numéros de parts par structure
- **Mouvements** : Historique des acquisitions et cessions de parts
- **Actes** : Gestion des actes juridiques (AGE, cessions, etc.)

### Gestion Cadastrale (Fermages)
- **Parcelles** : Référencement cadastral des parcelles
- **Subdivisions** : Découpage des parcelles avec affectation aux exploitants
- **Exploitants** : Gestion des agriculteurs locataires
- **Fermages** : Calcul des fermages avec système de points

### Structures supportées
- **GFA** : Groupements Fonciers Agricoles
- **TSL** : Terres Solidaires du Larzac
- **Associations**

## Stack Technique

### Backend
- ⚡ **[FastAPI](https://fastapi.tiangolo.com)** - API REST Python haute performance
- 🧰 **[SQLModel](https://sqlmodel.tiangolo.com)** - ORM avec validation Pydantic intégrée
- 💾 **[PostgreSQL](https://www.postgresql.org)** - Base de données relationnelle
- 🔄 **[Alembic](https://alembic.sqlalchemy.org)** - Migrations de base de données

### Frontend
- ⚛️ **[React 18](https://react.dev)** - Interface utilisateur
- 📘 **TypeScript** - Typage statique
- 🎨 **[Chakra UI v3](https://chakra-ui.com)** - Composants UI
- 🛣️ **[TanStack Router](https://tanstack.com/router)** - Routing type-safe
- 🔄 **[TanStack Query](https://tanstack.com/query)** - Gestion d'état serveur
- 🤖 **Client API auto-généré** via OpenAPI

### Infrastructure
- 🐋 **[Docker Compose](https://www.docker.com)** - Conteneurisation
- 📞 **[Traefik](https://traefik.io)** - Reverse proxy avec HTTPS automatique
- 🔒 **JWT** - Authentification sécurisée
- 🧪 **[Playwright](https://playwright.dev)** - Tests E2E

## Démarrage rapide

### Prérequis
- Docker et Docker Compose
- Node.js 20+ (pour le développement frontend)
- Python 3.10+ (pour le développement backend)
- uv (gestionnaire de paquets Python)

### Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd "GERSA - Parts et Fermages"
```

2. **Configurer les variables d'environnement**
```bash
# Copier et adapter le fichier .env
cp .env.example .env
```

3. **Lancer avec Docker Compose**
```bash
docker compose up -d
```

4. **Accéder à l'application**
- Frontend : http://localhost:5173
- API : http://localhost:8000
- Documentation API : http://localhost:8000/docs

### Développement local

**Backend** :
```bash
cd backend
uv sync
uv run fastapi dev app/main.py
```

**Frontend** :
```bash
cd frontend
npm install
npm run dev
```

**Générer le client API** :
```bash
cd frontend
npm run generate-client
```

## Structure du projet

```
├── backend/
│   ├── app/
│   │   ├── api/routes/      # Endpoints API
│   │   ├── alembic/         # Migrations DB
│   │   ├── models.py        # Modèles SQLModel
│   │   └── crud.py          # Opérations CRUD
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── routes/          # Pages (TanStack Router)
│   │   └── client/          # Client API généré
│   └── e2e/                 # Tests Playwright
├── scripts/                 # Scripts utilitaires
└── old-code/               # Code legacy (référence)
```

## Modèle de données

### Domaine Parts sociales
- `Structure` : GFA, TSL, Association
- `Personne` : Actionnaires (physiques ou morales)
- `Acte` : Actes juridiques
- `Mouvement` : Mouvements de parts
- `NumeroPart` : Numéros de parts individuels

### Domaine Cadastre/Fermages
- `Commune`, `LieuDit` : Références géographiques
- `Parcelle` : Parcelles cadastrales
- `Subdivision` : Subdivisions avec données de fermage
- `Exploitant` : Agriculteurs locataires
- `TypeCadastre`, `ClasseCadastre`, `TypeFermage` : Tables de référence
- `ValeurPoint` : Valeurs des points de fermage par année

## Configuration

Variables d'environnement importantes (`.env`) :

```env
# Sécurité
SECRET_KEY=your-secret-key
FIRST_SUPERUSER_PASSWORD=your-admin-password

# Base de données
POSTGRES_PASSWORD=your-db-password
POSTGRES_SERVER=localhost
POSTGRES_DB=app

# Frontend
VITE_API_URL=http://localhost:8000
```

## Documentation

- [Développement](./development.md) - Guide de développement local
- [Déploiement](./deployment.md) - Instructions de déploiement
- [Release Notes](./release-notes.md) - Historique des versions

## Migration depuis les anciens systèmes

L'application inclut des scripts de migration pour importer les données depuis les bases Access originales :
- `TSL.mdb` : Parts sociales et actionnaires
- `Sctl-Gfa.mdb` : Cadastre et fermages

Voir `backend/app/migrate_access_to_postgres.py` pour les détails.

## Licence

MIT License - voir [LICENSE](./LICENSE)
