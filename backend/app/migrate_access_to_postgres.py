#!/usr/bin/env python3
"""
Migration script to convert Access .mdb databases to PostgreSQL.

This script migrates data from the original GERSA Access databases:
- TSL.mdb: Contains shareholders data (Personnes, Mouvements, NumeroParts, Actes)
- Sctl-Gfa.mdb: Contains cadastre data (Parcelles, Communes, LieuxDits, etc.)

Requirements:
    - mdbtools: Install via `brew install mdbtools` on macOS
    - Python packages: psycopg

Usage:
    python migrate_access_to_postgres.py --tsl-db /path/to/TSL.mdb --cadastre-db /path/to/Sctl-Gfa.mdb

Or set environment variables:
    TSL_MDB_PATH=/path/to/TSL.mdb
    CADASTRE_MDB_PATH=/path/to/Sctl-Gfa.mdb
"""

import argparse
import csv
import os
import subprocess
import sys
from datetime import datetime
from decimal import Decimal, InvalidOperation
from io import StringIO

try:
    import psycopg
except ImportError:
    print("Error: psycopg not installed. Run: pip install psycopg")
    sys.exit(1)

# Database connection settings
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/app"
)


def check_mdbtools():
    """Check if mdbtools is installed."""
    try:
        subprocess.run(
            ["mdb-tables", "--version"],
            capture_output=True,
            check=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def get_mdb_tables(mdb_path: str) -> list[str]:
    """Get list of tables from Access database."""
    result = subprocess.run(
        ["mdb-tables", "-1", mdb_path],
        capture_output=True,
        text=True,
        check=True,
    )
    return [t.strip() for t in result.stdout.strip().split("\n") if t.strip()]


def export_mdb_table_to_csv(mdb_path: str, table_name: str) -> str:
    """Export Access table to CSV string."""
    result = subprocess.run(
        ["mdb-export", "-D", "%Y-%m-%d %H:%M:%S", mdb_path, table_name],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def parse_csv_data(csv_data: str) -> tuple[list[str], list[dict]]:
    """Parse CSV data into column names and rows."""
    reader = csv.DictReader(StringIO(csv_data))
    rows = list(reader)
    columns = reader.fieldnames or []
    return columns, rows


def convert_value(value: str, target_type: str):
    """Convert string value to appropriate Python type."""
    if value == "" or value is None:
        return None

    if target_type == "boolean":
        return value.lower() in ("true", "1", "yes", "oui", "-1")
    elif target_type == "integer":
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    elif target_type == "decimal":
        try:
            return Decimal(value.replace(",", "."))
        except (ValueError, InvalidOperation):
            return None
    elif target_type == "date":
        try:
            # Handle datetime format from mdb-export
            date_part = value.split(" ")[0] if " " in value else value
            # Try multiple date formats
            for fmt in ["%Y-%m-%d", "%m/%d/%y", "%d/%m/%y", "%m/%d/%Y", "%d/%m/%Y"]:
                try:
                    return datetime.strptime(date_part, fmt).date()
                except ValueError:
                    continue
            return None
        except ValueError:
            return None
    elif target_type == "datetime":
        try:
            return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                return datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                return None
    else:
        return value


def insert_batch(conn, table_name: str, columns: list[str], values: list[tuple]) -> int:
    """Insert a batch of values into a PostgreSQL table."""
    if not values:
        return 0

    columns_str = ", ".join(columns)
    placeholders = ", ".join(["%s"] * len(columns))
    insert_sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

    inserted = 0
    with conn.cursor() as cur:
        for v in values:
            try:
                cur.execute(insert_sql, v)
                inserted += 1
            except Exception as e:
                print(f"    Error inserting row: {e}")
                conn.rollback()
                continue
    conn.commit()
    return inserted


def migrate_structures(conn, mdb_path: str):
    """Migrate structures from Libelle table in TSL.mdb.

    Structures are defined in the Libelle table with TypeLibelle:
    - 2 = GFA (IDs 11-14: GFA1, GFA2, GFA3, GFA4)
    - 5 = Association (IDs 39-42: Assoc 1-4)
    - 6 = TSL (IDs 43-46: TSL 1-4)

    IMPORTANT: The old Gfa table contains shareholder data, NOT structures!
    """
    print("  Migrating structures (from Libelle table)...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Libelle")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # Type mapping: TypeLibelle -> type_structure
    # TYPE_GFA = 2, TYPE_ASSOC = 5, TYPE_TSL = 6
    valid_types = {2, 5, 6}

    values = []
    for row in rows:
        type_libelle = convert_value(row.get("TypeLibelle", ""), "integer")

        # Only process structure types (GFA, ASSOC, TSL)
        if type_libelle not in valid_types:
            continue

        id_libelle = convert_value(row.get("IdLibelle", ""), "integer")
        nom = row.get("Libelle", "").strip()

        # Determine GFA code for GFA structures (IDs 11-14)
        gfa_code = ""
        if type_libelle == 2 and id_libelle in (11, 12, 13, 14):
            gfa_code = nom  # e.g., "GFA1", "GFA2", etc.

        values.append((
            id_libelle,
            nom,
            type_libelle,
            gfa_code,
        ))

    count = insert_batch(conn, "structures", ["id", "nom_structure", "type_structure", "gfa"], values)
    print(f"    Inserted {count} structures (GFA: 11-14, Assoc: 39-42, TSL: 43-46)")


def migrate_personnes(conn, mdb_path: str):
    """Migrate Personnes from TSL.mdb.

    Two-phase migration:
    1. Insert all personnes without id_personne_morale (to avoid FK violations)
    2. Update id_personne_morale for those who have it
    """
    print("  Migrating personnes...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Personnes")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # Map civilite IDs to strings
    civilite_map = {1: "M.", 2: "Mme", 3: "Mlle", 4: "M. et Mme", 5: ""}

    # Phase 1: Collect data WITHOUT id_personne_morale
    values = []
    personne_morale_links = []  # (id, id_personne_morale) for phase 2

    for row in rows:
        id_civilite = convert_value(row.get("IdCivilite", ""), "integer")
        civilite = civilite_map.get(id_civilite, "")
        personne_id = convert_value(row.get("IdPersonne", ""), "integer")
        id_pers_morale = convert_value(row.get("IdPersMorale", ""), "integer")

        # Save id_personne_morale link for phase 2
        if id_pers_morale:
            personne_morale_links.append((personne_id, id_pers_morale))

        values.append((
            personne_id,
            None,  # id_structure - will need to be set based on business logic
            None,  # id_personne_morale - will be set in phase 2
            civilite,
            row.get("Nom", "").strip() or "INCONNU",
            row.get("Prenom", "").strip(),
            row.get("Adresse", "").strip(),
            row.get("Adresse2", "").strip(),
            row.get("CodePostal", "").strip(),
            row.get("Ville", "").strip(),
            row.get("Tel", "").strip(),
            None,  # port (portable)
            row.get("Fax", "").strip(),
            row.get("Mail", "").strip(),
            row.get("Commentaire", "").strip(),
            None,  # divers
            convert_value(row.get("Npai", ""), "boolean"),
            convert_value(row.get("Decede", ""), "boolean"),
            convert_value(row.get("CR", ""), "boolean"),
            convert_value(row.get("PasconvocAG", ""), "boolean"),
            convert_value(row.get("PasConvocAGTsl", ""), "boolean"),
            convert_value(row.get("Fini", ""), "boolean"),  # termine
            convert_value(row.get("Fondateur", ""), "boolean"),
            convert_value(row.get("DeDroit", ""), "boolean"),
            convert_value(row.get("Adherent", ""), "boolean"),
            convert_value(row.get("MisOffice", ""), "boolean"),
            convert_value(row.get("EstPersonneMorale", ""), "boolean"),
            convert_value(row.get("dcdnotarie", ""), "boolean"),
            convert_value(row.get("ApportTerre", ""), "boolean"),
            convert_value(row.get("CNIFournie", ""), "boolean"),
        ))

    pg_columns = [
        "id", "id_structure", "id_personne_morale", "civilite", "nom", "prenom",
        "adresse", "adresse2", "code_postal", "ville", "tel", "port", "fax", "mail",
        "comment", "divers", "npai", "decede", "cr", "pas_convoc_ag", "pas_convoc_tsl",
        "termine", "fondateur", "de_droit", "adherent", "mis_doffice",
        "est_personne_morale", "dcd_notarie", "apport", "cni"
    ]

    count = insert_batch(conn, "personnes", pg_columns, values)
    print(f"    Phase 1: Inserted {count} personnes")

    # Phase 2: Update id_personne_morale links
    if personne_morale_links:
        print(f"    Phase 2: Updating {len(personne_morale_links)} personne_morale links...")
        updated = 0
        skipped = 0
        with conn.cursor() as cur:
            for personne_id, id_pers_morale in personne_morale_links:
                try:
                    cur.execute(
                        "UPDATE personnes SET id_personne_morale = %s WHERE id = %s",
                        (id_pers_morale, personne_id)
                    )
                    updated += 1
                except Exception as e:
                    skipped += 1
                    conn.rollback()
        conn.commit()
        print(f"    Phase 2: Updated {updated} links, skipped {skipped}")


def migrate_types_apport(conn, mdb_path: str):
    """Migrate types_apport from Libelle table in TSL.mdb (TypeLibelle=3)."""
    print("  Migrating types_apport (from Libelle table)...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Libelle")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        type_libelle = convert_value(row.get("TypeLibelle", ""), "integer")
        if type_libelle == 3:  # types_apport
            values.append((
                convert_value(row.get("IdLibelle", ""), "integer"),
                row.get("Libelle", "").strip() or "?",
            ))

    pg_columns = ["id", "libelle"]
    count = insert_batch(conn, "types_apport", pg_columns, values)
    print(f"    Inserted {count} types_apport")


def migrate_types_remboursement(conn, mdb_path: str):
    """Migrate types_remboursement from Libelle table in TSL.mdb (TypeLibelle=4)."""
    print("  Migrating types_remboursement (from Libelle table)...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Libelle")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        type_libelle = convert_value(row.get("TypeLibelle", ""), "integer")
        if type_libelle == 4:  # types_remboursement
            values.append((
                convert_value(row.get("IdLibelle", ""), "integer"),
                row.get("Libelle", "").strip() or "?",
            ))

    pg_columns = ["id", "libelle"]
    count = insert_batch(conn, "types_remboursement", pg_columns, values)
    print(f"    Inserted {count} types_remboursement")


def migrate_actes(conn, mdb_path: str):
    """Migrate Actes from TSL.mdb."""
    print("  Migrating actes...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Actes")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        id_gfa = convert_value(row.get("IdGfa", ""), "integer")
        code = row.get("Code", "").strip() or f"ACTE-{row.get('IdActe', '')}"
        definitif = convert_value(row.get("Definitif", ""), "boolean")

        values.append((
            convert_value(row.get("IdActe", ""), "integer"),
            id_gfa,  # id_structure
            code,
            convert_value(row.get("Date", ""), "date"),
            row.get("Commentaire", "").strip(),
            not definitif if definitif is not None else False,  # provisoire is inverse of Definitif
        ))

    pg_columns = ["id", "id_structure", "code_acte", "date_acte", "libelle_acte", "provisoire"]
    count = insert_batch(conn, "actes", pg_columns, values)
    print(f"    Inserted {count} actes")


def migrate_mouvements(conn, mdb_path: str):
    """Migrate Mouvements from TSL.mdb."""
    print("  Migrating mouvements...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Mouvements")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # Get existing personne IDs to validate FK
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM personnes")
        valid_personne_ids = {row[0] for row in cur.fetchall()}

    values = []
    skipped = 0
    for row in rows:
        id_personne = convert_value(row.get("IdPersonne", ""), "integer")

        # Skip if personne doesn't exist (FK would fail)
        if id_personne not in valid_personne_ids:
            skipped += 1
            continue

        mouvement = convert_value(row.get("Mouvement", ""), "boolean")
        id_type_apport = convert_value(row.get("IdTypeApport", ""), "integer")
        id_type_rembourse = convert_value(row.get("IdTypeRembourse", ""), "integer")
        id_acte = convert_value(row.get("IdActe", ""), "integer")

        # Convert 0 to None for FK fields (0 is not a valid FK reference)
        if id_type_apport == 0:
            id_type_apport = None
        if id_type_rembourse == 0:
            id_type_rembourse = None
        if id_acte == 0:
            id_acte = None

        values.append((
            convert_value(row.get("IdMouvement", ""), "integer"),
            id_personne,
            id_acte,
            id_type_apport,
            id_type_rembourse,
            convert_value(row.get("DateMvt", ""), "date"),
            mouvement if mouvement is not None else True,  # sens
            convert_value(row.get("NbParts", ""), "integer") or 0,
        ))

    if skipped:
        print(f"    Skipped {skipped} rows (missing personne reference)")

    pg_columns = [
        "id", "id_personne", "id_acte", "id_type_apport", "id_type_remboursement",
        "date_operation", "sens", "nb_parts"
    ]
    count = insert_batch(conn, "mouvements", pg_columns, values)
    print(f"    Inserted {count} mouvements")


def migrate_numeros_parts(conn, mdb_path: str):
    """Migrate NumeroParts from TSL.mdb."""
    print("  Migrating numeros_parts...")
    csv_data = export_mdb_table_to_csv(mdb_path, "NumeroParts")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # Get existing personne and mouvement IDs to validate FK
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM personnes")
        valid_personne_ids = {row[0] for row in cur.fetchall()}
        cur.execute("SELECT id FROM mouvements")
        valid_mouvement_ids = {row[0] for row in cur.fetchall()}

    # Get valid structure IDs
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM structures")
        valid_structure_ids = {row[0] for row in cur.fetchall()}

    values = []
    skipped = 0
    for row in rows:
        id_personne = convert_value(row.get("IdPersonne", ""), "integer")
        id_mouvement = convert_value(row.get("IdMouvement", ""), "integer")
        # Use IdTSLouAssoc as primary structure link (IdGfa is mostly empty)
        id_structure = convert_value(row.get("IdTSLouAssoc", ""), "integer")
        # Fallback to IdGfa if IdTSLouAssoc is empty
        if not id_structure:
            id_structure = convert_value(row.get("IdGfa", ""), "integer")

        # Skip if personne doesn't exist (FK would fail)
        if id_personne not in valid_personne_ids:
            skipped += 1
            continue

        # Set mouvement to None if it doesn't exist
        if id_mouvement and id_mouvement not in valid_mouvement_ids:
            id_mouvement = None

        # Convert 0 or invalid to None for FK fields
        if id_structure == 0 or id_structure not in valid_structure_ids:
            id_structure = None

        values.append((
            convert_value(row.get("IdNumeroPart", ""), "integer"),
            id_personne,
            id_mouvement,
            id_structure,
            convert_value(row.get("NumeroPart", ""), "integer") or 0,
            convert_value(row.get("Termine", ""), "boolean"),
            convert_value(row.get("Distribue", ""), "boolean"),
            convert_value(row.get("Etat", ""), "integer") or 0,
        ))

    if skipped:
        print(f"    Skipped {skipped} rows (missing personne reference)")

    pg_columns = [
        "id", "id_personne", "id_mouvement", "id_structure", "num_part",
        "termine", "distribue", "etat"
    ]
    count = insert_batch(conn, "numeros_parts", pg_columns, values)
    print(f"    Inserted {count} numeros_parts")


def migrate_communes(conn, mdb_path: str):
    """Migrate Communes from Sctl-Gfa.mdb."""
    print("  Migrating communes...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Commune")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        commune_num = row.get("COMMUNE", "")
        code_insee = row.get("CodeInsee", "").strip()
        # Use CodeInsee if available, otherwise use COMMUNE number
        num_com = code_insee if code_insee else str(commune_num)

        values.append((
            convert_value(row.get("IdCommune", ""), "integer"),
            num_com,
            row.get("NOM", "").strip() or f"Commune {commune_num}",
        ))

    pg_columns = ["id", "num_com", "nom_com"]
    count = insert_batch(conn, "communes", pg_columns, values)
    print(f"    Inserted {count} communes")


def migrate_lieux_dits(conn, mdb_path: str):
    """Migrate LieuDit from Sctl-Gfa.mdb."""
    print("  Migrating lieux_dits...")
    csv_data = export_mdb_table_to_csv(mdb_path, "LieuDit")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # First, get the first commune ID to use as default
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM communes LIMIT 1")
        result = cur.fetchone()
        default_commune_id = result[0] if result else 1

    values = []
    for row in rows:
        values.append((
            convert_value(row.get("IdLieuDit", ""), "integer"),
            default_commune_id,  # id_commune - LieuDit table doesn't have this, use default
            row.get("Libelle", "").strip() or "Lieu-dit inconnu",
        ))

    pg_columns = ["id", "id_commune", "nom"]
    count = insert_batch(conn, "lieux_dits", pg_columns, values)
    print(f"    Inserted {count} lieux_dits")


def migrate_exploitants(conn, mdb_path: str):
    """Migrate Exploita from Sctl-Gfa.mdb."""
    print("  Migrating exploitants...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Exploita")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        values.append((
            convert_value(row.get("IdExploitant", ""), "integer"),
            row.get("NOMEXP", "").strip() or "Exploitant inconnu",
            row.get("Prenom", "").strip(),
            row.get("AdresseExp", "").strip(),
            row.get("CPExp", "").strip(),
            row.get("VilleExp", "").strip(),
            row.get("Telephone", "").strip(),
            row.get("Mail", "").strip(),
        ))

    pg_columns = ["id", "nom", "prenom", "adresse", "code_postal", "ville", "tel", "mail"]
    count = insert_batch(conn, "exploitants", pg_columns, values)
    print(f"    Inserted {count} exploitants")


def migrate_types_cadastre(conn, mdb_path: str):
    """Migrate TypeCadastre from Sctl-Gfa.mdb."""
    print("  Migrating types_cadastre...")
    csv_data = export_mdb_table_to_csv(mdb_path, "TypeCadastre")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        type_cad = row.get("TypeCadastre", "").strip()
        values.append((
            convert_value(row.get("IdTypeCad", ""), "integer"),
            type_cad or "?",
            row.get("Libelle", "").strip() or type_cad,
        ))

    pg_columns = ["id", "code", "libelle"]
    count = insert_batch(conn, "types_cadastre", pg_columns, values)
    print(f"    Inserted {count} types_cadastre")


def migrate_classes_cadastre(conn, mdb_path: str):
    """Migrate ClassCadastre from Sctl-Gfa.mdb."""
    print("  Migrating classes_cadastre...")
    csv_data = export_mdb_table_to_csv(mdb_path, "ClassCadastre")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        class_cad = convert_value(row.get("ClassCadastre", ""), "integer")
        values.append((
            convert_value(row.get("IdClassCad", ""), "integer"),
            str(class_cad) if class_cad else "?",
            row.get("Libelle", "").strip() or f"Classe {class_cad}",
        ))

    pg_columns = ["id", "code", "libelle"]
    count = insert_batch(conn, "classes_cadastre", pg_columns, values)
    print(f"    Inserted {count} classes_cadastre")


def migrate_types_fermage(conn, mdb_path: str):
    """Migrate Fermage from Sctl-Gfa.mdb.

    The Fermage table contains type codes and their default points for rent calculation.
    Points are used when a subdivision doesn't have its own specific PointFermage value.
    """
    print("  Migrating types_fermage...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Fermage")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        type_fermage = row.get("TypeFermage", "").strip()
        libelle = row.get("Libelle", "").strip() or type_fermage or "?"
        # Get the Points value for this fermage type (used for rent calculation)
        points = convert_value(row.get("Points", ""), "decimal") or Decimal("0")

        values.append((
            convert_value(row.get("IdFermage", ""), "integer"),
            libelle,
            points,
        ))

    pg_columns = ["id", "libelle", "points"]
    count = insert_batch(conn, "types_fermage", pg_columns, values)
    print(f"    Inserted {count} types_fermage (with points for rent calculation)")


def migrate_parcelles(conn, mdb_path: str):
    """Migrate Parcelle from Sctl-Gfa.mdb (simplified - subdivision data in subdivisions table)."""
    print("  Migrating parcelles...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Parcelle")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    values = []
    for row in rows:
        id_lieu_dit = convert_value(row.get("IdLieuDit", ""), "integer")
        id_type_cad = convert_value(row.get("IdTypeCad", ""), "integer")
        id_class_cad = convert_value(row.get("IdClassCad", ""), "integer")
        id_gfa = convert_value(row.get("IdGfa", ""), "integer")

        # Convert 0 to None for FK fields
        if id_lieu_dit == 0:
            id_lieu_dit = None
        if id_type_cad == 0:
            id_type_cad = None
        if id_class_cad == 0:
            id_class_cad = None
        if id_gfa == 0:
            id_gfa = None

        values.append((
            convert_value(row.get("IdParcelle", ""), "integer"),
            convert_value(row.get("IdCommune", ""), "integer"),
            id_lieu_dit,
            id_type_cad,
            id_class_cad,
            id_gfa,
            row.get("PARCELLE", "").strip() or "INCONNU",
            convert_value(row.get("SCTL", ""), "boolean") or False,
            row.get("Observations", "").strip(),
        ))

    pg_columns = [
        "id", "id_commune", "id_lieu_dit", "id_type_cadastre",
        "id_classe_cadastre", "id_gfa", "parcelle", "sctl", "comment"
    ]
    count = insert_batch(conn, "parcelles", pg_columns, values)
    print(f"    Inserted {count} parcelles")


def migrate_subdivisions(conn, mdb_path: str):
    """Migrate Subdivision from Sctl-Gfa.mdb."""
    print("  Migrating subdivisions...")
    csv_data = export_mdb_table_to_csv(mdb_path, "Subdivision")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # Get existing parcelle IDs to validate FK
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM parcelles")
        valid_parcelle_ids = {row[0] for row in cur.fetchall()}

    values = []
    skipped = 0
    for row in rows:
        id_parcelle = convert_value(row.get("IdParcelle", ""), "integer")

        # Skip if parcelle doesn't exist (FK would fail)
        if id_parcelle not in valid_parcelle_ids:
            skipped += 1
            continue

        id_exploitant = convert_value(row.get("IdExploitant", ""), "integer")
        id_type_fermage = convert_value(row.get("IdFermage", ""), "integer")
        id_type_cad = convert_value(row.get("IdTypeCad", ""), "integer")
        id_class_cad = convert_value(row.get("IdClassCad", ""), "integer")
        id_commune = convert_value(row.get("IdCommune", ""), "integer")
        id_lieu_dit = convert_value(row.get("IdLieuDit", ""), "integer")

        # Convert 0 to None for FK fields
        if id_exploitant == 0:
            id_exploitant = None
        if id_type_fermage == 0:
            id_type_fermage = None
        if id_type_cad == 0:
            id_type_cad = None
        if id_class_cad == 0:
            id_class_cad = None
        if id_commune == 0:
            id_commune = None
        if id_lieu_dit == 0:
            id_lieu_dit = None

        values.append((
            convert_value(row.get("IdSubdivision", ""), "integer"),
            id_parcelle,
            id_exploitant,
            id_type_fermage,
            id_type_cad,
            id_class_cad,
            id_commune,
            id_lieu_dit,
            convert_value(row.get("DIVISION", ""), "integer") or 0,
            convert_value(row.get("SUBDIVISION", ""), "integer") or 0,
            convert_value(row.get("SURFACE", ""), "decimal") or Decimal("0"),
            convert_value(row.get("REVENU", ""), "decimal") or Decimal("0"),
            row.get("GFA", "").strip(),
            convert_value(row.get("DureeFermage", ""), "integer") or 0,
            convert_value(row.get("PointFermage", ""), "decimal") or Decimal("0"),
        ))

    if skipped:
        print(f"    Skipped {skipped} rows (missing parcelle reference)")

    pg_columns = [
        "id", "id_parcelle", "id_exploitant", "id_type_fermage", "id_type_cadastre",
        "id_classe_cadastre", "id_commune", "id_lieu_dit", "division", "subdivision",
        "surface", "revenu", "gfa", "duree_fermage", "point_fermage"
    ]
    count = insert_batch(conn, "subdivisions", pg_columns, values)
    print(f"    Inserted {count} subdivisions")


def migrate_valeurs_points(conn, mdb_path: str):
    """Migrate ValeurPointGFA and ValeurPointSCTL from Sctl-Gfa.mdb.

    Access has static values (before/after 1995), we create a default entry
    with the 'after 1995' values for the current year.
    """
    print("  Migrating valeurs_points...")

    # Get GFA values
    csv_data_gfa = export_mdb_table_to_csv(mdb_path, "ValeurPointGFA")
    _, rows_gfa = parse_csv_data(csv_data_gfa)

    # Get SCTL values
    csv_data_sctl = export_mdb_table_to_csv(mdb_path, "ValeurPointSCTL")
    _, rows_sctl = parse_csv_data(csv_data_sctl)

    if not rows_gfa or not rows_sctl:
        print("    No ValeurPoint data found")
        return

    # Find "après 1995" values (Num=2)
    valeur_gfa = None
    valeur_sctl = None

    for row in rows_gfa:
        if convert_value(row.get("Num", ""), "integer") == 2:
            valeur_gfa = convert_value(row.get("Valeur", ""), "decimal")
            break

    for row in rows_sctl:
        if convert_value(row.get("Num", ""), "integer") == 2:
            valeur_sctl = convert_value(row.get("Valeur", ""), "decimal")
            break

    if valeur_gfa is None:
        valeur_gfa = Decimal("1.69")  # Default from Access data
    if valeur_sctl is None:
        valeur_sctl = Decimal("1.69")

    # Insert for current year (2024) as default
    from datetime import datetime
    current_year = datetime.now().year

    values = [(
        current_year,
        valeur_gfa,
        valeur_sctl,
        Decimal("0"),  # valeur_supp_gfa - no supplement data in Access
        Decimal("0"),  # valeur_supp_sctl
    )]

    pg_columns = ["annee", "valeur_point_gfa", "valeur_point_sctl", "valeur_supp_gfa", "valeur_supp_sctl"]
    count = insert_batch(conn, "valeurs_points", pg_columns, values)
    print(f"    Inserted {count} valeurs_points (year {current_year}: GFA={valeur_gfa}, SCTL={valeur_sctl})")


def migrate_liens_personne_morale(conn, mdb_path: str):
    """Migrate LiensActionPersMorale from TSL.mdb.

    This updates personnes.id_personne_morale to link shareholders to their legal entities.
    """
    print("  Migrating liens personne morale...")
    csv_data = export_mdb_table_to_csv(mdb_path, "LiensActionPersMorale")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # Get valid personne IDs
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM personnes")
        valid_personne_ids = {row[0] for row in cur.fetchall()}

    updated = 0
    skipped = 0

    with conn.cursor() as cur:
        for row in rows:
            id_actionnaire = convert_value(row.get("IdActionnaire", ""), "integer")
            id_pers_morale = convert_value(row.get("IdPersmorale", ""), "integer")

            # Skip if either ID is invalid
            if id_actionnaire not in valid_personne_ids or id_pers_morale not in valid_personne_ids:
                skipped += 1
                continue

            # Update the personne record with the link
            cur.execute(
                "UPDATE personnes SET id_personne_morale = %s WHERE id = %s",
                (id_pers_morale, id_actionnaire)
            )
            updated += 1

    conn.commit()
    if skipped:
        print(f"    Skipped {skipped} rows (invalid personne references)")
    print(f"    Updated {updated} personnes with personne_morale links")


def migrate_cad_valeurs(conn, mdb_path: str):
    """Migrate CadValeur from Sctl-Gfa.mdb.

    This is cadastral reference data: values by commune/type/class.
    Since there's no existing table for this, we'll create a cad_valeurs table.
    """
    print("  Migrating cad_valeurs (cadastral reference values)...")
    csv_data = export_mdb_table_to_csv(mdb_path, "CadValeur")
    columns, rows = parse_csv_data(csv_data)

    if not rows:
        print("    No data found")
        return

    # First, create the table if it doesn't exist
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cad_valeurs (
                id SERIAL PRIMARY KEY,
                id_commune INTEGER REFERENCES communes(id),
                id_type_cadastre INTEGER REFERENCES types_cadastre(id),
                id_classe_cadastre INTEGER REFERENCES classes_cadastre(id),
                nom VARCHAR(100),
                valeur DECIMAL(10, 4) DEFAULT 0,
                valeur_actuel DECIMAL(10, 4) DEFAULT 0
            )
        """)
    conn.commit()

    values = []
    for row in rows:
        id_commune = convert_value(row.get("IdCommune", ""), "integer")
        id_type_cad = convert_value(row.get("IdTypeCad", ""), "integer")
        id_class_cad = convert_value(row.get("IdClassCad", ""), "integer")

        # Convert 0 to None for FK fields
        if id_commune == 0:
            id_commune = None
        if id_type_cad == 0:
            id_type_cad = None
        if id_class_cad == 0:
            id_class_cad = None

        values.append((
            convert_value(row.get("IdCadValeur", ""), "integer"),
            id_commune,
            id_type_cad,
            id_class_cad,
            row.get("NOM", "").strip(),
            convert_value(row.get("Valeur", ""), "decimal") or Decimal("0"),
            convert_value(row.get("ValeurActuel", ""), "decimal") or Decimal("0"),
        ))

    pg_columns = ["id", "id_commune", "id_type_cadastre", "id_classe_cadastre", "nom", "valeur", "valeur_actuel"]
    count = insert_batch(conn, "cad_valeurs", pg_columns, values)
    print(f"    Inserted {count} cad_valeurs")


def reset_sequences(conn):
    """Reset PostgreSQL sequences to max ID values."""
    tables = [
        "structures",
        "personnes",
        "types_apport",
        "types_remboursement",
        "actes",
        "mouvements",
        "numeros_parts",
        "communes",
        "lieux_dits",
        "exploitants",
        "types_cadastre",
        "classes_cadastre",
        "types_fermage",
        "parcelles",
        "subdivisions",
        "valeurs_points",
        "cad_valeurs",
    ]

    with conn.cursor() as cur:
        for table in tables:
            try:
                cur.execute(
                    f"""
                    SELECT setval(pg_get_serial_sequence('{table}', 'id'),
                           COALESCE((SELECT MAX(id) FROM {table}), 1), true)
                """
                )
            except Exception as e:
                print(f"  Warning: Could not reset sequence for {table}: {e}")
    conn.commit()


def migrate_tsl_database(mdb_path: str, conn):
    """Migrate TSL.mdb database."""
    print(f"\nMigrating TSL database: {mdb_path}")

    tables = get_mdb_tables(mdb_path)
    print(f"  Found tables: {', '.join(tables)}")

    # Migrate in order (structures and reference tables first for FK references)
    if "Gfa" in tables:
        migrate_structures(conn, mdb_path)
    if "Personnes" in tables:
        migrate_personnes(conn, mdb_path)
    # Migrate reference tables from Libelle before mouvements
    if "Libelle" in tables:
        migrate_types_apport(conn, mdb_path)
        migrate_types_remboursement(conn, mdb_path)
    if "Actes" in tables:
        migrate_actes(conn, mdb_path)
    if "Mouvements" in tables:
        migrate_mouvements(conn, mdb_path)
    if "NumeroParts" in tables:
        migrate_numeros_parts(conn, mdb_path)
    # Migrate shareholder-legal entity links (after personnes)
    if "LiensActionPersMorale" in tables:
        migrate_liens_personne_morale(conn, mdb_path)


def migrate_cadastre_database(mdb_path: str, conn):
    """Migrate Sctl-Gfa.mdb cadastre database."""
    print(f"\nMigrating Cadastre database: {mdb_path}")

    tables = get_mdb_tables(mdb_path)
    print(f"  Found tables: {', '.join(tables)}")

    # Migrate reference tables first
    if "Commune" in tables:
        migrate_communes(conn, mdb_path)
    if "LieuDit" in tables:
        migrate_lieux_dits(conn, mdb_path)
    if "Exploita" in tables:
        migrate_exploitants(conn, mdb_path)
    if "TypeCadastre" in tables:
        migrate_types_cadastre(conn, mdb_path)
    if "ClassCadastre" in tables:
        migrate_classes_cadastre(conn, mdb_path)
    if "Fermage" in tables:
        migrate_types_fermage(conn, mdb_path)
    # Main tables
    if "Parcelle" in tables:
        migrate_parcelles(conn, mdb_path)
    if "Subdivision" in tables:
        migrate_subdivisions(conn, mdb_path)
    # Reference/calculation data
    if "ValeurPointGFA" in tables and "ValeurPointSCTL" in tables:
        migrate_valeurs_points(conn, mdb_path)
    if "CadValeur" in tables:
        migrate_cad_valeurs(conn, mdb_path)


def main():
    parser = argparse.ArgumentParser(
        description="Migrate Access .mdb databases to PostgreSQL"
    )
    parser.add_argument(
        "--tsl-db",
        default=os.getenv("TSL_MDB_PATH"),
        help="Path to TSL.mdb (shareholders database)",
    )
    parser.add_argument(
        "--cadastre-db",
        default=os.getenv("CADASTRE_MDB_PATH"),
        help="Path to Sctl-Gfa.mdb (cadastre database)",
    )
    parser.add_argument(
        "--database-url",
        default=DATABASE_URL,
        help="PostgreSQL connection URL",
    )
    parser.add_argument(
        "--skip-tsl",
        action="store_true",
        help="Skip TSL database migration",
    )
    parser.add_argument(
        "--skip-cadastre",
        action="store_true",
        help="Skip cadastre database migration",
    )

    args = parser.parse_args()

    # Check mdbtools
    if not check_mdbtools():
        print("Error: mdbtools not found. Install with: brew install mdbtools")
        sys.exit(1)

    # Validate inputs
    if not args.skip_tsl and not args.tsl_db:
        print("Error: TSL database path required. Use --tsl-db or set TSL_MDB_PATH")
        sys.exit(1)

    if not args.skip_cadastre and not args.cadastre_db:
        print(
            "Error: Cadastre database path required. Use --cadastre-db or set CADASTRE_MDB_PATH"
        )
        sys.exit(1)

    if not args.skip_tsl and not os.path.exists(args.tsl_db):
        print(f"Error: TSL database not found: {args.tsl_db}")
        sys.exit(1)

    if not args.skip_cadastre and not os.path.exists(args.cadastre_db):
        print(f"Error: Cadastre database not found: {args.cadastre_db}")
        sys.exit(1)

    # Connect to PostgreSQL
    print(f"Connecting to PostgreSQL...")
    try:
        conn = psycopg.connect(args.database_url)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

    try:
        # Migrate TSL database
        if not args.skip_tsl:
            migrate_tsl_database(args.tsl_db, conn)

        # Migrate cadastre database
        if not args.skip_cadastre:
            migrate_cadastre_database(args.cadastre_db, conn)

        # Reset sequences
        print("\nResetting sequences...")
        reset_sequences(conn)

        print("\n✓ Migration completed successfully!")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
