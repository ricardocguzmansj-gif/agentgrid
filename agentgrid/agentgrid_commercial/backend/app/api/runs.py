from sqlalchemy import desc, select
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.deps.auth import get_current_tenant, get_current_user
from app.models.models import Agent, AgentRun, AgentEvent, Plan, Subscription, Tenant, User
from app.schemas.run import RunCreate, RunOut
from app.services.events import publish_event
from app.workers.tasks import run_agent

router = APIRouter(prefix="/runs", tags=["runs"])


def get_plan_for_tenant(db: Session, tenant_id: str) -> Plan:
    subscription = db.scalar(select(Subscription).where(Subscription.tenant_id == tenant_id).order_by(Subscription.started_at.desc()))
    if not subscription:
        raise HTTPException(status_code=403, detail="Active subscription required")
    return db.get(Plan, subscription.plan_id)


@router.get("")
def list_runs(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    runs = db.scalars(
        select(AgentRun).where(AgentRun.tenant_id == tenant.id).order_by(desc(AgentRun.created_at)).limit(50)
    ).all()
    return runs


@router.post("/agent/{agent_id}", response_model=RunOut)
def create_run(
    agent_id: str,
    payload: RunCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    agent = db.get(Agent, agent_id)
    if not agent or agent.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Agent not found")

    plan = get_plan_for_tenant(db, tenant.id)

    run = AgentRun(
        tenant_id=tenant.id,
        agent_id=agent.id,
        status="queued",
        max_runtime_sec=min(payload.max_runtime_sec or agent.default_max_runtime_sec, plan.max_runtime_sec),
        max_steps=min(payload.max_steps or agent.default_max_steps, plan.max_steps),
        budget_usd=min(payload.budget_usd or agent.default_budget_usd, plan.max_budget_per_run_usd),
        remaining_sec=min(payload.max_runtime_sec or agent.default_max_runtime_sec, plan.max_runtime_sec),
        input_json=payload.input_json,
        created_by=current_user.email,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    publish_event(db, run.id, "queued", payload={"created_by": current_user.email})
    run_agent.delay(run.id)
    return run


@router.get("/{run_id}", response_model=RunOut)
def get_run(
    run_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    run = db.get(AgentRun, run_id)
    if not run or run.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/{run_id}/events")
def get_run_events(
    run_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    run = db.get(AgentRun, run_id)
    if not run or run.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Run not found")
    events = db.scalars(
        select(AgentEvent).where(AgentEvent.run_id == run_id).order_by(AgentEvent.created_at.asc())
    ).all()
    return events


@router.post("/{run_id}/pause")
def pause_run(
    run_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    run = db.get(AgentRun, run_id)
    if not run or run.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Run not found")
    run.status = "paused"
    db.commit()
    publish_event(db, run.id, "paused", step_index=run.steps_used, payload={"by": current_user.email})
    return {"ok": True, "status": run.status}


@router.post("/{run_id}/resume")
def resume_run(
    run_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    run = db.get(AgentRun, run_id)
    if not run or run.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Run not found")
    run.status = "running"
    db.commit()
    publish_event(db, run.id, "resumed", step_index=run.steps_used, payload={"by": current_user.email})
    return {"ok": True, "status": run.status}


@router.post("/{run_id}/cancel")
def cancel_run(
    run_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    run = db.get(AgentRun, run_id)
    if not run or run.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Run not found")
    run.status = "cancelled"
    db.commit()
    publish_event(db, run.id, "cancelled", step_index=run.steps_used, payload={"by": current_user.email})
    return {"ok": True, "status": run.status}
