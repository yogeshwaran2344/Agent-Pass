import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.agent import Agent
from app.models.risk import RiskAssessment

router = APIRouter(prefix="/risk", tags=["Risk Engine"])


class RiskCheckRequest(BaseModel):
    agent_id: str
    amount: float
    merchant: str
    velocity_tx_count_last_hour: int = 1


class RiskCheckResponse(BaseModel):
    overall_risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    triggered_rules: list[str]
    explanation: str


@router.post("/evaluate", response_model=RiskCheckResponse)
def evaluate_risk(req: RiskCheckRequest, db: Session = Depends(get_db)):
    rules_triggered = []
    score = 0.1

    if req.velocity_tx_count_last_hour > 5:
        score += 0.45
        rules_triggered.append("HIGH_VELOCITY_BURST: >5 transactions within single hour")

    if req.amount > 500:
        score += 0.3
        rules_triggered.append("HIGH_VALUE_OUTLIER: Single purchase above $500 threshold")

    score = min(score, 1.0)
    level = "LOW"
    if score >= 0.75:
        level = "CRITICAL"
    elif score >= 0.5:
        level = "HIGH"
    elif score >= 0.3:
        level = "MEDIUM"

    explanation = f"Evaluated with {len(rules_triggered)} risk signals."

    # Persist risk assessment only when referencing an actual registered agent (safe for UI simulator)
    agent_exists = db.query(Agent.id).filter(Agent.id == req.agent_id).first() is not None
    if agent_exists:
        assessment = RiskAssessment(
            id=str(uuid.uuid4()),
            agent_id=req.agent_id,
            overall_risk_score=score,
            risk_level=level,
            triggered_rules=rules_triggered,
            explanation=explanation,
        )
        db.add(assessment)
        db.commit()

    return RiskCheckResponse(
        overall_risk_score=score,
        risk_level=level,
        triggered_rules=rules_triggered,
        explanation=explanation,
    )
