from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base


class AgentPermission(Base):
    __tablename__ = "agent_permissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)

    # Active thresholds (evaluated deterministically)
    max_amount_per_tx: Mapped[float] = mapped_column(Float, default=100.0)
    daily_spend_limit: Mapped[float] = mapped_column(Float, default=500.0)
    monthly_spend_limit: Mapped[float] = mapped_column(Float, default=2000.0)
    require_human_approval_above: Mapped[float] = mapped_column(Float, default=50.0)

    # Allow/Disallow rule sets
    allowed_merchants: Mapped[list] = mapped_column(JSON, default=list)
    disallowed_merchants: Mapped[list] = mapped_column(JSON, default=list)
    allowed_categories: Mapped[list] = mapped_column(JSON, default=list)
    disallowed_categories: Mapped[list] = mapped_column(JSON, default=list)

    # Geographic and frequency constraints
    allowed_countries: Mapped[list] = mapped_column(JSON, default=list)  # e.g., ["US", "CA"]
    max_transactions_per_hour: Mapped[int] = mapped_column(Integer, default=10)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    agent = relationship("Agent", back_populates="permissions")
    policy_versions = relationship("PermissionPolicy", back_populates="permission", cascade="all, delete-orphan")


class PermissionPolicy(Base):
    __tablename__ = "permission_policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    permission_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_permissions.id"), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    change_summary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    policy_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    changed_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    permission = relationship("AgentPermission", back_populates="policy_versions")
