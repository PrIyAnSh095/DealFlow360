from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.v1 import auth, quotations, approvals, portal, operations
from src.core.database import engine, Base

# Import all models for SQLAlchemy to register them
from src.models import user, product, deal, quotation, approval, portal as portal_model, operations as operations_model

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DealFlow360 API", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(quotations.router, prefix="/api/v1/quotations", tags=["quotations"])
app.include_router(approvals.router, prefix="/api/v1/approvals", tags=["approvals"])
app.include_router(portal.router, prefix="/api/v1/portal", tags=["portal"])
app.include_router(operations.router, prefix="/api/v1/operations", tags=["operations"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
