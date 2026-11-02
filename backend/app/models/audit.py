from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(50), index=True)  # AGENT, PERMISSION, INTENT, APPROVAL, TRANSACTION, KILL_SWITCH
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    actor_type: Mapped[str] = mapped_column(String(30))  # USER, AGENT, SYSTEM
    actor_id: Mapped[str] = mapped_column(String(36))
    
    action: Mapped[str] = mapped_column(String(100), index=True)  # e.g., PERMISSION_CHECKED, INTENT_VIOLATED, AGENT_KILLED
    description: Mapped[str] = mapped_column(Text, nullable=True)
    payload_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
