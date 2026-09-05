from pydantic import BaseModel
from decimal import Decimal
from typing import Optional

class ProductBase(BaseModel):
    name: str
    sku: str
    category: str
    sales_price: Decimal
    cost: Optional[Decimal] = None
    is_active: Optional[bool] = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    sales_price: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str

    class Config:
        from_attributes = True
