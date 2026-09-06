from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.v1 import (
    auth,
    quotations,
    approvals,
    portal,
    operations,
    analytics,
    customers,
    search,
    health,
    deals,
    admin,
    billing,
    dashboard,
    intelligence,
    subscriptions,
    invoices,
    health_intelligence,
    negotiations,
)
from src.core.database import engine, Base
import src.models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Keep schema management out of API startup; use Alembic for PostgreSQL.
    if os.getenv("AUTO_CREATE_SCHEMA", "false").lower() == "true":
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="DealFlow360 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(deals.router, prefix="/api/v1/deals", tags=["deals"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(health.router, prefix="/api/v1/health-system", tags=["health-system"])
app.include_router(quotations.router, prefix="/api/v1/quotations", tags=["quotations"])
app.include_router(approvals.router, prefix="/api/v1/approvals", tags=["approvals"])
app.include_router(portal.router, prefix="/api/v1/portal", tags=["portal"])
app.include_router(operations.router, prefix="/api/v1/operations", tags=["operations"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["subscriptions"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["invoices"])
app.include_router(health_intelligence.router, prefix="/api/v1", tags=["health_intelligence"])
app.include_router(intelligence.router, prefix="/api/v1/intelligence", tags=["intelligence"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(negotiations.router, prefix="/api/v1/negotiations", tags=["negotiations"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
