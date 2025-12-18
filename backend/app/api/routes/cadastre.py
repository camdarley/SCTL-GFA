"""
API routes for Cadastre entities (Communes, LieuxDits, Exploitants, TypesCadastre, etc.).
"""

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Message,
    # Commune
    Commune,
    CommuneCreate,
    CommunePublic,
    CommunesPublic,
    CommuneUpdate,
    # LieuDit
    LieuDit,
    LieuDitCreate,
    LieuDitPublic,
    LieuxDitsPublic,
    LieuDitUpdate,
    # Exploitant
    Exploitant,
    ExploitantCreate,
    ExploitantPublic,
    ExploitantsPublic,
    ExploitantUpdate,
    # TypeCadastre
    TypeCadastre,
    TypeCadastreCreate,
    TypeCadastrePublic,
    TypesCadastrePublic,
    TypeCadastreUpdate,
    # ClasseCadastre
    ClasseCadastre,
    ClasseCadastreCreate,
    ClasseCadastrePublic,
    ClassesCadastrePublic,
    ClasseCadastreUpdate,
    # TypeFermage
    TypeFermage,
    TypeFermageCreate,
    TypeFermagePublic,
    TypesFermagePublic,
    TypeFermageUpdate,
    # ValeurPoint
    ValeurPoint,
    ValeurPointCreate,
    ValeurPointPublic,
    ValeursPointsPublic,
    ValeurPointUpdate,
)

router = APIRouter(prefix="/cadastre", tags=["cadastre"])


# =============================================================================
# COMMUNES
# =============================================================================


@router.get("/communes", response_model=CommunesPublic)
def read_communes(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> CommunesPublic:
    """Get all communes."""
    communes, count = crud.get_communes(session=session, skip=skip, limit=limit)
    return CommunesPublic(data=communes, count=count)


@router.get("/communes/{commune_id}", response_model=CommunePublic)
def read_commune(session: SessionDep, commune_id: int) -> Commune:
    """Get a specific commune by ID."""
    commune = crud.get_commune(session=session, commune_id=commune_id)
    if not commune:
        raise HTTPException(status_code=404, detail="Commune not found")
    return commune


@router.post("/communes", response_model=CommunePublic)
def create_commune(session: SessionDep, commune_in: CommuneCreate) -> Commune:
    """Create a new commune."""
    return crud.create_commune(session=session, commune_in=commune_in)


@router.put("/communes/{commune_id}", response_model=CommunePublic)
def update_commune(
    session: SessionDep, commune_id: int, commune_in: CommuneUpdate
) -> Commune:
    """Update an existing commune."""
    db_commune = crud.get_commune(session=session, commune_id=commune_id)
    if not db_commune:
        raise HTTPException(status_code=404, detail="Commune not found")
    return crud.update_commune(
        session=session, db_commune=db_commune, commune_in=commune_in
    )


@router.delete("/communes/{commune_id}", response_model=Message)
def delete_commune(session: SessionDep, commune_id: int) -> Message:
    """Delete a commune."""
    success = crud.delete_commune(session=session, commune_id=commune_id)
    if not success:
        raise HTTPException(status_code=404, detail="Commune not found")
    return Message(message="Commune deleted successfully")


# =============================================================================
# LIEUX-DITS
# =============================================================================


@router.get("/lieux-dits", response_model=LieuxDitsPublic)
def read_lieux_dits(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    id_commune: int | None = None,
) -> LieuxDitsPublic:
    """Get all lieux-dits with optional commune filter."""
    lieux_dits, count = crud.get_lieux_dits(
        session=session, skip=skip, limit=limit, id_commune=id_commune
    )
    return LieuxDitsPublic(data=lieux_dits, count=count)


@router.get("/lieux-dits/{lieu_dit_id}", response_model=LieuDitPublic)
def read_lieu_dit(session: SessionDep, lieu_dit_id: int) -> LieuDit:
    """Get a specific lieu-dit by ID."""
    lieu_dit = crud.get_lieu_dit(session=session, lieu_dit_id=lieu_dit_id)
    if not lieu_dit:
        raise HTTPException(status_code=404, detail="LieuDit not found")
    return lieu_dit


@router.post("/lieux-dits", response_model=LieuDitPublic)
def create_lieu_dit(session: SessionDep, lieu_dit_in: LieuDitCreate) -> LieuDit:
    """Create a new lieu-dit."""
    return crud.create_lieu_dit(session=session, lieu_dit_in=lieu_dit_in)


@router.put("/lieux-dits/{lieu_dit_id}", response_model=LieuDitPublic)
def update_lieu_dit(
    session: SessionDep, lieu_dit_id: int, lieu_dit_in: LieuDitUpdate
) -> LieuDit:
    """Update an existing lieu-dit."""
    db_lieu_dit = crud.get_lieu_dit(session=session, lieu_dit_id=lieu_dit_id)
    if not db_lieu_dit:
        raise HTTPException(status_code=404, detail="LieuDit not found")
    return crud.update_lieu_dit(
        session=session, db_lieu_dit=db_lieu_dit, lieu_dit_in=lieu_dit_in
    )


@router.delete("/lieux-dits/{lieu_dit_id}", response_model=Message)
def delete_lieu_dit(session: SessionDep, lieu_dit_id: int) -> Message:
    """Delete a lieu-dit."""
    success = crud.delete_lieu_dit(session=session, lieu_dit_id=lieu_dit_id)
    if not success:
        raise HTTPException(status_code=404, detail="LieuDit not found")
    return Message(message="LieuDit deleted successfully")


# =============================================================================
# EXPLOITANTS
# =============================================================================


@router.get("/exploitants", response_model=ExploitantsPublic)
def read_exploitants(
    session: SessionDep, skip: int = 0, limit: int = 100, nom: str | None = None
) -> ExploitantsPublic:
    """Get all exploitants with optional name filter."""
    exploitants, count = crud.get_exploitants(
        session=session, skip=skip, limit=limit, nom=nom
    )
    return ExploitantsPublic(data=exploitants, count=count)


@router.get("/exploitants/{exploitant_id}", response_model=ExploitantPublic)
def read_exploitant(session: SessionDep, exploitant_id: int) -> Exploitant:
    """Get a specific exploitant by ID."""
    exploitant = crud.get_exploitant(session=session, exploitant_id=exploitant_id)
    if not exploitant:
        raise HTTPException(status_code=404, detail="Exploitant not found")
    return exploitant


@router.post("/exploitants", response_model=ExploitantPublic)
def create_exploitant(session: SessionDep, exploitant_in: ExploitantCreate) -> Exploitant:
    """Create a new exploitant."""
    return crud.create_exploitant(session=session, exploitant_in=exploitant_in)


@router.put("/exploitants/{exploitant_id}", response_model=ExploitantPublic)
def update_exploitant(
    session: SessionDep, exploitant_id: int, exploitant_in: ExploitantUpdate
) -> Exploitant:
    """Update an existing exploitant."""
    db_exploitant = crud.get_exploitant(session=session, exploitant_id=exploitant_id)
    if not db_exploitant:
        raise HTTPException(status_code=404, detail="Exploitant not found")
    return crud.update_exploitant(
        session=session, db_exploitant=db_exploitant, exploitant_in=exploitant_in
    )


@router.delete("/exploitants/{exploitant_id}", response_model=Message)
def delete_exploitant(session: SessionDep, exploitant_id: int) -> Message:
    """Delete an exploitant."""
    success = crud.delete_exploitant(session=session, exploitant_id=exploitant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exploitant not found")
    return Message(message="Exploitant deleted successfully")


# =============================================================================
# TYPES CADASTRE
# =============================================================================


@router.get("/types-cadastre", response_model=TypesCadastrePublic)
def read_types_cadastre(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> TypesCadastrePublic:
    """Get all types cadastre."""
    types, count = crud.get_types_cadastre(session=session, skip=skip, limit=limit)
    return TypesCadastrePublic(data=types, count=count)


@router.get("/types-cadastre/{type_id}", response_model=TypeCadastrePublic)
def read_type_cadastre(session: SessionDep, type_id: int) -> TypeCadastre:
    """Get a specific type cadastre by ID."""
    type_cadastre = crud.get_type_cadastre(session=session, type_id=type_id)
    if not type_cadastre:
        raise HTTPException(status_code=404, detail="TypeCadastre not found")
    return type_cadastre


@router.post("/types-cadastre", response_model=TypeCadastrePublic)
def create_type_cadastre(
    session: SessionDep, type_in: TypeCadastreCreate
) -> TypeCadastre:
    """Create a new type cadastre."""
    return crud.create_type_cadastre(session=session, type_in=type_in)


@router.put("/types-cadastre/{type_id}", response_model=TypeCadastrePublic)
def update_type_cadastre(
    session: SessionDep, type_id: int, type_in: TypeCadastreUpdate
) -> TypeCadastre:
    """Update an existing type cadastre."""
    db_type = crud.get_type_cadastre(session=session, type_id=type_id)
    if not db_type:
        raise HTTPException(status_code=404, detail="TypeCadastre not found")
    return crud.update_type_cadastre(session=session, db_type=db_type, type_in=type_in)


@router.delete("/types-cadastre/{type_id}", response_model=Message)
def delete_type_cadastre(session: SessionDep, type_id: int) -> Message:
    """Delete a type cadastre."""
    success = crud.delete_type_cadastre(session=session, type_id=type_id)
    if not success:
        raise HTTPException(status_code=404, detail="TypeCadastre not found")
    return Message(message="TypeCadastre deleted successfully")


# =============================================================================
# CLASSES CADASTRE
# =============================================================================


@router.get("/classes-cadastre", response_model=ClassesCadastrePublic)
def read_classes_cadastre(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> ClassesCadastrePublic:
    """Get all classes cadastre."""
    classes, count = crud.get_classes_cadastre(session=session, skip=skip, limit=limit)
    return ClassesCadastrePublic(data=classes, count=count)


@router.get("/classes-cadastre/{classe_id}", response_model=ClasseCadastrePublic)
def read_classe_cadastre(session: SessionDep, classe_id: int) -> ClasseCadastre:
    """Get a specific classe cadastre by ID."""
    classe_cadastre = crud.get_classe_cadastre(session=session, classe_id=classe_id)
    if not classe_cadastre:
        raise HTTPException(status_code=404, detail="ClasseCadastre not found")
    return classe_cadastre


@router.post("/classes-cadastre", response_model=ClasseCadastrePublic)
def create_classe_cadastre(
    session: SessionDep, classe_in: ClasseCadastreCreate
) -> ClasseCadastre:
    """Create a new classe cadastre."""
    return crud.create_classe_cadastre(session=session, classe_in=classe_in)


@router.put("/classes-cadastre/{classe_id}", response_model=ClasseCadastrePublic)
def update_classe_cadastre(
    session: SessionDep, classe_id: int, classe_in: ClasseCadastreUpdate
) -> ClasseCadastre:
    """Update an existing classe cadastre."""
    db_classe = crud.get_classe_cadastre(session=session, classe_id=classe_id)
    if not db_classe:
        raise HTTPException(status_code=404, detail="ClasseCadastre not found")
    return crud.update_classe_cadastre(
        session=session, db_classe=db_classe, classe_in=classe_in
    )


@router.delete("/classes-cadastre/{classe_id}", response_model=Message)
def delete_classe_cadastre(session: SessionDep, classe_id: int) -> Message:
    """Delete a classe cadastre."""
    success = crud.delete_classe_cadastre(session=session, classe_id=classe_id)
    if not success:
        raise HTTPException(status_code=404, detail="ClasseCadastre not found")
    return Message(message="ClasseCadastre deleted successfully")


# =============================================================================
# TYPES FERMAGE
# =============================================================================


@router.get("/types-fermage", response_model=TypesFermagePublic)
def read_types_fermage(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> TypesFermagePublic:
    """Get all types fermage."""
    types, count = crud.get_types_fermage(session=session, skip=skip, limit=limit)
    return TypesFermagePublic(data=types, count=count)


@router.get("/types-fermage/{type_id}", response_model=TypeFermagePublic)
def read_type_fermage(session: SessionDep, type_id: int) -> TypeFermage:
    """Get a specific type fermage by ID."""
    type_fermage = crud.get_type_fermage(session=session, type_id=type_id)
    if not type_fermage:
        raise HTTPException(status_code=404, detail="TypeFermage not found")
    return type_fermage


@router.post("/types-fermage", response_model=TypeFermagePublic)
def create_type_fermage(session: SessionDep, type_in: TypeFermageCreate) -> TypeFermage:
    """Create a new type fermage."""
    return crud.create_type_fermage(session=session, type_in=type_in)


@router.put("/types-fermage/{type_id}", response_model=TypeFermagePublic)
def update_type_fermage(
    session: SessionDep, type_id: int, type_in: TypeFermageUpdate
) -> TypeFermage:
    """Update an existing type fermage."""
    db_type = crud.get_type_fermage(session=session, type_id=type_id)
    if not db_type:
        raise HTTPException(status_code=404, detail="TypeFermage not found")
    return crud.update_type_fermage(session=session, db_type=db_type, type_in=type_in)


@router.delete("/types-fermage/{type_id}", response_model=Message)
def delete_type_fermage(session: SessionDep, type_id: int) -> Message:
    """Delete a type fermage."""
    success = crud.delete_type_fermage(session=session, type_id=type_id)
    if not success:
        raise HTTPException(status_code=404, detail="TypeFermage not found")
    return Message(message="TypeFermage deleted successfully")


# =============================================================================
# VALEURS POINTS
# =============================================================================


@router.get("/valeurs-points", response_model=ValeursPointsPublic)
def read_valeurs_points(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> ValeursPointsPublic:
    """Get all valeurs points (sorted by year descending)."""
    valeurs, count = crud.get_valeurs_points(session=session, skip=skip, limit=limit)
    return ValeursPointsPublic(data=valeurs, count=count)


@router.get("/valeurs-points/by-annee/{annee}", response_model=ValeurPointPublic)
def read_valeur_point_by_annee(session: SessionDep, annee: int) -> ValeurPoint:
    """Get valeur point for a specific year."""
    valeur = crud.get_valeur_point_by_annee(session=session, annee=annee)
    if not valeur:
        raise HTTPException(status_code=404, detail="ValeurPoint not found for this year")
    return valeur


@router.get("/valeurs-points/{valeur_id}", response_model=ValeurPointPublic)
def read_valeur_point(session: SessionDep, valeur_id: int) -> ValeurPoint:
    """Get a specific valeur point by ID."""
    valeur = crud.get_valeur_point(session=session, valeur_id=valeur_id)
    if not valeur:
        raise HTTPException(status_code=404, detail="ValeurPoint not found")
    return valeur


@router.post("/valeurs-points", response_model=ValeurPointPublic)
def create_valeur_point(session: SessionDep, valeur_in: ValeurPointCreate) -> ValeurPoint:
    """Create a new valeur point."""
    return crud.create_valeur_point(session=session, valeur_in=valeur_in)


@router.put("/valeurs-points/{valeur_id}", response_model=ValeurPointPublic)
def update_valeur_point(
    session: SessionDep, valeur_id: int, valeur_in: ValeurPointUpdate
) -> ValeurPoint:
    """Update an existing valeur point."""
    db_valeur = crud.get_valeur_point(session=session, valeur_id=valeur_id)
    if not db_valeur:
        raise HTTPException(status_code=404, detail="ValeurPoint not found")
    return crud.update_valeur_point(
        session=session, db_valeur=db_valeur, valeur_in=valeur_in
    )


@router.delete("/valeurs-points/{valeur_id}", response_model=Message)
def delete_valeur_point(session: SessionDep, valeur_id: int) -> Message:
    """Delete a valeur point."""
    success = crud.delete_valeur_point(session=session, valeur_id=valeur_id)
    if not success:
        raise HTTPException(status_code=404, detail="ValeurPoint not found")
    return Message(message="ValeurPoint deleted successfully")
