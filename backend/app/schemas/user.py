from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None


class UserRegisterRequest(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: str = Field(
        default="agent_operator", description="Role: admin, agent_operator, auditor, user"
    )


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    is_superuser: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Role: admin, agent_operator, auditor, user")


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class EmailVerifyRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefreshRequest(BaseModel):
    refresh_token: str
