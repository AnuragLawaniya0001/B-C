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
    """Retrieve verified active promotions, coupons, and club privileges for /offers page."""
    now = datetime.now(timezone.utc)

    # 1. Active Marketing Coupons from db.coupons (exclude test artifacts)
    coupons = []
    c_cursor = db.coupons.find({
        "active": True,
        "discount_percent": {"$gt": 0},
        "code": {"$not": {"$regex": "^(PAYTEST|CRASHCP|LIMIT1)"}}
    })
    async for c in c_cursor:
        coupons.append({
            "code": c.get("code"),
            "discount_percent": c.get("discount_percent", 0),
            "max_discount_paise": c.get("max_discount_paise", 0),
            "min_order_value_paise": c.get("min_order_value_paise", 0),
            "description": c.get("description", "Store promotion discount"),
        })

    # 2. Public business rules from settings
    settings_doc = await db.settings.find_one({"_id": "global_settings"}) or {}
    rules = settings_doc.get("business_rules", {})

    offers = {
        "coupons": coupons,
        "membership": {
            "title": "BIGCHAMP Annual Passholder Privilege",
            "fee_paise": rules.get("card_fee_paise", 10000),
            "validity_days": rules.get("card_validity_days", 334),
            "cashback_percent": rules.get("joining_cashback_percent", 10.0),
            "member_discount_percent": rules.get("default_member_discount_percent", 15.0),
            "link": "/membership",
        },
        "cookey": {
            "title": "Cookey Weekly Draw Pass",
            "price_paise": rules.get("cookey_price_paise", 10000),
            "limit_per_week": rules.get("cookey_max_per_week", 1),
            "link": "/cookey",
        },
        "defense": {
            "title": "Armed Forces & Veterans Privilege",
            "discount_percent": rules.get("army_extra_discount_percent", 10.0),
            "description": "Extra 10% discount on all certified athletic gear for verified defense personnel.",
            "link": "/army-offer",
        },
        "shipping": {
            "free_threshold_paise": rules.get("free_delivery_threshold_paise", 50000),
            "standard_delivery_paise": rules.get("standard_delivery_charge_paise", 4000),
        },
    }

    return offers
