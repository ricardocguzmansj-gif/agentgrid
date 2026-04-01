import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.config import get_settings
from app.db.database import SessionLocal
from app.models.models import AgentRun

router = APIRouter(tags=['ws'])
settings = get_settings()


@router.websocket('/ws/runs/{run_id}')
async def run_ws(websocket: WebSocket, run_id: str):
    await websocket.accept()
    db = SessionLocal()
    try:
        while True:
            run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
            if not run:
                await websocket.send_json({'error': 'Run not found'})
                break
            await websocket.send_json(
                {
                    'run_id': run.id,
                    'status': run.status,
                    'elapsed_sec': run.elapsed_sec,
                    'remaining_sec': run.remaining_sec,
                    'steps_used': run.steps_used,
                    'max_steps': run.max_steps,
                    'spent_usd': run.spent_usd,
                    'budget_usd': run.budget_usd,
                    'final_reason': run.final_reason,
                    'output_json': run.output_json,
                }
            )
            await asyncio.sleep(settings.websocket_poll_interval_sec)
            db.expire_all()
    except WebSocketDisconnect:
        pass
    finally:
        db.close()
