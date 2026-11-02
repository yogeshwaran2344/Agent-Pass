import uuid

from sqlalchemy.orm import Session

from app.models.agent import Agent, AgentStatusHistory
from app.models.approval import ApprovalRequest
from app.models.audit import AuditLog
from app.models.commitment import Commitment
from app.models.delegation import AgentDelegation


class EmergencyKillSwitch:
    @staticmethod
    def kill_agent(
        db: Session,
        agent_id: str,
        reason: str,
        actor_id: str = "master_user",
        scope: str = "agent"  # "agent", "delegation_tree", "global"
    ) -> list[str]:
        """
        Immediately halts financial authority and revokes active authorizations.
        Returns list of agent IDs terminated.
        """
        affected_agents: list[str] = []

        if scope == "global":
            # Terminate all active agents
            agents = db.query(Agent).filter(Agent.is_kill_switched == False).all()
            for ag in agents:
                ag.is_kill_switched = True
                ag.status = "killed"
                ag.kill_reason = f"GLOBAL EMERGENCY KILL SWITCH: {reason}"
                affected_agents.append(ag.id)
                db.add(AgentStatusHistory(
                    id=str(uuid.uuid4()),
                    agent_id=ag.id,
                    previous_status="active",
                    new_status="killed",
                    reason=f"GLOBAL KILL: {reason}",
                    changed_by_user_id=actor_id
                ))
        elif scope == "delegation_tree":
            # Find root agent and all downstream descendants recursively
            to_process = [agent_id]
            while to_process:
                curr_id = to_process.pop(0)
                affected_agents.append(curr_id)
                children = (
                    db.query(AgentDelegation.child_agent_id)
                    .filter(AgentDelegation.parent_agent_id == curr_id, AgentDelegation.is_active == True)
                    .all()
                )
                for (child_id,) in children:
                    if child_id not in affected_agents and child_id not in to_process:
                        to_process.append(child_id)

            for aid in affected_agents:
                ag = db.query(Agent).filter(Agent.id == aid).first()
                if ag:
                    ag.is_kill_switched = True
                    ag.status = "killed"
                    ag.kill_reason = f"DELEGATION TREE KILL: {reason}"
        else:
            # Single agent kill
            ag = db.query(Agent).filter(Agent.id == agent_id).first()
            if ag:
                ag.is_kill_switched = True
                ag.status = "killed"
                ag.kill_reason = reason
                affected_agents.append(ag.id)
                db.add(AgentStatusHistory(
                    id=str(uuid.uuid4()),
                    agent_id=ag.id,
                    previous_status="active",
                    new_status="killed",
                    reason=reason,
                    changed_by_user_id=actor_id
                ))

        # Cancel all reserved commitments for affected agents
        if affected_agents:
            db.query(Commitment).filter(
                Commitment.agent_id.in_(affected_agents),
                Commitment.status == "reserved"
            ).update({"status": "released"}, synchronize_session=False)

            # Invalidate pending approvals
            db.query(ApprovalRequest).filter(
                ApprovalRequest.agent_id.in_(affected_agents),
                ApprovalRequest.status == "pending"
            ).update({"status": "expired", "user_comment": "Canceled by Emergency Kill Switch"}, synchronize_session=False)

            # Audit record
            db.add(AuditLog(
                id=str(uuid.uuid4()),
                entity_type="KILL_SWITCH",
                entity_id=agent_id or "GLOBAL",
                actor_type="USER",
                actor_id=actor_id,
                action="KILL_SWITCH_TRIGGERED",
                description=f"Scope: {scope}. Terminated {len(affected_agents)} agents. Reason: {reason}",
                payload_snapshot={"affected_agent_ids": affected_agents, "scope": scope, "reason": reason}
            ))

        db.commit()
        return affected_agents
