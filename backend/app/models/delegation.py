from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AgentDelegation(Base):
    __tablename__ = "agent_delegations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    parent_agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    child_agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    
    # Delegation chain metadata
    delegation_depth: Mapped[int] = mapped_column(Integer, default=1)
    task_description: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Delegated authority subset (must never exceed parent authority)
    delegated_budget_limit: Mapped[float] = mapped_column(Float, default=50.0)
    allowed_categories: Mapped[dict] = mapped_column(JSON, default=list)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    revoked_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    revocation_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent_agent = relationship("Agent", foreign_keys=[parent_agent_id], back_populates="delegations_given")
    child_agent = relationship("Agent", foreign_keys=[child_agent_id], back_populates="delegations_received")
