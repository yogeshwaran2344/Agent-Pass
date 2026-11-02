import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Body, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.commitment import Commitment
from app.models.notification import Notification
from app.models.transaction import PaymentEvent, PayPalOrder, Transaction
from app.schemas.transaction import PayPalOrderCapture, PayPalOrderCreate
from app.services.paypal_service import PayPalSandboxService

router = APIRouter(prefix="/paypal", tags=["PayPal Sandbox Gateway"])


@router.post("/create-order")
async def create_paypal_order(req: PayPalOrderCreate, db: Session = Depends(get_db)):
    try:
        res = await PayPalSandboxService.create_order(
            db=db,
            transaction_id=req.transaction_id,
            return_url=req.return_url,
            cancel_url=req.cancel_url,
        )
        return res
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal API error: {str(e)}")


@router.post("/capture-order")
async def capture_paypal_order(req: PayPalOrderCapture, db: Session = Depends(get_db)):
    try:
        res = await PayPalSandboxService.capture_order(
            db=db,
            paypal_order_id=req.paypal_order_id,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Capture error: {str(e)}")


@router.post("/webhook")
async def handle_paypal_webhook(
    payload: dict[str, Any] = Body(...),
    paypal_transmission_id: str | None = Header(None, alias="paypal-transmission-id"),
    db: Session = Depends(get_db),
):
    """
    Handle incoming PayPal Sandbox Webhooks with idempotency tracking
    and atomic transaction/commitment state updates.
    """
    event_id = payload.get("id") or paypal_transmission_id or str(uuid.uuid4())
    event_type = payload.get("event_type", "UNKNOWN")
    resource = payload.get("resource", {})

    # 1. Idempotency Check: Don't process the same event ID twice
    existing_event = (
        db.query(PaymentEvent).filter(PaymentEvent.provider_event_id == event_id).first()
    )
    if existing_event:
        return {
            "status": "ALREADY_PROCESSED",
            "event_id": event_id,
            "event_type": event_type,
            "message": "Webhook event was previously received and processed.",
        }

    # 2. Resolve target Transaction
    tx = None
    target_order_id = resource.get("id")
    if target_order_id:
        pp_order = (
            db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == target_order_id).first()
        )
        if pp_order:
            tx = db.query(Transaction).filter(Transaction.id == pp_order.transaction_id).first()

    # Fallback to custom_id or invoice_id
    if not tx:
        custom_id = resource.get("custom_id") or resource.get("invoice_id")
        if custom_id:
            tx = db.query(Transaction).filter(Transaction.id == custom_id).first()

    # 3. Create persistent PaymentEvent audit record
    event_record = PaymentEvent(
        id=str(uuid.uuid4()),
        transaction_id=tx.id if tx else None,
        event_type=event_type,
        provider="paypal",
        provider_event_id=event_id,
        is_verified=True,
        is_processed=True,
        payload=payload,
    )
    db.add(event_record)

    # 4. Handle event lifecycle transitions
    if event_type in ("PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"):
        if tx:
            tx.status = "completed"
            tx.completed_at = datetime.now(timezone.utc)
            if tx.commitment_id:
                comm = db.query(Commitment).filter(Commitment.id == tx.commitment_id).first()
                if comm:
                    comm.status = "settled"

            # Create notification
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=tx.agent.owner_id if tx.agent else "system",
                title="PayPal Capture Completed",
                message=f"Autonomous transaction #{tx.id[:8]} of ${tx.amount:.2f} at {tx.merchant} was settled on PayPal Sandbox.",
                notification_type="transaction_completed",
            )
            db.add(notif)

            # Record security audit log
            audit = AuditLog(
                id=str(uuid.uuid4()),
                entity_type="TRANSACTION",
                entity_id=tx.id,
                actor_type="SYSTEM",
                actor_id="paypal_webhook",
                action="PAYMENT_CAPTURED",
                description=f"PayPal confirmed payment capture for transaction {tx.id}",
                payload_snapshot={
                    "event_id": event_id,
                    "amount": tx.amount,
                    "merchant": tx.merchant,
                },
            )
            db.add(audit)

    elif event_type in ("PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.DECLINED"):
        if tx:
            tx.status = "failed"
            tx.error_message = f"PayPal Webhook: Payment denied ({event_type})"
            if tx.commitment_id:
                comm = db.query(Commitment).filter(Commitment.id == tx.commitment_id).first()
                if comm:
                    comm.status = "released"

    db.commit()
    return {
        "status": "PROCESSED",
        "event_id": event_id,
        "event_type": event_type,
        "transaction_id": tx.id if tx else None,
    }
