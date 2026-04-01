from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.models import AgentRun, Agent
from app.services.provider_clients import get_provider
from app.services.limits import elapsed_seconds, remaining_seconds


def utcnow():
    return datetime.now(timezone.utc)


def build_user_prompt(run: AgentRun) -> str:
    payload = run.input_json or {}
    brief = payload.get("prompt") or payload.get("task") or str(payload)
    return f"Objetivo del run: {brief}\n\nContexto JSON: {payload}"


def execute_agent_step(db: Session, run: AgentRun, agent: Agent) -> dict:
    provider = get_provider(agent.provider)
    response = provider.complete(
        model=agent.model,
        system_prompt=agent.system_prompt,
        user_prompt=build_user_prompt(run),
    )

    run.steps_used += 1
    run.spent_usd = round(float(run.spent_usd) + float(response.get("cost_usd", 0.0)), 4)
    run.elapsed_sec = elapsed_seconds(run.started_at)
    run.remaining_sec = remaining_seconds(run.started_at, run.max_runtime_sec)
    run.last_heartbeat = utcnow()

    patch = {
        "last_response_text": response.get("text", ""),
        "usage": response.get("usage", {}),
        "provider": agent.provider,
        "model": agent.model,
    }
    run.state_json = {**(run.state_json or {}), **patch}
    run.output_json = {
        "summary": response.get("text", ""),
        "usage": response.get("usage", {}),
    }
    db.add(run)
    db.commit()
    db.refresh(run)
    return patch
