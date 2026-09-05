import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from src.core.database import engine
from sqlalchemy import MetaData
metadata = MetaData()
metadata.reflect(bind=engine)
with engine.begin() as conn:
    for table in reversed(metadata.sorted_tables):
        conn.execute(table.delete())
print("Database wiped.")
