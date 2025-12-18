"""
API routes for Structures (GFA, TSL, Association).
"""

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Message,
    Structure,
    StructureCreate,
    StructurePublic,
    StructuresPublic,
    StructureUpdate,
)

router = APIRouter(prefix="/structures", tags=["structures"])


@router.get("/", response_model=StructuresPublic)
def read_structures(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    type_structure: int | None = None,
) -> StructuresPublic:
    """Get all structures with optional type filter."""
    structures, count = crud.get_structures(
        session=session, skip=skip, limit=limit, type_structure=type_structure
    )
    return StructuresPublic(data=structures, count=count)


@router.get("/{structure_id}", response_model=StructurePublic)
def read_structure(session: SessionDep, structure_id: int) -> Structure:
    """Get a specific structure by ID."""
    structure = crud.get_structure(session=session, structure_id=structure_id)
    if not structure:
        raise HTTPException(status_code=404, detail="Structure not found")
    return structure


@router.post("/", response_model=StructurePublic)
def create_structure(session: SessionDep, structure_in: StructureCreate) -> Structure:
    """Create a new structure."""
    return crud.create_structure(session=session, structure_in=structure_in)


@router.put("/{structure_id}", response_model=StructurePublic)
def update_structure(
    session: SessionDep, structure_id: int, structure_in: StructureUpdate
) -> Structure:
    """Update an existing structure."""
    db_structure = crud.get_structure(session=session, structure_id=structure_id)
    if not db_structure:
        raise HTTPException(status_code=404, detail="Structure not found")
    return crud.update_structure(
        session=session, db_structure=db_structure, structure_in=structure_in
    )


@router.delete("/{structure_id}", response_model=Message)
def delete_structure(session: SessionDep, structure_id: int) -> Message:
    """Delete a structure."""
    success = crud.delete_structure(session=session, structure_id=structure_id)
    if not success:
        raise HTTPException(status_code=404, detail="Structure not found")
    return Message(message="Structure deleted successfully")
