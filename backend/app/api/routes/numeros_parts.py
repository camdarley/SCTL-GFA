"""
API routes for NumerosParts (Share numbers).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Message,
    NumeroPart,
    NumeroPartCreate,
    NumeroPartPublic,
    NumeroPartsPublic,
    NumeroPartUpdate,
    NumeroPartWithDetails,
    NumeroPartsWithDetailsPublic,
)

router = APIRouter(prefix="/numeros-parts", tags=["numeros-parts"])


class TransferPartsRequest(BaseModel):
    """Request model for transferring parts to a new owner."""

    part_ids: list[int]
    new_owner_id: int
    mouvement_id: int


@router.get("/", response_model=NumeroPartsWithDetailsPublic)
def read_numeros_parts(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    id_personne: int | None = None,
    id_structure: int | None = None,
    termine: bool | None = None,
    distribue: bool | None = None,
    num_part_min: int | None = None,
    num_part_max: int | None = None,
) -> NumeroPartsWithDetailsPublic:
    """Get all numeros parts with optional filters and details."""
    parts, count = crud.get_numeros_parts(
        session=session,
        skip=skip,
        limit=limit,
        id_personne=id_personne,
        id_structure=id_structure,
        termine=termine,
        distribue=distribue,
        num_part_min=num_part_min,
        num_part_max=num_part_max,
    )
    # Enrich with person and structure names
    parts_with_details = []
    for part in parts:
        part_dict = NumeroPartWithDetails(
            id=part.id,
            num_part=part.num_part,
            termine=part.termine,
            distribue=part.distribue,
            etat=part.etat,
            id_personne=part.id_personne,
            id_mouvement=part.id_mouvement,
            id_structure=part.id_structure,
            personne_nom=part.personne.nom if part.personne else None,
            personne_prenom=part.personne.prenom if part.personne else None,
            structure_nom=part.structure.nom_structure if part.structure else None,
        )
        parts_with_details.append(part_dict)
    return NumeroPartsWithDetailsPublic(data=parts_with_details, count=count)


@router.get("/by-num/{num_part}", response_model=NumeroPartPublic)
def read_numero_part_by_num(
    session: SessionDep, num_part: int, id_structure: int | None = None
) -> NumeroPart:
    """Get a numero part by its number."""
    part = crud.get_numero_part_by_num(
        session=session, num_part=num_part, id_structure=id_structure
    )
    if not part:
        raise HTTPException(status_code=404, detail="NumeroPart not found")
    return part


@router.get("/{part_id}", response_model=NumeroPartPublic)
def read_numero_part(session: SessionDep, part_id: int) -> NumeroPart:
    """Get a specific numero part by ID."""
    part = crud.get_numero_part(session=session, part_id=part_id)
    if not part:
        raise HTTPException(status_code=404, detail="NumeroPart not found")
    return part


@router.post("/", response_model=NumeroPartPublic)
def create_numero_part(session: SessionDep, part_in: NumeroPartCreate) -> NumeroPart:
    """Create a new numero part."""
    return crud.create_numero_part(session=session, part_in=part_in)


@router.post("/transfer", response_model=list[NumeroPartPublic])
def transfer_parts(
    session: SessionDep, transfer_request: TransferPartsRequest
) -> list[NumeroPart]:
    """
    Transfer multiple parts to a new owner (cession).

    This is used for the cession workflow where parts change ownership.
    """
    return crud.transfer_parts(
        session=session,
        part_ids=transfer_request.part_ids,
        new_owner_id=transfer_request.new_owner_id,
        mouvement_id=transfer_request.mouvement_id,
    )


@router.put("/{part_id}", response_model=NumeroPartPublic)
def update_numero_part(
    session: SessionDep, part_id: int, part_in: NumeroPartUpdate
) -> NumeroPart:
    """Update an existing numero part."""
    db_part = crud.get_numero_part(session=session, part_id=part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="NumeroPart not found")
    return crud.update_numero_part(session=session, db_part=db_part, part_in=part_in)


@router.delete("/{part_id}", response_model=Message)
def delete_numero_part(session: SessionDep, part_id: int) -> Message:
    """Delete a numero part."""
    success = crud.delete_numero_part(session=session, part_id=part_id)
    if not success:
        raise HTTPException(status_code=404, detail="NumeroPart not found")
    return Message(message="NumeroPart deleted successfully")
