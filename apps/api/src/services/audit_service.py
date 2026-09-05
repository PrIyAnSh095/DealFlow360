from typing import Optional
from sqlalchemy.orm import Session
from src.models.audit import AuditEvent

def log_audit_event(
    db: Session,
    user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: str,
    details: Optional[str] = None
) -> AuditEvent:
    event = AuditEvent(
        user_id=user_id or "system",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
