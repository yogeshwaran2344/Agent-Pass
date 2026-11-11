import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.agent import Agent
from app.models.approval import ApprovalRequest
from app.models.notification import Notification
from app.models.user import User
from app.schemas.emergency import EmergencyStatus, KillSwitchRequest
from app.services.emergency_engine import EmergencyKillSwitch

router = APIRouter(prefix="/emergency", tags=["Emergency Kill Switch"])


@router.post("/kill-switch")
def trigger_kill_switch(req: KillSwitchRequest, db: Session = Depends(get_db)):
    """Instantly terminate financial authorization across chosen scope."""
    affected = EmergencyKillSwitch.kill_agent(
        db=db,
        agent_id=req.agent_id or "",
        reason=req.reason,
        scope=req.scope,
    )

    # Emit urgent notification to admin/operator if user exists
    first_user = db.query(User).first()
    if first_user:
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=first_user.id,
            title="EMERGENCY KILL SWITCH TRIGGERED",
            message=f"Kill switch activated across scope '{req.scope}'. Reason: {req.reason}. {len(affected)} agent(s) terminated.",
            notification_type="KILL_SWITCH_TRIGGERED",
        )
        db.add(notif)
        db.commit()

    return {
        "status": "TRIGGERED",
        "scope": req.scope,
        "reason": req.reason,
        "terminated_agents_count": len(affected),
        "terminated_agent_ids": affected,
    }


@router.get("/status", response_model=EmergencyStatus)
def get_emergency_status(db: Session = Depends(get_db)):
    killed_count = db.query(Agent).filter(Agent.is_kill_switched == True).count()
    suspended_count = db.query(Agent).filter(Agent.status == "suspended").count()
    pending_appr = db.query(ApprovalRequest).filter(ApprovalRequest.status == "pending").count()

    return EmergencyStatus(
        global_kill_active=False,
        suspended_agents_count=suspended_count,
        revoked_agents_count=killed_count,
        pending_approvals_count=pending_appr,
    )
