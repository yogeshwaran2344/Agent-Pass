from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.agent import Agent, AgentStatusHistory
from app.models.user import User
from app.schemas.agent import (
    AgentCapabilitySchema,
    AgentCreate,
    AgentRegistrationResponse,
    AgentResponse,
    AgentStatusUpdate,
    AgentUpdate,
)
from app.schemas.common import MessageResponse
from app.services.agent_service import AgentRegistryService

router = APIRouter(prefix="/agents", tags=["Agent Registry"])


def get_agent_from_api_key(
    x_agent_key: str | None = Header(default=None, alias="X-Agent-Key"),
    db: Session = Depends(get_db)
) -> Agent:
    """Dependency: Authenticates an autonomous agent by its X-Agent-Key header."""
    if not x_agent_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing 'X-Agent-Key' header",
        )
    return AgentRegistryService.authenticate_agent_by_key(db, x_agent_key)


@router.post("/", response_model=AgentRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_agent(
    req: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """1. Register a new AI Agent, generate cryptographic API key, and assign ownership."""
    agent, raw_api_key = AgentRegistryService.register_agent(
        db=db,
        owner_id=current_user.id,
        agent_in=req
    )
    return AgentRegistrationResponse(
        agent=agent,
        api_key=raw_api_key,
        message="Agent registered successfully. Store the API key safely; it cannot be shown again."
    )


@router.get("/", response_model=list[AgentResponse])
def list_my_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """2. List all agents owned by the authenticated user."""
    return db.query(Agent).filter(Agent.owner_id == current_user.id).all()


@router.get("/me", response_model=AgentResponse)
def get_authenticated_agent_profile(
    agent: Agent = Depends(get_agent_from_api_key)
):
    """3. Agent self-introspection: allows an AI agent to verify its own identity and status."""
    return agent


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent_details(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """4. Get specific agent details including capabilities and reputation profile."""
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
def update_agent_metadata(
    agent_id: str,
    req: AgentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """5. Update agent metadata, framework, model, or description."""
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if req.name is not None:
        agent.name = req.name
    if req.description is not None:
        agent.description = req.description
    if req.framework is not None:
        agent.framework = req.framework
    if req.model_name is not None:
        agent.model_name = req.model_name
    if req.metadata_json is not None:
        agent.metadata_json = req.metadata_json

    db.commit()
    db.refresh(agent)
    return agent


@router.post("/{agent_id}/status", response_model=AgentResponse)
def change_agent_status(
    agent_id: str,
    req: AgentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """6. Transition agent lifecycle (activate, suspend, deactivate, revoke) with reason."""
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentRegistryService.update_agent_status(
        db=db,
        agent_id=agent.id,
        new_status=req.status,
        reason=req.reason,
        actor_id=current_user.id
    )


@router.post("/{agent_id}/capabilities", response_model=AgentCapabilitySchema)
def register_capability(
    agent_id: str,
    req: AgentCapabilitySchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """7. Register or update an agent capability (e.g. ecommerce:purchase, web:scrape)."""
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentRegistryService.add_capability(db=db, agent_id=agent.id, cap_in=req)


@router.get("/{agent_id}/history")
def get_agent_status_history(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """8. Retrieve immutable status transition history for the agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return db.query(AgentStatusHistory).filter(AgentStatusHistory.agent_id == agent_id).order_by(AgentStatusHistory.created_at.desc()).all()


@router.delete("/{agent_id}", response_model=MessageResponse)
def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """9. Soft-delete / deactivate agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    AgentRegistryService.update_agent_status(
        db=db,
        agent_id=agent.id,
        new_status="deactivated",
        reason="Agent deleted by owner",
        actor_id=current_user.id
    )
    return MessageResponse(message=f"Agent '{agent.name}' deactivated successfully.")
