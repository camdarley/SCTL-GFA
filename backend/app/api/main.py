from fastapi import APIRouter

from app.api.routes import (
    actes,
    anomalies,
    cadastre,
    login,
    mouvements,
    numeros_parts,
    parcelles,
    personnes,
    private,
    references,
    structures,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()

# Authentication & Users (from template)
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)

# GERSA Domain Routes
api_router.include_router(structures.router)
api_router.include_router(personnes.router)
api_router.include_router(actes.router)
api_router.include_router(mouvements.router)
api_router.include_router(numeros_parts.router)
api_router.include_router(references.router)

# Cadastre & Fermages
api_router.include_router(cadastre.router)
api_router.include_router(parcelles.router)

# Data Quality
api_router.include_router(anomalies.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
