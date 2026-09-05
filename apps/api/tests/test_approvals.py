import pytest
from fastapi import HTTPException
from src.models.quotation import Quotation
from src.models.approval import ApprovalRequest
from src.services.approval_service import submit_quote_for_approval, process_approval_decision

def test_approval_workflow(db_session):
    q = Quotation(id="q-app-1", deal_id="d-app-1", status="draft")
    db_session.add(q)
    db_session.commit()

    app_req = submit_quote_for_approval(db_session, "q-app-1", requester_id="u-sales")
    assert app_req.status == "PENDING"
    assert q.status == "PENDING_APPROVAL"

    approved = process_approval_decision(db_session, app_req.id, actor_id="u-mgr", action="APPROVED", reason="Looks good")
    assert approved.status == "APPROVED"
    assert q.status == "APPROVED"

def test_prevent_double_approval_action(db_session):
    q = Quotation(id="q-app-2", deal_id="d-app-2", status="draft")
    db_session.add(q)
    db_session.commit()

    app_req = submit_quote_for_approval(db_session, "q-app-2", requester_id="u-sales")
    process_approval_decision(db_session, app_req.id, actor_id="u-mgr", action="APPROVED")

    with pytest.raises(HTTPException) as exc_info:
        process_approval_decision(db_session, app_req.id, actor_id="u-mgr", action="REJECTED")

    assert exc_info.value.status_code == 400
    assert "already been finalized" in exc_info.value.detail
