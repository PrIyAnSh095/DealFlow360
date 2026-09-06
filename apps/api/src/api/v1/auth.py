from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
import smtplib
from email.mime.text import MIMEText
from pydantic import BaseModel, EmailStr

from src.core.database import get_db
from src.core.security import (
    verify_password, get_password_hash, create_access_token, get_current_user,
    validate_password_strength, generate_secure_password
)
from src.models.user import User
from src.services.audit_service import log_audit_event
from src.schemas.user import UserResponse, UserUpdate, MessageResponse

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "sales"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.get("/generate-password")
def generate_password():
    """Generates a cryptographically secure random password meeting all password policies."""
    password = generate_secure_password()
    return {"password": password}

@router.post("/signup", response_model=TokenResponse)
@router.post("/register", response_model=TokenResponse)
def signup(body: RegisterRequest, db: Session = Depends(get_db)):
    is_valid, error_msg = validate_password_strength(body.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )

    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    
    hashed = get_password_hash(body.password)
    user = User(
        email=body.email.lower(),
        hashed_password=hashed,
        name=body.name,
        role=body.role or "sales"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        user_id=user.id,
        action="USER_REGISTERED",
        entity_type="User",
        entity_id=user.id,
        details=f"User registered with role {user.role}"
    )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password if hasattr(user, 'hashed_password') and user.hashed_password else getattr(user, 'password_hash', '')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    log_audit_event(
        db,
        user_id=user.id,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=user.id,
        details="User logged in successfully"
    )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Successfully logged out. Please discard your token."}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.patch("/me")
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub") or current_user.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = body.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        user.name = update_data["name"]
    if "role" in update_data and update_data["role"] is not None and current_user.get("role") == "admin":
        user.role = update_data["role"]
        
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user:
        # To prevent email enumeration, return success even if user not found
        return {"message": "If an account exists, you will receive an email."}
        
    reset_token = "mock-reset-token-12345"
    
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    mail_from = os.getenv("MAIL_FROM")
    
    if smtp_server and smtp_user and smtp_pass:
        msg = MIMEText(f"Click here to reset your password for DealFlow360: http://localhost:3000/reset-password?token={reset_token}")
        msg['Subject'] = 'DealFlow360 - Password Reset'
        msg['From'] = mail_from or smtp_user
        msg['To'] = user.email

        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
        except Exception as e:
            print(f"Error sending email: {e}")
            
    return {"message": "If an account exists, you will receive an email."}
