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
    UserUpdate,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
import logging

logger = logging.getLogger(__name__)

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


# ── POST /auth/forgot-password ──────────────────────────────────────────────────

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password reset link",
)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    user: User | None = db.query(User).filter(User.email == body.email).first()
    
    if user:
        # Generate a short-lived token (15 mins) for password reset
        from datetime import timedelta
        reset_token = create_access_token(user_id=str(user.id), expires_delta=timedelta(minutes=15))
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        
        from src.core.config import get_settings
        settings = get_settings()
        
        # If SMTP settings are provided, send a real email
        if settings.SMTP_SERVER and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            try:
                msg = MIMEMultipart()
                msg['From'] = settings.MAIL_FROM
                msg['To'] = user.email
                msg['Subject'] = "Password Reset - DealFlow360"
                
                body = f"""Hello {user.name},

You requested a password reset for your DealFlow360 account.
Please click the link below to reset your password. This link is valid for 15 minutes:

{reset_link}

If you did not request this, please ignore this email.

Thanks,
The DealFlow360 Team
"""
                msg.attach(MIMEText(body, 'plain'))
                
                server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                
                logger.info(f"Real password reset email sent successfully to {user.email}")
            except Exception as e:
                logger.error(f"Failed to send real email to {user.email}: {e}")
                # Fallback to printing if SMTP fails
                print(f"\n\n[SMTP ERROR - FALLBACK MOCK EMAIL]\nLINK: {reset_link}\n\n")
        else:
            # Fallback mock logging when SMTP is not configured
            logger.warning(f"\n\n=========================================\n"
                           f"MOCK EMAIL SENT TO: {user.email}\n"
                           f"SUBJECT: Password Reset\n"
                           f"LINK: {reset_link}\n"
                           f"=========================================\n\n")
            print(f"\n\n=========================================\n"
                  f"MOCK EMAIL SENT TO: {user.email}\n"
                  f"SUBJECT: Password Reset\n"
                  f"LINK: {reset_link}\n"
                  f"=========================================\n\n")
              
    # Always return a success message to prevent user enumeration
    return MessageResponse(message="If an account exists for that email, a password reset link has been sent.")


# ── POST /auth/reset-password ───────────────────────────────────────────────────

@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password using a token",
)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    from src.core.security import decode_access_token
    user_id = decode_access_token(body.token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )
        
    user: User | None = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
        
    user.password_hash = get_password_hash(body.new_password)
    db.commit()
    
    return MessageResponse(message="Password has been successfully reset.")



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


@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current authenticated user",
)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Update profile information of the current user."""
    if body.name is not None:
        current_user.name = body.name
    # Don't allow regular users to update their own role unless they are admins.
    # To keep it simple for testing if role is provided and they are an admin, allow it.
    if body.role is not None and current_user.role == "admin":
        current_user.role = body.role
        
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
