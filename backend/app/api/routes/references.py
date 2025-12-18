"""
API routes for reference tables (TypeApport, TypeRemboursement, etc.).
"""

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Message,
    # Type Apport
    TypeApport,
    TypeApportCreate,
    TypeApportPublic,
    TypesApportPublic,
    TypeApportUpdate,
    # Type Remboursement
    TypeRemboursement,
    TypeRemboursementCreate,
    TypeRemboursementPublic,
    TypesRemboursementPublic,
    TypeRemboursementUpdate,
)

router = APIRouter(prefix="/references", tags=["references"])


# =============================================================================
# TYPE APPORT
# =============================================================================


@router.get("/types-apport", response_model=TypesApportPublic)
def read_types_apport(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> TypesApportPublic:
    """Get all types d'apport."""
    types, count = crud.get_types_apport(session=session, skip=skip, limit=limit)
    return TypesApportPublic(data=types, count=count)


@router.get("/types-apport/{type_id}", response_model=TypeApportPublic)
def read_type_apport(session: SessionDep, type_id: int) -> TypeApport:
    """Get a specific type d'apport by ID."""
    type_apport = crud.get_type_apport(session=session, type_id=type_id)
    if not type_apport:
        raise HTTPException(status_code=404, detail="TypeApport not found")
    return type_apport


@router.post("/types-apport", response_model=TypeApportPublic)
def create_type_apport(session: SessionDep, type_in: TypeApportCreate) -> TypeApport:
    """Create a new type d'apport."""
    return crud.create_type_apport(session=session, type_in=type_in)


@router.put("/types-apport/{type_id}", response_model=TypeApportPublic)
def update_type_apport(
    session: SessionDep, type_id: int, type_in: TypeApportUpdate
) -> TypeApport:
    """Update an existing type d'apport."""
    db_type = crud.get_type_apport(session=session, type_id=type_id)
    if not db_type:
        raise HTTPException(status_code=404, detail="TypeApport not found")
    return crud.update_type_apport(session=session, db_type=db_type, type_in=type_in)


@router.delete("/types-apport/{type_id}", response_model=Message)
def delete_type_apport(session: SessionDep, type_id: int) -> Message:
    """Delete a type d'apport."""
    success = crud.delete_type_apport(session=session, type_id=type_id)
    if not success:
        raise HTTPException(status_code=404, detail="TypeApport not found")
    return Message(message="TypeApport deleted successfully")


# =============================================================================
# TYPE REMBOURSEMENT
# =============================================================================


@router.get("/types-remboursement", response_model=TypesRemboursementPublic)
def read_types_remboursement(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> TypesRemboursementPublic:
    """Get all types de remboursement."""
    types, count = crud.get_types_remboursement(session=session, skip=skip, limit=limit)
    return TypesRemboursementPublic(data=types, count=count)


@router.get("/types-remboursement/{type_id}", response_model=TypeRemboursementPublic)
def read_type_remboursement(session: SessionDep, type_id: int) -> TypeRemboursement:
    """Get a specific type de remboursement by ID."""
    type_remboursement = crud.get_type_remboursement(session=session, type_id=type_id)
    if not type_remboursement:
        raise HTTPException(status_code=404, detail="TypeRemboursement not found")
    return type_remboursement


@router.post("/types-remboursement", response_model=TypeRemboursementPublic)
def create_type_remboursement(
    session: SessionDep, type_in: TypeRemboursementCreate
) -> TypeRemboursement:
    """Create a new type de remboursement."""
    return crud.create_type_remboursement(session=session, type_in=type_in)


@router.put("/types-remboursement/{type_id}", response_model=TypeRemboursementPublic)
def update_type_remboursement(
    session: SessionDep, type_id: int, type_in: TypeRemboursementUpdate
) -> TypeRemboursement:
    """Update an existing type de remboursement."""
    db_type = crud.get_type_remboursement(session=session, type_id=type_id)
    if not db_type:
        raise HTTPException(status_code=404, detail="TypeRemboursement not found")
    return crud.update_type_remboursement(
        session=session, db_type=db_type, type_in=type_in
    )


@router.delete("/types-remboursement/{type_id}", response_model=Message)
def delete_type_remboursement(session: SessionDep, type_id: int) -> Message:
    """Delete a type de remboursement."""
    success = crud.delete_type_remboursement(session=session, type_id=type_id)
    if not success:
        raise HTTPException(status_code=404, detail="TypeRemboursement not found")
    return Message(message="TypeRemboursement deleted successfully")
