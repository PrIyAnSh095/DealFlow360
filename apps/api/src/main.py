"""
DealFlow360 FastAPI application entry point.

Schema is managed exclusively by Alembic — Base.metadata.create_all()
is NOT called here. Run `alembic upgrade head` before starting the server.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1 import auth
from src.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Startup: validate that settings are loadable (will raise early if
    DATABASE_URL or AUTH_SECRET are missing from the environment).

    Shutdown: nothing to clean up for now.
    """
    # Trigger settings validation on startup — fails fast if env vars are missing.
    settings = get_settings()
    yield
    # Shutdown (add cleanup here if needed, e.g. close connection pools)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.APP_VERSION,
        lifespan=lifespan,
        # Disable docs in production
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    def health_check():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()
