from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class IntentBase(BaseModel):
    raw_prompt: str
    primary_goal: str | None = None
    target_category: str | None = None
    positive_constraints: list[str] = []
    negative_constraints: list[str] = []
    max_acceptable_budget: float | None = None


class IntentCreate(IntentBase):
    pass


class IntentRead(IntentBase):
    id: str
    user_id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IntentEvaluateRequest(BaseModel):
    intent_id: str
    agent_id: str
    proposed_item_name: str
    proposed_merchant: str
    proposed_price: float
    proposed_item_specs: dict[str, Any] = {}


class IntentEvaluateResponse(BaseModel):
    evaluation_id: str
    intent_id: str
    consistency_score: float
    is_consistent: bool
    decision: str  # MATCH, DRIFT, HARD_CONFLICT
    conflicting_requirements: list[str]
    reasoning: str
