from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.commitment import Commitment
from app.schemas.commitment import CommitmentCreate, CommitmentRead
from app.services.commitment_engine import CommitmentEngine

router = APIRouter(prefix="/commitments", tags=["Commitment & Pre-Allocation Engine"])


@router.post("/reserve", response_model=CommitmentRead, status_code=status.HTTP_201_CREATED)
def reserve_budget(com_in: CommitmentCreate, db: Session = Depends(get_db)):
    try:
        commitment = CommitmentEngine.reserve_budget(
            db=db,
            agent_id=com_in.agent_id,
            amount=com_in.amount,
            merchant=com_in.merchant,
            purpose=com_in.purpose,
            intent_id=com_in.intent_id,
            hold_minutes=com_in.hold_duration_minutes,
        )
        return commitment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/agent/{agent_id}", response_model=list[CommitmentRead])
def list_agent_commitments(agent_id: str, db: Session = Depends(get_db)):
    return db.query(Commitment).filter(Commitment.agent_id == agent_id).all()


@router.post("/{commitment_id}/release", response_model=CommitmentRead)
def release_commitment(commitment_id: str, db: Session = Depends(get_db)):
    try:
        return CommitmentEngine.release_commitment(db=db, commitment_id=commitment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
