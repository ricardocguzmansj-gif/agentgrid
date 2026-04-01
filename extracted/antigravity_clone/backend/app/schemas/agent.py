from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: str
    provider: str = 'mock'
    model: str = 'mock-reasoner'
    default_max_runtime_sec: int = 300
    default_max_steps: int = 20
    default_budget_usd: float = 0.50
    tools_json: dict = Field(default_factory=dict)


class AgentOut(AgentCreate):
    id: str
    is_active: bool

    model_config = {'from_attributes': True}
