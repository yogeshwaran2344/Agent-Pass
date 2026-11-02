from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ApprovalCreate(BaseModel):
    agent_id: str
    intent_id: str | None = None
    amount: float
    currency: str = "USD"
    merchant_name: str
    item_description: str
    reason_for_approval: str
    policy_conflicts: list[str] = []
    intent_divergence_summary: str | None = None


class ApprovalActionRequest(BaseModel):
    action: str  # approve, reject, request_clarification
    user_comment: str | None = None


class ApprovalRead(BaseModel):
    id: str
    agent_id: str
    intent_id: str | None = None
    amount: float
    currency: str
    merchant_name: str
    item_description: str
    reason_for_approval: str
    policy_conflicts: list[str]
    intent_divergence_summary: str | None = None
    status: str
    user_comment: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
