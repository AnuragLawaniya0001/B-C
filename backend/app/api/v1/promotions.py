import random
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.promotion_schema import (
    PromotionalPopupCreateRequest,
    PromotionalPopupUpdateRequest,
)
from app.services.coupon_service import compute_coupon_status

router = APIRouter(prefix="/promotions", tags=["promotions"])


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", ""))
    if "_id" in doc:
        del doc["_id"]
    return doc


def to_object_id(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str


@router.get("/popup/active", summary="Get active promotional popup for visitor (Public)")
async def get_active_popup(
    route: Optional[str] = Query("/", description="Current client route path"),
    last_seen_id: Optional[str] = Query(None, description="Previous popup ID seen by visitor"),
):
    """Select one eligible active promotional popup using fair rotation policy."""
    now = datetime.now(timezone.utc)
    query = {
        "is_active": True,
        "$and": [
            {"$or": [{"start_date": None}, {"start_date": {"$lte": now}}]},
            {"$or": [{"end_date": None}, {"end_date": {"$gte": now}}]},
        ],
    }

    cursor = db.promotional_popups.find(query)
    eligible = []
    async for doc in cursor:
        routes = doc.get("target_routes") or ["/"]
        # Check if route matches target routes or wildcard '*'
        if "*" in routes or any(route.startswith(r) for r in routes):
            eligible.append(doc)

    if not eligible:
        return None

    # Filter out last seen popup if multiple alternatives exist (fair rotation)
    candidates = [e for e in eligible if str(e.get("_id")) != last_seen_id]
    if not candidates:
        candidates = eligible

    # Weight by priority (default 1 to 10)
    weights = [c.get("priority", 1) for c in candidates]
    chosen = random.choices(candidates, weights=weights, k=1)[0]
    return serialize_doc(chosen)


@router.get("/admin/popups", summary="List all popup campaigns (Admin)")
async def admin_list_popups(current_admin: dict = Depends(get_current_admin)):
    cursor = db.promotional_popups.find({}).sort("priority", -1)
    popups = []
    async for doc in cursor:
        popups.append(serialize_doc(doc))
    return popups


@router.post("/admin/popups", summary="Create promotional popup campaign (Admin)", status_code=status.HTTP_201_CREATED)
async def create_popup(
    payload: PromotionalPopupCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)
    doc_data = payload.model_dump()
    doc_data["created_at"] = now
    doc_data["updated_at"] = now
    doc_data["created_by"] = current_admin.get("email", "admin")

    res = await db.promotional_popups.insert_one(doc_data)
    doc_data["id"] = str(res.inserted_id)
    if "_id" in doc_data:
        del doc_data["_id"]
    return doc_data


@router.put("/admin/popups/{popup_id}", summary="Update promotional popup (Admin)")
async def update_popup(
    popup_id: str,
    payload: PromotionalPopupUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    obj_id = to_object_id(popup_id)
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_admin.get("email", "admin")

    doc = await db.promotional_popups.find_one_and_update(
        {"$or": [{"_id": obj_id}, {"id": popup_id}]},
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Promotional popup not found")
    return serialize_doc(doc)


@router.delete("/admin/popups/{popup_id}", summary="Delete promotional popup (Admin)")
async def delete_popup(
    popup_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    obj_id = to_object_id(popup_id)
    res = await db.promotional_popups.delete_one({"$or": [{"_id": obj_id}, {"id": popup_id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Popup campaign not found")
    return {"deleted": True, "popup_id": popup_id}


@router.get("/offers", summary="Get all current promotions and offers (Public)")
async def get_current_offers():
    """Retrieve verified active promotions, coupons, and rules for /offers page."""
    # 1. Active Marketing Coupons from db.coupons (exclude internal test artifacts)
    coupons = []
    c_cursor = db.coupons.find({
        "active": True,
        "code": {"$not": {"$regex": "^(PAYTEST|CRASHCP|LIMIT1)"}}
    }).sort("created_at", -1)

    async for c in c_cursor:
        st = compute_coupon_status(c)
        if st != "ACTIVE":
            continue

        disc_type = c.get("discount_type", "PERCENTAGE")
        disc_val = float(c.get("discount_value", 0))
        if disc_type == "PERCENTAGE":
            discount_display = f"{int(disc_val) if disc_val.is_integer() else disc_val}% OFF"
            discount_percent = disc_val
        else:
            discount_display = f"₹{int(disc_val / 100)} OFF"
            discount_percent = 0

        min_paise = c.get("min_order_paise", 0) or 0
        max_paise = c.get("max_discount_paise")

        coupons.append({
            "id": str(c.get("_id", "")),
            "code": c.get("code"),
            "name": c.get("name") or c.get("code"),
            "description": c.get("description", "Store promotion discount"),
            "discount_type": disc_type,
            "discount_value": disc_val,
            "discount_display": discount_display,
            "discount_percent": discount_percent,
            "min_order_paise": min_paise,
            "min_order_rupees": int(min_paise / 100),
            "max_discount_paise": max_paise,
            "max_discount_rupees": int(max_paise / 100) if max_paise else None,
            "applicable_categories": c.get("applicable_categories", []),
            "end_date": c.get("end_date").isoformat() if hasattr(c.get("end_date"), "isoformat") else c.get("end_date"),
            "status": st,
        })

    # 2. Public business rules from settings
    settings_doc = await db.settings.find_one({"_id": "global_settings"}) or {}
    rules = settings_doc.get("business_rules", {})

    free_thresh_paise = rules.get("free_delivery_threshold_paise", 50000)
    std_deliv_paise = rules.get("standard_delivery_charge_paise", 4000)

    offers = {
        "coupons": coupons,
        "shipping": {
            "free_threshold_paise": free_thresh_paise,
            "free_delivery_threshold_rupees": int(free_thresh_paise / 100),
            "standard_delivery_paise": std_deliv_paise,
            "standard_delivery_fee_rupees": int(std_deliv_paise / 100),
        },
    }

    return offers
