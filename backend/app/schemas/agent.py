from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AgentBase(BaseModel):
    name: str
    description: str | None = None
    agent_type: str = "autonomous_buyer"


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class AgentRead(AgentBase):
    id: str
    owner_id: str
    status: str
    reputation_score: float
    is_kill_switched: bool
    kill_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
