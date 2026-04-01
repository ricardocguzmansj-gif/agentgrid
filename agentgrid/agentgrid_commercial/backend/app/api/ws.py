import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.db.database import SessionLocal
from app.models.models import AgentRun

router = APIRouter(tags=["ws"])


@router.websocket("/ws/runs/{run_id}")
async def run_ws(websocket: WebSocket, run_id: str):
    await websocket.accept()
    db = SessionLocal()
    try:
        while True:
            run = db.get(AgentRun, run_id)
            if not run:
                await websocket.send_json({"error": "run_not_found"})
                break
            await websocket.send_json(
                {
                    "id": run.id,
                    "status": run.status,
                    "steps_used": run.steps_used,
                    "spent_usd": run.spent_usd,
                    "elapsed_sec": run.elapsed_sec,
                    "remaining_sec": run.remaining_sec,
                    "output_json": run.output_json,
                    "final_reason": run.final_reason,
                }
            )
            db.expire_all()
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
    finally:
        db.close()
