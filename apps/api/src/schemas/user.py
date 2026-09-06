"""
Pydantic v2 schemas for user-related API requests and responses.

Security rules enforced here:
  - password_hash is NEVER included in any response schema.
  - Public registration only accepts safe roles (sales_rep, customer).
  - Email is normalised to lowercase before any DB operation.
"""
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# ── Role constants ─────────────────────────────────────────────────────────────

PUBLIC_ALLOWED_ROLES = {"customer"}

# All valid roles in the system (used internally / by seed / admin).
ALL_VALID_ROLES = {"sales_rep", "sales_manager", "finance", "customer", "admin"}


# ── Request schemas ────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """
    Body for POST /auth/register.

    The 'role' field is optional.  If omitted it defaults to 'sales_rep'.
    Clients may NOT register themselves as admin / finance / sales_manager.
    """

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Jane Doe"],
    )
    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        examples=["SecurePassword123"],
    )
    role: Optional[str] = Field(
        default="customer",
        examples=["customer"],
    )

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        """Store email in lowercase for consistent lookup."""
        return v.lower().strip()

    @field_validator("role", mode="before")
    @classmethod
    def validate_public_role(cls, v: Optional[str]) -> str:
        role = (v or "customer").lower().strip()
        if role not in PUBLIC_ALLOWED_ROLES:
            raise ValueError(
                f"Role '{role}' is not available for self-registration. "
                f"Allowed: {sorted(PUBLIC_ALLOWED_ROLES)}"
            )
        return role


class LoginRequest(BaseModel):
    """Body for POST /auth/login."""

    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., min_length=1, examples=["SecurePassword123"])

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.lower().strip()

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.lower().strip()

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


# ── Response schemas ───────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    """
    Safe user representation returned by all auth endpoints.

    password_hash is intentionally absent.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """
    Returned by /auth/register and /auth/login.

    The frontend should store access_token in memory (NOT localStorage)
    for security; use it as a Bearer token in the Authorization header.
    """

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic message response (e.g. for logout)."""

    message: str
