from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ApprovalActionRequest(BaseModel):
    reason: str

class ApprovalLogResponse(BaseModel):
    id: str
    action: str
    reason: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApprovalRequestResponse(BaseModel):
    id: str
    quotation_id: str
    requester_id: str
    status: str
    created_at: datetime
    
    # We will attach some extra deal/quote context to make the frontend easier
    deal_name: Optional[str] = None
    customer_name: Optional[str] = None
    quote_total: Optional[float] = None
    quote_margin: Optional[float] = None
    
    logs: List[ApprovalLogResponse] = []
    
    class Config:
        from_attributes = True
