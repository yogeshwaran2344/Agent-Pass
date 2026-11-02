import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.commitment import Commitment
from app.models.permission import AgentPermission


class CommitmentEngine:
    @staticmethod
    def reserve_budget(
        db: Session,
        agent_id: str,
        amount: float,
        merchant: str,
        purpose: str,
        intent_id: str | None = None,
        hold_minutes: int = 15,
    ) -> Commitment:
        """
        Creates a temporary budget lock/hold (RESERVED) before payment execution.
        Fails if remaining unreserved daily budget is insufficient.
        """
        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Fetch agent permission daily limit
        permission = (
            db.query(AgentPermission)
            .filter(AgentPermission.agent_id == agent_id, AgentPermission.is_active == True)
            .first()
        )

        daily_limit = permission.daily_spend_limit if permission else 500.0

        # 2. Sum existing active commitments for today
        active_commitments = (
            db.query(func.coalesce(func.sum(Commitment.amount), 0.0))
            .filter(
                Commitment.agent_id == agent_id,
                Commitment.reserved_at >= start_of_day,
                Commitment.status.in_(["reserved", "committed", "settled"]),
                Commitment.expires_at > now,
            )
            .scalar()
        )

        remaining_budget = daily_limit - float(active_commitments)
        if amount > remaining_budget:
            raise ValueError(
                f"Insufficient available budget. Requested hold: ${amount:.2f}, "
                f"Remaining uncommitted budget: ${remaining_budget:.2f}"
            )

        # 3. Create commitment
        commitment = Commitment(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            intent_id=intent_id,
            amount=amount,
            currency="USD",
            merchant=merchant,
            purpose=purpose,
            status="reserved",
            reserved_at=now,
            expires_at=now + timedelta(minutes=hold_minutes),
        )
        db.add(commitment)
        db.commit()
        db.refresh(commitment)
        return commitment

    @staticmethod
    def settle_commitment(db: Session, commitment_id: str) -> Commitment:
        """Mark a commitment as SETTLED upon successful payment capture."""
        commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
        if not commitment:
            raise ValueError(f"Commitment '{commitment_id}' not found.")

        commitment.status = "settled"
        commitment.settled_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(commitment)
        return commitment

    @staticmethod
    def release_commitment(db: Session, commitment_id: str) -> Commitment:
        """Release a reserved commitment (e.g. if purchase was canceled or rejected)."""
        commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
        if not commitment:
            raise ValueError(f"Commitment '{commitment_id}' not found.")

        commitment.status = "released"
        db.commit()
        db.refresh(commitment)
        return commitment
