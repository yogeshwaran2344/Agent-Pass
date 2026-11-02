from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_type: Mapped[str] = mapped_column(String(50), default="autonomous_buyer")

    # Lifecycle Status: active, suspended, deactivated, revoked, killed
    status: Mapped[str] = mapped_column(String(30), default="active", index=True)
    suspension_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Security & Kill Switch state
    is_kill_switched: Mapped[bool] = mapped_column(Boolean, default=False)
    kill_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metadata & Framework context (e.g., langchain, crewai, autogen, custom)
    framework: Mapped[str | None] = mapped_column(String(50), default="custom")
    model_name: Mapped[str | None] = mapped_column(String(100), default="gemini-2.0-flash")
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner = relationship("User", back_populates="agents")
    credentials = relationship("AgentCredential", back_populates="agent", cascade="all, delete-orphan")
    capabilities = relationship("AgentCapability", back_populates="agent", cascade="all, delete-orphan")
    reputation = relationship("AgentReputation", back_populates="agent", uselist=False, cascade="all, delete-orphan")
    permissions = relationship("AgentPermission", back_populates="agent", cascade="all, delete-orphan")
    status_history = relationship("AgentStatusHistory", back_populates="agent", cascade="all, delete-orphan")
    commitments = relationship("Commitment", back_populates="agent")
    transactions = relationship("Transaction", back_populates="agent")
    delegations_given = relationship(
        "AgentDelegation", foreign_keys="AgentDelegation.parent_agent_id", back_populates="parent_agent"
    )
    delegations_received = relationship(
        "AgentDelegation", foreign_keys="AgentDelegation.child_agent_id", back_populates="child_agent"
    )


class AgentCredential(Base):
    __tablename__ = "agent_credentials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    key_prefix: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), default="Default Key")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="credentials")


class AgentCapability(Base):
    __tablename__ = "agent_capabilities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    capability_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g., "ecommerce:purchase"
    scope: Mapped[str] = mapped_column(String(50), default="financial")  # financial, browsing, delegation
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="capabilities")


class AgentReputation(Base):
    __tablename__ = "agent_reputation"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), unique=True, nullable=False, index=True)
    total_tasks_attempted: Mapped[int] = mapped_column(Integer, default=0)
    successful_tasks_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_tasks_count: Mapped[int] = mapped_column(Integer, default=0)
    policy_violations_count: Mapped[int] = mapped_column(Integer, default=0)
    rejected_recommendations_count: Mapped[int] = mapped_column(Integer, default=0)

    # Score: 0.0 to 100.0
    reputation_score: Mapped[float] = mapped_column(Float, default=100.0)
    trust_tier: Mapped[str] = mapped_column(String(30), default="ESTABLISHED")  # PROBATIONARY, ESTABLISHED, HIGH_TRUST, UNTRUSTED
    last_evaluated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="reputation")


class AgentStatusHistory(Base):
    __tablename__ = "agent_status"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    previous_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="status_history")
