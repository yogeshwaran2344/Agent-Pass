from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DelegationCreate(BaseModel):
    parent_agent_id: str
    child_agent_id: str
    task_description: str
    delegated_budget_limit: float
    allowed_categories: list[str] = []
    expires_in_hours: int | None = 24


class DelegationRead(BaseModel):
    id: str
    parent_agent_id: str
    child_agent_id: str
    parent_agent_name: str | None = None
    child_agent_name: str | None = None
    delegation_depth: int
    task_description: str | None
    delegated_budget_limit: float
    allowed_categories: list[str]
    is_active: bool
    revocation_reason: str | None = None
    revoked_at: datetime | None = None
    created_at: datetime
    expires_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
