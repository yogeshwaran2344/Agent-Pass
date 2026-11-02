from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AgentCapabilitySchema(BaseModel):
    capability_name: str = Field(..., description="e.g. ecommerce:search, ecommerce:purchase")
    scope: str = Field(default="financial", description="financial, browsing, delegation")
    description: str | None = None
    is_enabled: bool = True

    model_config = ConfigDict(from_attributes=True)


class AgentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = None
    agent_type: str = Field(default="autonomous_buyer")
    framework: str | None = Field(
        default="custom", description="langchain, crewai, autogen, custom"
    )
    model_name: str | None = Field(default="gemini-2.0-flash")
    metadata_json: dict = Field(default_factory=dict)


class AgentCreate(AgentBase):
    capabilities: list[AgentCapabilitySchema] = Field(default_factory=list)


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    framework: str | None = None
    model_name: str | None = None
    metadata_json: dict | None = None


class AgentStatusUpdate(BaseModel):
    status: str = Field(..., description="active, suspended, deactivated, revoked")
    reason: str = Field(..., min_length=3)


class AgentCredentialResponse(BaseModel):
    id: str
    key_prefix: str
    api_key: str | None = None  # only returned upon generation
    name: str
    is_active: bool
    created_at: datetime
    expires_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AgentReputationResponse(BaseModel):
    reputation_score: float
    trust_tier: str
    total_tasks_attempted: int
    successful_tasks_count: int
    failed_tasks_count: int
    policy_violations_count: int
    rejected_recommendations_count: int

    model_config = ConfigDict(from_attributes=True)


class AgentResponse(AgentBase):
    id: str
    owner_id: str
    status: str
    suspension_reason: str | None = None
    is_kill_switched: bool
    kill_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    capabilities: list[AgentCapabilitySchema] = Field(default_factory=list)
    reputation: AgentReputationResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class AgentRegistrationResponse(BaseModel):
    agent: AgentResponse
    api_key: str
    message: str = (
        "Agent registered successfully. Store the API key safely; it cannot be shown again."
    )
