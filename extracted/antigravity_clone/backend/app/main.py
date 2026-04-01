from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.agents import router as agents_router
from app.api.runs import router as runs_router
from app.api.ws import router as ws_router
from app.core.config import get_settings
from app.db.database import Base, engine

settings = get_settings()
app = FastAPI(title=settings.app_name, version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(',') if origin.strip()],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get('/health')
def healthcheck():
    return {'ok': True, 'app': settings.app_name}


app.include_router(agents_router, prefix=settings.api_prefix)
app.include_router(runs_router, prefix=settings.api_prefix)
app.include_router(ws_router)
