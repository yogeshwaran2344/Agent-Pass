from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    commitment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("commitments.id"), nullable=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    merchant: Mapped[str] = mapped_column(String(255), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="paypal_sandbox")

    # Idempotency key for preventing duplicate executions
    idempotency_key: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)

    # Status: pending, authorized, completed, failed, refunded
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    agent = relationship("Agent", back_populates="transactions")
    commitment = relationship("Commitment")
    paypal_order = relationship("PayPalOrder", back_populates="transaction", uselist=False)
    payment_events = relationship("PaymentEvent", back_populates="transaction", cascade="all, delete-orphan")


class PayPalOrder(Base):
    __tablename__ = "paypal_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    transaction_id: Mapped[str] = mapped_column(String(36), ForeignKey("transactions.id"), nullable=False, index=True)
    paypal_order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    intent: Mapped[str] = mapped_column(String(20), default="CAPTURE")
    status: Mapped[str] = mapped_column(String(50), default="CREATED")

    capture_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_response: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    transaction = relationship("Transaction", back_populates="paypal_order")


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    transaction_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("transactions.id"), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g., PAYMENT.CAPTURE.COMPLETED
    provider: Mapped[str] = mapped_column(String(50), default="paypal")
    provider_event_id: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    processing_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    transaction = relationship("Transaction", back_populates="payment_events")
