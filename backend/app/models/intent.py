from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserIntent(Base):
    __tablename__ = "user_intents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Raw natural language instruction
    raw_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Structured representation extracted from instruction
    primary_goal: Mapped[str] = mapped_column(String(255), nullable=True)
    target_category: Mapped[str] = mapped_column(String(100), nullable=True)
    positive_constraints: Mapped[dict] = mapped_column(JSON, default=list)  # ["battery life", "portability"]
    negative_constraints: Mapped[dict] = mapped_column(JSON, default=list)  # ["no gaming laptops", "no used items"]
    max_acceptable_budget: Mapped[float] = mapped_column(Float, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="intents")
    evaluations = relationship("IntentEvaluation", back_populates="intent", cascade="all, delete-orphan")


class IntentEvaluation(Base):
    __tablename__ = "intent_evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    intent_id: Mapped[str] = mapped_column(String(36), ForeignKey("user_intents.id"), nullable=False, index=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    
    # Proposed purchase item & context
    proposed_item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    proposed_merchant: Mapped[str] = mapped_column(String(255), nullable=False)
    proposed_price: Mapped[float] = mapped_column(Float, nullable=False)
    proposed_item_specs: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # AI Evaluation Result
    consistency_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 to 1.0
    is_consistent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    decision: Mapped[str] = mapped_column(String(30), nullable=False)  # MATCH, DRIFT, HARD_CONFLICT
    conflicting_requirements: Mapped[dict] = mapped_column(JSON, default=list)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    intent = relationship("UserIntent", back_populates="evaluations")
