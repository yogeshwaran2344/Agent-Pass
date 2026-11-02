from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(50), index=True)  # AGENT, PERMISSION, INTENT, APPROVAL, TRANSACTION, KILL_SWITCH
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    actor_type: Mapped[str] = mapped_column(String(30))  # USER, AGENT, SYSTEM
    actor_id: Mapped[str] = mapped_column(String(36))

    action: Mapped[str] = mapped_column(String(100), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)

    # Tamper-evident integrity hash chaining
    previous_log_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    current_log_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    incident_type: Mapped[str] = mapped_column(String(50), index=True)  # KILL_SWITCH_TRIGGERED, PROMPT_INJECTION, REPLAY_ATTACK, UNAPPROVED_SURGE
    severity: Mapped[str] = mapped_column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL

    agent_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("agents.id"), nullable=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)

    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_payload: Mapped[dict] = mapped_column(JSON, default=dict)

    is_resolved: Mapped[bool] = mapped_column(default=False)
    resolved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
