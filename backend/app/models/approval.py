from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    intent_id: Mapped[str] = mapped_column(String(36), ForeignKey("user_intents.id"), nullable=True)
    
    # Financial context
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    merchant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    item_description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Context-aware explanation: Why approval was requested
    reason_for_approval: Mapped[str] = mapped_column(Text, nullable=False)
    policy_conflicts: Mapped[dict] = mapped_column(JSON, default=list)
    intent_divergence_summary: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Status: pending, approved, rejected, clarification_requested, expired
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    user_comment: Mapped[str] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent")
    intent = relationship("UserIntent")
