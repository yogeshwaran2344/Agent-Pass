from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PermissionBase(BaseModel):
    max_amount_per_tx: float = 100.0
    daily_spend_limit: float = 500.0
    monthly_spend_limit: float = 2000.0
    require_human_approval_above: float = 50.0
    allowed_merchants: list[str] = []
    disallowed_merchants: list[str] = []
    allowed_categories: list[str] = []
    disallowed_categories: list[str] = []
    valid_until: datetime | None = None


class PermissionCreate(PermissionBase):
    agent_id: str


class PermissionRead(PermissionBase):
    id: str
    agent_id: str
    is_active: bool
    valid_from: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PermissionCheckRequest(BaseModel):
    agent_id: str
    amount: float
    merchant: str
    category: str | None = None


class PermissionCheckResponse(BaseModel):
    is_authorized: bool
    requires_human_approval: bool
    reason: str
    violations: list[str] = []
