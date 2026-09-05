"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-05 14:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Tables are created via Base.metadata.create_all in main.py & seed.py
    pass

def downgrade():
    pass
