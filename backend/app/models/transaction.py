from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    commitment_id: Mapped[str] = mapped_column(String(36), ForeignKey("commitments.id"), nullable=True)
    
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    merchant: Mapped[str] = mapped_column(String(255), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="paypal_sandbox")
    
    # Status: pending, authorized, completed, failed, refunded
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    agent = relationship("Agent", back_populates="transactions")
    commitment = relationship("Commitment")
    paypal_order = relationship("PayPalOrder", back_populates="transaction", uselist=False)


class PayPalOrder(Base):
    __tablename__ = "paypal_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    transaction_id: Mapped[str] = mapped_column(String(36), ForeignKey("transactions.id"), nullable=False, index=True)
    paypal_order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    intent: Mapped[str] = mapped_column(String(20), default="CAPTURE")
    status: Mapped[str] = mapped_column(String(50), default="CREATED")
    
    capture_id: Mapped[str] = mapped_column(String(100), nullable=True)
    payer_id: Mapped[str] = mapped_column(String(100), nullable=True)
    payer_email: Mapped[str] = mapped_column(String(255), nullable=True)
    raw_response: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    transaction = relationship("Transaction", back_populates="paypal_order")
