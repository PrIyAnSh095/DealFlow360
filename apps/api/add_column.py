from src.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE deals ADD COLUMN customer_name VARCHAR;"))
        conn.commit()
        print("Column customer_name added to deals successfully.")
    except Exception as e:
        print(f"Error: {e}")
