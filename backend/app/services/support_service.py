"""Support ticket service managing customer inquiries, threads, and admin triage."""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException

from app.core.database import get_db
from app.schemas.support_schema import SupportTicketCreateRequest, SupportTicketReplyRequest


async def create_support_ticket(
    user_id: str,
    user_name: str,
    user_email: str,
    payload: SupportTicketCreateRequest
) -> Dict[str, Any]:
    """Create a new support ticket and initialize the conversation thread."""
    db = get_db()
    now = datetime.now(timezone.utc)
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"

    doc = {
        "ticket_id": ticket_id,
        "user_id": str(user_id),
        "user_name": user_name,
        "user_email": user_email,
        "subject": payload.subject,
        "category": payload.category.upper(),
        "order_number": payload.order_number,
        "status": "OPEN",
        "created_at": now,
        "updated_at": now,
        "messages": [
            {
                "id": uuid.uuid4().hex[:8],
                "sender_role": "CUSTOMER",
                "sender_name": user_name,
                "message": payload.message,
                "created_at": now,
            }
        ]
    }

    await db.support_tickets.insert_one(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


async def get_customer_tickets(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all support tickets created by a customer."""
    db = get_db()
    cursor = db.support_tickets.find({"user_id": str(user_id)}).sort("updated_at", -1)
    docs = await cursor.to_list(length=100)

    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


async def get_ticket_by_id(ticket_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve ticket details with ownership validation."""
    db = get_db()
    query: Dict[str, Any] = {"ticket_id": ticket_id}
    if user_id:
        query["user_id"] = str(user_id)

    doc = await db.support_tickets.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    doc["id"] = str(doc.pop("_id"))
    return doc


async def add_ticket_reply(
    ticket_id: str,
    sender_role: str,
    sender_name: str,
    message: str,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Add a message reply to the ticket thread."""
    db = get_db()
    now = datetime.now(timezone.utc)

    query: Dict[str, Any] = {"ticket_id": ticket_id}
    if user_id:
        query["user_id"] = str(user_id)

    ticket = await db.support_tickets.find_one(query)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    new_msg = {
        "id": uuid.uuid4().hex[:8],
        "sender_role": sender_role,
        "sender_name": sender_name,
        "message": message,
        "created_at": now,
    }

    # If customer replies to resolved ticket, re-open it
    new_status = ticket.get("status")
    if sender_role == "CUSTOMER" and new_status == "RESOLVED":
        new_status = "OPEN"

    await db.support_tickets.update_one(
        {"_id": ticket["_id"]},
        {
            "$push": {"messages": new_msg},
            "$set": {"updated_at": now, "status": new_status}
        }
    )

    ticket["messages"].append(new_msg)
    ticket["status"] = new_status
    ticket["id"] = str(ticket.pop("_id"))
    return ticket


async def admin_list_support_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Dict[str, Any]:
    """Admin view of all customer support tickets."""
    db = get_db()
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status.upper()
    if category:
        query["category"] = category.upper()

    total = await db.support_tickets.count_documents(query)
    cursor = db.support_tickets.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)

    for it in items:
        it["id"] = str(it.pop("_id"))

    return {
        "total": total,
        "items": items
    }


async def admin_update_ticket_status(ticket_id: str, status: str, note: Optional[str] = None) -> Dict[str, Any]:
    """Admin updates status of a support ticket (e.g. IN_PROGRESS, RESOLVED, CLOSED)."""
    db = get_db()
    now = datetime.now(timezone.utc)

    ticket = await db.support_tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    update_fields: Dict[str, Any] = {
        "status": status.upper(),
        "updated_at": now
    }
    if note:
        update_fields["admin_internal_note"] = note

    await db.support_tickets.update_one({"_id": ticket["_id"]}, {"$set": update_fields})
    ticket["status"] = status.upper()
    ticket["id"] = str(ticket.pop("_id"))
    return ticket
