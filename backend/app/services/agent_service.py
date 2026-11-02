import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.agent import (
    Agent,
    AgentCapability,
    AgentCredential,
    AgentReputation,
    AgentStatusHistory,
)
from app.models.audit import AuditLog
from app.schemas.agent import AgentCapabilitySchema, AgentCreate


class AgentRegistryService:
    @staticmethod
    def generate_api_key() -> tuple[str, str, str]:
        """
        Generate high-entropy agent API key.
        Returns: (full_key, key_prefix, key_hash)
        """
        token = secrets.token_hex(24)
        full_key = f"agp_live_{token}"
        key_prefix = full_key[:14]  # e.g., "agp_live_abc12"
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        return full_key, key_prefix, key_hash

    @staticmethod
    def register_agent(db: Session, owner_id: str, agent_in: AgentCreate) -> tuple[Agent, str]:
        """
        Register a new AI agent with credentials, capabilities, and initial reputation profile.
        """
        agent_id = f"ag_{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc)

        # 1. Create Agent core record
        agent = Agent(
            id=agent_id,
            owner_id=owner_id,
            name=agent_in.name,
            description=agent_in.description,
            agent_type=agent_in.agent_type,
            framework=agent_in.framework or "custom",
            model_name=agent_in.model_name or "gemini-2.0-flash",
            metadata_json=agent_in.metadata_json or {},
            status="active",
            is_kill_switched=False,
            created_at=now,
            updated_at=now,
        )
        db.add(agent)

        # 2. Issue initial API credential
        raw_key, prefix, key_hash = AgentRegistryService.generate_api_key()
        credential = AgentCredential(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            key_prefix=prefix,
            key_hash=key_hash,
            name="Primary Live Key",
            is_active=True,
            created_at=now,
        )
        db.add(credential)

        # 3. Initialize default capabilities
        capabilities_to_add = agent_in.capabilities or [
            AgentCapabilitySchema(capability_name="ecommerce:search", scope="browsing"),
            AgentCapabilitySchema(capability_name="ecommerce:purchase", scope="financial"),
        ]
        for cap in capabilities_to_add:
            db.add(
                AgentCapability(
                    id=str(uuid.uuid4()),
                    agent_id=agent_id,
                    capability_name=cap.capability_name,
                    scope=cap.scope,
                    description=cap.description,
                    is_enabled=cap.is_enabled,
                    created_at=now,
                )
            )

        # 4. Initialize Reputation profile
        reputation = AgentReputation(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            total_tasks_attempted=0,
            successful_tasks_count=0,
            failed_tasks_count=0,
            policy_violations_count=0,
            rejected_recommendations_count=0,
            reputation_score=100.0,
            trust_tier="ESTABLISHED",
            last_evaluated_at=now,
        )
        db.add(reputation)

        # 5. Record initial status history & Audit Log
        db.add(
            AgentStatusHistory(
                id=str(uuid.uuid4()),
                agent_id=agent_id,
                previous_status=None,
                new_status="active",
                reason="Agent registration",
                changed_by_user_id=owner_id,
                created_at=now,
            )
        )

        db.add(
            AuditLog(
                id=str(uuid.uuid4()),
                entity_type="AGENT",
                entity_id=agent_id,
                actor_type="USER",
                actor_id=owner_id,
                action="AGENT_REGISTERED",
                description=f"Agent '{agent_in.name}' registered with capabilities: {[c.capability_name for c in capabilities_to_add]}",
                payload_snapshot={"framework": agent_in.framework, "model": agent_in.model_name},
                created_at=now,
            )
        )

        db.commit()
        db.refresh(agent)
        return agent, raw_key

    @staticmethod
    def authenticate_agent_by_key(db: Session, raw_key: str) -> Agent:
        """
        Verify incoming API key from agent and return Agent record if active.
        """
        if not raw_key.startswith("agp_live_"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid agent API key format",
            )

        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        credential = (
            db.query(AgentCredential)
            .filter(
                AgentCredential.key_hash == key_hash,
                AgentCredential.is_active == True,
            )
            .first()
        )

        if not credential:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked agent API key",
            )

        agent = db.query(Agent).filter(Agent.id == credential.agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Agent not found for provided key",
            )

        if agent.is_kill_switched or agent.status == "killed":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Agent financial authorization terminated via Kill Switch: {agent.kill_reason}",
            )

        if agent.status in ("suspended", "deactivated", "revoked"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Agent is currently {agent.status}: {agent.suspension_reason or 'No reason provided'}",
            )

        # Update last used timestamp
        credential.last_used_at = datetime.now(timezone.utc)
        db.commit()

        return agent

    @staticmethod
    def update_agent_status(
        db: Session, agent_id: str, new_status: str, reason: str, actor_id: str
    ) -> Agent:
        """Transition agent lifecycle status with audit recording."""
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        valid_statuses = ("active", "suspended", "deactivated", "revoked")
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{new_status}'. Allowed: {valid_statuses}",
            )

        prev_status = agent.status
        agent.status = new_status
        if new_status == "suspended":
            agent.suspension_reason = reason
        elif new_status == "active":
            agent.suspension_reason = None

        now = datetime.now(timezone.utc)
        agent.updated_at = now

        db.add(
            AgentStatusHistory(
                id=str(uuid.uuid4()),
                agent_id=agent.id,
                previous_status=prev_status,
                new_status=new_status,
                reason=reason,
                changed_by_user_id=actor_id,
                created_at=now,
            )
        )

        db.add(
            AuditLog(
                id=str(uuid.uuid4()),
                entity_type="AGENT",
                entity_id=agent.id,
                actor_type="USER",
                actor_id=actor_id,
                action=f"AGENT_STATUS_CHANGED_{new_status.upper()}",
                description=f"Status changed from {prev_status} to {new_status}. Reason: {reason}",
                payload_snapshot={
                    "previous_status": prev_status,
                    "new_status": new_status,
                    "reason": reason,
                },
                created_at=now,
            )
        )

        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def add_capability(
        db: Session, agent_id: str, cap_in: AgentCapabilitySchema
    ) -> AgentCapability:
        """Register a new declared capability for the agent."""
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        existing = (
            db.query(AgentCapability)
            .filter(
                AgentCapability.agent_id == agent_id,
                AgentCapability.capability_name == cap_in.capability_name,
            )
            .first()
        )

        if existing:
            existing.is_enabled = cap_in.is_enabled
            existing.description = cap_in.description
            db.commit()
            db.refresh(existing)
            return existing

        cap = AgentCapability(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            capability_name=cap_in.capability_name,
            scope=cap_in.scope,
            description=cap_in.description,
            is_enabled=cap_in.is_enabled,
            created_at=datetime.now(timezone.utc),
        )
        db.add(cap)
        db.commit()
        db.refresh(cap)
        return cap
