from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AgentGrid Pro"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440

    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/agentgrid_pro"
    redis_url: str = "redis://redis:6379/0"
    cors_origins: str = "http://localhost:5173"

    superadmin_email: str = "owner@digitalsun.ai"
    superadmin_password: str = "ChangeThisNow123!"

    default_brand_name: str = "Digital Sun AgentGrid"
    default_brand_tagline: str = "Autonomous agents you can actually sell"

    openai_api_key: str | None = None
    openai_model: str = "gpt-5-mini"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-5"
    groq_api_key: str | None = None
    groq_model: str = "qwen-qwq-32b"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
