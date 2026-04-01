from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    'agentgrid_workers',
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_track_started=True,
    task_time_limit=max(10, settings.default_max_runtime_sec + 30),
    task_soft_time_limit=max(5, settings.default_max_runtime_sec + 15),
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
)
