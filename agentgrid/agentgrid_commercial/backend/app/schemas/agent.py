from datetime import datetime
from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=2)
    provider: str = Field(default="mock", pattern=r"^(mock|openai|anthropic|groq)$")
    model: str = Field(default="mock-reasoner", max_length=120)
    system_prompt: str = Field(default="You are a helpful autonomous agent.")
    default_max_runtime_sec: int = Field(default=300, ge=15, le=3600)
    default_max_steps: int = Field(default=20, ge=1, le=200)
    default_budget_usd: float = Field(default=0.5, ge=0, le=100)
    tools_json: dict = Field(default_factory=dict)


class AgentOut(BaseModel):
    id: str
    name: str
    description: str
    provider: str
    model: str
    system_prompt: str
    default_max_runtime_sec: int
    default_max_steps: int
    default_budget_usd: float
    tools_json: dict
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
