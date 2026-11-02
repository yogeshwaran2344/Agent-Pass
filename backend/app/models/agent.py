from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    agent_type: Mapped[str] = mapped_column(String(50), default="autonomous_buyer")
    api_key_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Status: active, suspended, revoked, killed
    status: Mapped[str] = mapped_column(String(30), default="active", index=True)
    reputation_score: Mapped[float] = mapped_column(Float, default=1.0)
    is_kill_switched: Mapped[bool] = mapped_column(Boolean, default=False)
    kill_reason: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner = relationship("User", back_populates="agents")
    permissions = relationship("AgentPermission", back_populates="agent", cascade="all, delete-orphan")
    delegations_given = relationship(
        "AgentDelegation", foreign_keys="AgentDelegation.parent_agent_id", back_populates="parent_agent"
    )
    delegations_received = relationship(
        "AgentDelegation", foreign_keys="AgentDelegation.child_agent_id", back_populates="child_agent"
    )
    commitments = relationship("Commitment", back_populates="agent")
    transactions = relationship("Transaction", back_populates="agent")
    status_history = relationship("AgentStatusHistory", back_populates="agent", cascade="all, delete-orphan")


class AgentStatusHistory(Base):
    __tablename__ = "agent_status"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    previous_status: Mapped[str] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    changed_by_user_id: Mapped[str] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="status_history")
