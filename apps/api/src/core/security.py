import hashlib
import re
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os

SECRET_KEY = os.environ.get("AUTH_SECRET", "super-secret-key-for-dealflow360")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

WEAK_PASSWORDS = {"password", "123456", "12345678", "admin123", "qwerty", "letmein", "dealflow"}

def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Authoritative backend password strength validation."""
    password = decode_payload_password(password)
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        return False, "Password must contain at least one special character."
    if password.lower() in WEAK_PASSWORDS:
        return False, "Password is too common or weak. Please choose a stronger password."
    return True, "Password meets strength requirements."

def generate_secure_password(length: int = 16) -> str:
    """Generate a cryptographically secure random password meeting all password policies."""
    if length < 12:
        length = 12
    upper = secrets.choice(string.ascii_uppercase)
    lower = secrets.choice(string.ascii_lowercase)
    digit = secrets.choice(string.digits)
    special = secrets.choice("!@#$%^&*()_+-=")
    
    remaining_length = length - 4
    all_chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-="
    remaining = "".join(secrets.choice(all_chars) for _ in range(remaining_length))
    
    password_chars = list(upper + lower + digit + special + remaining)
    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)

import base64
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def decode_payload_password(password: str) -> str:
    """Decodes encrypted or base64 payload strings if present (e.g. 'enc:...')."""
    if not password:
        return password
    if password.startswith("enc:"):
        try:
            return base64.b64decode(password[4:]).decode("utf-8")
        except Exception:
            pass
    return password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    plain = decode_payload_password(plain_password)
    if hashed_password.startswith("$"):
        try:
            return pwd_context.verify(plain, hashed_password)
        except Exception:
            return False
    return hashlib.sha256(plain.encode("utf-8")).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    plain = decode_payload_password(password)
    return pwd_context.hash(plain)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    if isinstance(data, str):
        data = {"sub": data}
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def decode_access_token(token: str) -> Optional[str]:
    payload = decode_token(token)
    if payload and "sub" in payload:
        return str(payload["sub"])
    return None

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return payload

def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "").lower()
        allowed_lower = [r.lower() for r in allowed_roles]
        if user_role not in allowed_lower and "admin" not in user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not authorized to access this resource",
            )
        return current_user
    return role_checker
