from sqlalchemy import func, select
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.deps.auth import get_current_tenant, get_current_user
from app.models.models import Agent, Plan, Subscription, Tenant, User
from app.schemas.agent import AgentCreate, AgentOut

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=list[AgentOut])
def list_agents(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(select(Agent).where(Agent.tenant_id == tenant.id).order_by(Agent.created_at.desc())).all()


@router.post("", response_model=AgentOut)
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    subscription = db.scalar(select(Subscription).where(Subscription.tenant_id == tenant.id).order_by(Subscription.started_at.desc()))
    if not subscription:
        raise HTTPException(status_code=403, detail="Active subscription required")
    plan = db.get(Plan, subscription.plan_id)
    current_count = db.scalar(select(func.count()).select_from(Agent).where(Agent.tenant_id == tenant.id)) or 0
    if current_count >= plan.max_agents:
        raise HTTPException(status_code=403, detail=f"Plan limit reached: max {plan.max_agents} agents")

    agent = Agent(
        tenant_id=tenant.id,
        name=payload.name,
        description=payload.description,
        provider=payload.provider,
        model=payload.model,
        system_prompt=payload.system_prompt,
        default_max_runtime_sec=min(payload.default_max_runtime_sec, plan.max_runtime_sec),
        default_max_steps=min(payload.default_max_steps, plan.max_steps),
        default_budget_usd=min(payload.default_budget_usd, plan.max_budget_per_run_usd),
        tools_json=payload.tools_json,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent
