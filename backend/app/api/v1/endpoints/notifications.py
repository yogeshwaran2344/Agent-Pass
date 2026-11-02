from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications Engine"])


class NotificationRead(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    unread_count: int


@router.get("/", response_model=list[NotificationRead])
def list_notifications(db: Session = Depends(get_db)):
    """Retrieve recent notifications ordered by latest first."""
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(db: Session = Depends(get_db)):
    """Get the total count of unread notifications."""
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(notification_id: str, db: Session = Depends(get_db)):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    """Mark all unread notifications as read."""
    db.query(Notification).filter(Notification.is_read == False).update(
        {Notification.is_read: True}
    )
    db.commit()
    return {"status": "SUCCESS", "message": "All notifications marked as read"}
