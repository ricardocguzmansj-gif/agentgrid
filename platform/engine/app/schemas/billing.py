from pydantic import BaseModel


class PlanOut(BaseModel):
    id: str
    code: str
    name: str
    price_monthly_usd: float
    max_agents: int
    max_runs_per_month: int
    max_runtime_sec: int
    max_steps: int
    max_budget_per_run_usd: float
    features_json: dict

    class Config:
        from_attributes = True
