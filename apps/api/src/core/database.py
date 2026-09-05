"""
SQLAlchemy 2.x database engine, session factory, and declarative Base.

Connection string is read exclusively from settings (environment / .env).
Schema changes are managed by Alembic — do NOT call Base.metadata.create_all()
anywhere in application code.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from src.core.config import get_settings


def _build_engine():
    settings = get_settings()
    url = settings.DATABASE_URL

    connect_args = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        url,
        echo=(settings.APP_ENV == "development"),
        future=True,
        connect_args=connect_args,
    )
    return engine


engine = _build_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # avoids lazy-load issues after commit
)


class Base(DeclarativeBase):
    """
    Shared declarative base for all SQLAlchemy models.

    Other developers should import this Base and extend it when adding
    new domain models (products, quotations, etc.).
    """
    pass


# ── FastAPI dependency ─────────────────────────────────────────────────────────

def get_db():
    """
    Yield a database session and guarantee it is closed after the request,
    even if an exception is raised.

    Usage in FastAPI:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
