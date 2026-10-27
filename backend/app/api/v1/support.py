"""Customer support ticket endpoints."""
from fastapi import APIRouter, Depends, Query, Path
from typing import Dict, Any, Optional

from app.core.dependencies import get_current_user, get_current_admin
from app.schemas.support_schema import (
    SupportTicketCreateRequest,
    SupportTicketReplyRequest,
    AdminTicketStatusUpdateRequest,
)
from app.services.support_service import (
    create_support_ticket,
    get_customer_tickets,
    get_ticket_by_id,
    add_ticket_reply,
    admin_list_support_tickets,
    admin_update_ticket_status,
)

router = APIRouter(tags=["Support"])


# ---------------- Customer Endpoints ----------------

@router.post("/support/tickets", summary="Create customer support ticket")
async def create_ticket(
    payload: SupportTicketCreateRequest,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new customer support ticket with initial message."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    user_name = current_user.get("full_name", "Customer")
    user_email = current_user.get("email", "")
    ticket = await create_support_ticket(
        user_id=user_id,
        user_name=user_name,
        user_email=user_email,
        payload=payload,
    )
    return {
        "success": True,
        "data": ticket,
    }


@router.get("/support/my", summary="List my support tickets")
async def get_my_tickets(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve all support tickets created by the authenticated customer."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    tickets = await get_customer_tickets(user_id=user_id)
    return {
        "success": True,
        "data": tickets,
    }


@router.get("/support/tickets/{ticket_id}", summary="Get support ticket details and thread")
async def get_ticket_details(
    ticket_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve ticket conversation thread."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    ticket = await get_ticket_by_id(ticket_id=ticket_id, user_id=user_id)
    return {
        "success": True,
        "data": ticket,
    }


@router.post("/support/tickets/{ticket_id}/reply", summary="Customer reply to support ticket")
async def customer_reply(
    payload: SupportTicketReplyRequest,
    ticket_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Add a customer reply to the conversation thread."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    user_name = current_user.get("full_name", "Customer")
    ticket = await add_ticket_reply(
        ticket_id=ticket_id,
        sender_role="CUSTOMER",
        sender_name=user_name,
        message=payload.message,
        user_id=user_id,
    )
    return {
        "success": True,
        "data": ticket,
    }


# ---------------- Admin Endpoints ----------------

@router.get("/admin/support/tickets", summary="List all support tickets (Admin)")
async def admin_get_tickets(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Admin triage of all customer support tickets."""
    data = await admin_list_support_tickets(status=status, category=category, skip=skip, limit=limit)
    return {
        "success": True,
        "data": data,
    }


@router.post("/admin/support/tickets/{ticket_id}/reply", summary="Admin reply to support ticket")
async def admin_reply(
    payload: SupportTicketReplyRequest,
    ticket_id: str = Path(...),
    current_admin: dict = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Add an administrative response to the support ticket thread."""
    admin_name = current_admin.get("email", "BIGCHAMP Support")
    ticket = await add_ticket_reply(
        ticket_id=ticket_id,
        sender_role="SUPPORT_ADMIN",
        sender_name=admin_name,
        message=payload.message,
    )
    return {
        "success": True,
        "data": ticket,
    }


@router.patch("/admin/support/tickets/{ticket_id}/status", summary="Update support ticket status (Admin)")
async def admin_update_status(
    payload: AdminTicketStatusUpdateRequest,
    ticket_id: str = Path(...),
    current_admin: dict = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Update ticket lifecycle state (OPEN, IN_PROGRESS, RESOLVED, CLOSED)."""
    ticket = await admin_update_ticket_status(
        ticket_id=ticket_id,
        status=payload.status,
        note=payload.note,
    )
    return {
        "success": True,
        "data": ticket,
    }
