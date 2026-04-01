from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Agent, AgentEvent, AgentRun
from app.schemas.run import RunActionOut, RunCreate, RunOut
from app.services.events import publish_event
from app.workers.tasks import run_agent

router = APIRouter(prefix='/runs', tags=['runs'])


@router.post('', response_model=RunOut)
def create_run(payload: RunCreate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail='Agent not found')

    run = AgentRun(
        agent_id=payload.agent_id,
        input_json=payload.input_json,
        max_runtime_sec=payload.max_runtime_sec or agent.default_max_runtime_sec,
        max_steps=payload.max_steps or agent.default_max_steps,
        budget_usd=payload.budget_usd or agent.default_budget_usd,
        remaining_sec=payload.max_runtime_sec or agent.default_max_runtime_sec,
        created_by=payload.created_by,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    publish_event(db, run.id, 'queued', 0, {'status': 'queued'})
    run_agent.delay(run.id)
    db.refresh(run)
    return run


@router.get('', response_model=list[RunOut])
def list_runs(db: Session = Depends(get_db)):
    return db.query(AgentRun).order_by(AgentRun.created_at.desc()).limit(100).all()


@router.get('/{run_id}', response_model=RunOut)
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail='Run not found')
    return run


@router.get('/{run_id}/events')
def get_events(run_id: str, db: Session = Depends(get_db)):
    return db.query(AgentEvent).filter(AgentEvent.run_id == run_id).order_by(AgentEvent.created_at.asc()).all()


@router.post('/{run_id}/pause', response_model=RunActionOut)
def pause_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail='Run not found')
    run.status = 'paused'
    db.commit()
    publish_event(db, run.id, 'paused', run.steps_used, {'status': 'paused'})
    return {'ok': True, 'message': 'Run paused'}


@router.post('/{run_id}/resume', response_model=RunActionOut)
def resume_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail='Run not found')
    run.status = 'running'
    db.commit()
    publish_event(db, run.id, 'resumed', run.steps_used, {'status': 'running'})
    return {'ok': True, 'message': 'Run resumed'}


@router.post('/{run_id}/cancel', response_model=RunActionOut)
def cancel_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail='Run not found')
    run.status = 'cancelled'
    db.commit()
    publish_event(db, run.id, 'cancel_requested', run.steps_used, {'status': 'cancelled'})
    return {'ok': True, 'message': 'Run cancelled'}
