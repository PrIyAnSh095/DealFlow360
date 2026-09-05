"""
FastAPI dependency injection utilities.

get_current_user  — validates Bearer JWT and returns the active User model.
get_current_active_user — alias that additionally confirms is_active = True
                           (both checks are already in get_current_user).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.security import decode_access_token
from src.models.user import User

# The tokenUrl is the endpoint where clients exchange credentials for a token.
# This drives the Swagger UI "Authorize" button.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Central role groups used by route dependencies. Keep these names aligned with
# the role values stored in the users table and the frontend navigation policy.
INTERNAL_ROLES = ["sales_rep", "sales_manager", "finance", "admin"]
DEAL_VIEW_ROLES = INTERNAL_ROLES
DEAL_WRITE_ROLES = ["sales_rep", "admin"]
QUOTE_VIEW_ROLES = INTERNAL_ROLES
QUOTE_WRITE_ROLES = ["sales_rep", "admin"]
APPROVAL_VIEW_ROLES = INTERNAL_ROLES
APPROVAL_ACTION_ROLES = ["sales_manager", "finance", "admin"]
ANALYTICS_ROLES = ["sales_manager", "finance", "admin"]
HEALTH_ROLES = INTERNAL_ROLES
RESCUE_ROLES = ["sales_manager", "admin"]
SEARCH_ROLES = INTERNAL_ROLES


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate the Bearer JWT and return the corresponding User.

    Raises:
        401 — token missing, invalid, or expired.
        401 — user referenced in token no longer exists.
        403 — user account is inactive (deactivated by admin).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception

    user: User | None = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    return user


# Alias — makes route signatures self-documenting when roles matter.
get_current_active_user = get_current_user


class RoleChecker:
    """
    Dependency for enforcing Role-Based Access Control.
    Usage:
        dependencies=[Depends(RoleChecker(["sales_manager", "admin"]))]
    """
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Role must be one of: {', '.join(self.allowed_roles)}",
            )
        return user
