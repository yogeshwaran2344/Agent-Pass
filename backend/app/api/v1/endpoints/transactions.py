import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionRead
from app.services.policy_engine import PolicyEngine

router = APIRouter(prefix="/transactions", tags=["Transaction Engine"])


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(tx_in: TransactionCreate, db: Session = Depends(get_db)):
    # 0. Check Idempotency Key
    if tx_in.idempotency_key:
        existing_tx = (
            db.query(Transaction)
            .filter(Transaction.idempotency_key == tx_in.idempotency_key)
            .first()
        )
        if existing_tx:
            return existing_tx

    # 1. Enforce deterministic policy before recording
    is_auth, req_appr, reason, violations = PolicyEngine.evaluate_transaction(
        db=db,
        agent_id=tx_in.agent_id,
        amount=tx_in.amount,
        merchant=tx_in.merchant,
    )
    if not is_auth:
        raise HTTPException(status_code=403, detail=f"Policy Blocked: {reason}")
    if req_appr:
        raise HTTPException(
            status_code=400,
            detail=f"Transaction requires prior human approval: {reason}",
        )

    tx = Transaction(
        id=str(uuid.uuid4()),
        agent_id=tx_in.agent_id,
        commitment_id=tx_in.commitment_id,
        amount=tx_in.amount,
        currency=tx_in.currency,
        merchant=tx_in.merchant,
        payment_method=tx_in.payment_method,
        idempotency_key=tx_in.idempotency_key,
        status="authorized",
        metadata_json=tx_in.metadata_json,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/", response_model=list[TransactionRead])
def list_transactions(
    agent_id: str | None = Query(None, description="Filter by agent ID"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if agent_id:
        query = query.filter(Transaction.agent_id == agent_id)
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    return query.order_by(Transaction.created_at.desc()).limit(100).all()


@router.get("/{transaction_id}", response_model=TransactionRead)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
