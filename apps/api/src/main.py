from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.v1 import auth
from src.core.database import engine, Base

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

@app.get("/health")
def health_check():
    return {"status": "ok"}
