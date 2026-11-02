import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.agent import Agent, AgentStatusHistory
from app.schemas.agent import AgentCreate, AgentRead, AgentUpdate

router = APIRouter(prefix="/agents", tags=["Agent Registry"])


@router.post("/", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
def register_agent(agent_in: AgentCreate, owner_id: str = "master_user", db: Session = Depends(get_db)):
    agent = Agent(
        id=str(uuid.uuid4()),
        owner_id=owner_id,
        name=agent_in.name,
        description=agent_in.description,
        agent_type=agent_in.agent_type,
        status="active",
        reputation_score=1.0,
        is_kill_switched=False,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/", response_model=list[AgentRead])
def list_agents(db: Session = Depends(get_db)):
    return db.query(Agent).all()


@router.get("/{agent_id}", response_model=AgentRead)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentRead)
def update_agent(agent_id: str, agent_in: AgentUpdate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent_in.name:
        agent.name = agent_in.name
    if agent_in.description:
        agent.description = agent_in.description
    if agent_in.status:
        prev = agent.status
        agent.status = agent_in.status
        db.add(AgentStatusHistory(
            id=str(uuid.uuid4()),
            agent_id=agent.id,
            previous_status=prev,
            new_status=agent_in.status,
            reason="Manual status update via API"
        ))
    db.commit()
    db.refresh(agent)
    return agent
