from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Commitment(Base):
    __tablename__ = "commitments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id"), nullable=False, index=True
    )
    intent_id: Mapped[str] = mapped_column(String(36), ForeignKey("user_intents.id"), nullable=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    merchant: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)

    # Status: reserved, committed, settled, released, expired
    status: Mapped[str] = mapped_column(String(30), default="reserved", index=True)

    # Lock timestamps
    reserved_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    settled_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    agent = relationship("Agent", back_populates="commitments")
    intent = relationship("UserIntent")
