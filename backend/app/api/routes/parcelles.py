"""
API routes for Parcelles (land parcels with fermage calculation).
"""

from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query

from app import crud
from app.api.deps import SessionDep
from app.models import (
    FermageTotaux,
    Message,
    Parcelle,
    ParcelleCreate,
    ParcellePublic,
    ParcellesPublic,
    ParcelleUpdate,
    ParcelleWithDetails,
    ParcelleWithSubdivisions,
    ParcellesWithSubdivisionsPublic,
)

router = APIRouter(prefix="/parcelles", tags=["parcelles"])


@router.get("/", response_model=ParcellesWithSubdivisionsPublic)
def read_parcelles(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    id_commune: int | None = None,
    id_lieu_dit: int | None = None,
    id_exploitant: int | None = None,
    id_type_cadastre: int | None = None,
    id_type_fermage: int | None = None,
    id_gfa: int | None = None,
    sctl: bool | None = None,
) -> ParcellesWithSubdivisionsPublic:
    """
    Get all parcelles with subdivision data.

    Filters allow searching by commune, lieu-dit, exploitant (via subdivisions),
    cadastre type, fermage type (via subdivisions), GFA, or SCTL ownership status.
    """
    parcelles, count = crud.get_parcelles_with_subdivisions(
        session=session,
        skip=skip,
        limit=limit,
        id_commune=id_commune,
        id_lieu_dit=id_lieu_dit,
        id_exploitant=id_exploitant,
        id_type_cadastre=id_type_cadastre,
        id_type_fermage=id_type_fermage,
        id_gfa=id_gfa,
        sctl=sctl,
    )
    return ParcellesWithSubdivisionsPublic(data=parcelles, count=count)


@router.get("/by-commune/{commune_id}", response_model=ParcellesWithSubdivisionsPublic)
def read_parcelles_by_commune(
    session: SessionDep,
    commune_id: int,
    skip: int = 0,
    limit: int = 100,
) -> ParcellesWithSubdivisionsPublic:
    """Get all parcelles for a specific commune."""
    parcelles, count = crud.get_parcelles_with_subdivisions(
        session=session, skip=skip, limit=limit, id_commune=commune_id
    )
    return ParcellesWithSubdivisionsPublic(data=parcelles, count=count)


@router.get("/by-exploitant/{exploitant_id}", response_model=ParcellesWithSubdivisionsPublic)
def read_parcelles_by_exploitant(
    session: SessionDep,
    exploitant_id: int,
    skip: int = 0,
    limit: int = 100,
) -> ParcellesWithSubdivisionsPublic:
    """Get all parcelles for a specific exploitant (farmer) via subdivisions."""
    parcelles, count = crud.get_parcelles_with_subdivisions(
        session=session, skip=skip, limit=limit, id_exploitant=exploitant_id
    )
    return ParcellesWithSubdivisionsPublic(data=parcelles, count=count)


@router.get("/fermages/totaux", response_model=FermageTotaux)
def get_fermages_totaux(
    session: SessionDep,
    annee: int | None = None,
    id_exploitant: int | None = None,
    id_commune: int | None = None,
    sctl: bool | None = None,
) -> FermageTotaux:
    """
    Calculate total fermage amounts from subdivisions.

    Returns totals for surface, revenu, and fermage amounts.
    Optionally filter by year, exploitant, commune, or SCTL ownership status.
    """
    # Get point values for the year if specified
    valeur_point = None
    if annee:
        valeur_point = crud.get_valeur_point_by_annee(session=session, annee=annee)

    return crud.get_fermage_totaux(
        session=session,
        id_exploitant=id_exploitant,
        id_commune=id_commune,
        sctl=sctl,
        valeur_point=valeur_point,
    )


@router.get("/fermages/calculate", response_model=dict)
def calculate_fermage(
    session: SessionDep,
    point_fermage: Decimal = Query(..., description="Point de fermage de la subdivision"),
    surface: Decimal = Query(..., description="Surface en hectares"),
    sctl: bool = Query(False, description="Si la parcelle appartient au SCTL"),
    annee: int | None = Query(None, description="Année pour les valeurs de points"),
) -> dict:
    """
    Calculate fermage amount for given parameters.

    Uses the formula: (points × surface) / 10000 × point_value × (1 + supplement%)

    Returns the calculated fermage amount.
    """
    # Get point values for the year
    valeur_point = None
    if annee:
        valeur_point = crud.get_valeur_point_by_annee(session=session, annee=annee)

    valeur_point_gfa = Decimal("1.0")
    valeur_point_sctl = Decimal("1.0")
    valeur_supp_gfa = Decimal("0.0")
    valeur_supp_sctl = Decimal("0.0")

    if valeur_point:
        valeur_point_gfa = valeur_point.valeur_point_gfa or Decimal("1.0")
        valeur_point_sctl = valeur_point.valeur_point_sctl or Decimal("1.0")
        valeur_supp_gfa = valeur_point.valeur_supp_gfa or Decimal("0.0")
        valeur_supp_sctl = valeur_point.valeur_supp_sctl or Decimal("0.0")

    montant = crud.calculer_montant_fermage(
        point_fermage=point_fermage,
        surface=surface,
        est_sctl=sctl,
        valeur_point_gfa=valeur_point_gfa,
        valeur_point_sctl=valeur_point_sctl,
        valeur_supp_gfa=valeur_supp_gfa,
        valeur_supp_sctl=valeur_supp_sctl,
    )

    return {
        "point_fermage": float(point_fermage),
        "surface": float(surface),
        "sctl": sctl,
        "annee": annee,
        "valeur_point": float(valeur_point_sctl if sctl else valeur_point_gfa),
        "montant_fermage": float(montant),
    }


@router.get("/{parcelle_id}", response_model=ParcellePublic)
def read_parcelle(session: SessionDep, parcelle_id: int) -> Parcelle:
    """Get a specific parcelle by ID."""
    parcelle = crud.get_parcelle(session=session, parcelle_id=parcelle_id)
    if not parcelle:
        raise HTTPException(status_code=404, detail="Parcelle not found")
    return parcelle


@router.get("/{parcelle_id}/details", response_model=ParcelleWithDetails)
def read_parcelle_with_details(
    session: SessionDep, parcelle_id: int, annee: int | None = None
) -> ParcelleWithDetails:
    """
    Get a parcelle with all related details and calculated fermage.

    Includes commune name, lieu-dit name, exploitant name, type labels,
    and calculated fermage amounts.
    """
    parcelle_details = crud.get_parcelle_with_details(
        session=session, parcelle_id=parcelle_id, annee=annee
    )
    if not parcelle_details:
        raise HTTPException(status_code=404, detail="Parcelle not found")
    return parcelle_details


@router.post("/", response_model=ParcellePublic)
def create_parcelle(session: SessionDep, parcelle_in: ParcelleCreate) -> Parcelle:
    """Create a new parcelle."""
    return crud.create_parcelle(session=session, parcelle_in=parcelle_in)


@router.put("/{parcelle_id}", response_model=ParcellePublic)
def update_parcelle(
    session: SessionDep, parcelle_id: int, parcelle_in: ParcelleUpdate
) -> Parcelle:
    """Update an existing parcelle."""
    db_parcelle = crud.get_parcelle(session=session, parcelle_id=parcelle_id)
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle not found")
    return crud.update_parcelle(
        session=session, db_parcelle=db_parcelle, parcelle_in=parcelle_in
    )


@router.delete("/{parcelle_id}", response_model=Message)
def delete_parcelle(session: SessionDep, parcelle_id: int) -> Message:
    """Delete a parcelle."""
    success = crud.delete_parcelle(session=session, parcelle_id=parcelle_id)
    if not success:
        raise HTTPException(status_code=404, detail="Parcelle not found")
    return Message(message="Parcelle deleted successfully")
