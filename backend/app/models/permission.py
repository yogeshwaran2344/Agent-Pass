from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AgentPermission(Base):
    __tablename__ = "agent_permissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    
    # Financial thresholds (deterministic)
    max_amount_per_tx: Mapped[float] = mapped_column(Float, default=100.0)
    daily_spend_limit: Mapped[float] = mapped_column(Float, default=500.0)
    monthly_spend_limit: Mapped[float] = mapped_column(Float, default=2000.0)
    require_human_approval_above: Mapped[float] = mapped_column(Float, default=50.0)
    
    # Categorical and merchant guardrails (JSON arrays)
    allowed_merchants: Mapped[dict] = mapped_column(JSON, default=list)  # list of regexes/domains
    disallowed_merchants: Mapped[dict] = mapped_column(JSON, default=list)
    allowed_categories: Mapped[dict] = mapped_column(JSON, default=list)
    disallowed_categories: Mapped[dict] = mapped_column(JSON, default=list)
    
    # Expiry & state
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    agent = relationship("Agent", back_populates="permissions")
