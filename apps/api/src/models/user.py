import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Index,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    # ── Primary key ────────────────────────────────────────────────────────────
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
        index=True,
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
        Index("ix_users_email_active", "email", "is_active"),
    )

    @property
    def hashed_password(self):
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, value):
        self.password_hash = value

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"
