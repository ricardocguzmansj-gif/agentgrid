import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import AgentRun
from app.services.checkpoints import save_checkpoint
from app.services.events import publish_event
from app.services.executor import mock_agent_step
from app.services.limits import budget_exceeded, elapsed_seconds, remaining_seconds, steps_exceeded, timeout_exceeded
from app.workers.celery_app import celery_app


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_run(db: Session, run_id: str) -> AgentRun:
    return db.query(AgentRun).filter(AgentRun.id == run_id).first()


@celery_app.task(bind=True, name='run_agent')
def run_agent(self, run_id: str):
    db = SessionLocal()
    try:
        run = get_run(db, run_id)
        if not run:
            return {'status': 'not_found'}

        if not run.started_at:
            run.started_at = utcnow()
        run.status = 'running'
        run.last_heartbeat = utcnow()
        run.remaining_sec = run.max_runtime_sec
        db.commit()
        publish_event(db, run.id, 'started', payload={'status': 'running'})

        while True:
            db.expire_all()
            run = get_run(db, run_id)
            if not run:
                return {'status': 'not_found'}

            run.elapsed_sec = elapsed_seconds(run.started_at)
            run.remaining_sec = remaining_seconds(run.started_at, run.max_runtime_sec)
            run.last_heartbeat = utcnow()
            db.commit()

            if run.status == 'cancelled':
                publish_event(db, run.id, 'cancelled', run.steps_used, {'reason': 'user_cancelled'})
                return {'status': 'cancelled'}

            if run.status == 'paused':
                time.sleep(1)
                continue

            if timeout_exceeded(run.started_at, run.max_runtime_sec):
                run.status = 'timeout'
                run.finished_at = utcnow()
                run.final_reason = 'timeout'
                db.commit()
                publish_event(db, run.id, 'timeout', run.steps_used, {'elapsed_sec': run.elapsed_sec})
                return {'status': 'timeout'}

            if steps_exceeded(run.steps_used, run.max_steps):
                run.status = 'finished'
                run.finished_at = utcnow()
                run.final_reason = 'max_steps'
                db.commit()
                publish_event(db, run.id, 'finished', run.steps_used, {'reason': 'max_steps'})
                return {'status': 'finished', 'reason': 'max_steps'}

            if budget_exceeded(run.spent_usd, run.budget_usd):
                run.status = 'finished'
                run.finished_at = utcnow()
                run.final_reason = 'budget_exceeded'
                db.commit()
                publish_event(db, run.id, 'finished', run.steps_used, {'reason': 'budget_exceeded'})
                return {'status': 'finished', 'reason': 'budget_exceeded'}

            next_step = run.steps_used + 1
            result = mock_agent_step(run.state_json or {}, run.input_json or {}, next_step)
            new_state = dict(run.state_json or {})
            new_state.update(result['state_patch'])
            run.state_json = new_state
            run.steps_used = next_step
            run.spent_usd = round((run.spent_usd or 0.0) + float(result['cost_usd']), 4)
            run.elapsed_sec = elapsed_seconds(run.started_at)
            run.remaining_sec = remaining_seconds(run.started_at, run.max_runtime_sec)
            db.commit()

            save_checkpoint(db, run.id, run.steps_used, run.state_json)
            publish_event(
                db,
                run.id,
                'step_completed',
                run.steps_used,
                {
                    'step': run.steps_used,
                    'spent_usd': run.spent_usd,
                    'remaining_sec': run.remaining_sec,
                },
            )

            if result['final']:
                run.status = 'finished'
                run.finished_at = utcnow()
                run.final_reason = 'completed'
                run.output_json = result['output']
                db.commit()
                publish_event(db, run.id, 'finished', run.steps_used, {'reason': 'completed', 'output': result['output']})
                return {'status': 'finished', 'output': result['output']}

            time.sleep(1)
    finally:
        db.close()
