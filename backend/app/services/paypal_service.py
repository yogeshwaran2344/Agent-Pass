import uuid
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.commitment import Commitment
from app.models.transaction import PayPalOrder, Transaction
from app.services.policy_engine import PolicyEngine


class PayPalSandboxService:
    @staticmethod
    async def get_access_token() -> str:
        """Fetch OAuth2 Bearer token from PayPal Sandbox."""
        if (
            not settings.PAYPAL_CLIENT_ID
            or not settings.PAYPAL_CLIENT_SECRET
            or settings.PAYPAL_CLIENT_ID == "mock_client_id"
        ):
            # Return synthetic test token in mock/dev mode
            return "mock_sandbox_access_token_agentpass"

        url = f"{settings.PAYPAL_API_BASE}/v1/oauth2/token"
        headers = {"Accept": "application/json", "Accept-Language": "en_US"}
        data = {"grant_type": "client_credentials"}

        async with httpx.AsyncClient() as client:
            res = await client.post(
                url,
                auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
                data=data,
                headers=headers,
                timeout=15.0,
            )
            res.raise_for_status()
            return res.json().get("access_token")

    @staticmethod
    async def create_order(
        db: Session,
        transaction_id: str,
        return_url: str | None = None,
        cancel_url: str | None = None,
    ) -> dict[str, Any]:
        """
        Create a PayPal Sandbox order.
        Strictly requires AGENTPASS deterministic policy check before creation!
        """
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise ValueError(f"Transaction '{transaction_id}' not found.")

        # ENFORCE AGENTPASS DETERMINISTIC POLICY FIRST
        is_auth, req_approval, reason, violations = PolicyEngine.evaluate_transaction(
            db=db, agent_id=tx.agent_id, amount=tx.amount, merchant=tx.merchant
        )
        if not is_auth:
            raise PermissionError(f"AGENTPASS Policy Blocked Order: {reason}")
        if req_approval:
            raise PermissionError(f"Transaction requires prior human approval: {reason}")

        # If live credentials exist, execute HTTP call against sandbox API; otherwise mock response
        if settings.PAYPAL_CLIENT_ID and settings.PAYPAL_CLIENT_ID != "mock_client_id":
            token = await PayPalSandboxService.get_access_token()
            url = f"{settings.PAYPAL_API_BASE}/v2/checkout/orders"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            }
            payload = {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "reference_id": tx.id,
                        "amount": {
                            "currency_code": tx.currency,
                            "value": f"{tx.amount:.2f}",
                        },
                        "description": f"AGENTPASS Autonomous Agent Order - {tx.merchant}",
                    }
                ],
                "application_context": {
                    "return_url": return_url or "https://agentpass.local/paypal/return",
                    "cancel_url": cancel_url or "https://agentpass.local/paypal/cancel",
                },
            }
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, headers=headers, timeout=20.0)
                res.raise_for_status()
                data = res.json()
                paypal_order_id = data["id"]
        else:
            paypal_order_id = f"PAYPAL-MOCK-ORDER-{uuid.uuid4().hex[:12].upper()}"
            data = {"id": paypal_order_id, "status": "CREATED", "links": []}

        # Record PayPal order reference in PostgreSQL / SQLite
        pp_order = PayPalOrder(
            id=str(uuid.uuid4()),
            transaction_id=tx.id,
            paypal_order_id=paypal_order_id,
            intent="CAPTURE",
            status="CREATED",
            raw_response=data,
        )
        db.add(pp_order)
        db.commit()
        db.refresh(pp_order)

        return {"paypal_order_id": paypal_order_id, "status": "CREATED", "details": data}

    @staticmethod
    async def capture_order(db: Session, paypal_order_id: str) -> dict[str, Any]:
        """Captures an approved PayPal order and settles the transaction and commitment."""
        pp_order = (
            db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == paypal_order_id).first()
        )
        if not pp_order:
            raise ValueError(f"PayPal order '{paypal_order_id}' not found.")

        tx = db.query(Transaction).filter(Transaction.id == pp_order.transaction_id).first()
        if not tx:
            raise ValueError(f"Transaction for order '{paypal_order_id}' not found.")

        # In production/sandbox with valid credentials
        if settings.PAYPAL_CLIENT_ID and settings.PAYPAL_CLIENT_ID != "mock_client_id":
            token = await PayPalSandboxService.get_access_token()
            url = f"{settings.PAYPAL_API_BASE}/v2/checkout/orders/{paypal_order_id}/capture"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            }
            async with httpx.AsyncClient() as client:
                res = await client.post(url, headers=headers, timeout=20.0)
                res.raise_for_status()
                data = res.json()
                status = data.get("status", "COMPLETED")
                capture_id = (
                    data.get("purchase_units", [{}])[0]
                    .get("payments", {})
                    .get("captures", [{}])[0]
                    .get("id")
                )
        else:
            status = "COMPLETED"
            capture_id = f"CAPTURE-MOCK-{uuid.uuid4().hex[:8].upper()}"
            data = {"id": paypal_order_id, "status": status, "capture_id": capture_id}

        pp_order.status = status
        pp_order.capture_id = capture_id
        pp_order.raw_response = data

        tx.status = "completed" if status == "COMPLETED" else "failed"

        # Settle associated commitment if exists
        if tx.commitment_id:
            comm = db.query(Commitment).filter(Commitment.id == tx.commitment_id).first()
            if comm:
                comm.status = "settled"

        db.commit()
        return {"status": status, "capture_id": capture_id, "paypal_order_id": paypal_order_id}
