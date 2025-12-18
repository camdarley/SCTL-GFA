"""
API routes for Actes (Legal Acts).
"""

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Acte,
    ActeCreate,
    ActePublic,
    ActesPublic,
    ActeUpdate,
    ActeWithDetails,
    ActesWithDetailsPublic,
    Message,
)

router = APIRouter(prefix="/actes", tags=["actes"])


@router.get("/", response_model=ActesWithDetailsPublic)
def read_actes(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    id_structure: int | None = None,
    provisoire: bool | None = None,
) -> ActesWithDetailsPublic:
    """Get all actes with optional filters and details."""
    actes, count = crud.get_actes(
        session=session,
        skip=skip,
        limit=limit,
        id_structure=id_structure,
        provisoire=provisoire,
    )
    # Enrich with structure names
    actes_with_details = []
    for acte in actes:
        acte_detail = ActeWithDetails(
            id=acte.id,
            code_acte=acte.code_acte,
            date_acte=acte.date_acte,
            libelle_acte=acte.libelle_acte,
            provisoire=acte.provisoire,
            id_structure=acte.id_structure,
            structure_nom=acte.structure.nom_structure if acte.structure else None,
        )
        actes_with_details.append(acte_detail)
    return ActesWithDetailsPublic(data=actes_with_details, count=count)


@router.get("/by-code/{code_acte}", response_model=ActePublic)
def read_acte_by_code(session: SessionDep, code_acte: str) -> Acte:
    """Get an acte by its code."""
    acte = crud.get_acte_by_code(session=session, code_acte=code_acte)
    if not acte:
        raise HTTPException(status_code=404, detail="Acte not found")
    return acte


@router.get("/{acte_id}", response_model=ActePublic)
def read_acte(session: SessionDep, acte_id: int) -> Acte:
    """Get a specific acte by ID."""
    acte = crud.get_acte(session=session, acte_id=acte_id)
    if not acte:
        raise HTTPException(status_code=404, detail="Acte not found")
    return acte


@router.post("/", response_model=ActePublic)
def create_acte(session: SessionDep, acte_in: ActeCreate) -> Acte:
    """Create a new acte."""
    return crud.create_acte(session=session, acte_in=acte_in)


@router.put("/{acte_id}", response_model=ActePublic)
def update_acte(session: SessionDep, acte_id: int, acte_in: ActeUpdate) -> Acte:
    """Update an existing acte."""
    db_acte = crud.get_acte(session=session, acte_id=acte_id)
    if not db_acte:
        raise HTTPException(status_code=404, detail="Acte not found")
    return crud.update_acte(session=session, db_acte=db_acte, acte_in=acte_in)


@router.delete("/{acte_id}", response_model=Message)
def delete_acte(session: SessionDep, acte_id: int) -> Message:
    """Delete an acte."""
    success = crud.delete_acte(session=session, acte_id=acte_id)
    if not success:
        raise HTTPException(status_code=404, detail="Acte not found")
    return Message(message="Acte deleted successfully")
