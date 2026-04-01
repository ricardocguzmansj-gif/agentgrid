import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    brand_name: Mapped[str] = mapped_column(String(160))
    brand_tagline: Mapped[str] = mapped_column(String(255), default="")
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    users = relationship("User", back_populates="tenant")
    subscriptions = relationship("Subscription", back_populates="tenant")
    agents = relationship("Agent", back_populates="tenant")
    runs = relationship("AgentRun", back_populates="tenant")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="owner")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    tenant = relationship("Tenant", back_populates="users")


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    price_monthly_usd: Mapped[float] = mapped_column(Float, default=0.0)
    max_agents: Mapped[int] = mapped_column(Integer, default=3)
    max_runs_per_month: Mapped[int] = mapped_column(Integer, default=500)
    max_runtime_sec: Mapped[int] = mapped_column(Integer, default=300)
    max_steps: Mapped[int] = mapped_column(Integer, default=20)
    max_budget_per_run_usd: Mapped[float] = mapped_column(Float, default=1.0)
    features_json: Mapped[dict] = mapped_column(JSON, default=dict)

    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("plans.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="active")
    provider: Mapped[str] = mapped_column(String(40), default="manual")
    provider_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    renews_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tenant = relationship("Tenant", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(50), default="mock")
    model: Mapped[str] = mapped_column(String(100), default="mock-reasoner")
    system_prompt: Mapped[str] = mapped_column(Text, default="You are a helpful autonomous agent.")
    default_max_runtime_sec: Mapped[int] = mapped_column(Integer, default=300)
    default_max_steps: Mapped[int] = mapped_column(Integer, default=20)
    default_budget_usd: Mapped[float] = mapped_column(Float, default=0.50)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    tools_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    tenant = relationship("Tenant", back_populates="agents")
    runs = relationship("AgentRun", back_populates="agent")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="queued", index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_runtime_sec: Mapped[int] = mapped_column(Integer, default=300)
    max_steps: Mapped[int] = mapped_column(Integer, default=20)
    budget_usd: Mapped[float] = mapped_column(Float, default=0.50)
    steps_used: Mapped[int] = mapped_column(Integer, default=0)
    spent_usd: Mapped[float] = mapped_column(Float, default=0.0)
    elapsed_sec: Mapped[int] = mapped_column(Integer, default=0)
    remaining_sec: Mapped[int] = mapped_column(Integer, default=300)
    input_json: Mapped[dict] = mapped_column(JSON, default=dict)
    state_json: Mapped[dict] = mapped_column(JSON, default=dict)
    output_json: Mapped[dict] = mapped_column(JSON, default=dict)
    final_reason: Mapped[str | None] = mapped_column(String(120), nullable=True)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    tenant = relationship("Tenant", back_populates="runs")
    agent = relationship("Agent", back_populates="runs")
    events = relationship("AgentEvent", back_populates="run", cascade="all, delete-orphan")
    checkpoints = relationship("RunCheckpoint", back_populates="run", cascade="all, delete-orphan")


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_runs.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(60), index=True)
    step_index: Mapped[int] = mapped_column(Integer, default=0)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    run = relationship("AgentRun", back_populates="events")


class RunCheckpoint(Base):
    __tablename__ = "run_checkpoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_runs.id"), index=True)
    step_index: Mapped[int] = mapped_column(Integer, default=0)
    state_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    run = relationship("AgentRun", back_populates="checkpoints")
