from sqlalchemy.orm import Session
from app.models.models import AgentEvent


def publish_event(db: Session, run_id: str, event_type: str, step_index: int = 0, payload: dict | None = None) -> AgentEvent:
    event = AgentEvent(run_id=run_id, event_type=event_type, step_index=step_index, payload_json=payload or {})
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
