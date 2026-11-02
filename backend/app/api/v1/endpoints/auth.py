import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_token_pair,
    decode_token,
    generate_secure_token,
    get_current_user,
    get_password_hash,
    is_token_revoked,
    oauth2_scheme,
    verify_password,
)
from app.db.database import get_db
from app.models.user import RevokedToken, User
from app.schemas.common import MessageResponse
from app.schemas.user import (
    EmailVerifyRequest,
    ForgotPasswordRequest,
    ResetPasswordConfirmRequest,
    TokenRefreshRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """1. User registration with auto-generated email verification token."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    verification_token = generate_secure_token()
    user = User(
        id=str(uuid.uuid4()),
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=req.role,
        is_active=True,
        is_verified=False,
        verification_token=verification_token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login_json(req: UserLoginRequest, db: Session = Depends(get_db)):
    """2. Secure login returning JWT access and refresh token pair."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support.",
        )

    token_data = create_token_pair(subject=user.id, role=user.role)
    return TokenResponse(**token_data)


@router.post("/login/access-token", response_model=TokenResponse)
def login_oauth2_form(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """OAuth2 compatible login endpoint."""
    return login_json(UserLoginRequest(email=form_data.username, password=form_data.password), db)


@router.post("/logout", response_model=MessageResponse)
def logout(
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """3. Secure logout with immediate token revocation."""
    payload = decode_token(token)
    jti = payload.get("jti")
    exp_ts = payload.get("exp")
    expires_at = (
        datetime.fromtimestamp(exp_ts, tz=timezone.utc)
        if exp_ts
        else datetime.now(timezone.utc) + timedelta(hours=24)
    )

    if jti:
        revoked = RevokedToken(
            id=str(uuid.uuid4()),
            token_jti=jti,
            token_type="access",
            user_id=current_user.id,
            expires_at=expires_at,
        )
        db.add(revoked)
        db.commit()

    return MessageResponse(message="Successfully logged out and session revoked.")


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: TokenRefreshRequest, db: Session = Depends(get_db)):
    """4. Exchange valid refresh token for a new access & refresh token pair."""
    payload = decode_token(req.refresh_token)
    token_type = payload.get("type")
    user_id = payload.get("sub")
    jti = payload.get("jti")

    if token_type != "refresh" or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if jti and is_token_revoked(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User inactive or not found",
        )

    # Invalidate previous refresh token
    exp_ts = payload.get("exp")
    expires_at = (
        datetime.fromtimestamp(exp_ts, tz=timezone.utc)
        if exp_ts
        else datetime.now(timezone.utc) + timedelta(days=7)
    )
    if jti:
        db.add(
            RevokedToken(
                id=str(uuid.uuid4()),
                token_jti=jti,
                token_type="refresh",
                user_id=user.id,
                expires_at=expires_at,
            )
        )
        db.commit()

    token_data = create_token_pair(subject=user.id, role=user.role)
    return TokenResponse(**token_data)


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(req: EmailVerifyRequest, db: Session = Depends(get_db)):
    """5. Confirm user email address via verification token."""
    user = db.query(User).filter(User.verification_token == req.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user.is_verified = True
    user.verification_token = None
    db.commit()
    return MessageResponse(message="Email verified successfully.")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """6. Generate password reset token."""
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        reset_token = generate_secure_token()
        user.reset_password_token = reset_token
        user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        # In production: email service dispatches the token.
        return MessageResponse(
            message="If this email is registered, a password reset token has been issued.",
            detail=f"DEBUG_TOKEN:{reset_token}" if settings.DEBUG else None,
        )

    return MessageResponse(
        message="If this email is registered, a password reset token has been issued."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordConfirmRequest, db: Session = Depends(get_db)):
    """7. Apply new password using valid reset token."""
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.reset_password_token == req.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if user.reset_password_expires_at:
        exp = user.reset_password_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

    user.hashed_password = get_password_hash(req.new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    db.commit()

    return MessageResponse(
        message="Password reset successfully. You can now login with your new password."
    )
