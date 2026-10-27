from datetime import datetime, timezone
import re
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.coupon_schema import (
    CouponValidateRequest,
    CouponValidateResponse,
    OfferCouponCreateRequest,
    OfferCouponUpdateRequest,
)
from app.services.coupon_service import (
    compute_coupon_status,
    validate_and_calculate_coupon_discount,
)

router = APIRouter(prefix="/coupons", tags=["coupons"])

DEFAULT_COUPONS = [
    {
        "code": "WELCOME10",
        "name": "Welcome New Athlete — 10% Off",
        "description": "Get 10% discount on your first sports equipment or apparel order.",
        "discount_type": "PERCENTAGE",
        "discount_value": 10.0,
        "min_order_paise": 50000,       # ₹500
        "max_discount_paise": 50000,    # Max ₹500 cap
        "applicable_categories": [],
        "applicable_product_ids": [],
        "total_usage_limit": 1000,
        "per_user_limit": 1,
        "times_used": 0,
        "active": True,
    },
    {
        "code": "FITNESS200",
        "name": "Flat ₹200 Off Fitness Gear",
        "description": "Flat ₹200 off on all training equipment and gym mats on orders above ₹1,000.",
        "discount_type": "FIXED_AMOUNT",
        "discount_value": 20000.0,      # ₹200
        "min_order_paise": 100000,      # ₹1,000
        "max_discount_paise": None,
        "applicable_categories": ["FITNESS", "GEARS"],
        "applicable_product_ids": [],
        "total_usage_limit": 500,
        "per_user_limit": 1,
        "times_used": 0,
        "active": True,
    },
    {
        "code": "ARMY10",
        "name": "Armed Forces & Veterans Privilege — 10% Extra OFF",
        "description": "Special 10% privilege discount honoring Indian Armed Forces personnel, Veterans, and Police.",
        "discount_type": "PERCENTAGE",
        "discount_value": 10.0,
        "min_order_paise": 50000,       # ₹500
        "max_discount_paise": 100000,   # Max ₹1,000 cap
        "applicable_categories": [],
        "applicable_product_ids": [],
        "total_usage_limit": 5000,
        "per_user_limit": 5,
        "times_used": 0,
        "active": True,
    },
]


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    doc["status"] = compute_coupon_status(doc)
    return doc


def get_id_or_code_query(identifier: str) -> dict:
    code_upper = identifier.strip().upper()
    if ObjectId.is_valid(identifier):
        return {"$or": [{"_id": ObjectId(identifier)}, {"code": code_upper}]}
    return {"code": code_upper}


async def ensure_default_coupons():
    """Seed initial default coupons once during platform bootstrap only.
    Will NEVER re-insert coupons that an administrator has intentionally deleted.
    """
    settings_doc = await db.settings.find_one({"_id": "global_settings"}) or {}
    if settings_doc.get("coupons_seeded"):
        return

    now = datetime.now(timezone.utc)
    for c in DEFAULT_COUPONS:
        doc = {**c, "created_at": now, "updated_at": now}
        await db.coupons.update_one({"code": c["code"]}, {"$setOnInsert": doc}, upsert=True)

    await db.settings.update_one(
        {"_id": "global_settings"},
        {"$set": {"coupons_seeded": True}},
        upsert=True,
    )


@router.get("", summary="List offers and coupons")
async def get_coupons(
    search: Optional[str] = Query(None, description="Search keyword in code or name"),
    discount_type: Optional[str] = Query(None, description="Filter by PERCENTAGE or FIXED_AMOUNT"),
    active: Optional[bool] = Query(None, description="Filter by active status"),
    status_filter: Optional[str] = Query(None, description="Filter by computed status: ACTIVE, SCHEDULED, EXPIRED, INACTIVE"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Retrieve promotional coupons and discount rules."""
    await ensure_default_coupons()
    query = {"is_deleted": {"$ne": True}}
    if active is not None:
        query["active"] = active
    if discount_type:
        query["discount_type"] = discount_type.upper()

    if search:
        s_regex = {"$regex": re.escape(search.strip()), "$options": "i"}
        query["$or"] = [{"code": s_regex}, {"name": s_regex}, {"description": s_regex}]

    cursor = db.coupons.find(query).sort("created_at", -1).skip(skip).limit(limit)
    coupons = []
    async for doc in cursor:
        serialized = serialize_doc(doc)
        if status_filter and status_filter.upper() != "ALL":
            if serialized["status"] != status_filter.upper():
                continue
        coupons.append(serialized)
    return coupons


@router.get("/{id_or_code}", summary="Get coupon details by code or ID")
async def get_coupon_by_id_or_code(id_or_code: str):
    """Retrieve single coupon document by code or ID."""
    query = get_id_or_code_query(id_or_code)
    query["is_deleted"] = {"$ne": True}
    doc = await db.coupons.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Coupon '{id_or_code}' not found")
    return serialize_doc(doc)


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create offer / coupon (Admin)")
async def create_coupon(
    payload: OfferCouponCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Create a new promotional coupon code with discount rules and limits."""
    code_upper = payload.code.strip().upper()

    existing = await db.coupons.find_one({"code": code_upper})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Coupon with code '{code_upper}' already exists",
        )

    now = datetime.now(timezone.utc)
    new_doc = {
        "code": code_upper,
        "name": payload.name.strip(),
        "description": payload.description.strip() if payload.description else "",
        "discount_type": payload.discount_type.value,
        "discount_value": payload.discount_value,
        "min_order_paise": payload.min_order_paise,
        "max_discount_paise": payload.max_discount_paise,
        "applicable_categories": [c.upper() for c in payload.applicable_categories],
        "applicable_product_ids": payload.applicable_product_ids,
        "total_usage_limit": payload.total_usage_limit,
        "per_user_limit": payload.per_user_limit,
        "times_used": 0,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "active": payload.active,
        "created_at": now,
        "updated_at": now,
        "created_by": current_admin.get("email", "admin"),
    }

    result = await db.coupons.insert_one(new_doc)
    created = await db.coupons.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.put("/{id_or_code}", summary="Update coupon (Admin)")
async def update_coupon(
    id_or_code: str,
    payload: OfferCouponUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Update coupon parameters, discount values, and schedules."""
    query = get_id_or_code_query(id_or_code)
    existing = await db.coupons.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")

    update_fields = {}
    if payload.code is not None:
        new_code = payload.code.strip().upper()
        if new_code != existing.get("code"):
            collision = await db.coupons.find_one({"code": new_code, "_id": {"$ne": existing["_id"]}})
            if collision:
                raise HTTPException(status_code=409, detail=f"Coupon code '{new_code}' already exists")
            update_fields["code"] = new_code

    if payload.name is not None:
        update_fields["name"] = payload.name.strip()
    if payload.description is not None:
        update_fields["description"] = payload.description.strip()
    if payload.discount_type is not None:
        update_fields["discount_type"] = payload.discount_type.value
    if payload.discount_value is not None:
        update_fields["discount_value"] = payload.discount_value
    if payload.min_order_paise is not None:
        update_fields["min_order_paise"] = payload.min_order_paise
    if payload.max_discount_paise is not None:
        update_fields["max_discount_paise"] = payload.max_discount_paise
    if payload.applicable_categories is not None:
        update_fields["applicable_categories"] = [c.upper() for c in payload.applicable_categories]
    if payload.applicable_product_ids is not None:
        update_fields["applicable_product_ids"] = payload.applicable_product_ids
    if payload.total_usage_limit is not None:
        update_fields["total_usage_limit"] = payload.total_usage_limit
    if payload.per_user_limit is not None:
        update_fields["per_user_limit"] = payload.per_user_limit
    if payload.start_date is not None:
        update_fields["start_date"] = payload.start_date
    if payload.end_date is not None:
        update_fields["end_date"] = payload.end_date
    if payload.active is not None:
        update_fields["active"] = payload.active

    update_fields["updated_at"] = datetime.now(timezone.utc)
    update_fields["updated_by"] = current_admin.get("email", "admin")

    updated = await db.coupons.find_one_and_update(
        {"_id": existing["_id"]},
        {"$set": update_fields},
        return_document=True,
    )
    return serialize_doc(updated)


@router.patch("/{id_or_code}/toggle-active", summary="Toggle coupon active status (Admin)")
async def toggle_coupon_active(
    id_or_code: str,
    active: Optional[bool] = Query(None, description="Explicit active state"),
    current_admin: dict = Depends(get_current_admin),
):
    """Toggle or set the active flag of an offer."""
    query = get_id_or_code_query(id_or_code)
    existing = await db.coupons.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")

    new_active = active if active is not None else not existing.get("active", True)
    now = datetime.now(timezone.utc)

    updated = await db.coupons.find_one_and_update(
        {"_id": existing["_id"]},
        {"$set": {"active": new_active, "updated_at": now, "updated_by": current_admin.get("email", "admin")}},
        return_document=True,
    )
    return serialize_doc(updated)


@router.delete("/{id_or_code}", summary="Delete or archive coupon (Admin)")
async def delete_coupon(
    id_or_code: str,
    hard_delete: bool = Query(True, description="If true, permanently delete record; otherwise soft-deactivate"),
    current_admin: dict = Depends(get_current_admin),
):
    """Remove coupon from database or soft-archive."""
    query = get_id_or_code_query(id_or_code)
    existing = await db.coupons.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if hard_delete:
        await db.coupons.delete_one({"_id": existing["_id"]})
        return {"message": f"Coupon '{existing.get('code')}' permanently deleted", "deleted": True}

    now = datetime.now(timezone.utc)
    await db.coupons.update_one(
        {"_id": existing["_id"]},
        {"$set": {"active": False, "is_deleted": True, "updated_at": now, "updated_by": current_admin.get("email", "admin")}},
    )
    return {"message": f"Coupon '{existing.get('code')}' archived", "archived": True}


@router.post("/validate", response_model=CouponValidateResponse, summary="Authoritative coupon validation & discount calculation")
async def validate_coupon(payload: CouponValidateRequest):
    """Authoritative server-side discount evaluation against cart items and rules.
    Does NOT trust client discount calculations.
    """
    code_upper = payload.code.strip().upper()
    coupon = await db.coupons.find_one({"code": code_upper})

    if not coupon:
        return CouponValidateResponse(
            valid=False,
            code=code_upper,
            message=f"Coupon code '{code_upper}' is invalid or does not exist",
            reason="NOT_FOUND",
            reason_code="NOT_FOUND",
            final_total_paise=payload.subtotal_paise or 0,
        )

    # Convert items to dicts
    items_dicts = [item.model_dump() for item in payload.items]

    is_valid, discount_paise, final_total_paise, msg, reason = validate_and_calculate_coupon_discount(
        coupon=coupon,
        items=items_dicts,
        client_subtotal_paise=payload.subtotal_paise or 0,
    )

    savings_text = None
    if is_valid and discount_paise > 0:
        savings_text = f"You save ₹{(discount_paise / 100):.2f} with {coupon.get('code')}"

    return CouponValidateResponse(
        valid=is_valid,
        code=coupon.get("code", code_upper),
        name=coupon.get("name"),
        discount_type=coupon.get("discount_type"),
        discount_value=coupon.get("discount_value"),
        discount_paise=discount_paise,
        final_total_paise=final_total_paise,
        message=msg,
        reason=reason,
        reason_code=reason,
        savings_text=savings_text,
    )
