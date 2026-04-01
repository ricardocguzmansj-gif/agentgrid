from sqlalchemy import select
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.deps.auth import get_current_tenant, get_current_user
from app.models.models import Subscription, Tenant, User, Plan

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.get("/brand")
def get_brand(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    subscription = db.scalar(select(Subscription).where(Subscription.tenant_id == tenant.id).order_by(Subscription.started_at.desc()))
    plan = db.get(Plan, subscription.plan_id) if subscription else None
    return {
        "tenant_id": tenant.id,
        "slug": tenant.slug,
        "brand_name": tenant.brand_name,
        "brand_tagline": tenant.brand_tagline,
        "logo_url": tenant.logo_url,
        "plan": plan.name if plan else None,
    }
