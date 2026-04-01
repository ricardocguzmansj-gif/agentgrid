from datetime import datetime
from pydantic import BaseModel, Field


class RunCreate(BaseModel):
    agent_id: str
    input_json: dict = Field(default_factory=dict)
    max_runtime_sec: int | None = None
    max_steps: int | None = None
    budget_usd: float | None = None
    created_by: str | None = 'demo@agentgrid.local'


class RunOut(BaseModel):
    id: str
    agent_id: str
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    max_runtime_sec: int
    max_steps: int
    budget_usd: float
    steps_used: int
    spent_usd: float
    elapsed_sec: int
    remaining_sec: int
    input_json: dict
    state_json: dict
    output_json: dict
    final_reason: str | None = None
    created_by: str | None = None

    model_config = {'from_attributes': True}


class RunActionOut(BaseModel):
    ok: bool
    message: str
