"""Admin API endpoints for Customer User Management, separation of Normal Users vs VIP Members."""
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_admin


router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


def _to_object_id(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str


@router.get("", summary="List all registered customers with separation of normal users and members")
async def list_registered_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by Name, Email, Mobile or Referral Code"),
    account_type: Optional[str] = Query(None, description="Filter: ALL | NORMAL | MEMBER"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter: ALL | ACTIVE | SUSPENDED"),
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve full paginated directory of registered customers.
    Separates Normal Shopping Users (free tier) from VIP Athlete Members (card holders).
    Includes overall counts and telemetry.
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # 1. Fetch active memberships to build fast lookup table
    active_members_map = {}
    async for m in db.memberships.find({"is_active": True}):
        uid = str(m.get("user_id"))
        active_members_map[uid] = {
            "card_number": m.get("card_number"),
            "valid_till": m.get("valid_till"),
            "is_active": m.get("is_active", True),
            "status": "ACTIVE" if m.get("is_active") else "EXPIRED",
            "plan_name": m.get("plan_name", "VIP Athlete Pass"),
            "activated_at": m.get("activated_at"),
        }

    # 2. Overall KPI stats
    total_users_count = await db.users.count_documents({})
    total_members_count = len(active_members_map)
    total_normal_count = max(0, total_users_count - total_members_count)
    new_7d_count = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})

    # 3. Build MongoDB query
    query: dict[str, Any] = {}

    if search and search.strip():
        s = search.strip()
        query["$or"] = [
            {"full_name": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
            {"mobile": {"$regex": s, "$options": "i"}},
            {"referral_code": {"$regex": s, "$options": "i"}},
        ]

    if status_filter:
        sf = status_filter.upper()
        if sf == "ACTIVE":
            query["is_active"] = True
        elif sf in ("SUSPENDED", "INACTIVE"):
            query["is_active"] = False

    # Filter by account_type (NORMAL vs MEMBER)
    member_user_ids = list(active_members_map.keys())
    # Prepare both string IDs and ObjectIds
    member_id_objs = []
    for mid in member_user_ids:
        member_id_objs.append(mid)
        try:
            member_id_objs.append(ObjectId(mid))
        except Exception:
            pass

    if account_type:
        at = account_type.upper()
        if at == "MEMBER":
            query["_id"] = {"$in": member_id_objs}
        elif at == "NORMAL":
            query["_id"] = {"$nin": member_id_objs}

    total_matching = await db.users.count_documents(query)
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        uid = str(doc["_id"])
        membership_info = active_members_map.get(uid)
        has_membership = membership_info is not None

        items.append({
            "id": uid,
            "full_name": doc.get("full_name") or "User",
            "email": doc.get("email"),
            "mobile": doc.get("mobile"),
            "role": doc.get("role", "USER"),
            "is_active": doc.get("is_active", True),
            "referral_code": doc.get("referral_code"),
            "referred_by_code": doc.get("referred_by_code"),
            "has_membership": has_membership,
            "account_type": "VIP Member" if has_membership else "Normal User",
            "membership": membership_info,
            "created_at": doc.get("created_at"),
            "last_login_at": doc.get("last_login_at"),
        })

    return {
        "items": items,
        "total": total_matching,
        "skip": skip,
        "limit": limit,
        "stats": {
            "total_users": total_users_count,
            "total_normal": total_normal_count,
            "total_members": total_members_count,
            "new_7d": new_7d_count,
        },
    }


@router.get("/{user_id}", summary="Get detailed profile of a registered user")
async def get_user_detail(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve complete customer details including membership, wallet balance, and order history."""
    db = get_db()
    obj_id = _to_object_id(user_id)

    user = await db.users.find_one({"$or": [{"_id": obj_id}, {"_id": user_id}]})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    uid = str(user["_id"])

    # Membership check
    membership = await db.memberships.find_one({
        "$or": [{"user_id": uid}, {"user_id": _to_object_id(uid)}],
        "is_active": True,
    })

    # Wallet check
    wallet = await db.wallets.find_one({"$or": [{"user_id": uid}, {"user_id": _to_object_id(uid)}]})

    # Orders count and recent
    orders_cursor = db.orders.find({"$or": [{"user_id": uid}, {"user_id": _to_object_id(uid)}]}).sort("created_at", -1).limit(5)
    recent_orders = []
    async for o in orders_cursor:
        recent_orders.append({
            "id": str(o["_id"]),
            "order_number": o.get("order_number") or str(o["_id"]),
            "total_amount": o.get("total_amount") or o.get("total_price", 0),
            "status": o.get("status", "PENDING"),
            "created_at": o.get("created_at"),
        })

    total_orders = await db.orders.count_documents({"$or": [{"user_id": uid}, {"user_id": _to_object_id(uid)}]})

    return {
        "id": uid,
        "full_name": user.get("full_name"),
        "email": user.get("email"),
        "mobile": user.get("mobile"),
        "role": user.get("role", "USER"),
        "is_active": user.get("is_active", True),
        "referral_code": user.get("referral_code"),
        "referred_by_code": user.get("referred_by_code"),
        "kyc_status": user.get("kyc_status", "NOT_SUBMITTED"),
        "created_at": user.get("created_at"),
        "last_login_at": user.get("last_login_at"),
        "has_membership": membership is not None,
        "account_type": "VIP Member" if membership else "Normal User",
        "membership": {
            "card_number": membership.get("card_number"),
            "valid_till": membership.get("valid_till"),
            "activated_at": membership.get("activated_at"),
            "plan_name": membership.get("plan_name", "VIP Athlete Pass"),
            "status": "ACTIVE" if membership.get("is_active") else "EXPIRED",
        } if membership else None,
        "wallet": {
            "balance_inr": (wallet.get("balance_paise", 0) / 100.0) if wallet else 0.0,
            "cookey_balance": wallet.get("cookey_balance", 0) if wallet else 0,
        } if wallet else None,
        "orders_summary": {
            "total_orders": total_orders,
            "recent": recent_orders,
        },
    }


@router.patch("/{user_id}/status", summary="Activate or suspend user account")
async def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Toggle customer account status (ACTIVE vs SUSPENDED)."""
    db = get_db()
    obj_id = _to_object_id(user_id)

    res = await db.users.update_one(
        {"$or": [{"_id": obj_id}, {"_id": user_id}]},
        {"$set": {"is_active": payload.is_active, "updated_at": datetime.now(timezone.utc)}},
    )

    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    return {
        "success": True,
        "user_id": user_id,
        "is_active": payload.is_active,
        "message": f"User account has been {'activated' if payload.is_active else 'suspended'}.",
    }

