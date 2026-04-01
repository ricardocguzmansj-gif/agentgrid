from datetime import datetime
from pydantic import BaseModel, Field


class RunCreate(BaseModel):
    input_json: dict = Field(default_factory=dict)
    max_runtime_sec: int | None = Field(default=None, ge=15, le=3600)
    max_steps: int | None = Field(default=None, ge=1, le=200)
    budget_usd: float | None = Field(default=None, ge=0, le=100)


class RunOut(BaseModel):
    id: str
    agent_id: str
    status: str
    started_at: datetime | None
    finished_at: datetime | None
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
    final_reason: str | None
    created_by: str | None
    created_at: datetime

    class Config:
        from_attributes = True
