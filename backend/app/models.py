"""
SCTL/GERSA Database Models

Based on original C++ Builder (Sctl/) and Delphi (D3Dev/Ghis/) applications.
Two main databases:
- TSL.mdb: Shareholders, shares, movements, acts
- Sctl-Gfa.mdb: Cadastre, rents, parcels
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import IntEnum
from typing import TYPE_CHECKING, Optional

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    pass  # Forward references handled via string annotations


# =============================================================================
# ENUMS - Structure Types
# =============================================================================

class TypeStructure(IntEnum):
    """Types de structures juridiques (from Main.h)"""
    ALL_TYPES = 0      # Tous les types (filtre désactivé)
    GFA = 2            # Groupement Foncier Agricole
    ASSOC = 5          # Association
    TSL = 6            # Terres Solidaires du Larzac


# =============================================================================
# USER MODELS (Authentication - kept from template)
# =============================================================================

class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str


class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# =============================================================================
# REFERENCE TABLES (Lookup tables)
# =============================================================================

# --- Structure (Libelle table) ---

class StructureBase(SQLModel):
    """Structure juridique (GFA, TSL, Association)"""
    nom_structure: str = Field(max_length=100, description="Nom de la structure")
    type_structure: int = Field(default=TypeStructure.GFA, description="Type: 2=GFA, 5=ASSOC, 6=TSL")
    gfa: str | None = Field(default=None, max_length=50, description="Code GFA associé")


class StructureCreate(StructureBase):
    pass


class StructureUpdate(SQLModel):
    nom_structure: str | None = Field(default=None, max_length=100)
    type_structure: int | None = None
    gfa: str | None = Field(default=None, max_length=50)


class Structure(StructureBase, table=True):
    __tablename__ = "structures"

    id: int = Field(default=None, primary_key=True)

    # Relationships
    actes: list["Acte"] = Relationship(back_populates="structure")
    personnes: list["Personne"] = Relationship(back_populates="structure")


class StructurePublic(StructureBase):
    id: int


class StructuresPublic(SQLModel):
    data: list[StructurePublic]
    count: int


# --- Type Apport ---

class TypeApportBase(SQLModel):
    """Type d'apport (Numéraire, Nature, etc.)"""
    libelle: str = Field(max_length=100)


class TypeApportCreate(TypeApportBase):
    pass


class TypeApportUpdate(SQLModel):
    libelle: str | None = Field(default=None, max_length=100)


class TypeApport(TypeApportBase, table=True):
    __tablename__ = "types_apport"

    id: int = Field(default=None, primary_key=True)

    mouvements: list["Mouvement"] = Relationship(back_populates="type_apport")


class TypeApportPublic(TypeApportBase):
    id: int


class TypesApportPublic(SQLModel):
    data: list[TypeApportPublic]
    count: int


# --- Type Remboursement ---

class TypeRemboursementBase(SQLModel):
    """Type de remboursement"""
    libelle: str = Field(max_length=100)


class TypeRemboursementCreate(TypeRemboursementBase):
    pass


class TypeRemboursementUpdate(SQLModel):
    libelle: str | None = Field(default=None, max_length=100)


class TypeRemboursement(TypeRemboursementBase, table=True):
    __tablename__ = "types_remboursement"

    id: int = Field(default=None, primary_key=True)

    mouvements: list["Mouvement"] = Relationship(back_populates="type_remboursement")


class TypeRemboursementPublic(TypeRemboursementBase):
    id: int


class TypesRemboursementPublic(SQLModel):
    data: list[TypeRemboursementPublic]
    count: int


# =============================================================================
# ACTE (Legal Acts)
# =============================================================================

class ActeBase(SQLModel):
    """Acte juridique"""
    code_acte: str = Field(max_length=50, index=True, description="Code court (ex: AGE2024)")
    date_acte: date | None = Field(default=None, description="Date de l'acte")
    libelle_acte: str | None = Field(default=None, max_length=255, description="Description")
    provisoire: bool = Field(default=False, description="Acte provisoire")


class ActeCreate(ActeBase):
    id_structure: int | None = Field(default=None, foreign_key="structures.id")


class ActeUpdate(SQLModel):
    code_acte: str | None = Field(default=None, max_length=50)
    date_acte: date | None = None
    libelle_acte: str | None = Field(default=None, max_length=255)
    id_structure: int | None = None
    provisoire: bool | None = None


class Acte(ActeBase, table=True):
    __tablename__ = "actes"

    id: int = Field(default=None, primary_key=True)
    id_structure: int | None = Field(default=None, foreign_key="structures.id")

    # Relationships
    structure: Structure | None = Relationship(back_populates="actes")
    mouvements: list["Mouvement"] = Relationship(back_populates="acte")


class ActePublic(ActeBase):
    id: int
    id_structure: int | None


class ActesPublic(SQLModel):
    data: list[ActePublic]
    count: int


# =============================================================================
# PERSONNE (Shareholder - Actionnaire)
# =============================================================================

class PersonneBase(SQLModel):
    """Actionnaire (personne physique ou morale)"""
    # Identity
    civilite: str | None = Field(default=None, max_length=20, description="M., Mme, etc.")
    nom: str = Field(max_length=100, index=True)
    prenom: str | None = Field(default=None, max_length=100)

    # Address
    adresse: str | None = Field(default=None, max_length=255)
    adresse2: str | None = Field(default=None, max_length=255)
    code_postal: str | None = Field(default=None, max_length=15)
    ville: str | None = Field(default=None, max_length=100)

    # Contact
    tel: str | None = Field(default=None, max_length=50, description="Téléphone fixe")
    port: str | None = Field(default=None, max_length=50, description="Portable")
    fax: str | None = Field(default=None, max_length=50)
    mail: str | None = Field(default=None, max_length=255)

    # Notes
    comment: str | None = Field(default=None, description="Commentaires libres")
    divers: str | None = Field(default=None, description="Informations diverses")

    # Boolean flags (état)
    npai: bool = Field(default=False, description="N'habite Pas à l'Adresse Indiquée")
    decede: bool = Field(default=False, description="Personne décédée")
    cr: bool = Field(default=False, description="Courrier Retourné")
    pas_convoc_ag: bool = Field(default=False, description="Ne pas convoquer aux AG")
    pas_convoc_tsl: bool = Field(default=False, description="Ne pas convoquer TSL")
    termine: bool = Field(default=False, description="Dossier terminé (soldé)")

    # Member type flags
    fondateur: bool = Field(default=False, description="Membre fondateur")
    de_droit: bool = Field(default=False, description="Membre de droit")
    adherent: bool = Field(default=False, description="Adhérent")
    mis_doffice: bool = Field(default=False, description="Mis d'office")

    # Other flags
    est_personne_morale: bool = Field(default=False, description="Personne morale (vs physique)")
    dcd_notarie: bool = Field(default=False, description="Décès notarié")
    apport: bool = Field(default=False, description="A fait un apport")
    cni: bool = Field(default=False, description="Carte d'identité fournie")


class PersonneCreate(PersonneBase):
    id_structure: int | None = Field(default=None, description="Structure principale")
    id_personne_morale: int | None = Field(default=None, description="Si membre d'une personne morale")


class PersonneUpdate(SQLModel):
    civilite: str | None = Field(default=None, max_length=20)
    nom: str | None = Field(default=None, max_length=100)
    prenom: str | None = Field(default=None, max_length=100)
    adresse: str | None = Field(default=None, max_length=255)
    adresse2: str | None = Field(default=None, max_length=255)
    code_postal: str | None = Field(default=None, max_length=15)
    ville: str | None = Field(default=None, max_length=100)
    tel: str | None = Field(default=None, max_length=50)
    port: str | None = Field(default=None, max_length=50)
    fax: str | None = Field(default=None, max_length=50)
    mail: str | None = Field(default=None, max_length=255)
    comment: str | None = None
    divers: str | None = None
    npai: bool | None = None
    decede: bool | None = None
    cr: bool | None = None
    pas_convoc_ag: bool | None = None
    pas_convoc_tsl: bool | None = None
    termine: bool | None = None
    fondateur: bool | None = None
    de_droit: bool | None = None
    adherent: bool | None = None
    mis_doffice: bool | None = None
    est_personne_morale: bool | None = None
    dcd_notarie: bool | None = None
    apport: bool | None = None
    cni: bool | None = None
    id_structure: int | None = None
    id_personne_morale: int | None = None


class Personne(PersonneBase, table=True):
    __tablename__ = "personnes"

    id: int = Field(default=None, primary_key=True)
    id_structure: int | None = Field(default=None, foreign_key="structures.id")
    id_personne_morale: int | None = Field(default=None, foreign_key="personnes.id")

    # Relationships
    structure: Structure | None = Relationship(back_populates="personnes")
    mouvements: list["Mouvement"] = Relationship(back_populates="personne")
    numeros_parts: list["NumeroPart"] = Relationship(back_populates="personne")

    # Self-referential for personne morale members
    membres: list["Personne"] = Relationship(
        back_populates="personne_morale",
        sa_relationship_kwargs={"foreign_keys": "[Personne.id_personne_morale]"}
    )
    personne_morale: Optional["Personne"] = Relationship(
        back_populates="membres",
        sa_relationship_kwargs={"foreign_keys": "[Personne.id_personne_morale]", "remote_side": "[Personne.id]"}
    )


class PersonnePublic(PersonneBase):
    id: int
    id_structure: int | None
    id_personne_morale: int | None


class PersonnesPublic(SQLModel):
    data: list[PersonnePublic]
    count: int


# =============================================================================
# MOUVEMENT (Movement history)
# =============================================================================

class MouvementBase(SQLModel):
    """Mouvement de parts (acquisition/cession)"""
    date_operation: date | None = Field(default=None)
    sens: bool = Field(default=True, description="true=acquisition (+), false=cession (-)")
    nb_parts: int = Field(default=0, description="Nombre de parts concernées")


class MouvementCreate(MouvementBase):
    id_personne: int = Field(foreign_key="personnes.id")
    id_acte: int | None = Field(default=None, foreign_key="actes.id")
    id_type_apport: int | None = Field(default=None, foreign_key="types_apport.id")
    id_type_remboursement: int | None = Field(default=None, foreign_key="types_remboursement.id")


class MouvementUpdate(SQLModel):
    date_operation: date | None = None
    sens: bool | None = None
    nb_parts: int | None = None
    id_personne: int | None = None
    id_acte: int | None = None
    id_type_apport: int | None = None
    id_type_remboursement: int | None = None


class Mouvement(MouvementBase, table=True):
    __tablename__ = "mouvements"

    id: int = Field(default=None, primary_key=True)
    id_personne: int = Field(foreign_key="personnes.id")
    id_acte: int | None = Field(default=None, foreign_key="actes.id")
    id_type_apport: int | None = Field(default=None, foreign_key="types_apport.id")
    id_type_remboursement: int | None = Field(default=None, foreign_key="types_remboursement.id")

    # Relationships
    personne: Personne = Relationship(back_populates="mouvements")
    acte: Acte | None = Relationship(back_populates="mouvements")
    type_apport: TypeApport | None = Relationship(back_populates="mouvements")
    type_remboursement: TypeRemboursement | None = Relationship(back_populates="mouvements")
    numeros_parts: list["NumeroPart"] = Relationship(back_populates="mouvement")


class MouvementPublic(MouvementBase):
    id: int
    id_personne: int
    id_acte: int | None
    id_type_apport: int | None
    id_type_remboursement: int | None


class MouvementsPublic(SQLModel):
    data: list[MouvementPublic]
    count: int


# =============================================================================
# NUMERO PART (Share numbers)
# =============================================================================

class NumeroPartBase(SQLModel):
    """Numéro de part sociale"""
    num_part: int = Field(index=True, description="Numéro de la part (1, 2, 3...)")
    termine: bool = Field(default=False, description="Part terminée/soldée")
    distribue: bool = Field(default=False, description="Part distribuée")
    etat: int = Field(default=0, description="Code d'état de la part")


class NumeroPartCreate(NumeroPartBase):
    id_personne: int = Field(foreign_key="personnes.id")
    id_mouvement: int | None = Field(default=None, foreign_key="mouvements.id")
    id_structure: int | None = Field(default=None, foreign_key="structures.id")


class NumeroPartUpdate(SQLModel):
    num_part: int | None = None
    termine: bool | None = None
    distribue: bool | None = None
    etat: int | None = None
    id_personne: int | None = None
    id_mouvement: int | None = None
    id_structure: int | None = None


class NumeroPart(NumeroPartBase, table=True):
    __tablename__ = "numeros_parts"

    id: int = Field(default=None, primary_key=True)
    id_personne: int = Field(foreign_key="personnes.id")
    id_mouvement: int | None = Field(default=None, foreign_key="mouvements.id")
    id_structure: int | None = Field(default=None, foreign_key="structures.id")

    # Relationships
    personne: Personne = Relationship(back_populates="numeros_parts")
    mouvement: Mouvement | None = Relationship(back_populates="numeros_parts")
    structure: Structure | None = Relationship()


class NumeroPartPublic(NumeroPartBase):
    id: int
    id_personne: int
    id_mouvement: int | None
    id_structure: int | None


class NumeroPartsPublic(SQLModel):
    data: list[NumeroPartPublic]
    count: int


# =============================================================================
# CADASTRE REFERENCE TABLES
# =============================================================================

# --- Commune ---

class CommuneBase(SQLModel):
    """Commune"""
    num_com: str = Field(max_length=10, index=True, description="Numéro de commune")
    nom_com: str = Field(max_length=100, description="Nom de la commune")


class CommuneCreate(CommuneBase):
    pass


class CommuneUpdate(SQLModel):
    num_com: str | None = Field(default=None, max_length=10)
    nom_com: str | None = Field(default=None, max_length=100)


class Commune(CommuneBase, table=True):
    __tablename__ = "communes"

    id: int = Field(default=None, primary_key=True)

    lieux_dits: list["LieuDit"] = Relationship(back_populates="commune")
    parcelles: list["Parcelle"] = Relationship(back_populates="commune")
    subdivisions: list["Subdivision"] = Relationship(back_populates="commune")


class CommunePublic(CommuneBase):
    id: int


class CommunesPublic(SQLModel):
    data: list[CommunePublic]
    count: int


# --- LieuDit ---

class LieuDitBase(SQLModel):
    """Lieu-dit"""
    nom: str = Field(max_length=100)


class LieuDitCreate(LieuDitBase):
    id_commune: int = Field(foreign_key="communes.id")


class LieuDitUpdate(SQLModel):
    nom: str | None = Field(default=None, max_length=100)
    id_commune: int | None = None


class LieuDit(LieuDitBase, table=True):
    __tablename__ = "lieux_dits"

    id: int = Field(default=None, primary_key=True)
    id_commune: int = Field(foreign_key="communes.id")

    commune: Commune = Relationship(back_populates="lieux_dits")
    parcelles: list["Parcelle"] = Relationship(back_populates="lieu_dit")
    subdivisions: list["Subdivision"] = Relationship(back_populates="lieu_dit")


class LieuDitPublic(LieuDitBase):
    id: int
    id_commune: int


class LieuxDitsPublic(SQLModel):
    data: list[LieuDitPublic]
    count: int


# --- Exploitant ---

class ExploitantBase(SQLModel):
    """Exploitant agricole"""
    nom: str = Field(max_length=100, index=True)
    prenom: str | None = Field(default=None, max_length=100)
    adresse: str | None = Field(default=None, max_length=255)
    code_postal: str | None = Field(default=None, max_length=10)
    ville: str | None = Field(default=None, max_length=100)
    tel: str | None = Field(default=None, max_length=20)
    mail: str | None = Field(default=None, max_length=255)


class ExploitantCreate(ExploitantBase):
    pass


class ExploitantUpdate(SQLModel):
    nom: str | None = Field(default=None, max_length=100)
    prenom: str | None = Field(default=None, max_length=100)
    adresse: str | None = Field(default=None, max_length=255)
    code_postal: str | None = Field(default=None, max_length=10)
    ville: str | None = Field(default=None, max_length=100)
    tel: str | None = Field(default=None, max_length=20)
    mail: str | None = Field(default=None, max_length=255)


class Exploitant(ExploitantBase, table=True):
    __tablename__ = "exploitants"

    id: int = Field(default=None, primary_key=True)

    subdivisions: list["Subdivision"] = Relationship(back_populates="exploitant")


class ExploitantPublic(ExploitantBase):
    id: int


class ExploitantsPublic(SQLModel):
    data: list[ExploitantPublic]
    count: int


# --- Type Cadastre ---

class TypeCadastreBase(SQLModel):
    """Type cadastral"""
    libelle: str = Field(max_length=100)
    code: str | None = Field(default=None, max_length=10)


class TypeCadastreCreate(TypeCadastreBase):
    pass


class TypeCadastreUpdate(SQLModel):
    libelle: str | None = Field(default=None, max_length=100)
    code: str | None = Field(default=None, max_length=10)


class TypeCadastre(TypeCadastreBase, table=True):
    __tablename__ = "types_cadastre"

    id: int = Field(default=None, primary_key=True)

    parcelles: list["Parcelle"] = Relationship(back_populates="type_cadastre")
    subdivisions: list["Subdivision"] = Relationship(back_populates="type_cadastre")


class TypeCadastrePublic(TypeCadastreBase):
    id: int


class TypesCadastrePublic(SQLModel):
    data: list[TypeCadastrePublic]
    count: int


# --- Classe Cadastre ---

class ClasseCadastreBase(SQLModel):
    """Classe cadastrale"""
    libelle: str = Field(max_length=100)
    code: str | None = Field(default=None, max_length=10)


class ClasseCadastreCreate(ClasseCadastreBase):
    pass


class ClasseCadastreUpdate(SQLModel):
    libelle: str | None = Field(default=None, max_length=100)
    code: str | None = Field(default=None, max_length=10)


class ClasseCadastre(ClasseCadastreBase, table=True):
    __tablename__ = "classes_cadastre"

    id: int = Field(default=None, primary_key=True)

    parcelles: list["Parcelle"] = Relationship(back_populates="classe_cadastre")
    subdivisions: list["Subdivision"] = Relationship(back_populates="classe_cadastre")


class ClasseCadastrePublic(ClasseCadastreBase):
    id: int


class ClassesCadastrePublic(SQLModel):
    data: list[ClasseCadastrePublic]
    count: int


# --- Type Fermage ---

class TypeFermageBase(SQLModel):
    """Type de fermage"""
    libelle: str = Field(max_length=100)


class TypeFermageCreate(TypeFermageBase):
    pass


class TypeFermageUpdate(SQLModel):
    libelle: str | None = Field(default=None, max_length=100)


class TypeFermage(TypeFermageBase, table=True):
    __tablename__ = "types_fermage"

    id: int = Field(default=None, primary_key=True)

    subdivisions: list["Subdivision"] = Relationship(back_populates="type_fermage")


class TypeFermagePublic(TypeFermageBase):
    id: int


class TypesFermagePublic(SQLModel):
    data: list[TypeFermagePublic]
    count: int


# --- Valeur Points ---

class ValeurPointBase(SQLModel):
    """Valeur des points fermage"""
    annee: int = Field(index=True, description="Année de la valeur")
    valeur_point_gfa: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=4)
    valeur_point_sctl: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=4)
    valeur_supp_gfa: Decimal = Field(default=Decimal("0"), max_digits=5, decimal_places=2, description="% supplément durée GFA")
    valeur_supp_sctl: Decimal = Field(default=Decimal("0"), max_digits=5, decimal_places=2, description="% supplément durée SCTL")


class ValeurPointCreate(ValeurPointBase):
    pass


class ValeurPointUpdate(SQLModel):
    annee: int | None = None
    valeur_point_gfa: Decimal | None = None
    valeur_point_sctl: Decimal | None = None
    valeur_supp_gfa: Decimal | None = None
    valeur_supp_sctl: Decimal | None = None


class ValeurPoint(ValeurPointBase, table=True):
    __tablename__ = "valeurs_points"

    id: int = Field(default=None, primary_key=True)


class ValeurPointPublic(ValeurPointBase):
    id: int


class ValeursPointsPublic(SQLModel):
    data: list[ValeurPointPublic]
    count: int


# =============================================================================
# PARCELLE (Cadastral parcel with rent data)
# =============================================================================

class ParcelleBase(SQLModel):
    """Parcelle cadastrale (sans données de subdivision/fermage)"""
    # Cadastral identification
    parcelle: str = Field(max_length=50, index=True, description="Référence cadastrale")

    # Ownership
    sctl: bool = Field(default=False, description="Appartient à la SCTL")
    comment: str | None = Field(default=None, description="Commentaires")


class ParcelleCreate(ParcelleBase):
    id_commune: int = Field(foreign_key="communes.id")
    id_lieu_dit: int | None = Field(default=None, foreign_key="lieux_dits.id")
    id_type_cadastre: int | None = Field(default=None, foreign_key="types_cadastre.id")
    id_classe_cadastre: int | None = Field(default=None, foreign_key="classes_cadastre.id")
    id_gfa: int | None = Field(default=None, foreign_key="structures.id")


class ParcelleUpdate(SQLModel):
    parcelle: str | None = Field(default=None, max_length=50)
    sctl: bool | None = None
    comment: str | None = None
    id_commune: int | None = None
    id_lieu_dit: int | None = None
    id_type_cadastre: int | None = None
    id_classe_cadastre: int | None = None
    id_gfa: int | None = None


class Parcelle(ParcelleBase, table=True):
    __tablename__ = "parcelles"

    id: int = Field(default=None, primary_key=True)
    id_commune: int = Field(foreign_key="communes.id")
    id_lieu_dit: int | None = Field(default=None, foreign_key="lieux_dits.id")
    id_type_cadastre: int | None = Field(default=None, foreign_key="types_cadastre.id")
    id_classe_cadastre: int | None = Field(default=None, foreign_key="classes_cadastre.id")
    id_gfa: int | None = Field(default=None, foreign_key="structures.id")

    # Relationships
    commune: Commune = Relationship(back_populates="parcelles")
    lieu_dit: LieuDit | None = Relationship(back_populates="parcelles")
    type_cadastre: TypeCadastre | None = Relationship(back_populates="parcelles")
    classe_cadastre: ClasseCadastre | None = Relationship(back_populates="parcelles")
    gfa: Structure | None = Relationship()
    subdivisions: list["Subdivision"] = Relationship(back_populates="parcelle")


class ParcellePublic(ParcelleBase):
    id: int
    id_commune: int
    id_lieu_dit: int | None
    id_type_cadastre: int | None
    id_classe_cadastre: int | None
    id_gfa: int | None


class ParcellesPublic(SQLModel):
    data: list[ParcellePublic]
    count: int


# =============================================================================
# SUBDIVISION (Parcelle subdivisions with fermage/exploitant data)
# =============================================================================

class SubdivisionBase(SQLModel):
    """Subdivision de parcelle avec données de fermage"""
    # Division identifiers
    division: int = Field(default=0, description="Numéro de division")
    subdivision: int = Field(default=0, description="Numéro de subdivision")

    # Surface and revenue
    surface: Decimal = Field(default=Decimal("0"), max_digits=15, decimal_places=4, description="Surface en hectares")
    revenu: Decimal = Field(default=Decimal("0"), max_digits=15, decimal_places=4, description="Revenu cadastral")

    # GFA code
    gfa: str | None = Field(default=None, max_length=10, description="Code GFA")

    # Fermage data
    duree_fermage: int = Field(default=0, description="Durée du fermage en années")
    point_fermage: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=4, description="Points de fermage")


class SubdivisionCreate(SubdivisionBase):
    id_parcelle: int = Field(foreign_key="parcelles.id")
    id_exploitant: int | None = Field(default=None, foreign_key="exploitants.id")
    id_type_fermage: int | None = Field(default=None, foreign_key="types_fermage.id")
    id_type_cadastre: int | None = Field(default=None, foreign_key="types_cadastre.id")
    id_classe_cadastre: int | None = Field(default=None, foreign_key="classes_cadastre.id")
    id_commune: int | None = Field(default=None, foreign_key="communes.id")
    id_lieu_dit: int | None = Field(default=None, foreign_key="lieux_dits.id")


class SubdivisionUpdate(SQLModel):
    division: int | None = None
    subdivision: int | None = None
    surface: Decimal | None = None
    revenu: Decimal | None = None
    gfa: str | None = Field(default=None, max_length=10)
    duree_fermage: int | None = None
    point_fermage: Decimal | None = None
    id_parcelle: int | None = None
    id_exploitant: int | None = None
    id_type_fermage: int | None = None
    id_type_cadastre: int | None = None
    id_classe_cadastre: int | None = None
    id_commune: int | None = None
    id_lieu_dit: int | None = None


class Subdivision(SubdivisionBase, table=True):
    __tablename__ = "subdivisions"

    id: int = Field(default=None, primary_key=True)
    id_parcelle: int = Field(foreign_key="parcelles.id")
    id_exploitant: int | None = Field(default=None, foreign_key="exploitants.id")
    id_type_fermage: int | None = Field(default=None, foreign_key="types_fermage.id")
    id_type_cadastre: int | None = Field(default=None, foreign_key="types_cadastre.id")
    id_classe_cadastre: int | None = Field(default=None, foreign_key="classes_cadastre.id")
    id_commune: int | None = Field(default=None, foreign_key="communes.id")
    id_lieu_dit: int | None = Field(default=None, foreign_key="lieux_dits.id")

    # Relationships
    parcelle: Parcelle = Relationship(back_populates="subdivisions")
    exploitant: Exploitant | None = Relationship(back_populates="subdivisions")
    type_fermage: TypeFermage | None = Relationship(back_populates="subdivisions")
    type_cadastre: TypeCadastre | None = Relationship(back_populates="subdivisions")
    classe_cadastre: ClasseCadastre | None = Relationship(back_populates="subdivisions")
    commune: Commune | None = Relationship(back_populates="subdivisions")
    lieu_dit: LieuDit | None = Relationship(back_populates="subdivisions")


class SubdivisionPublic(SubdivisionBase):
    id: int
    id_parcelle: int
    id_exploitant: int | None
    id_type_fermage: int | None
    id_type_cadastre: int | None
    id_classe_cadastre: int | None
    id_commune: int | None
    id_lieu_dit: int | None


class SubdivisionsPublic(SQLModel):
    data: list[SubdivisionPublic]
    count: int


# =============================================================================
# GENERIC MODELS
# =============================================================================

class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# =============================================================================
# COMPUTED / AGGREGATE MODELS (for API responses)
# =============================================================================

class PersonneWithParts(PersonnePublic):
    """Personne avec le nombre total de parts"""
    nb_parts_gfa: int = 0
    nb_parts_sctl: int = 0
    nb_parts_total: int = 0


class PersonnesWithPartsPublic(SQLModel):
    data: list[PersonneWithParts]
    count: int


class MouvementWithDetails(MouvementPublic):
    """Mouvement avec détails de l'actionnaire et de l'acte"""
    personne_nom: str | None = None
    personne_prenom: str | None = None
    code_acte: str | None = None
    date_acte: date | None = None
    # Liste des numéros de parts concernés (limité à 10 max pour l'affichage)
    numeros_parts: list[int] = []
    numeros_parts_count: int = 0  # Nombre total de parts liées


class MouvementsWithDetailsPublic(SQLModel):
    data: list[MouvementWithDetails]
    count: int


class SubdivisionSummary(SQLModel):
    """Résumé d'une subdivision pour affichage dans la liste des parcelles"""
    id: int
    division: int
    subdivision: int
    surface: Decimal = Decimal("0")
    nom_exploitant: str | None = None
    id_exploitant: int | None = None


class ParcelleWithSubdivisions(ParcellePublic):
    """Parcelle avec subdivisions et détails pour affichage liste"""
    nom_commune: str | None = None
    nom_lieu_dit: str | None = None
    # Aggregated subdivision data
    total_surface: Decimal = Decimal("0")
    nb_subdivisions: int = 0
    # First subdivision info (for display when only 1)
    first_division: int | None = None
    first_exploitant: str | None = None
    first_exploitant_id: int | None = None
    # All subdivisions
    subdivisions: list[SubdivisionSummary] = []


class ParcellesWithSubdivisionsPublic(SQLModel):
    data: list[ParcelleWithSubdivisions]
    count: int


class ParcelleWithDetails(ParcellePublic):
    """Parcelle avec détails calculés"""
    nom_commune: str | None = None
    nom_lieu_dit: str | None = None
    nom_exploitant: str | None = None
    montant_fermage: Decimal = Decimal("0")


class ParcellesWithDetailsPublic(SQLModel):
    data: list[ParcelleWithDetails]
    count: int


class FermageTotaux(SQLModel):
    """Totaux des fermages"""
    total_surface: Decimal = Decimal("0")
    total_revenu: Decimal = Decimal("0")
    total_montant: Decimal = Decimal("0")
    nb_parcelles: int = 0


class PartsTotaux(SQLModel):
    """Totaux globaux des parts par structure"""
    gfa: int = 0
    sctl: int = 0
    total: int = 0
    actionnaires: int = 0


class NumeroPartWithDetails(NumeroPartPublic):
    """NumeroPart avec noms de la personne et de la structure, et détails du mouvement"""
    personne_nom: str | None = None
    personne_prenom: str | None = None
    structure_nom: str | None = None
    # Détails du mouvement associé
    mouvement_sens: bool | None = None
    mouvement_date: date | None = None
    mouvement_code_acte: str | None = None


class NumeroPartsWithDetailsPublic(SQLModel):
    data: list[NumeroPartWithDetails]
    count: int


class ActeWithDetails(ActePublic):
    """Acte avec nom de la structure"""
    structure_nom: str | None = None


class ActesWithDetailsPublic(SQLModel):
    data: list[ActeWithDetails]
    count: int
