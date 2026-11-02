import secrets
import uuid
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db

# Password hashing with Argon2
password_hash = PasswordHash((Argon2Hasher(),))

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate Argon2 password hash."""
    return password_hash.hash(password)


def generate_secure_token() -> str:
    """Generate high-entropy random token for email verification or password reset."""
    return secrets.token_urlsafe(32)


def create_token_pair(subject: str, role: str) -> dict[str, Any]:
    """Create both access token and refresh token."""
    now = datetime.now(timezone.utc)
    access_jti = str(uuid.uuid4())
    refresh_jti = str(uuid.uuid4())

    access_expires = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_expires = now + timedelta(days=7)

    access_payload = {
        "sub": str(subject),
        "role": role,
        "jti": access_jti,
        "type": "access",
        "exp": access_expires,
        "iat": now,
    }

    refresh_payload = {
        "sub": str(subject),
        "role": role,
        "jti": refresh_jti,
        "type": "refresh",
        "exp": refresh_expires,
        "iat": now,
    }

    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT token claims."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def is_token_revoked(db: Session, jti: str) -> bool:
    """Check if token JTI has been revoked/blacklisted."""
    from app.models.user import RevokedToken
    revoked = db.query(RevokedToken).filter(RevokedToken.token_jti == jti).first()
    return revoked is not None


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Retrieve and validate current authenticated user."""
    from app.models.user import User

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    user_id = payload.get("sub")
    token_type = payload.get("type")
    jti = payload.get("jti")

    if not user_id or token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if jti and is_token_revoked(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


def require_roles(allowed_roles: list[str]) -> Callable:
    """RBAC Guard dependency: verifies current user has one of allowed roles."""
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.is_superuser:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker
