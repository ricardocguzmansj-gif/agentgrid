from sqlalchemy.orm import Session
from app.models.models import RunCheckpoint


def save_checkpoint(db: Session, run_id: str, step_index: int, state_json: dict) -> RunCheckpoint:
    checkpoint = RunCheckpoint(run_id=run_id, step_index=step_index, state_json=state_json)
    db.add(checkpoint)
    db.commit()
    db.refresh(checkpoint)
    return checkpoint
