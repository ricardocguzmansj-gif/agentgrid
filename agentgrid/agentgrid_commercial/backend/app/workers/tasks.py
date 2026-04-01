from __future__ import annotations
from datetime import datetime, timezone
from time import sleep
from celery.exceptions import SoftTimeLimitExceeded
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import AgentRun, Agent
from app.services.events import publish_event
from app.services.checkpoints import save_checkpoint
from app.services.executor import execute_agent_step
from app.services.limits import timeout_exceeded, steps_exceeded, budget_exceeded, remaining_seconds, elapsed_seconds
from app.workers.celery_app import celery_app


def utcnow():
    return datetime.now(timezone.utc)


@celery_app.task(bind=True, name="run_agent")
def run_agent(self, run_id: str):
    db: Session = SessionLocal()
    try:
        run = db.get(AgentRun, run_id)
        if not run:
            return {"status": "not_found"}

        agent = db.get(Agent, run.agent_id)
        if not agent:
            run.status = "failed"
            run.final_reason = "agent_missing"
            db.commit()
            return {"status": "failed", "reason": "agent_missing"}

        if not run.started_at:
            run.started_at = utcnow()
        run.status = "running"
        run.last_heartbeat = utcnow()
        db.commit()
        publish_event(db, run.id, "started", payload={"agent": agent.name})

        try:
            while True:
                db.refresh(run)

                if run.status == "cancelled":
                    publish_event(db, run.id, "cancelled", step_index=run.steps_used)
                    return {"status": "cancelled"}

                if run.status == "paused":
                    publish_event(db, run.id, "paused", step_index=run.steps_used)
                    sleep(1)
                    continue

                run.elapsed_sec = elapsed_seconds(run.started_at)
                run.remaining_sec = remaining_seconds(run.started_at, run.max_runtime_sec)
                run.last_heartbeat = utcnow()
                db.commit()

                if timeout_exceeded(run.started_at, run.max_runtime_sec):
                    run.status = "timeout"
                    run.finished_at = utcnow()
                    run.final_reason = "max_runtime_exceeded"
                    db.commit()
                    publish_event(db, run.id, "timeout", step_index=run.steps_used)
                    return {"status": "timeout"}

                if steps_exceeded(run.steps_used, run.max_steps):
                    run.status = "finished"
                    run.finished_at = utcnow()
                    run.final_reason = "max_steps_reached"
                    db.commit()
                    publish_event(db, run.id, "finished", step_index=run.steps_used, payload={"reason": run.final_reason})
                    return {"status": "finished"}

                if budget_exceeded(run.spent_usd, run.budget_usd):
                    run.status = "finished"
                    run.finished_at = utcnow()
                    run.final_reason = "budget_exceeded"
                    db.commit()
                    publish_event(db, run.id, "finished", step_index=run.steps_used, payload={"reason": run.final_reason})
                    return {"status": "finished"}

                patch = execute_agent_step(db, run, agent)
                save_checkpoint(db, run.id, run.steps_used, run.state_json or {})
                publish_event(
                    db,
                    run.id,
                    "step_completed",
                    step_index=run.steps_used,
                    payload={
                        "remaining_sec": run.remaining_sec,
                        "spent_usd": run.spent_usd,
                        "state_patch": patch,
                    },
                )

                run.status = "finished"
                run.finished_at = utcnow()
                run.final_reason = "completed"
                run.elapsed_sec = elapsed_seconds(run.started_at)
                run.remaining_sec = remaining_seconds(run.started_at, run.max_runtime_sec)
                db.commit()
                publish_event(
                    db,
                    run.id,
                    "finished",
                    step_index=run.steps_used,
                    payload={"reason": "completed", "output": run.output_json},
                )
                return {"status": "finished", "output": run.output_json}
        except SoftTimeLimitExceeded:
            run.status = "timeout"
            run.finished_at = utcnow()
            run.final_reason = "soft_time_limit_exceeded"
            db.commit()
            publish_event(db, run.id, "timeout", step_index=run.steps_used, payload={"reason": run.final_reason})
            return {"status": "timeout"}
    finally:
        db.close()
