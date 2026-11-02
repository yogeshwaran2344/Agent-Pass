import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.permission import AgentPermission
from app.schemas.permission import (
    PermissionCheckRequest,
    PermissionCheckResponse,
    PermissionCreate,
    PermissionRead,
)
from app.services.policy_engine import PolicyEngine

router = APIRouter(prefix="/permissions", tags=["Policy & Permissions Engine"])


@router.post("/", response_model=PermissionRead, status_code=status.HTTP_201_CREATED)
def create_permission_policy(perm_in: PermissionCreate, db: Session = Depends(get_db)):
    # Deactivate existing active policies for this agent
    db.query(AgentPermission).filter(
        AgentPermission.agent_id == perm_in.agent_id,
        AgentPermission.is_active == True
    ).update({"is_active": False})

    permission = AgentPermission(
        id=str(uuid.uuid4()),
        agent_id=perm_in.agent_id,
        max_amount_per_tx=perm_in.max_amount_per_tx,
        daily_spend_limit=perm_in.daily_spend_limit,
        monthly_spend_limit=perm_in.monthly_spend_limit,
        require_human_approval_above=perm_in.require_human_approval_above,
        allowed_merchants=perm_in.allowed_merchants,
        disallowed_merchants=perm_in.disallowed_merchants,
        allowed_categories=perm_in.allowed_categories,
        disallowed_categories=perm_in.disallowed_categories,
        valid_until=perm_in.valid_until,
        is_active=True
    )
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


@router.get("/agent/{agent_id}", response_model=list[PermissionRead])
def get_agent_permissions(agent_id: str, db: Session = Depends(get_db)):
    return db.query(AgentPermission).filter(AgentPermission.agent_id == agent_id).all()


@router.post("/evaluate", response_model=PermissionCheckResponse)
def evaluate_transaction_policy(req: PermissionCheckRequest, db: Session = Depends(get_db)):
    is_auth, req_approval, reason, violations = PolicyEngine.evaluate_transaction(
        db=db,
        agent_id=req.agent_id,
        amount=req.amount,
        merchant=req.merchant,
        category=req.category or ""
    )
    return PermissionCheckResponse(
        is_authorized=is_auth,
        requires_human_approval=req_approval,
        reason=reason,
        violations=violations
    )
