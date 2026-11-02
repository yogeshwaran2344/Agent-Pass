from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.agent import Agent
from app.models.approval import ApprovalRequest
from app.models.audit import AuditLog
from app.models.commitment import Commitment
from app.models.transaction import Transaction
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard Statistics"])


class DashboardStatsResponse(BaseModel):
    total_agents: int
    active_agents: int
    suspended_agents: int
    pending_approvals_count: int
    total_reserved_usd: float
    total_settled_usd: float
    recent_transactions: list[dict]
    recent_audit_events: list[dict]
    pending_approvals: list[dict]


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate live metrics for the user's dashboard."""
    # Agent stats
    agents = db.query(Agent).filter(Agent.owner_id == current_user.id).all()
    total_agents = len(agents)
    active_agents = len([a for a in agents if a.status == "active"])
    suspended_agents = len([a for a in agents if a.status in ("suspended", "killed")])

    agent_ids = [a.id for a in agents]

    # Pending approvals
    pending_approvals = (
        db.query(ApprovalRequest)
        .filter(ApprovalRequest.agent_id.in_(agent_ids) if agent_ids else True, ApprovalRequest.status == "pending")
        .order_by(ApprovalRequest.created_at.desc())
        .limit(5)
        .all()
    )

    # Commitments reserved
    reserved_sum = (
        db.query(func.coalesce(func.sum(Commitment.amount), 0.0))
        .filter(Commitment.agent_id.in_(agent_ids) if agent_ids else True, Commitment.status == "reserved")
        .scalar()
    )

    # Settled transactions
    settled_sum = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.agent_id.in_(agent_ids) if agent_ids else True, Transaction.status == "completed")
        .scalar()
    )

    # Recent transactions
    txs = (
        db.query(Transaction)
        .filter(Transaction.agent_id.in_(agent_ids) if agent_ids else True)
        .order_by(Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    # Recent audit events
    audit_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(6).all()

    return DashboardStatsResponse(
        total_agents=total_agents,
        active_agents=active_agents,
        suspended_agents=suspended_agents,
        pending_approvals_count=len(pending_approvals),
        total_reserved_usd=float(reserved_sum),
        total_settled_usd=float(settled_sum),
        recent_transactions=[
            {
                "id": t.id,
                "agent_id": t.agent_id,
                "merchant": t.merchant,
                "amount": t.amount,
                "status": t.status,
                "payment_method": t.payment_method,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in txs
        ],
        recent_audit_events=[
            {
                "id": a.id,
                "action": a.action,
                "actor_type": a.actor_type,
                "description": a.description,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in audit_logs
        ],
        pending_approvals=[
            {
                "id": p.id,
                "agent_id": p.agent_id,
                "merchant_name": p.merchant_name,
                "amount": p.amount,
                "item_description": p.item_description,
                "reason_for_approval": p.reason_for_approval,
                "policy_conflicts": p.policy_conflicts,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in pending_approvals
        ],
    )
