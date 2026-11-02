from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_password_hash, require_roles, verify_password
from app.db.database import get_db
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import (
    PasswordChangeRequest,
    UserResponse,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """1. Retrieve authenticated user profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """2. Update authenticated user profile details."""
    if req.email and req.email != current_user.email:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use by another account.",
            )
        current_user.email = req.email
        current_user.is_verified = False  # requires re-verification

    if req.full_name is not None:
        current_user.full_name = req.full_name

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password", response_model=MessageResponse)
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """3. Change password with current password check."""
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return MessageResponse(message="Password changed successfully.")


@router.delete("/me", response_model=MessageResponse)
def deactivate_my_account(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """4. Deactivate account (soft delete)."""
    current_user.is_active = False
    db.commit()
    return MessageResponse(message="Account successfully deactivated.")


@router.get(
    "/", response_model=list[UserResponse], dependencies=[Depends(require_roles(["admin"]))]
)
def list_all_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """5. Admin endpoint: list all registered users (RBAC protected)."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.patch(
    "/{user_id}/role", response_model=UserResponse, dependencies=[Depends(require_roles(["admin"]))]
)
def update_user_role(user_id: str, req: UserRoleUpdateRequest, db: Session = Depends(get_db)):
    """6. Admin endpoint: update a user's system role (RBAC protected)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.role = req.role
    db.commit()
    db.refresh(user)
    return user
