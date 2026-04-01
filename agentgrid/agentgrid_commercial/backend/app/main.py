from sqlalchemy import select
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.database import Base, engine, SessionLocal
from app.models.models import Plan, Subscription, Tenant, User
from app.api.auth import router as auth_router
from app.api.billing import router as billing_router
from app.api.agents import router as agents_router
from app.api.runs import router as runs_router
from app.api.tenant import router as tenant_router
from app.api.ws import router as ws_router

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_defaults():
    db = SessionLocal()
    try:
        plans = [
            {
                "code": "starter",
                "name": "Starter",
                "price_monthly_usd": 49.0,
                "max_agents": 3,
                "max_runs_per_month": 500,
                "max_runtime_sec": 180,
                "max_steps": 12,
                "max_budget_per_run_usd": 1.0,
                "features_json": {"white_label": False, "team_members": 1, "api_access": False},
            },
            {
                "code": "pro",
                "name": "Pro",
                "price_monthly_usd": 149.0,
                "max_agents": 15,
                "max_runs_per_month": 5000,
                "max_runtime_sec": 600,
                "max_steps": 40,
                "max_budget_per_run_usd": 5.0,
                "features_json": {"white_label": True, "team_members": 5, "api_access": True},
            },
            {
                "code": "scale",
                "name": "Scale",
                "price_monthly_usd": 499.0,
                "max_agents": 100,
                "max_runs_per_month": 50000,
                "max_runtime_sec": 1800,
                "max_steps": 120,
                "max_budget_per_run_usd": 25.0,
                "features_json": {"white_label": True, "team_members": 25, "api_access": True, "sso": True},
            },
        ]
        for payload in plans:
            existing = db.scalar(select(Plan).where(Plan.code == payload["code"]))
            if not existing:
                db.add(Plan(**payload))
        db.commit()

        tenant = db.scalar(select(Tenant).where(Tenant.slug == "digitalsun"))
        if not tenant:
            tenant = Tenant(
                name="Digital Sun Demo",
                slug="digitalsun",
                brand_name=settings.default_brand_name,
                brand_tagline=settings.default_brand_tagline,
            )
            db.add(tenant)
            db.flush()

            owner = User(
                tenant_id=tenant.id,
                email=settings.superadmin_email,
                full_name="Digital Sun Owner",
                hashed_password=hash_password(settings.superadmin_password),
                role="owner",
                is_active=True,
            )
            db.add(owner)

            starter = db.scalar(select(Plan).where(Plan.code == "scale"))
            if starter:
                db.add(
                    Subscription(
                        tenant_id=tenant.id,
                        plan_id=starter.id,
                        status="active",
                        provider="manual",
                    )
                )
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_defaults()


@app.get("/health")
def health():
    return {"ok": True, "app": settings.app_name, "env": settings.app_env}


app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(billing_router, prefix=settings.api_prefix)
app.include_router(agents_router, prefix=settings.api_prefix)
app.include_router(runs_router, prefix=settings.api_prefix)
app.include_router(tenant_router, prefix=settings.api_prefix)
app.include_router(ws_router)
