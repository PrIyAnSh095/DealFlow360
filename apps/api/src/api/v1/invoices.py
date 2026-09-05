from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from src.core.database import get_db
from src.models.billing import Invoice, InvoiceLine, Payment
from src.services.audit_service import log_audit_event

router = APIRouter()

class PaymentInput(BaseModel):
    amount: float
    method: str = "CREDIT_CARD"

@router.get("")
def list_invoices(db: Session = Depends(get_db)):
    return db.query(Invoice).all()

@router.get("/{invoice_id}")
def get_invoice_detail(invoice_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    lines = []
    for l in inv.lines:
        lines.append({
            "id": l.id,
            "description": l.description,
            "quantity": l.quantity,
            "unit_price": l.unit_price,
            "amount": l.amount
        })

    payments = []
    for p in inv.payments:
        payments.append({
            "id": p.id,
            "amount": p.amount,
            "method": p.method,
            "status": p.status,
            "created_at": p.created_at
        })

    return {
        "id": inv.id,
        "order_id": inv.order_id,
        "status": inv.status,
        "subtotal": inv.subtotal,
        "tax": inv.tax,
        "total": inv.total,
        "lines": lines,
        "payments": payments,
        "created_at": inv.created_at
    }

@router.post("/{invoice_id}/payments")
def process_payment(invoice_id: str, payload: PaymentInput, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    pmt = Payment(
        invoice_id=invoice_id,
        amount=payload.amount,
        method=payload.method,
        status="COMPLETED"
    )
    db.add(pmt)
    
    total_paid = sum(p.amount for p in inv.payments) + payload.amount
    if total_paid >= inv.total:
        inv.status = "PAID"
    else:
        inv.status = "PARTIAL"

    log_audit_event(
        db=db,
        user_id="finance",
        action="PAYMENT_RECEIVED",
        entity_type="Invoice",
        entity_id=invoice_id,
        details=f"Payment of {payload.amount} received via {payload.method}. New Status: {inv.status}"
    )

    db.commit()
    return {"invoice_id": invoice_id, "status": inv.status, "amount_paid": payload.amount}
