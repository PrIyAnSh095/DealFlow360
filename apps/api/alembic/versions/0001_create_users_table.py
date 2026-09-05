"""Create users table

Revision ID: 0001
Revises: (none — initial migration)
Create Date: 2026-09-05 UTC

Creates the 'users' table with:
  - UUID primary key (gen_random_uuid())
  - name, email (unique + lowercase), password_hash
  - role (VARCHAR 30, default 'sales_rep')
  - is_active (BOOLEAN, default TRUE)
  - created_at, updated_at (TIMESTAMPTZ, default now())

Indexes:
  - ix_users_email          (unique — from column definition)
  - ix_users_role           (for role-based queries)
  - ix_users_is_active      (for filtering active users)
  - ix_users_email_active   (composite — fast login lookup)

This migration is the foundation for all future DealFlow360 tables.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# ── Revision identifiers ───────────────────────────────────────────────────────
revision: str = "0001"
down_revision: Union[str, None] = None   # Initial migration — no parent.
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the users table and all its indexes."""

    op.create_table(
        "users",

        # ── Primary key ────────────────────────────────────────────────────────
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
            comment="Unique user identifier (UUID v4)",
        ),

        # ── Identity ──────────────────────────────────────────────────────────
        sa.Column(
            "name",
            sa.String(100),
            nullable=False,
            comment="Display name",
        ),
        sa.Column(
            "email",
            sa.String(255),
            nullable=False,
            comment="Email address — stored and compared in lowercase",
        ),

        # ── Auth ──────────────────────────────────────────────────────────────
        sa.Column(
            "password_hash",
            sa.String(255),
            nullable=False,
            comment="bcrypt hash — NEVER store plain-text passwords",
        ),

        # ── Role ──────────────────────────────────────────────────────────────
        sa.Column(
            "role",
            sa.String(30),
            nullable=False,
            server_default="sales_rep",
            comment="User role: sales_rep | sales_manager | finance | customer | admin",
        ),

        # ── Status ────────────────────────────────────────────────────────────
        sa.Column(
            "is_active",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("true"),
            comment="Inactive users cannot log in",
        ),

        # ── Timestamps ────────────────────────────────────────────────────────
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
            comment="Record creation timestamp (UTC)",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
            comment="Record last-updated timestamp (UTC)",
        ),
    )

    # ── Unique constraint on email ─────────────────────────────────────────────
    op.create_unique_constraint("uq_users_email", "users", ["email"])

    # ── Individual column indexes ──────────────────────────────────────────────
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_is_active", "users", ["is_active"])

    # ── Composite index: fast login lookup ─────────────────────────────────────
    # Used in: SELECT * FROM users WHERE email = $1 AND is_active = true
    op.create_index("ix_users_email_active", "users", ["email", "is_active"])

    # ── Trigger: auto-update updated_at on row change ──────────────────────────
    # Uses a PostgreSQL function; safe to add here since we own the schema.
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    """Drop the users table and its trigger/function."""

    op.execute("DROP TRIGGER IF EXISTS trg_users_updated_at ON users;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")

    op.drop_index("ix_users_email_active", table_name="users")
    op.drop_index("ix_users_is_active", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_constraint("uq_users_email", "users", type_="unique")

    op.drop_table("users")
