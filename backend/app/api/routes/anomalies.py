"""
API routes for anomaly detection in the GERSA database.

These endpoints help identify data integrity issues such as:
- Parts without movements
- Movements without actes
- Orphan records
- Missing references
"""

from fastapi import APIRouter

from app import crud
from app.api.deps import SessionDep
from app.models import (
    MouvementPublic,
    NumeroPartPublic,
)

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("/parts-sans-mouvements", response_model=list[NumeroPartPublic])
def get_parts_sans_mouvements(
    session: SessionDep,
    id_structure: int | None = None,
) -> list:
    """
    Find share numbers (numeros de parts) that have no associated movements.

    This indicates data that may need correction - every part should have
    at least one movement recording its creation/acquisition.
    """
    return crud.find_parts_sans_mouvements(session=session, id_structure=id_structure)


@router.get("/mouvements-sans-actes", response_model=list[MouvementPublic])
def get_mouvements_sans_actes(
    session: SessionDep,
    id_structure: int | None = None,
) -> list:
    """
    Find movements that have no associated legal act (acte).

    Every movement should be linked to an acte for proper legal tracking.
    """
    return crud.find_mouvements_sans_actes(session=session, id_structure=id_structure)


@router.get("/summary")
def get_anomalies_summary(
    session: SessionDep,
    id_structure: int | None = None,
) -> dict:
    """
    Get a summary of all detected anomalies.

    Returns counts of each anomaly type for quick assessment of data quality.
    """
    parts_sans_mvt = crud.find_parts_sans_mouvements(
        session=session, id_structure=id_structure
    )
    mvt_sans_actes = crud.find_mouvements_sans_actes(
        session=session, id_structure=id_structure
    )

    return {
        "parts_sans_mouvements": {
            "count": len(parts_sans_mvt),
            "description": "Numéros de parts sans mouvements associés",
        },
        "mouvements_sans_actes": {
            "count": len(mvt_sans_actes),
            "description": "Mouvements sans actes associés",
        },
        "total_anomalies": len(parts_sans_mvt) + len(mvt_sans_actes),
    }
