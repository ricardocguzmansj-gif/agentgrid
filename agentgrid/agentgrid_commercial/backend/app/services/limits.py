from datetime import datetime, timezone


def elapsed_seconds(started_at) -> int:
    if not started_at:
        return 0
    return int((datetime.now(timezone.utc) - started_at).total_seconds())


def remaining_seconds(started_at, max_runtime_sec: int) -> int:
    return max(0, max_runtime_sec - elapsed_seconds(started_at))


def timeout_exceeded(started_at, max_runtime_sec: int) -> bool:
    return elapsed_seconds(started_at) >= max_runtime_sec


def steps_exceeded(steps_used: int, max_steps: int) -> bool:
    return steps_used >= max_steps


def budget_exceeded(spent_usd: float, max_budget_usd: float) -> bool:
    return spent_usd >= max_budget_usd
