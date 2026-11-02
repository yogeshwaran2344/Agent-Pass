import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.agent import Agent
from app.models.delegation import AgentDelegation
from app.models.permission import AgentPermission
from app.schemas.delegation import DelegationCreate, DelegationRead

router = APIRouter(prefix="/delegations", tags=["Delegation Chain Tracking"])


@router.post("/", response_model=DelegationRead, status_code=status.HTTP_201_CREATED)
def delegate_authority(del_in: DelegationCreate, db: Session = Depends(get_db)):
    parent = db.query(Agent).filter(Agent.id == del_in.parent_agent_id).first()
    child = db.query(Agent).filter(Agent.id == del_in.child_agent_id).first()
    if not parent or not child:
        raise HTTPException(status_code=404, detail="Parent or child agent not found")

    # Invariance check: Delegated budget must not exceed parent's daily limit
    parent_perm = db.query(AgentPermission).filter(
        AgentPermission.agent_id == parent.id,
        AgentPermission.is_active == True
    ).first()

    if parent_perm and del_in.delegated_budget_limit > parent_perm.daily_spend_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delegate authority (${del_in.delegated_budget_limit:.2f}) exceeding parent's limit (${parent_perm.daily_spend_limit:.2f})"
        )

    # Determine delegation depth
    prior_delegation = (
        db.query(AgentDelegation)
        .filter(AgentDelegation.child_agent_id == parent.id, AgentDelegation.is_active == True)
        .first()
    )
    depth = (prior_delegation.delegation_depth + 1) if prior_delegation else 1

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=del_in.expires_in_hours) if del_in.expires_in_hours else None

    delegation = AgentDelegation(
        id=str(uuid.uuid4()),
        parent_agent_id=del_in.parent_agent_id,
        child_agent_id=del_in.child_agent_id,
        delegation_depth=depth,
        task_description=del_in.task_description,
        delegated_budget_limit=del_in.delegated_budget_limit,
        allowed_categories=del_in.allowed_categories,
        is_active=True,
        expires_at=expires_at
    )
    db.add(delegation)
    db.commit()
    db.refresh(delegation)
    return delegation


@router.get("/chain/{agent_id}", response_model=list[DelegationRead])
def get_agent_delegation_chain(agent_id: str, db: Session = Depends(get_db)):
    """Retrieve full delegation ancestors for an agent."""
    chain = []
    curr_id = agent_id
    while True:
        del_record = (
            db.query(AgentDelegation)
            .filter(AgentDelegation.child_agent_id == curr_id, AgentDelegation.is_active == True)
            .first()
        )
        if not del_record:
            break
        chain.append(del_record)
        curr_id = del_record.parent_agent_id
    return chain
