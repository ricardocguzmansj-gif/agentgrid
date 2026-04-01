import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = 'users'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default='admin')
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Agent(Base):
    __tablename__ = 'agents'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(50), default='mock')
    model: Mapped[str] = mapped_column(String(100), default='mock-reasoner')
    default_max_runtime_sec: Mapped[int] = mapped_column(Integer, default=300)
    default_max_steps: Mapped[int] = mapped_column(Integer, default=20)
    default_budget_usd: Mapped[float] = mapped_column(Float, default=0.50)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    tools_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    runs = relationship('AgentRun', back_populates='agent')


class AgentRun(Base):
    __tablename__ = 'agent_runs'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey('agents.id'), index=True)
    status: Mapped[str] = mapped_column(String(32), default='queued', index=True)
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

    agent = relationship('Agent', back_populates='runs')
    events = relationship('AgentEvent', back_populates='run', cascade='all, delete-orphan')
    checkpoints = relationship('RunCheckpoint', back_populates='run', cascade='all, delete-orphan')


class AgentEvent(Base):
    __tablename__ = 'agent_events'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey('agent_runs.id'), index=True)
    event_type: Mapped[str] = mapped_column(String(60), index=True)
    step_index: Mapped[int] = mapped_column(Integer, default=0)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    run = relationship('AgentRun', back_populates='events')


class RunCheckpoint(Base):
    __tablename__ = 'run_checkpoints'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey('agent_runs.id'), index=True)
    step_index: Mapped[int] = mapped_column(Integer, default=0)
    state_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    run = relationship('AgentRun', back_populates='checkpoints')
