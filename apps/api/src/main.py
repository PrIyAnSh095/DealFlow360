from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.v1 import (
    auth,
    quotations,
    approvals,
    portal,
    operations,
    deals,
    subscriptions,
    invoices,
    health_intelligence,
    admin,
    customers,
    dashboard,
    search,
    health,
)
from src.core.database import engine, Base
import src.models

# Register DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DealFlow360 API", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(deals.router, prefix="/api/v1/deals", tags=["deals"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(health.router, prefix="/api/v1/health-legacy", tags=["health-legacy"])
app.include_router(quotations.router, prefix="/api/v1/quotations", tags=["quotations"])
app.include_router(approvals.router, prefix="/api/v1/approvals", tags=["approvals"])
app.include_router(portal.router, prefix="/api/v1/portal", tags=["portal"])
app.include_router(operations.router, prefix="/api/v1/operations", tags=["operations"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["subscriptions"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["invoices"])
app.include_router(health_intelligence.router, prefix="/api/v1", tags=["intelligence"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
