
from pydantic import BaseModel


class KillSwitchRequest(BaseModel):
    agent_id: str | None = None  # If None, global kill switch
    scope: str = "agent"  # agent, delegation_tree, global
    reason: str


class EmergencyStatus(BaseModel):
    global_kill_active: bool
    suspended_agents_count: int
    revoked_agents_count: int
    pending_approvals_count: int
