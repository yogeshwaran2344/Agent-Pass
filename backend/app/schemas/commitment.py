from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CommitmentCreate(BaseModel):
    agent_id: str
    intent_id: str | None = None
    amount: float
    currency: str = "USD"
    merchant: str
    purpose: str
    hold_duration_minutes: int = 15


class CommitmentRead(BaseModel):
    id: str
    agent_id: str
    intent_id: str | None = None
    amount: float
    currency: str
    merchant: str
    purpose: str
    status: str
    reserved_at: datetime
    expires_at: datetime
    settled_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
