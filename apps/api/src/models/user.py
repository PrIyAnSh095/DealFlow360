"""
User SQLAlchemy model — the ONLY model in this initial migration.

Column naming follows the agreed spec:
  - id            UUID primary key (native PostgreSQL UUID type)
  - name          VARCHAR(100)
  - email         VARCHAR(255), unique, stored lowercase
  - password_hash VARCHAR(255)  — bcrypt hash, never the plain password
  - role          VARCHAR(30)
  - is_active     BOOLEAN
  - created_at    TIMESTAMPTZ
  - updated_at    TIMESTAMPTZ

Other developers: add new models in separate files inside src/models/ and
import them in alembic/env.py so Alembic can detect them.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Index,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class User(Base):
    """
    Application user.

    Roles are validated at the application layer (see schemas/user.py).
    The database stores the role as a plain VARCHAR for flexibility —
    future migrations can migrate to a PostgreSQL ENUM if desired.
    """

    __tablename__ = "users"

    # ── Primary key ────────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),  # PostgreSQL 14+ built-in
        comment="Unique user identifier (UUID v4)",
    )

    # ── Identity ───────────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Display name",
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        comment="Email address — stored and compared in lowercase",
    )

    # ── Auth ───────────────────────────────────────────────────────────────────
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="bcrypt hash of the user's password — NEVER store plain text",
    )

    # ── Role ───────────────────────────────────────────────────────────────────
    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="sales_rep",
        server_default="sales_rep",
        index=True,
        comment="User role: sales_rep | sales_manager | finance | customer | admin",
    )

    # ── Status ─────────────────────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        index=True,
        comment="Inactive users cannot log in",
    )

    # ── Timestamps (UTC) ───────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Record creation timestamp (UTC)",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Record last-updated timestamp (UTC)",
    )

    # ── Additional composite indexes ───────────────────────────────────────────
    __table_args__ = (
        # Fast lookup of active users by email (used on every login)
        Index("ix_users_email_active", "email", "is_active"),
    )

    # ── Python helpers ─────────────────────────────────────────────────────────

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"
