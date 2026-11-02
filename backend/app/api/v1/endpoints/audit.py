from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit Log"])


class AuditRead(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    actor_type: str
    actor_id: str
    action: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[AuditRead])
def get_audit_trail(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
