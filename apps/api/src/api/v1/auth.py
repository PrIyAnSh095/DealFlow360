"""
Authentication API router.

Endpoints
---------
POST /auth/register   Register a new user account.
POST /auth/login      Authenticate and receive a JWT.
POST /auth/logout     Instruct client to discard token (stateless).
GET  /auth/me         Return the current authenticated user's profile.

All endpoints are mounted at /api/v1/auth in main.py.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_current_user
from src.core.database import get_db
from src.core.security import create_access_token, get_password_hash, verify_password
from src.models.user import User
from src.schemas.user import (
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter()


# ── POST /auth/register ────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Create a new account. Only 'sales_rep' and 'customer' roles are "
        "available for self-registration."
    ),
)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    # 1. Check for duplicate email (case-insensitive; email is normalised to
    #    lowercase by the schema validator before reaching here).
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 2. Hash password — plain text never touches the database.
    hashed = get_password_hash(body.password)

    # 3. Create user record.
    user = User(
        name=body.name,
        email=body.email,          # already lowercased by validator
        password_hash=hashed,
        role=body.role,            # validated to PUBLIC_ALLOWED_ROLES
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 4. Issue JWT.
    token = create_access_token(user_id=str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ── POST /auth/login ───────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    # 1. Look up user by email.
    user: User | None = db.query(User).filter(User.email == body.email).first()

    # 2. Verify password.
    # We intentionally use the same error message for "user not found" and
    # "wrong password" to avoid user-enumeration attacks.
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Reject inactive accounts.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    # 4. Issue JWT.
    token = create_access_token(user_id=str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ── POST /auth/logout ──────────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout (stateless JWT — client must discard token)",
)
def logout(_current_user: User = Depends(get_current_user)) -> MessageResponse:
    """
    Because JWT is stateless, 'logout' means the client discards the token.

    This endpoint validates the token (so the client knows it was accepted),
    then instructs the client to delete it.  No server-side blacklist is
    maintained at this scope; add a token blacklist/Redis layer when needed.
    """
    return MessageResponse(message="Successfully logged out. Please discard your token.")


# ── GET /auth/me ───────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the current authenticated user",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the profile of the user identified by the Bearer token."""
    return UserResponse.model_validate(current_user)
