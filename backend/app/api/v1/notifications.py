"""Customer notification center endpoints."""
from fastapi import APIRouter, Depends, Query, Path
from typing import Dict, Any

from app.core.dependencies import get_current_user
from app.services.notification_service import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/my", summary="Get my notifications list and unread count")
async def get_my_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve personal notifications for order updates, refund status, and platform announcements."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    data = await get_user_notifications(user_id=user_id, skip=skip, limit=limit)
    return {
        "success": True,
        "data": data,
    }


@router.patch("/my/{notification_id}/read", summary="Mark single notification as read")
async def mark_single_read(
    notification_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Mark a notification as read."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    updated = await mark_notification_as_read(user_id=user_id, notification_id=notification_id)
    return {
        "success": updated,
        "message": "Notification marked as read" if updated else "Notification not found or already read",
    }


@router.post("/my/read-all", summary="Mark all notifications as read")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Mark all unread notifications as read."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    count = await mark_all_notifications_as_read(user_id=user_id)
    return {
        "success": True,
        "marked_read_count": count,
    }
