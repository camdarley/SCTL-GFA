"""
API routes for Personnes (Actionnaires/Shareholders).
"""

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Message,
    PartsTotaux,
    Personne,
    PersonneCreate,
    PersonnePublic,
    PersonnesPublic,
    PersonnesWithPartsPublic,
    PersonneUpdate,
    PersonneWithParts,
)

router = APIRouter(prefix="/personnes", tags=["personnes"])


@router.get("/totals", response_model=PartsTotaux)
def read_parts_totals(session: SessionDep) -> PartsTotaux:
    """Get global totals for all non-terminated parts (GFA, SCTL, total, actionnaires count)."""
    totals = crud.get_parts_totals(session=session)
    return PartsTotaux(**totals)


@router.get("/", response_model=PersonnesWithPartsPublic)
def read_personnes(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    nom: str | None = None,
    ville: str | None = None,
    code_postal: str | None = None,
    id_structure: int | None = None,
    npai: bool | None = None,
    decede: bool | None = None,
    termine: bool | None = None,
    fondateur: bool | None = None,
    de_droit: bool | None = None,
    adherent: bool | None = None,
    est_personne_morale: bool | None = None,
) -> PersonnesWithPartsPublic:
    """
    Get all personnes with optional filters and calculated share counts.

    Returns personnes with nb_parts_gfa, nb_parts_sctl, nb_parts_total.
    Filters match the MultiCrit search from the original application.
    """
    personnes, count = crud.get_personnes_with_parts(
        session=session,
        skip=skip,
        limit=limit,
        nom=nom,
        ville=ville,
        code_postal=code_postal,
        id_structure=id_structure,
        npai=npai,
        decede=decede,
        termine=termine,
        fondateur=fondateur,
        de_droit=de_droit,
        adherent=adherent,
        est_personne_morale=est_personne_morale,
    )
    return PersonnesWithPartsPublic(data=personnes, count=count)


@router.get("/{personne_id}", response_model=PersonnePublic)
def read_personne(session: SessionDep, personne_id: int) -> Personne:
    """Get a specific personne by ID."""
    personne = crud.get_personne(session=session, personne_id=personne_id)
    if not personne:
        raise HTTPException(status_code=404, detail="Personne not found")
    return personne


@router.get("/{personne_id}/with-parts", response_model=PersonneWithParts)
def read_personne_with_parts(session: SessionDep, personne_id: int) -> PersonneWithParts:
    """Get a personne with calculated share counts (GFA, SCTL, total)."""
    personne = crud.get_personne_with_parts(session=session, personne_id=personne_id)
    if not personne:
        raise HTTPException(status_code=404, detail="Personne not found")
    return personne


@router.get("/{personne_id}/membres", response_model=list[PersonnePublic])
def read_membres_personne_morale(
    session: SessionDep, personne_id: int
) -> list[Personne]:
    """Get all members of a personne morale (legal entity)."""
    return crud.get_membres_personne_morale(
        session=session, personne_morale_id=personne_id
    )


@router.post("/", response_model=PersonnePublic)
def create_personne(session: SessionDep, personne_in: PersonneCreate) -> Personne:
    """Create a new personne (shareholder)."""
    return crud.create_personne(session=session, personne_in=personne_in)


@router.put("/{personne_id}", response_model=PersonnePublic)
def update_personne(
    session: SessionDep, personne_id: int, personne_in: PersonneUpdate
) -> Personne:
    """Update an existing personne."""
    db_personne = crud.get_personne(session=session, personne_id=personne_id)
    if not db_personne:
        raise HTTPException(status_code=404, detail="Personne not found")
    return crud.update_personne(
        session=session, db_personne=db_personne, personne_in=personne_in
    )


@router.delete("/{personne_id}", response_model=Message)
def delete_personne(session: SessionDep, personne_id: int) -> Message:
    """Delete a personne."""
    success = crud.delete_personne(session=session, personne_id=personne_id)
    if not success:
        raise HTTPException(status_code=404, detail="Personne not found")
    return Message(message="Personne deleted successfully")
