import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PriceList(Base):
    __tablename__ = "price_lists"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    currency = Column(String, default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PriceListItem(Base):
    __tablename__ = "price_list_items"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    price_list_id = Column(String, ForeignKey("price_lists.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    price = Column(Float, nullable=False)

    price_list = relationship("PriceList")
    product = relationship("Product")
