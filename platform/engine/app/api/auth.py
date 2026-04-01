from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Plan, Subscription, Tenant, User
from app.schemas.auth import LoginRequest, TenantRegistration, TokenResponse
from app.core.security import create_access_token, hash_password, verify_password
from app.deps.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def serialize_context(user: User, tenant: Tenant) -> dict:
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "brand_name": tenant.brand_name,
            "brand_tagline": tenant.brand_tagline,
        },
    }


@router.post("/register", response_model=TokenResponse)
def register(payload: TenantRegistration, db: Session = Depends(get_db)):
    existing_email = db.scalar(select(User).where(User.email == payload.owner_email))
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    existing_slug = db.scalar(select(Tenant).where(Tenant.slug == payload.slug))
    if existing_slug:
        raise HTTPException(status_code=400, detail="Slug already exists")

    plan = db.scalar(select(Plan).where(Plan.code == payload.plan_code))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    tenant = Tenant(
        name=payload.company_name,
        slug=payload.slug,
        brand_name=payload.brand_name,
        brand_tagline=payload.brand_tagline,
    )
    db.add(tenant)
    db.flush()

    user = User(
        tenant_id=tenant.id,
        email=payload.owner_email,
        full_name=payload.owner_name,
        hashed_password=hash_password(payload.password),
        role="owner",
        is_active=True,
    )
    db.add(user)

    subscription = Subscription(
        tenant_id=tenant.id,
        plan_id=plan.id,
        status="active",
        provider="manual",
    )
    db.add(subscription)
    db.commit()
    db.refresh(user)
    db.refresh(tenant)

    token = create_access_token(subject=user.id, extra={"tenant_id": tenant.id, "role": user.role})
    ctx = serialize_context(user, tenant)
    return TokenResponse(access_token=token, user=ctx["user"], tenant=ctx["tenant"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    tenant = db.get(Tenant, user.tenant_id)
    token = create_access_token(subject=user.id, extra={"tenant_id": tenant.id, "role": user.role})
    ctx = serialize_context(user, tenant)
    return TokenResponse(access_token=token, user=ctx["user"], tenant=ctx["tenant"])


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant = db.get(Tenant, current_user.tenant_id)
    return serialize_context(current_user, tenant)
