from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'AgentGrid'
    environment: str = 'development'
    debug: bool = True
    api_prefix: str = '/api/v1'

    database_url: str = 'postgresql+psycopg://postgres:postgres@db:5432/agentgrid'
    redis_url: str = 'redis://redis:6379/0'
    celery_broker_url: str = 'redis://redis:6379/0'
    celery_result_backend: str = 'redis://redis:6379/1'

    secret_key: str = 'change-me'
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60

    default_max_runtime_sec: int = 300
    default_max_steps: int = 20
    default_budget_usd: float = 0.50
    websocket_poll_interval_sec: float = 1.0
    cors_origins: str = 'http://localhost:5173,http://127.0.0.1:5173'


@lru_cache
def get_settings() -> Settings:
    return Settings()
