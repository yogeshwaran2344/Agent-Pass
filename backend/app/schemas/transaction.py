from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class TransactionCreate(BaseModel):
    agent_id: str
    commitment_id: str | None = None
    amount: float
    currency: str = "USD"
    merchant: str
    payment_method: str = "paypal_sandbox"
    metadata_json: dict[str, Any] = {}


class TransactionRead(BaseModel):
    id: str
    agent_id: str
    commitment_id: str | None = None
    amount: float
    currency: str
    merchant: str
    payment_method: str
    status: str
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PayPalOrderCreate(BaseModel):
    transaction_id: str
    return_url: str | None = None
    cancel_url: str | None = None


class PayPalOrderCapture(BaseModel):
    paypal_order_id: str
