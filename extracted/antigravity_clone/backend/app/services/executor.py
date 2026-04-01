from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def mock_agent_step(run_state: dict, input_json: dict, next_step: int) -> dict:
    goal = input_json.get('goal', 'Complete the assigned objective')
    transcript = run_state.get('transcript', [])
    transcript.append(
        {
            'step': next_step,
            'thought': f'Analyzing goal: {goal}',
            'action': 'mock_reasoning',
            'result': f'Completed synthetic subtask {next_step}',
            'timestamp': utcnow().isoformat(),
        }
    )
    final = next_step >= input_json.get('target_steps', 5)
    output = {
        'summary': f'Run completed for goal: {goal}',
        'artifacts': ['report.md', 'run_log.json'],
    } if final else {}
    return {
        'state_patch': {'transcript': transcript},
        'cost_usd': 0.01,
        'final': final,
        'output': output,
    }
