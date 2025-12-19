"""add_points_to_types_fermage

Revision ID: 4209b3d715cb
Revises: 31e7ff3d3f3e
Create Date: 2025-12-19 09:27:07.333843

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4209b3d715cb'
down_revision = '31e7ff3d3f3e'
branch_labels = None
depends_on = None


def upgrade():
    # Add points column to types_fermage
    op.add_column('types_fermage', sa.Column('points', sa.Numeric(precision=10, scale=4), nullable=False, server_default='0'))

    # Update points values based on old Access database data (from Fermage table)
    # TypeFermage -> Points mapping from old database:
    # B=1, BP2=3, BP3=2, MAI=0, P1=6, P2=4, P3=2, S=0, T1=65, T2=42, T3=31, T4=26, J=10
    op.execute("""
        UPDATE types_fermage SET points = CASE libelle
            WHEN 'B' THEN 1
            WHEN 'BP2' THEN 3
            WHEN 'BP3' THEN 2
            WHEN 'MAI' THEN 0
            WHEN 'P1' THEN 6
            WHEN 'P2' THEN 4
            WHEN 'P3' THEN 2
            WHEN 'S' THEN 0
            WHEN 'T1' THEN 65
            WHEN 'T2' THEN 42
            WHEN 'T3' THEN 31
            WHEN 'T4' THEN 26
            WHEN 'J' THEN 10
            ELSE 0
        END
    """)


def downgrade():
    op.drop_column('types_fermage', 'points')
