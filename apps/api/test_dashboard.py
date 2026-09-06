from src.core.database import SessionLocal
from src.api.v1.dashboard import get_dashboard_metrics, get_recent_activities

db = SessionLocal()
try:
    metrics = get_dashboard_metrics(db=db)
    print("Metrics success:", list(metrics.keys()) if isinstance(metrics, dict) else metrics)
    activities = get_recent_activities(db=db)
    print("Activities success, count:", len(activities))
except Exception as e:
    print(f"Error: {e}")
