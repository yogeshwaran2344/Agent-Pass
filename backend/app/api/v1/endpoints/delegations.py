import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.agent import Agent
from app.models.delegation import AgentDelegation
from app.models.permission import AgentPermission
from app.schemas.delegation import DelegationCreate, DelegationRead

router = APIRouter(prefix="/delegations", tags=["Delegation Chain Tracking"])


def _to_read_schema(d: AgentDelegation) -> DelegationRead:
    return DelegationRead(
        id=d.id,
        parent_agent_id=d.parent_agent_id,
        child_agent_id=d.child_agent_id,
        parent_agent_name=d.parent_agent.name if d.parent_agent else None,
        child_agent_name=d.child_agent.name if d.child_agent else None,
        delegation_depth=d.delegation_depth,
        task_description=d.task_description,
        delegated_budget_limit=d.delegated_budget_limit,
        allowed_categories=d.allowed_categories or [],
        is_active=d.is_active,
        revocation_reason=d.revocation_reason,
        revoked_at=d.revoked_at,
        created_at=d.created_at,
        expires_at=d.expires_at,
    )


@router.get("/", response_model=list[DelegationRead])
def list_delegations(
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
):
    """List all agent delegations with optional status filtering."""
    query = db.query(AgentDelegation)
    if is_active is not None:
        query = query.filter(AgentDelegation.is_active == is_active)
    delegations = query.order_by(AgentDelegation.created_at.desc()).all()
    return [_to_read_schema(d) for d in delegations]


@router.post("/", response_model=DelegationRead, status_code=status.HTTP_201_CREATED)
def delegate_authority(del_in: DelegationCreate, db: Session = Depends(get_db)):
    """
    Delegate authority from parent to child agent with strict invariance,
    cycle detection, and maximum depth enforcement.
    """
    if del_in.parent_agent_id == del_in.child_agent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-delegation prohibited: An agent cannot delegate authority to itself.",
        )

    parent = db.query(Agent).filter(Agent.id == del_in.parent_agent_id).first()
    child = db.query(Agent).filter(Agent.id == del_in.child_agent_id).first()
    if not parent or not child:
        raise HTTPException(status_code=404, detail="Parent or child agent not found")

    # Cycle Detection: Child must not already be an ancestor of Parent
    curr_id = parent.id
    visited = {parent.id}
    while True:
        ancestor_del = (
            db.query(AgentDelegation)
            .filter(
                AgentDelegation.child_agent_id == curr_id,
                AgentDelegation.is_active == True,
            )
            .first()
        )
        if not ancestor_del:
            break
        if ancestor_del.parent_agent_id == child.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Circular delegation detected: The child agent is already an ancestor of the parent.",
            )
        if ancestor_del.parent_agent_id in visited:
            break
        visited.add(ancestor_del.parent_agent_id)
        curr_id = ancestor_del.parent_agent_id

    # Invariance check: Delegated budget must not exceed parent's daily limit
    parent_perm = (
        db.query(AgentPermission)
        .filter(
            AgentPermission.agent_id == parent.id,
            AgentPermission.is_active == True,
        )
        .first()
    )

    if parent_perm and del_in.delegated_budget_limit > parent_perm.daily_spend_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delegate authority (${del_in.delegated_budget_limit:.2f}) exceeding parent's limit (${parent_perm.daily_spend_limit:.2f})",
        )

    # Determine delegation depth and check limit (max 5)
    prior_delegation = (
        db.query(AgentDelegation)
        .filter(AgentDelegation.child_agent_id == parent.id, AgentDelegation.is_active == True)
        .first()
    )
    depth = (prior_delegation.delegation_depth + 1) if prior_delegation else 1

    if depth > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum delegation depth of 5 exceeded (calculated depth: {depth}). Delegation rejected.",
        )

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
        expires_at=expires_at,
    )
    db.add(delegation)
    db.commit()
    db.refresh(delegation)
    return _to_read_schema(delegation)


@router.get("/chain/{agent_id}", response_model=list[DelegationRead])
def get_agent_delegation_chain(agent_id: str, db: Session = Depends(get_db)):
    """Retrieve full delegation ancestors for an agent from child to root."""
    chain = []
    curr_id = agent_id
    visited = set()
    while True:
        if curr_id in visited:
            break
        visited.add(curr_id)

        del_record = (
            db.query(AgentDelegation)
            .filter(AgentDelegation.child_agent_id == curr_id, AgentDelegation.is_active == True)
            .first()
        )
        if not del_record:
            break
        chain.append(_to_read_schema(del_record))
        curr_id = del_record.parent_agent_id
    return chain


@router.delete("/{delegation_id}", response_model=DelegationRead)
def revoke_delegation(
    delegation_id: str,
    reason: str = Query("Manually revoked by admin", description="Reason for revocation"),
    db: Session = Depends(get_db),
):
    """Revoke an active delegation immediately."""
    delegation = db.query(AgentDelegation).filter(AgentDelegation.id == delegation_id).first()
    if not delegation:
        raise HTTPException(status_code=404, detail="Delegation record not found")

    delegation.is_active = False
    delegation.revoked_at = datetime.now(timezone.utc)
    delegation.revocation_reason = reason
    db.commit()
    db.refresh(delegation)
    return _to_read_schema(delegation)
