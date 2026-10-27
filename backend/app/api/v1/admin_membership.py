"""FastAPI endpoints for Admin Membership Management and Dynamic Configuration (Phase 4.1)."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_admin
from app.schemas.membership_schema import (
    MembershipSettingsSchema,
    UpdateMembershipSettingsRequest,
    AdminMembershipListResponse,
)
from app.services.membership_service import (
    get_membership_settings,
    update_membership_settings,
    admin_list_memberships,
    admin_get_membership_detail,
)
from app.core.database import db

router = APIRouter(prefix="/admin/membership", tags=["Admin Membership"])


@router.get(
    "/settings",
    response_model=MembershipSettingsSchema,
    summary="Get full membership configuration for admin console",
)
async def get_admin_membership_settings(current_admin: dict = Depends(get_current_admin)):
    """Retrieve current dynamic membership business rules, pricing, duration, and renewal policies."""
    return await get_membership_settings()


@router.put(
    "/settings",
    response_model=MembershipSettingsSchema,
    summary="Update dynamic membership settings and increment version",
)
async def update_admin_membership_settings(
    payload: UpdateMembershipSettingsRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Authoritative update of membership settings with server validation and audit logging."""
    admin_email = current_admin.get("email") or "admin@bigchamp.in"
    return await update_membership_settings(payload, admin_email=admin_email)


@router.get(
    "/members",
    response_model=AdminMembershipListResponse,
    summary="Paginated customer memberships directory",
)
async def list_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter: ACTIVE | EXPIRED"),
    search: Optional[str] = Query(None, description="Search by customer mobile, email, or card number"),
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve customer memberships with live validity and search."""
    return await admin_list_memberships(
        skip=skip,
        limit=limit,
        status_filter=status,
        search=search,
    )


@router.get(
    "/members/{identifier}",
    summary="Detailed membership record, linked purchases, and period history",
)
async def get_member_detail(
    identifier: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Inspect complete membership lifecycle, card details, and payment linkage."""
    return await admin_get_membership_detail(identifier)


@router.get(
    "/purchases",
    summary="List all membership purchase and renewal transactions",
)
async def list_membership_purchases(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_admin: dict = Depends(get_current_admin),
):
    """Paginated list of all customer membership purchase attempts, status, and snapshotted configs."""
    query = {}
    if status:
        query["status"] = status.upper()

    total = await db.membership_purchases.count_documents(query)
    cursor = db.membership_purchases.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    return {"items": items, "total": total, "skip": skip, "limit": limit}
