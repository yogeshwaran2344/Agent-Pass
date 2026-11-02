from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    transaction_id: Mapped[str] = mapped_column(String(36), ForeignKey("transactions.id"), nullable=True)
    
    # Risk scores (0.0 low to 1.0 critical risk)
    overall_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    velocity_anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    merchant_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    intent_drift_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Flagged triggers and reasons
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    triggered_rules: Mapped[dict] = mapped_column(JSON, default=list)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent")
    transaction = relationship("Transaction")
