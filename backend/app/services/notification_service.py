"""Notification service for operational events and in-app customer updates."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.core.database import get_db


async def create_notification(
    user_id: str,
    title: str,
    message: str,
    event_type: str = "GENERAL",
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create and persist an in-app notification for a customer."""
    db = get_db()
    now = datetime.now(timezone.utc)

    doc = {
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "event_type": event_type,
        "metadata": metadata or {},
        "is_read": False,
        "created_at": now,
        "read_at": None,
    }

    res = await db.notifications.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc


async def get_user_notifications(
    user_id: str,
    skip: int = 0,
    limit: int = 50
) -> Dict[str, Any]:
    """Retrieve paginated notifications for the authenticated customer."""
    db = get_db()
    query = {"user_id": str(user_id)}

    total = await db.notifications.count_documents(query)
    unread_count = await db.notifications.count_documents({"user_id": str(user_id), "is_read": False})

    cursor = db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)

    return {
        "total": total,
        "unread_count": unread_count,
        "items": [
            {
                "id": str(n["_id"]),
                "title": n.get("title"),
                "message": n.get("message"),
                "event_type": n.get("event_type"),
                "metadata": n.get("metadata", {}),
                "is_read": n.get("is_read", False),
                "created_at": n.get("created_at"),
                "read_at": n.get("read_at"),
            }
            for n in items
        ]
    }


async def mark_notification_as_read(user_id: str, notification_id: str) -> bool:
    """Mark a single notification as read."""
    db = get_db()
    try:
        nid = ObjectId(notification_id)
    except Exception:
        nid = notification_id

    res = await db.notifications.update_one(
        {"_id": nid, "user_id": str(user_id)},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return res.modified_count > 0


async def mark_all_notifications_as_read(user_id: str) -> int:
    """Mark all notifications of a customer as read."""
    db = get_db()
    res = await db.notifications.update_many(
        {"user_id": str(user_id), "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return res.modified_count
