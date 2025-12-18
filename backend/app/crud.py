"""
CRUD operations for SCTL/GERSA database models.

Provides database operations for:
- User authentication (kept from template)
- Shareholders (Personnes) and their shares
- Movements and legal acts
- Cadastral parcels and rents
"""

import uuid
from decimal import Decimal
from typing import Any, TypeVar

from sqlmodel import Session, func, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    # User models
    User,
    UserCreate,
    UserUpdate,
    # Reference tables
    Structure,
    StructureCreate,
    StructureUpdate,
    TypeApport,
    TypeApportCreate,
    TypeApportUpdate,
    TypeRemboursement,
    TypeRemboursementCreate,
    TypeRemboursementUpdate,
    TypeStructure,
    # Legal acts
    Acte,
    ActeCreate,
    ActeUpdate,
    # Shareholders
    Personne,
    PersonneCreate,
    PersonneUpdate,
    PersonneWithParts,
    # Movements
    Mouvement,
    MouvementCreate,
    MouvementUpdate,
    MouvementWithDetails,
    # Share numbers
    NumeroPart,
    NumeroPartCreate,
    NumeroPartUpdate,
    # Cadastre reference tables
    Commune,
    CommuneCreate,
    CommuneUpdate,
    LieuDit,
    LieuDitCreate,
    LieuDitUpdate,
    Exploitant,
    ExploitantCreate,
    ExploitantUpdate,
    TypeCadastre,
    TypeCadastreCreate,
    TypeCadastreUpdate,
    ClasseCadastre,
    ClasseCadastreCreate,
    ClasseCadastreUpdate,
    TypeFermage,
    TypeFermageCreate,
    TypeFermageUpdate,
    ValeurPoint,
    ValeurPointCreate,
    ValeurPointUpdate,
    # Parcels
    Parcelle,
    ParcelleCreate,
    ParcelleUpdate,
    ParcelleWithDetails,
    ParcelleWithSubdivisions,
    SubdivisionSummary,
    FermageTotaux,
    # Subdivisions
    Subdivision,
    SubdivisionCreate,
    SubdivisionUpdate,
)


# =============================================================================
# Generic Type for CRUD operations
# =============================================================================

ModelType = TypeVar("ModelType")
CreateType = TypeVar("CreateType")
UpdateType = TypeVar("UpdateType")


# =============================================================================
# USER CRUD (kept from template)
# =============================================================================

def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


# =============================================================================
# STRUCTURE CRUD
# =============================================================================

def get_structures(
    *, session: Session, skip: int = 0, limit: int = 100, type_structure: int | None = None
) -> tuple[list[Structure], int]:
    statement = select(Structure)
    if type_structure is not None and type_structure != TypeStructure.ALL_TYPES:
        statement = statement.where(Structure.type_structure == type_structure)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit)
    structures = session.exec(statement).all()
    return list(structures), count


def get_structure(*, session: Session, structure_id: int) -> Structure | None:
    return session.get(Structure, structure_id)


def create_structure(*, session: Session, structure_in: StructureCreate) -> Structure:
    db_obj = Structure.model_validate(structure_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_structure(
    *, session: Session, db_structure: Structure, structure_in: StructureUpdate
) -> Structure:
    structure_data = structure_in.model_dump(exclude_unset=True)
    db_structure.sqlmodel_update(structure_data)
    session.add(db_structure)
    session.commit()
    session.refresh(db_structure)
    return db_structure


def delete_structure(*, session: Session, structure_id: int) -> bool:
    db_structure = session.get(Structure, structure_id)
    if db_structure:
        session.delete(db_structure)
        session.commit()
        return True
    return False


# =============================================================================
# TYPE APPORT CRUD
# =============================================================================

def get_types_apport(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[TypeApport], int]:
    count = session.exec(select(func.count()).select_from(TypeApport)).one()
    statement = select(TypeApport).offset(skip).limit(limit)
    types = session.exec(statement).all()
    return list(types), count


def get_type_apport(*, session: Session, type_id: int) -> TypeApport | None:
    return session.get(TypeApport, type_id)


def create_type_apport(*, session: Session, type_in: TypeApportCreate) -> TypeApport:
    db_obj = TypeApport.model_validate(type_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_type_apport(
    *, session: Session, db_type: TypeApport, type_in: TypeApportUpdate
) -> TypeApport:
    type_data = type_in.model_dump(exclude_unset=True)
    db_type.sqlmodel_update(type_data)
    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type


def delete_type_apport(*, session: Session, type_id: int) -> bool:
    db_type = session.get(TypeApport, type_id)
    if db_type:
        session.delete(db_type)
        session.commit()
        return True
    return False


# =============================================================================
# TYPE REMBOURSEMENT CRUD
# =============================================================================

def get_types_remboursement(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[TypeRemboursement], int]:
    count = session.exec(select(func.count()).select_from(TypeRemboursement)).one()
    statement = select(TypeRemboursement).offset(skip).limit(limit)
    types = session.exec(statement).all()
    return list(types), count


def get_type_remboursement(*, session: Session, type_id: int) -> TypeRemboursement | None:
    return session.get(TypeRemboursement, type_id)


def create_type_remboursement(
    *, session: Session, type_in: TypeRemboursementCreate
) -> TypeRemboursement:
    db_obj = TypeRemboursement.model_validate(type_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_type_remboursement(
    *, session: Session, db_type: TypeRemboursement, type_in: TypeRemboursementUpdate
) -> TypeRemboursement:
    type_data = type_in.model_dump(exclude_unset=True)
    db_type.sqlmodel_update(type_data)
    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type


def delete_type_remboursement(*, session: Session, type_id: int) -> bool:
    db_type = session.get(TypeRemboursement, type_id)
    if db_type:
        session.delete(db_type)
        session.commit()
        return True
    return False


# =============================================================================
# ACTE CRUD
# =============================================================================

def get_actes(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    id_structure: int | None = None,
    provisoire: bool | None = None,
) -> tuple[list[Acte], int]:
    statement = select(Acte)
    if id_structure is not None:
        statement = statement.where(Acte.id_structure == id_structure)
    if provisoire is not None:
        statement = statement.where(Acte.provisoire == provisoire)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(Acte.date_acte.desc()).offset(skip).limit(limit)
    actes = session.exec(statement).all()
    return list(actes), count


def get_acte(*, session: Session, acte_id: int) -> Acte | None:
    return session.get(Acte, acte_id)


def get_acte_by_code(*, session: Session, code_acte: str) -> Acte | None:
    statement = select(Acte).where(Acte.code_acte == code_acte)
    return session.exec(statement).first()


def create_acte(*, session: Session, acte_in: ActeCreate) -> Acte:
    db_obj = Acte.model_validate(acte_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_acte(*, session: Session, db_acte: Acte, acte_in: ActeUpdate) -> Acte:
    acte_data = acte_in.model_dump(exclude_unset=True)
    db_acte.sqlmodel_update(acte_data)
    session.add(db_acte)
    session.commit()
    session.refresh(db_acte)
    return db_acte


def delete_acte(*, session: Session, acte_id: int) -> bool:
    db_acte = session.get(Acte, acte_id)
    if db_acte:
        session.delete(db_acte)
        session.commit()
        return True
    return False


# =============================================================================
# PERSONNE (ACTIONNAIRE) CRUD
# =============================================================================

def get_personnes(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    # Filters
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
) -> tuple[list[Personne], int]:
    statement = select(Personne)

    if nom:
        statement = statement.where(Personne.nom.ilike(f"%{nom}%"))
    if ville:
        statement = statement.where(Personne.ville.ilike(f"%{ville}%"))
    if code_postal:
        statement = statement.where(Personne.code_postal == code_postal)
    if id_structure is not None:
        statement = statement.where(Personne.id_structure == id_structure)
    if npai is not None:
        statement = statement.where(Personne.npai == npai)
    if decede is not None:
        statement = statement.where(Personne.decede == decede)
    if termine is not None:
        statement = statement.where(Personne.termine == termine)
    if fondateur is not None:
        statement = statement.where(Personne.fondateur == fondateur)
    if de_droit is not None:
        statement = statement.where(Personne.de_droit == de_droit)
    if adherent is not None:
        statement = statement.where(Personne.adherent == adherent)
    if est_personne_morale is not None:
        statement = statement.where(Personne.est_personne_morale == est_personne_morale)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(Personne.nom, Personne.prenom).offset(skip).limit(limit)
    personnes = session.exec(statement).all()
    return list(personnes), count


def get_personne(*, session: Session, personne_id: int) -> Personne | None:
    return session.get(Personne, personne_id)


def get_personne_with_parts(*, session: Session, personne_id: int) -> PersonneWithParts | None:
    """Get a personne with calculated share counts"""
    personne = session.get(Personne, personne_id)
    if not personne:
        return None

    # Count parts by structure type
    gfa_count = session.exec(
        select(func.count())
        .select_from(NumeroPart)
        .join(Structure, NumeroPart.id_structure == Structure.id)
        .where(NumeroPart.id_personne == personne_id)
        .where(NumeroPart.termine == False)
        .where(Structure.type_structure == TypeStructure.GFA)
    ).one()

    sctl_count = session.exec(
        select(func.count())
        .select_from(NumeroPart)
        .join(Structure, NumeroPart.id_structure == Structure.id)
        .where(NumeroPart.id_personne == personne_id)
        .where(NumeroPart.termine == False)
        .where(Structure.type_structure == TypeStructure.TSL)
    ).one()

    return PersonneWithParts(
        **personne.model_dump(),
        nb_parts_gfa=gfa_count,
        nb_parts_sctl=sctl_count,
        nb_parts_total=gfa_count + sctl_count,
    )


def get_personnes_with_parts(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    # Filters
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
) -> tuple[list[PersonneWithParts], int]:
    """
    Get personnes with calculated share counts in an optimized single query.
    Avoids N+1 queries by computing part counts using subqueries.
    """
    # Subquery for GFA parts count per personne
    gfa_subquery = (
        select(
            NumeroPart.id_personne,
            func.count().label("gfa_count")
        )
        .join(Structure, NumeroPart.id_structure == Structure.id)
        .where(NumeroPart.termine == False)
        .where(Structure.type_structure == TypeStructure.GFA)
        .group_by(NumeroPart.id_personne)
        .subquery()
    )

    # Subquery for SCTL parts count per personne
    sctl_subquery = (
        select(
            NumeroPart.id_personne,
            func.count().label("sctl_count")
        )
        .join(Structure, NumeroPart.id_structure == Structure.id)
        .where(NumeroPart.termine == False)
        .where(Structure.type_structure == TypeStructure.TSL)
        .group_by(NumeroPart.id_personne)
        .subquery()
    )

    # Main query with outer joins to subqueries
    statement = (
        select(
            Personne,
            func.coalesce(gfa_subquery.c.gfa_count, 0).label("nb_parts_gfa"),
            func.coalesce(sctl_subquery.c.sctl_count, 0).label("nb_parts_sctl"),
        )
        .outerjoin(gfa_subquery, Personne.id == gfa_subquery.c.id_personne)
        .outerjoin(sctl_subquery, Personne.id == sctl_subquery.c.id_personne)
    )

    # Apply filters
    if nom:
        statement = statement.where(Personne.nom.ilike(f"%{nom}%"))
    if ville:
        statement = statement.where(Personne.ville.ilike(f"%{ville}%"))
    if code_postal:
        statement = statement.where(Personne.code_postal == code_postal)
    if id_structure is not None:
        statement = statement.where(Personne.id_structure == id_structure)
    if npai is not None:
        statement = statement.where(Personne.npai == npai)
    if decede is not None:
        statement = statement.where(Personne.decede == decede)
    if termine is not None:
        statement = statement.where(Personne.termine == termine)
    if fondateur is not None:
        statement = statement.where(Personne.fondateur == fondateur)
    if de_droit is not None:
        statement = statement.where(Personne.de_droit == de_droit)
    if adherent is not None:
        statement = statement.where(Personne.adherent == adherent)
    if est_personne_morale is not None:
        statement = statement.where(Personne.est_personne_morale == est_personne_morale)

    # Count total (use a separate count query on Personne only for accuracy)
    count_statement = select(func.count()).select_from(Personne)
    if nom:
        count_statement = count_statement.where(Personne.nom.ilike(f"%{nom}%"))
    if ville:
        count_statement = count_statement.where(Personne.ville.ilike(f"%{ville}%"))
    if code_postal:
        count_statement = count_statement.where(Personne.code_postal == code_postal)
    if id_structure is not None:
        count_statement = count_statement.where(Personne.id_structure == id_structure)
    if npai is not None:
        count_statement = count_statement.where(Personne.npai == npai)
    if decede is not None:
        count_statement = count_statement.where(Personne.decede == decede)
    if termine is not None:
        count_statement = count_statement.where(Personne.termine == termine)
    if fondateur is not None:
        count_statement = count_statement.where(Personne.fondateur == fondateur)
    if de_droit is not None:
        count_statement = count_statement.where(Personne.de_droit == de_droit)
    if adherent is not None:
        count_statement = count_statement.where(Personne.adherent == adherent)
    if est_personne_morale is not None:
        count_statement = count_statement.where(Personne.est_personne_morale == est_personne_morale)
    count = session.exec(count_statement).one()

    # Apply ordering and pagination
    statement = statement.order_by(Personne.nom, Personne.prenom).offset(skip).limit(limit)
    results = session.exec(statement).all()

    # Build PersonneWithParts objects
    personnes_with_parts: list[PersonneWithParts] = []
    for row in results:
        personne = row[0]
        gfa_count = row[1]
        sctl_count = row[2]
        personnes_with_parts.append(
            PersonneWithParts(
                **personne.model_dump(),
                nb_parts_gfa=gfa_count,
                nb_parts_sctl=sctl_count,
                nb_parts_total=gfa_count + sctl_count,
            )
        )

    return personnes_with_parts, count


def get_parts_totals(*, session: Session) -> dict[str, int]:
    """Get global totals for all non-terminated parts."""
    # Count GFA parts
    gfa_total = session.exec(
        select(func.count())
        .select_from(NumeroPart)
        .join(Structure, NumeroPart.id_structure == Structure.id)
        .where(NumeroPart.termine == False)
        .where(Structure.type_structure == TypeStructure.GFA)
    ).one()

    # Count SCTL parts
    sctl_total = session.exec(
        select(func.count())
        .select_from(NumeroPart)
        .join(Structure, NumeroPart.id_structure == Structure.id)
        .where(NumeroPart.termine == False)
        .where(Structure.type_structure == TypeStructure.TSL)
    ).one()

    # Count unique actionnaires (personnes with at least one non-terminated part)
    actionnaires_count = session.exec(
        select(func.count(func.distinct(NumeroPart.id_personne)))
        .select_from(NumeroPart)
        .where(NumeroPart.termine == False)
    ).one()

    return {
        "gfa": gfa_total,
        "sctl": sctl_total,
        "total": gfa_total + sctl_total,
        "actionnaires": actionnaires_count,
    }


def create_personne(*, session: Session, personne_in: PersonneCreate) -> Personne:
    db_obj = Personne.model_validate(personne_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_personne(
    *, session: Session, db_personne: Personne, personne_in: PersonneUpdate
) -> Personne:
    personne_data = personne_in.model_dump(exclude_unset=True)
    db_personne.sqlmodel_update(personne_data)
    session.add(db_personne)
    session.commit()
    session.refresh(db_personne)
    return db_personne


def delete_personne(*, session: Session, personne_id: int) -> bool:
    db_personne = session.get(Personne, personne_id)
    if db_personne:
        session.delete(db_personne)
        session.commit()
        return True
    return False


def get_membres_personne_morale(
    *, session: Session, personne_morale_id: int
) -> list[Personne]:
    """Get all members of a legal entity (personne morale)"""
    statement = select(Personne).where(Personne.id_personne_morale == personne_morale_id)
    return list(session.exec(statement).all())


# =============================================================================
# MOUVEMENT CRUD
# =============================================================================

def get_mouvements(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    id_personne: int | None = None,
    id_acte: int | None = None,
    sens: bool | None = None,
) -> tuple[list[Mouvement], int]:
    # Join with Acte to sort by effective date (date_operation or date_acte)
    statement = select(Mouvement).outerjoin(Acte, Mouvement.id_acte == Acte.id)

    if id_personne is not None:
        statement = statement.where(Mouvement.id_personne == id_personne)
    if id_acte is not None:
        statement = statement.where(Mouvement.id_acte == id_acte)
    if sens is not None:
        statement = statement.where(Mouvement.sens == sens)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    # Sort by effective date: use date_operation if available, otherwise use acte.date_acte
    effective_date = func.coalesce(Mouvement.date_operation, Acte.date_acte)
    statement = statement.order_by(effective_date.desc()).offset(skip).limit(limit)
    mouvements = session.exec(statement).all()
    return list(mouvements), count


def get_mouvements_with_details(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    id_personne: int | None = None,
    id_acte: int | None = None,
    sens: bool | None = None,
    max_parts_display: int = 10,
) -> tuple[list[MouvementWithDetails], int]:
    """
    Get mouvements with personne and acte details in a single optimized query.
    Avoids N+1 queries by joining with Personne and Acte tables.
    Also fetches the related share numbers (numeros_parts) for each mouvement.
    """
    # Main query with joins to Personne and Acte
    statement = (
        select(
            Mouvement,
            Personne.nom.label("personne_nom"),
            Personne.prenom.label("personne_prenom"),
            Acte.code_acte.label("code_acte"),
            Acte.date_acte.label("date_acte"),
        )
        .join(Personne, Mouvement.id_personne == Personne.id)
        .outerjoin(Acte, Mouvement.id_acte == Acte.id)
    )

    # Apply filters
    if id_personne is not None:
        statement = statement.where(Mouvement.id_personne == id_personne)
    if id_acte is not None:
        statement = statement.where(Mouvement.id_acte == id_acte)
    if sens is not None:
        statement = statement.where(Mouvement.sens == sens)

    # Count query
    count_statement = select(func.count()).select_from(Mouvement)
    if id_personne is not None:
        count_statement = count_statement.where(Mouvement.id_personne == id_personne)
    if id_acte is not None:
        count_statement = count_statement.where(Mouvement.id_acte == id_acte)
    if sens is not None:
        count_statement = count_statement.where(Mouvement.sens == sens)
    count = session.exec(count_statement).one()

    # Sort by effective date: use date_operation if available, otherwise use acte.date_acte
    effective_date = func.coalesce(Mouvement.date_operation, Acte.date_acte)
    statement = statement.order_by(effective_date.desc()).offset(skip).limit(limit)
    results = session.exec(statement).all()

    # Get mouvement IDs to fetch related parts
    mouvement_ids = [row[0].id for row in results]

    # Fetch all related numeros_parts for these mouvements in one query
    parts_by_mouvement: dict[int, list[int]] = {}
    parts_count_by_mouvement: dict[int, int] = {}
    if mouvement_ids:
        # Get counts first
        count_query = (
            select(NumeroPart.id_mouvement, func.count().label("cnt"))
            .where(NumeroPart.id_mouvement.in_(mouvement_ids))
            .group_by(NumeroPart.id_mouvement)
        )
        count_results = session.exec(count_query).all()
        for id_mvt, cnt in count_results:
            parts_count_by_mouvement[id_mvt] = cnt

        # Get num_part values (limited per mouvement for display)
        parts_query = (
            select(NumeroPart.id_mouvement, NumeroPart.num_part)
            .where(NumeroPart.id_mouvement.in_(mouvement_ids))
            .order_by(NumeroPart.id_mouvement, NumeroPart.num_part)
        )
        parts_results = session.exec(parts_query).all()

        for id_mvt, num_part in parts_results:
            if id_mvt not in parts_by_mouvement:
                parts_by_mouvement[id_mvt] = []
            # Only keep up to max_parts_display per mouvement
            if len(parts_by_mouvement[id_mvt]) < max_parts_display:
                parts_by_mouvement[id_mvt].append(num_part)

    # Build MouvementWithDetails objects
    mouvements_with_details: list[MouvementWithDetails] = []
    for row in results:
        mouvement = row[0]
        mouvements_with_details.append(
            MouvementWithDetails(
                **mouvement.model_dump(),
                personne_nom=row[1],
                personne_prenom=row[2],
                code_acte=row[3],
                date_acte=row[4],
                numeros_parts=parts_by_mouvement.get(mouvement.id, []),
                numeros_parts_count=parts_count_by_mouvement.get(mouvement.id, 0),
            )
        )

    return mouvements_with_details, count


def get_mouvement(*, session: Session, mouvement_id: int) -> Mouvement | None:
    return session.get(Mouvement, mouvement_id)


def create_mouvement(*, session: Session, mouvement_in: MouvementCreate) -> Mouvement:
    db_obj = Mouvement.model_validate(mouvement_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_mouvement(
    *, session: Session, db_mouvement: Mouvement, mouvement_in: MouvementUpdate
) -> Mouvement:
    mouvement_data = mouvement_in.model_dump(exclude_unset=True)
    db_mouvement.sqlmodel_update(mouvement_data)
    session.add(db_mouvement)
    session.commit()
    session.refresh(db_mouvement)
    return db_mouvement


def delete_mouvement(*, session: Session, mouvement_id: int) -> bool:
    db_mouvement = session.get(Mouvement, mouvement_id)
    if db_mouvement:
        session.delete(db_mouvement)
        session.commit()
        return True
    return False


# =============================================================================
# NUMERO PART CRUD
# =============================================================================

def get_numeros_parts(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    id_personne: int | None = None,
    id_structure: int | None = None,
    termine: bool | None = None,
    distribue: bool | None = None,
    num_part_min: int | None = None,
    num_part_max: int | None = None,
    num_part: int | None = None,
) -> tuple[list[NumeroPart], int]:
    statement = select(NumeroPart)

    if id_personne is not None:
        statement = statement.where(NumeroPart.id_personne == id_personne)
    if id_structure is not None:
        statement = statement.where(NumeroPart.id_structure == id_structure)
    if termine is not None:
        statement = statement.where(NumeroPart.termine == termine)
    if distribue is not None:
        statement = statement.where(NumeroPart.distribue == distribue)
    if num_part_min is not None:
        statement = statement.where(NumeroPart.num_part >= num_part_min)
    if num_part_max is not None:
        statement = statement.where(NumeroPart.num_part <= num_part_max)
    if num_part is not None:
        statement = statement.where(NumeroPart.num_part == num_part)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(NumeroPart.num_part).offset(skip).limit(limit)
    parts = session.exec(statement).all()
    return list(parts), count


def get_numero_part(*, session: Session, part_id: int) -> NumeroPart | None:
    return session.get(NumeroPart, part_id)


def get_numero_part_by_num(
    *, session: Session, num_part: int, id_structure: int | None = None
) -> NumeroPart | None:
    statement = select(NumeroPart).where(NumeroPart.num_part == num_part)
    if id_structure is not None:
        statement = statement.where(NumeroPart.id_structure == id_structure)
    return session.exec(statement).first()


def create_numero_part(*, session: Session, part_in: NumeroPartCreate) -> NumeroPart:
    db_obj = NumeroPart.model_validate(part_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_numero_part(
    *, session: Session, db_part: NumeroPart, part_in: NumeroPartUpdate
) -> NumeroPart:
    part_data = part_in.model_dump(exclude_unset=True)
    db_part.sqlmodel_update(part_data)
    session.add(db_part)
    session.commit()
    session.refresh(db_part)
    return db_part


def delete_numero_part(*, session: Session, part_id: int) -> bool:
    db_part = session.get(NumeroPart, part_id)
    if db_part:
        session.delete(db_part)
        session.commit()
        return True
    return False


def transfer_parts(
    *,
    session: Session,
    part_ids: list[int],
    new_owner_id: int,
    mouvement_id: int,
) -> list[NumeroPart]:
    """Transfer multiple parts to a new owner (cession)"""
    transferred = []
    for part_id in part_ids:
        part = session.get(NumeroPart, part_id)
        if part:
            part.id_personne = new_owner_id
            part.id_mouvement = mouvement_id
            session.add(part)
            transferred.append(part)
    session.commit()
    for part in transferred:
        session.refresh(part)
    return transferred


# =============================================================================
# COMMUNE CRUD
# =============================================================================

def get_communes(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Commune], int]:
    count = session.exec(select(func.count()).select_from(Commune)).one()
    statement = select(Commune).order_by(Commune.nom_com).offset(skip).limit(limit)
    communes = session.exec(statement).all()
    return list(communes), count


def get_commune(*, session: Session, commune_id: int) -> Commune | None:
    return session.get(Commune, commune_id)


def create_commune(*, session: Session, commune_in: CommuneCreate) -> Commune:
    db_obj = Commune.model_validate(commune_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_commune(
    *, session: Session, db_commune: Commune, commune_in: CommuneUpdate
) -> Commune:
    commune_data = commune_in.model_dump(exclude_unset=True)
    db_commune.sqlmodel_update(commune_data)
    session.add(db_commune)
    session.commit()
    session.refresh(db_commune)
    return db_commune


def delete_commune(*, session: Session, commune_id: int) -> bool:
    db_commune = session.get(Commune, commune_id)
    if db_commune:
        session.delete(db_commune)
        session.commit()
        return True
    return False


# =============================================================================
# LIEU-DIT CRUD
# =============================================================================

def get_lieux_dits(
    *, session: Session, skip: int = 0, limit: int = 100, id_commune: int | None = None
) -> tuple[list[LieuDit], int]:
    statement = select(LieuDit)
    if id_commune is not None:
        statement = statement.where(LieuDit.id_commune == id_commune)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(LieuDit.nom).offset(skip).limit(limit)
    lieux_dits = session.exec(statement).all()
    return list(lieux_dits), count


def get_lieu_dit(*, session: Session, lieu_dit_id: int) -> LieuDit | None:
    return session.get(LieuDit, lieu_dit_id)


def create_lieu_dit(*, session: Session, lieu_dit_in: LieuDitCreate) -> LieuDit:
    db_obj = LieuDit.model_validate(lieu_dit_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_lieu_dit(
    *, session: Session, db_lieu_dit: LieuDit, lieu_dit_in: LieuDitUpdate
) -> LieuDit:
    lieu_dit_data = lieu_dit_in.model_dump(exclude_unset=True)
    db_lieu_dit.sqlmodel_update(lieu_dit_data)
    session.add(db_lieu_dit)
    session.commit()
    session.refresh(db_lieu_dit)
    return db_lieu_dit


def delete_lieu_dit(*, session: Session, lieu_dit_id: int) -> bool:
    db_lieu_dit = session.get(LieuDit, lieu_dit_id)
    if db_lieu_dit:
        session.delete(db_lieu_dit)
        session.commit()
        return True
    return False


# =============================================================================
# EXPLOITANT CRUD
# =============================================================================

def get_exploitants(
    *, session: Session, skip: int = 0, limit: int = 100, nom: str | None = None
) -> tuple[list[Exploitant], int]:
    statement = select(Exploitant)
    if nom:
        statement = statement.where(Exploitant.nom.ilike(f"%{nom}%"))

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(Exploitant.nom).offset(skip).limit(limit)
    exploitants = session.exec(statement).all()
    return list(exploitants), count


def get_exploitant(*, session: Session, exploitant_id: int) -> Exploitant | None:
    return session.get(Exploitant, exploitant_id)


def create_exploitant(*, session: Session, exploitant_in: ExploitantCreate) -> Exploitant:
    db_obj = Exploitant.model_validate(exploitant_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_exploitant(
    *, session: Session, db_exploitant: Exploitant, exploitant_in: ExploitantUpdate
) -> Exploitant:
    exploitant_data = exploitant_in.model_dump(exclude_unset=True)
    db_exploitant.sqlmodel_update(exploitant_data)
    session.add(db_exploitant)
    session.commit()
    session.refresh(db_exploitant)
    return db_exploitant


def delete_exploitant(*, session: Session, exploitant_id: int) -> bool:
    db_exploitant = session.get(Exploitant, exploitant_id)
    if db_exploitant:
        session.delete(db_exploitant)
        session.commit()
        return True
    return False


# =============================================================================
# TYPE CADASTRE CRUD
# =============================================================================

def get_types_cadastre(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[TypeCadastre], int]:
    count = session.exec(select(func.count()).select_from(TypeCadastre)).one()
    statement = select(TypeCadastre).offset(skip).limit(limit)
    types = session.exec(statement).all()
    return list(types), count


def get_type_cadastre(*, session: Session, type_id: int) -> TypeCadastre | None:
    return session.get(TypeCadastre, type_id)


def create_type_cadastre(*, session: Session, type_in: TypeCadastreCreate) -> TypeCadastre:
    db_obj = TypeCadastre.model_validate(type_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_type_cadastre(
    *, session: Session, db_type: TypeCadastre, type_in: TypeCadastreUpdate
) -> TypeCadastre:
    type_data = type_in.model_dump(exclude_unset=True)
    db_type.sqlmodel_update(type_data)
    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type


def delete_type_cadastre(*, session: Session, type_id: int) -> bool:
    db_type = session.get(TypeCadastre, type_id)
    if db_type:
        session.delete(db_type)
        session.commit()
        return True
    return False


# =============================================================================
# CLASSE CADASTRE CRUD
# =============================================================================

def get_classes_cadastre(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[ClasseCadastre], int]:
    count = session.exec(select(func.count()).select_from(ClasseCadastre)).one()
    statement = select(ClasseCadastre).offset(skip).limit(limit)
    classes = session.exec(statement).all()
    return list(classes), count


def get_classe_cadastre(*, session: Session, classe_id: int) -> ClasseCadastre | None:
    return session.get(ClasseCadastre, classe_id)


def create_classe_cadastre(
    *, session: Session, classe_in: ClasseCadastreCreate
) -> ClasseCadastre:
    db_obj = ClasseCadastre.model_validate(classe_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_classe_cadastre(
    *, session: Session, db_classe: ClasseCadastre, classe_in: ClasseCadastreUpdate
) -> ClasseCadastre:
    classe_data = classe_in.model_dump(exclude_unset=True)
    db_classe.sqlmodel_update(classe_data)
    session.add(db_classe)
    session.commit()
    session.refresh(db_classe)
    return db_classe


def delete_classe_cadastre(*, session: Session, classe_id: int) -> bool:
    db_classe = session.get(ClasseCadastre, classe_id)
    if db_classe:
        session.delete(db_classe)
        session.commit()
        return True
    return False


# =============================================================================
# TYPE FERMAGE CRUD
# =============================================================================

def get_types_fermage(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[TypeFermage], int]:
    count = session.exec(select(func.count()).select_from(TypeFermage)).one()
    statement = select(TypeFermage).offset(skip).limit(limit)
    types = session.exec(statement).all()
    return list(types), count


def get_type_fermage(*, session: Session, type_id: int) -> TypeFermage | None:
    return session.get(TypeFermage, type_id)


def create_type_fermage(*, session: Session, type_in: TypeFermageCreate) -> TypeFermage:
    db_obj = TypeFermage.model_validate(type_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_type_fermage(
    *, session: Session, db_type: TypeFermage, type_in: TypeFermageUpdate
) -> TypeFermage:
    type_data = type_in.model_dump(exclude_unset=True)
    db_type.sqlmodel_update(type_data)
    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type


def delete_type_fermage(*, session: Session, type_id: int) -> bool:
    db_type = session.get(TypeFermage, type_id)
    if db_type:
        session.delete(db_type)
        session.commit()
        return True
    return False


# =============================================================================
# VALEUR POINTS CRUD
# =============================================================================

def get_valeurs_points(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[ValeurPoint], int]:
    count = session.exec(select(func.count()).select_from(ValeurPoint)).one()
    statement = select(ValeurPoint).order_by(ValeurPoint.annee.desc()).offset(skip).limit(limit)
    valeurs = session.exec(statement).all()
    return list(valeurs), count


def get_valeur_point(*, session: Session, valeur_id: int) -> ValeurPoint | None:
    return session.get(ValeurPoint, valeur_id)


def get_valeur_point_by_annee(*, session: Session, annee: int) -> ValeurPoint | None:
    statement = select(ValeurPoint).where(ValeurPoint.annee == annee)
    return session.exec(statement).first()


def create_valeur_point(*, session: Session, valeur_in: ValeurPointCreate) -> ValeurPoint:
    db_obj = ValeurPoint.model_validate(valeur_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_valeur_point(
    *, session: Session, db_valeur: ValeurPoint, valeur_in: ValeurPointUpdate
) -> ValeurPoint:
    valeur_data = valeur_in.model_dump(exclude_unset=True)
    db_valeur.sqlmodel_update(valeur_data)
    session.add(db_valeur)
    session.commit()
    session.refresh(db_valeur)
    return db_valeur


def delete_valeur_point(*, session: Session, valeur_id: int) -> bool:
    db_valeur = session.get(ValeurPoint, valeur_id)
    if db_valeur:
        session.delete(db_valeur)
        session.commit()
        return True
    return False


# =============================================================================
# PARCELLE CRUD
# =============================================================================

def get_parcelles(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    id_commune: int | None = None,
    id_lieu_dit: int | None = None,
    id_type_cadastre: int | None = None,
    id_gfa: int | None = None,
    sctl: bool | None = None,
) -> tuple[list[Parcelle], int]:
    """Get parcelles with basic filtering (fields on Parcelle model only)."""
    statement = select(Parcelle)

    if id_commune is not None:
        statement = statement.where(Parcelle.id_commune == id_commune)
    if id_lieu_dit is not None:
        statement = statement.where(Parcelle.id_lieu_dit == id_lieu_dit)
    if id_type_cadastre is not None:
        statement = statement.where(Parcelle.id_type_cadastre == id_type_cadastre)
    if id_gfa is not None:
        statement = statement.where(Parcelle.id_gfa == id_gfa)
    if sctl is not None:
        statement = statement.where(Parcelle.sctl == sctl)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(Parcelle.parcelle).offset(skip).limit(limit)
    parcelles = session.exec(statement).all()
    return list(parcelles), count


def get_parcelles_with_subdivisions(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    id_commune: int | None = None,
    id_lieu_dit: int | None = None,
    id_exploitant: int | None = None,
    id_type_cadastre: int | None = None,
    id_type_fermage: int | None = None,
    id_gfa: int | None = None,
    sctl: bool | None = None,
) -> tuple[list[ParcelleWithSubdivisions], int]:
    """Get parcelles with subdivision summary data for list display."""
    # Base query for parcelles
    statement = select(Parcelle)

    if id_commune is not None:
        statement = statement.where(Parcelle.id_commune == id_commune)
    if id_lieu_dit is not None:
        statement = statement.where(Parcelle.id_lieu_dit == id_lieu_dit)
    if id_type_cadastre is not None:
        statement = statement.where(Parcelle.id_type_cadastre == id_type_cadastre)
    if id_gfa is not None:
        statement = statement.where(Parcelle.id_gfa == id_gfa)
    if sctl is not None:
        statement = statement.where(Parcelle.sctl == sctl)

    # If filtering by exploitant or type_fermage, need to join with subdivisions
    if id_exploitant is not None or id_type_fermage is not None:
        # Get parcelle IDs that have matching subdivisions
        sub_statement = select(Subdivision.id_parcelle).distinct()
        if id_exploitant is not None:
            sub_statement = sub_statement.where(Subdivision.id_exploitant == id_exploitant)
        if id_type_fermage is not None:
            sub_statement = sub_statement.where(Subdivision.id_type_fermage == id_type_fermage)
        parcelle_ids = session.exec(sub_statement).all()
        statement = statement.where(Parcelle.id.in_(parcelle_ids))

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(Parcelle.parcelle).offset(skip).limit(limit)
    parcelles = session.exec(statement).all()

    # Build response with subdivision data
    result: list[ParcelleWithSubdivisions] = []
    for parcelle in parcelles:
        # Get related names
        nom_commune = parcelle.commune.nom_com if parcelle.commune else None
        nom_lieu_dit = parcelle.lieu_dit.nom if parcelle.lieu_dit else None

        # Get subdivisions for this parcelle
        subdivisions = session.exec(
            select(Subdivision)
            .where(Subdivision.id_parcelle == parcelle.id)
            .order_by(Subdivision.division, Subdivision.subdivision)
        ).all()

        # Calculate aggregates
        total_surface = sum((s.surface for s in subdivisions), Decimal("0"))
        nb_subdivisions = len(subdivisions)

        # Build subdivision summaries
        subdivision_summaries: list[SubdivisionSummary] = []
        first_division = None
        first_exploitant = None
        first_exploitant_id = None

        for i, sub in enumerate(subdivisions):
            nom_exploitant = None
            if sub.exploitant:
                nom_exploitant = f"{sub.exploitant.nom} {sub.exploitant.prenom or ''}".strip()

            subdivision_summaries.append(SubdivisionSummary(
                id=sub.id,
                division=sub.division,
                subdivision=sub.subdivision,
                surface=sub.surface,
                nom_exploitant=nom_exploitant,
                id_exploitant=sub.id_exploitant,
            ))

            if i == 0:
                first_division = sub.division
                first_exploitant = nom_exploitant
                first_exploitant_id = sub.id_exploitant

        result.append(ParcelleWithSubdivisions(
            **parcelle.model_dump(),
            nom_commune=nom_commune,
            nom_lieu_dit=nom_lieu_dit,
            total_surface=total_surface,
            nb_subdivisions=nb_subdivisions,
            first_division=first_division,
            first_exploitant=first_exploitant,
            first_exploitant_id=first_exploitant_id,
            subdivisions=subdivision_summaries,
        ))

    return result, count


def get_parcelle(*, session: Session, parcelle_id: int) -> Parcelle | None:
    return session.get(Parcelle, parcelle_id)


def create_parcelle(*, session: Session, parcelle_in: ParcelleCreate) -> Parcelle:
    db_obj = Parcelle.model_validate(parcelle_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_parcelle(
    *, session: Session, db_parcelle: Parcelle, parcelle_in: ParcelleUpdate
) -> Parcelle:
    parcelle_data = parcelle_in.model_dump(exclude_unset=True)
    db_parcelle.sqlmodel_update(parcelle_data)
    session.add(db_parcelle)
    session.commit()
    session.refresh(db_parcelle)
    return db_parcelle


def delete_parcelle(*, session: Session, parcelle_id: int) -> bool:
    db_parcelle = session.get(Parcelle, parcelle_id)
    if db_parcelle:
        session.delete(db_parcelle)
        session.commit()
        return True
    return False


# =============================================================================
# FERMAGE CALCULATION (from UBib.pas - Bib_CalculerMontantFermage)
# =============================================================================

def calculer_montant_fermage(
    *,
    point_fermage: Decimal,
    surface: Decimal,
    est_sctl: bool,
    valeur_point_gfa: Decimal,
    valeur_point_sctl: Decimal,
    supp_gfa: bool = False,
    supp_sctl: bool = False,
    valeur_supp_gfa: Decimal = Decimal("0"),
    valeur_supp_sctl: Decimal = Decimal("0"),
) -> Decimal:
    """
    Calculate rent amount based on the original formula from UBib.pas.

    Formula: (points × surface) / 10000 × point_value × (1 + supplement%)

    Args:
        point_fermage: Number of rent points
        surface: Surface in m²
        est_sctl: True for SCTL rent, False for GFA
        valeur_point_gfa: GFA point value
        valeur_point_sctl: SCTL point value
        supp_gfa: GFA duration supplement active
        supp_sctl: SCTL duration supplement active
        valeur_supp_gfa: GFA supplement percentage
        valeur_supp_sctl: SCTL supplement percentage

    Returns:
        Calculated rent amount
    """
    # Base calculation: (points × surface) / 10000
    result = (point_fermage * surface) / Decimal("10000")

    if est_sctl:
        result = result * valeur_point_sctl
        if supp_sctl:
            result = result + ((result * valeur_supp_sctl) / Decimal("100"))
    else:
        result = result * valeur_point_gfa
        if supp_gfa:
            result = result + ((result * valeur_supp_gfa) / Decimal("100"))

    return result


def get_parcelle_with_details(
    *, session: Session, parcelle_id: int, valeur_point: ValeurPoint | None = None
) -> ParcelleWithDetails | None:
    """Get a parcelle with calculated rent and details (based on first subdivision)"""
    parcelle = session.get(Parcelle, parcelle_id)
    if not parcelle:
        return None

    # Get related names
    nom_commune = parcelle.commune.nom_com if parcelle.commune else None
    nom_lieu_dit = parcelle.lieu_dit.nom if parcelle.lieu_dit else None

    # Get first subdivision for exploitant name and fermage calculation
    first_subdivision = session.exec(
        select(Subdivision)
        .where(Subdivision.id_parcelle == parcelle_id)
        .order_by(Subdivision.division, Subdivision.subdivision)
        .limit(1)
    ).first()

    nom_exploitant = None
    montant_fermage = Decimal("0")

    if first_subdivision:
        if first_subdivision.exploitant:
            nom_exploitant = (
                f"{first_subdivision.exploitant.nom} {first_subdivision.exploitant.prenom or ''}".strip()
            )

        # Calculate rent if valeur_point provided
        if valeur_point:
            montant_fermage = calculer_montant_fermage(
                point_fermage=first_subdivision.point_fermage,
                surface=first_subdivision.surface,
                est_sctl=parcelle.sctl,  # Use parcelle.sctl flag
                valeur_point_gfa=valeur_point.valeur_point_gfa,
                valeur_point_sctl=valeur_point.valeur_point_sctl,
                valeur_supp_gfa=valeur_point.valeur_supp_gfa,
                valeur_supp_sctl=valeur_point.valeur_supp_sctl,
            )

    return ParcelleWithDetails(
        **parcelle.model_dump(),
        nom_commune=nom_commune,
        nom_lieu_dit=nom_lieu_dit,
        nom_exploitant=nom_exploitant,
        montant_fermage=montant_fermage,
    )


def get_fermage_totaux(
    *,
    session: Session,
    id_exploitant: int | None = None,
    id_commune: int | None = None,
    sctl: bool | None = None,
    valeur_point: ValeurPoint | None = None,
) -> FermageTotaux:
    """Get aggregated rent totals based on subdivisions with optional filtering"""
    # Query subdivisions directly
    statement = select(Subdivision).join(Parcelle, Subdivision.id_parcelle == Parcelle.id)

    if id_exploitant is not None:
        statement = statement.where(Subdivision.id_exploitant == id_exploitant)
    if id_commune is not None:
        statement = statement.where(Parcelle.id_commune == id_commune)
    if sctl is not None:
        statement = statement.where(Parcelle.sctl == sctl)

    subdivisions = session.exec(statement).all()

    total_surface = Decimal("0")
    total_revenu = Decimal("0")
    total_montant = Decimal("0")
    parcelle_ids = set()

    for sub in subdivisions:
        total_surface += sub.surface
        total_revenu += sub.revenu
        parcelle_ids.add(sub.id_parcelle)

        if valeur_point:
            # Use the parcelle's sctl flag to determine GFA vs SCTL calculation
            est_sctl = sub.parcelle.sctl if sub.parcelle else False
            total_montant += calculer_montant_fermage(
                point_fermage=sub.point_fermage,
                surface=sub.surface,
                est_sctl=est_sctl,
                valeur_point_gfa=valeur_point.valeur_point_gfa,
                valeur_point_sctl=valeur_point.valeur_point_sctl,
                valeur_supp_gfa=valeur_point.valeur_supp_gfa,
                valeur_supp_sctl=valeur_point.valeur_supp_sctl,
            )

    return FermageTotaux(
        total_surface=total_surface,
        total_revenu=total_revenu,
        total_montant=total_montant,
        nb_parcelles=len(parcelle_ids),
    )


# =============================================================================
# ANOMALY DETECTION (from MultiCrit.h)
# =============================================================================

def find_parts_sans_mouvements(
    *, session: Session, id_structure: int | None = None
) -> list[NumeroPart]:
    """Find orphan parts without movements"""
    statement = select(NumeroPart).where(NumeroPart.id_mouvement == None)
    if id_structure is not None:
        statement = statement.where(NumeroPart.id_structure == id_structure)
    return list(session.exec(statement).all())


def find_mouvements_sans_actes(
    *, session: Session, id_structure: int | None = None
) -> list[Mouvement]:
    """Find movements without associated acts"""
    statement = select(Mouvement).where(Mouvement.id_acte == None)
    if id_structure is not None:
        statement = statement.join(Personne, Mouvement.id_personne == Personne.id).where(
            Personne.id_structure == id_structure
        )
    return list(session.exec(statement).all())


def find_parts_sans_actionnaires(*, session: Session) -> list[NumeroPart]:
    """Find parts without associated shareholders"""
    statement = (
        select(NumeroPart)
        .outerjoin(Personne, NumeroPart.id_personne == Personne.id)
        .where(Personne.id == None)
    )
    return list(session.exec(statement).all())


def find_mouvements_sans_actionnaires(*, session: Session) -> list[Mouvement]:
    """Find movements without associated shareholders"""
    statement = (
        select(Mouvement)
        .outerjoin(Personne, Mouvement.id_personne == Personne.id)
        .where(Personne.id == None)
    )
    return list(session.exec(statement).all())


# =============================================================================
# SUBDIVISION CRUD
# =============================================================================

def get_subdivisions(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    id_parcelle: int | None = None,
    id_exploitant: int | None = None,
    id_type_fermage: int | None = None,
) -> tuple[list[Subdivision], int]:
    """Get subdivisions with optional filters."""
    statement = select(Subdivision)

    if id_parcelle is not None:
        statement = statement.where(Subdivision.id_parcelle == id_parcelle)
    if id_exploitant is not None:
        statement = statement.where(Subdivision.id_exploitant == id_exploitant)
    if id_type_fermage is not None:
        statement = statement.where(Subdivision.id_type_fermage == id_type_fermage)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(
        Subdivision.id_parcelle, Subdivision.division, Subdivision.subdivision
    ).offset(skip).limit(limit)
    subdivisions = session.exec(statement).all()
    return list(subdivisions), count


def get_subdivision(*, session: Session, subdivision_id: int) -> Subdivision | None:
    return session.get(Subdivision, subdivision_id)


def get_subdivisions_by_parcelle(
    *, session: Session, parcelle_id: int
) -> list[Subdivision]:
    """Get all subdivisions for a specific parcelle."""
    statement = (
        select(Subdivision)
        .where(Subdivision.id_parcelle == parcelle_id)
        .order_by(Subdivision.division, Subdivision.subdivision)
    )
    return list(session.exec(statement).all())


def create_subdivision(
    *, session: Session, subdivision_in: SubdivisionCreate
) -> Subdivision:
    db_obj = Subdivision.model_validate(subdivision_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_subdivision(
    *, session: Session, db_subdivision: Subdivision, subdivision_in: SubdivisionUpdate
) -> Subdivision:
    subdivision_data = subdivision_in.model_dump(exclude_unset=True)
    db_subdivision.sqlmodel_update(subdivision_data)
    session.add(db_subdivision)
    session.commit()
    session.refresh(db_subdivision)
    return db_subdivision


def delete_subdivision(*, session: Session, subdivision_id: int) -> bool:
    db_subdivision = session.get(Subdivision, subdivision_id)
    if db_subdivision:
        session.delete(db_subdivision)
        session.commit()
        return True
    return False
