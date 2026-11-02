import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.agent import Agent
from app.models.approval import ApprovalRequest
from app.models.notification import Notification
from app.schemas.approval import ApprovalActionRequest, ApprovalCreate, ApprovalRead

router = APIRouter(prefix="/approvals", tags=["Context-Aware Human Approval"])


@router.post("/", response_model=ApprovalRead, status_code=status.HTTP_201_CREATED)
def create_approval_request(appr_in: ApprovalCreate, db: Session = Depends(get_db)):
    req = ApprovalRequest(
        id=str(uuid.uuid4()),
        agent_id=appr_in.agent_id,
        intent_id=appr_in.intent_id,
        amount=appr_in.amount,
        currency=appr_in.currency,
        merchant_name=appr_in.merchant_name,
        item_description=appr_in.item_description,
        reason_for_approval=appr_in.reason_for_approval,
        policy_conflicts=appr_in.policy_conflicts,
        intent_divergence_summary=appr_in.intent_divergence_summary,
        status="pending",
    )
    db.add(req)

    # Emit real-time Notification to owner
    agent = db.query(Agent).filter(Agent.id == appr_in.agent_id).first()
    owner_id = agent.owner_id if agent else "system"
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=owner_id,
        title="Human Approval Required",
        message=f"Agent '{agent.name if agent else 'Autonomous Agent'}' requested approval for ${appr_in.amount:.2f} at {appr_in.merchant_name}: {appr_in.reason_for_approval}",
        notification_type="APPROVAL_REQUIRED",
    )
    db.add(notif)

    db.commit()
    db.refresh(req)
    return req


@router.get("/pending", response_model=list[ApprovalRead])
def get_pending_approvals(db: Session = Depends(get_db)):
    return db.query(ApprovalRequest).filter(ApprovalRequest.status == "pending").all()


@router.post("/{approval_id}/action", response_model=ApprovalRead)
def act_on_approval(
    approval_id: str, action_in: ApprovalActionRequest, db: Session = Depends(get_db)
):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if action_in.action == "approve":
        req.status = "approved"
    elif action_in.action == "reject":
        req.status = "rejected"
    elif action_in.action == "clarify":
        req.status = "clarification_requested"
    else:
        raise HTTPException(
            status_code=400, detail="Invalid action. Use 'approve', 'reject', or 'clarify'"
        )

    req.user_comment = action_in.user_comment
    req.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req
