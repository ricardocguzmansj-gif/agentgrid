from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "agentgrid_workers",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_time_limit=900,
    task_soft_time_limit=840,
)
