"""
Security utilities: password hashing (bcrypt) and JWT token management.

Rules enforced here:
  - Passwords are NEVER logged or returned.
  - AUTH_SECRET has no hardcoded fallback — app will fail to start if missing.
  - JWT payload contains only the minimal claim needed (user id as 'sub').
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.config import get_settings

# ── Password hashing ───────────────────────────────────────────────────────────

# bcrypt with auto-deprecation so we can upgrade rounds in the future.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Return True if plain_password matches the stored bcrypt hash.
    This is constant-time — safe against timing attacks.
    """
    return _pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Return a bcrypt hash of the given password.
    NEVER log or store the plain password.
    """
    return _pwd_context.hash(password)


# ── JWT tokens ─────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token encoding the user's UUID as 'sub'.

    Args:
        user_id:       The user's UUID string.
        expires_delta: Override the default expiry from settings.

    Returns:
        Signed JWT string.
    """
    settings = get_settings()
    now = datetime.now(tz=timezone.utc)
    expire = now + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": user_id,   # subject — user UUID
        "iat": now,        # issued at
        "exp": expire,     # expires at
    }
    return jwt.encode(payload, settings.AUTH_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode and verify a JWT token.

    Returns:
        The user_id (str from 'sub' claim) if the token is valid and
        not expired; None otherwise.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: Optional[str] = payload.get("sub")
        return user_id
    except JWTError:
        return None
