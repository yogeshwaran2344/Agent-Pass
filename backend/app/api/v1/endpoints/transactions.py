import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionRead
from app.services.policy_engine import PolicyEngine

router = APIRouter(prefix="/transactions", tags=["Transaction Engine"])


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(tx_in: TransactionCreate, db: Session = Depends(get_db)):
    # 1. Enforce deterministic policy before recording
    is_auth, req_appr, reason, violations = PolicyEngine.evaluate_transaction(
        db=db,
        agent_id=tx_in.agent_id,
        amount=tx_in.amount,
        merchant=tx_in.merchant
    )
    if not is_auth:
        raise HTTPException(status_code=403, detail=f"Policy Blocked: {reason}")
    if req_appr:
        raise HTTPException(status_code=400, detail=f"Transaction requires prior human approval: {reason}")

    tx = Transaction(
        id=str(uuid.uuid4()),
        agent_id=tx_in.agent_id,
        commitment_id=tx_in.commitment_id,
        amount=tx_in.amount,
        currency=tx_in.currency,
        merchant=tx_in.merchant,
        payment_method=tx_in.payment_method,
        status="authorized",
        metadata_json=tx_in.metadata_json
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/", response_model=list[TransactionRead])
def list_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()
