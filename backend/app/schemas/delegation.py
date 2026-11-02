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
    delegation_depth: int
    task_description: str | None
    delegated_budget_limit: float
    allowed_categories: list[str]
    is_active: bool
    created_at: datetime
    expires_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
