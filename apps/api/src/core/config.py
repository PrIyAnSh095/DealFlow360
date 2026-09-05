"""
Central application settings loaded from environment variables / .env file.

All secrets MUST be provided via environment variables in production.
No secrets are hardcoded here.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Locate root directory containing .env
# config.py is at: <root>/apps/api/src/core/config.py
_CURRENT_FILE = Path(__file__).resolve()
_REPO_ROOT = _CURRENT_FILE.parents[4] if len(_CURRENT_FILE.parents) >= 5 else _CURRENT_FILE.parent
_API_ROOT = _CURRENT_FILE.parents[2] if len(_CURRENT_FILE.parents) >= 3 else _CURRENT_FILE.parent
_ENV_FILE_PATH = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    """
    Application configuration.

    Values are read from environment variables (case-insensitive).
    A .env file in the project root is also loaded automatically.
    """

    # ── Application ────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_TITLE: str = "DealFlow360 API"
    APP_VERSION: str = "1.0.0"

    # ── Database ───────────────────────────────────────────────────────────────
    DATABASE_URL: str  # Loaded from .env or environment variable (PostgreSQL)

    # ── Authentication (JWT) ───────────────────────────────────────────────────
    AUTH_SECRET: str = "super-secret-key-for-dealflow360-dev-only-min-32-chars"  # Read from .env or environment
    JWT_ALGORITHM: str = "HS256"
    # Token lifetime in minutes. Default: 7 days (convenient for dev).
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        # Look for .env in repo root, local api dir, or current working directory
        env_file=[str(_REPO_ROOT / ".env"), str(_API_ROOT / ".env"), ".env"],
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # silently ignore unknown vars (e.g. AI_ENABLED)
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS_ORIGINS into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance.
    The cache means Settings() is only constructed once per process.
    """
    return Settings()
