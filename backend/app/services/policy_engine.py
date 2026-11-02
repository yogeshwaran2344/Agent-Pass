from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.commitment import Commitment
from app.models.permission import AgentPermission
from app.models.transaction import Transaction


class PolicyEngine:
    @staticmethod
    def evaluate_transaction(
        db: Session,
        agent_id: str,
        amount: float,
        merchant: str,
        category: str = ""
    ) -> tuple[bool, bool, str, list[str]]:
        """
        Deterministic Policy Enforcement.
        Returns:
            (is_authorized, requires_human_approval, reason, violations)
        """
        violations: list[str] = []

        # 1. Agent status & Kill switch check
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return False, False, "Agent not found in registry", ["AGENT_NOT_FOUND"]
        if agent.is_kill_switched or agent.status in ("killed", "revoked"):
            return False, False, f"Agent is terminated via Kill Switch: {agent.kill_reason}", ["KILL_SWITCH_ACTIVE"]
        if agent.status == "suspended":
            return False, True, "Agent is currently suspended; requires human review", ["AGENT_SUSPENDED"]

        # 2. Query active permission policy
        now = datetime.now(timezone.utc)
        permission = (
            db.query(AgentPermission)
            .filter(
                AgentPermission.agent_id == agent_id,
                AgentPermission.is_active == True,
            )
            .first()
        )
        if not permission:
            return False, False, "No active permission policy assigned to agent", ["NO_PERMISSION_POLICY"]

        # Check validity window
        if permission.valid_until and permission.valid_until < now:
            return False, False, "Agent permission policy has expired", ["POLICY_EXPIRED"]

        # 3. Check per-transaction limit
        if amount > permission.max_amount_per_tx:
            violations.append(
                f"Amount ${amount:.2f} exceeds per-transaction limit of ${permission.max_amount_per_tx:.2f}"
            )

        # 4. Check daily spending velocity limit
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        daily_spent = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(
                Transaction.agent_id == agent_id,
                Transaction.created_at >= start_of_day,
                Transaction.status.in_(["authorized", "completed", "pending"]),
            )
            .scalar()
        )
        # Also include currently reserved commitments
        daily_committed = (
            db.query(func.coalesce(func.sum(Commitment.amount), 0.0))
            .filter(
                Commitment.agent_id == agent_id,
                Commitment.reserved_at >= start_of_day,
                Commitment.status == "reserved",
            )
            .scalar()
        )

        total_projected_daily = float(daily_spent) + float(daily_committed) + amount
        if total_projected_daily > permission.daily_spend_limit:
            violations.append(
                f"Projected daily spend ${total_projected_daily:.2f} exceeds daily limit ${permission.daily_spend_limit:.2f}"
            )

        # 5. Merchant whitelist/blacklist check
        merchant_lower = merchant.lower().strip()
        disallowed_merchants = [m.lower().strip() for m in (permission.disallowed_merchants or [])]
        if any(d in merchant_lower for d in disallowed_merchants):
            violations.append(f"Merchant '{merchant}' is explicitly blocked by policy")

        allowed_merchants = [m.lower().strip() for m in (permission.allowed_merchants or [])]
        if allowed_merchants and not any(a in merchant_lower for a in allowed_merchants):
            violations.append(f"Merchant '{merchant}' is not in approved merchant whitelist")

        # 6. Category whitelist/blacklist check
        category_lower = category.lower().strip()
        disallowed_cats = [c.lower().strip() for c in (permission.disallowed_categories or [])]
        if any(c in category_lower for c in disallowed_cats):
            violations.append(f"Category '{category}' is in prohibited categories list")

        # Decision synthesis
        if violations:
            return False, False, f"Policy violation: {'; '.join(violations)}", violations

        # Check if amount requires human approval
        requires_approval = amount >= permission.require_human_approval_above
        reason = "Passed all deterministic rules"
        if requires_approval:
            reason += f" (Amount ${amount:.2f} triggers human approval threshold of ${permission.require_human_approval_above:.2f})"

        return True, requires_approval, reason, []
