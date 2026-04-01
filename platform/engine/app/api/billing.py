from sqlalchemy import func, select
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.deps.auth import get_current_tenant, get_current_user
from app.models.models import Agent, AgentRun, Plan, Subscription, Tenant, User
from app.schemas.billing import PlanOut

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.scalars(select(Plan).order_by(Plan.price_monthly_usd.asc())).all()


@router.get("/summary")
def tenant_billing_summary(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    subscription = db.scalar(
        select(Subscription).where(Subscription.tenant_id == tenant.id).order_by(Subscription.started_at.desc())
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    plan = db.get(Plan, subscription.plan_id)
    agent_count = db.scalar(select(func.count()).select_from(Agent).where(Agent.tenant_id == tenant.id)) or 0
    run_count = db.scalar(select(func.count()).select_from(AgentRun).where(AgentRun.tenant_id == tenant.id)) or 0
    spend_total = db.scalar(select(func.coalesce(func.sum(AgentRun.spent_usd), 0.0)).where(AgentRun.tenant_id == tenant.id)) or 0.0

    return {
        "brand_name": tenant.brand_name,
        "plan": {
            "code": plan.code,
            "name": plan.name,
            "price_monthly_usd": plan.price_monthly_usd,
            "limits": {
                "max_agents": plan.max_agents,
                "max_runs_per_month": plan.max_runs_per_month,
                "max_runtime_sec": plan.max_runtime_sec,
                "max_steps": plan.max_steps,
                "max_budget_per_run_usd": plan.max_budget_per_run_usd,
            },
        },
        "usage": {
            "agents": agent_count,
            "runs": run_count,
            "spent_usd_total": round(float(spend_total), 4),
        },
    }
