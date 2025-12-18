"""
API routes for Mouvements (Share movements/transactions).
"""

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Message,
    Mouvement,
    MouvementCreate,
    MouvementPublic,
    MouvementsPublic,
    MouvementUpdate,
)

router = APIRouter(prefix="/mouvements", tags=["mouvements"])


@router.get("/", response_model=MouvementsPublic)
def read_mouvements(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    id_personne: int | None = None,
    id_acte: int | None = None,
    sens: bool | None = None,
) -> MouvementsPublic:
    """
    Get all mouvements with optional filters.

    - sens=true: acquisitions (+)
    - sens=false: cessions (-)
    """
    mouvements, count = crud.get_mouvements(
        session=session,
        skip=skip,
        limit=limit,
        id_personne=id_personne,
        id_acte=id_acte,
        sens=sens,
    )
    return MouvementsPublic(data=mouvements, count=count)


@router.get("/{mouvement_id}", response_model=MouvementPublic)
def read_mouvement(session: SessionDep, mouvement_id: int) -> Mouvement:
    """Get a specific mouvement by ID."""
    mouvement = crud.get_mouvement(session=session, mouvement_id=mouvement_id)
    if not mouvement:
        raise HTTPException(status_code=404, detail="Mouvement not found")
    return mouvement


@router.post("/", response_model=MouvementPublic)
def create_mouvement(session: SessionDep, mouvement_in: MouvementCreate) -> Mouvement:
    """Create a new mouvement."""
    return crud.create_mouvement(session=session, mouvement_in=mouvement_in)


@router.put("/{mouvement_id}", response_model=MouvementPublic)
def update_mouvement(
    session: SessionDep, mouvement_id: int, mouvement_in: MouvementUpdate
) -> Mouvement:
    """Update an existing mouvement."""
    db_mouvement = crud.get_mouvement(session=session, mouvement_id=mouvement_id)
    if not db_mouvement:
        raise HTTPException(status_code=404, detail="Mouvement not found")
    return crud.update_mouvement(
        session=session, db_mouvement=db_mouvement, mouvement_in=mouvement_in
    )


@router.delete("/{mouvement_id}", response_model=Message)
def delete_mouvement(session: SessionDep, mouvement_id: int) -> Message:
    """Delete a mouvement."""
    success = crud.delete_mouvement(session=session, mouvement_id=mouvement_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mouvement not found")
    return Message(message="Mouvement deleted successfully")
