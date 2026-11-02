import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.intent import UserIntent
from app.schemas.intent import (
    IntentCreate,
    IntentEvaluateRequest,
    IntentEvaluateResponse,
    IntentRead,
)
from app.services.intent_engine import IntentConsistencyEngine

router = APIRouter(prefix="/intents", tags=["Intent Consistency Engine"])


@router.post("/", response_model=IntentRead, status_code=status.HTTP_201_CREATED)
def create_user_intent(intent_in: IntentCreate, user_id: str = "master_user", db: Session = Depends(get_db)):
    # Auto-extract structured constraints if not explicitly passed
    extracted = IntentConsistencyEngine.extract_intent_structure(intent_in.raw_prompt)
    
    intent = UserIntent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        raw_prompt=intent_in.raw_prompt,
        primary_goal=intent_in.primary_goal or extracted["primary_goal"],
        target_category=intent_in.target_category,
        positive_constraints=intent_in.positive_constraints or extracted["positive_constraints"],
        negative_constraints=intent_in.negative_constraints or extracted["negative_constraints"],
        max_acceptable_budget=intent_in.max_acceptable_budget or extracted["max_acceptable_budget"],
        is_active=True
    )
    db.add(intent)
    db.commit()
    db.refresh(intent)
    return intent


@router.get("/", response_model=list[IntentRead])
def list_user_intents(db: Session = Depends(get_db)):
    return db.query(UserIntent).filter(UserIntent.is_active == True).all()


@router.post("/evaluate", response_model=IntentEvaluateResponse)
def evaluate_intent(req: IntentEvaluateRequest, db: Session = Depends(get_db)):
    try:
        evaluation = IntentConsistencyEngine.evaluate_intent_consistency(
            db=db,
            intent_id=req.intent_id,
            agent_id=req.agent_id,
            proposed_item_name=req.proposed_item_name,
            proposed_merchant=req.proposed_merchant,
            proposed_price=req.proposed_price,
            proposed_item_specs=req.proposed_item_specs
        )
        return IntentEvaluateResponse(
            evaluation_id=evaluation.id,
            intent_id=evaluation.intent_id,
            consistency_score=evaluation.consistency_score,
            is_consistent=evaluation.is_consistent,
            decision=evaluation.decision,
            conflicting_requirements=evaluation.conflicting_requirements,
            reasoning=evaluation.reasoning
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
