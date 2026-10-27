"""Business logic and service operations for Dynamic Membership System (Phase 4.1)."""
from datetime import datetime, timezone, timedelta
import hashlib
import hmac
import json
import logging
import uuid
from typing import Any, Dict, List, Optional
from bson import ObjectId

from fastapi import HTTPException, status
import razorpay

from app.core.config import settings
from app.core.database import db
from app.core.security import create_qr_payload
from app.schemas.membership_schema import (
    MembershipSettingsSchema,
    UpdateMembershipSettingsRequest,
    RenewalPolicyEnum,
    MembershipStatusEnum,
    MembershipPurchaseStatusEnum,
)

logger = logging.getLogger(__name__)

MEMBERSHIP_SETTINGS_KEY = "membership_settings"


def _to_object_id(id_val: Any) -> Optional[ObjectId]:
    if isinstance(id_val, ObjectId):
        return id_val
    if isinstance(id_val, str) and ObjectId.is_valid(id_val):
        return ObjectId(id_val)
    return None


def get_razorpay_client() -> razorpay.Client:
    """Instantiate authenticated Razorpay Client with configured test credentials."""
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def compute_razorpay_signature(provider_order_id: str, provider_payment_id: str, secret: str) -> str:
    """Cryptographically calculate expected Razorpay HMAC-SHA256 signature."""
    msg = f"{provider_order_id}|{provider_payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


# ==============================================================================
# 1. Authoritative Membership Settings Management
# ==============================================================================

async def get_membership_settings() -> MembershipSettingsSchema:
    """Retrieve authoritative membership settings from MongoDB.
    Initializes safe default configuration with version 1 if not previously configured.
    """
    doc = await db.settings.find_one({"key": MEMBERSHIP_SETTINGS_KEY})
    if doc and "value" in doc:
        try:
            return MembershipSettingsSchema(**doc["value"])
        except Exception as e:
            logger.error(f"Malformed membership settings in database: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Persisted membership settings are invalid. Please check administrator configuration.",
            )

    # Missing configuration: Initialize default configuration once
    now = datetime.now(timezone.utc)
    default_config = MembershipSettingsSchema(
        enabled=True,
        price_paise=10000,          # ₹100.00
        validity_days=334,          # 11 months
        renewal_policy=RenewalPolicyEnum.EXTEND_FROM_EXPIRY,
        allow_renewal_while_active=True,
        allow_renewal_after_expiry=True,
        display_name="Bigchamp Digital Membership Card",
        description="Annual digital sports privilege pass with partner benefits, store discounts, and athletic community privileges.",
        benefits=[
            "Member-exclusive pricing across all Bigchamp store gear and apparel",
            "QR privilege check-in at affiliated sports dormitories and physio centers",
            "Priority access and participation in athletic community events",
            "Exclusive eligibility for upcoming Cookey and community offers",
        ],
        version=1,
    )

    await db.settings.update_one(
        {"key": MEMBERSHIP_SETTINGS_KEY},
        {
            "$setOnInsert": {
                "key": MEMBERSHIP_SETTINGS_KEY,
                "value": default_config.model_dump(),
                "created_at": now,
                "updated_at": now,
                "updated_by": "SYSTEM_DEFAULT",
            }
        },
        upsert=True,
    )
    return default_config


async def update_membership_settings(
    update_data: UpdateMembershipSettingsRequest,
    admin_email: str,
) -> MembershipSettingsSchema:
    """Update dynamic membership business settings, automatically incrementing the version.
    Validates all business constraints and ensures no live secrets can be saved.
    """
    current_settings = await get_membership_settings()
    data_dict = current_settings.model_dump()

    # Apply only provided fields
    provided = update_data.model_dump(exclude_unset=True)
    for field, val in provided.items():
        if val is not None:
            data_dict[field] = val

    # Monotonically increment version to guarantee immutable purchase snapshots
    data_dict["version"] = current_settings.version + 1

    try:
        validated = MembershipSettingsSchema(**data_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid membership configuration: {str(e)}",
        )

    now = datetime.now(timezone.utc)
    await db.settings.update_one(
        {"key": MEMBERSHIP_SETTINGS_KEY},
        {
            "$set": {
                "key": MEMBERSHIP_SETTINGS_KEY,
                "value": validated.model_dump(),
                "updated_at": now,
                "updated_by": admin_email,
            }
        },
        upsert=True,
    )
    logger.info(f"Membership settings updated to version {validated.version} by {admin_email}")
    return validated


# ==============================================================================
# 2. Customer Membership Lifecycle & Status Resolution
# ==============================================================================

async def get_customer_membership_status(user_id: str) -> dict:
    """Return customer's authoritative membership status, active dates, remaining days,
    and renewal eligibility calculated against the current server time and dynamic settings.
    """
    now = datetime.now(timezone.utc)
    settings_obj = await get_membership_settings()

    query = {"user_id": str(user_id)}
    membership = await db.memberships.find_one(query)

    if not membership:
        return {
            "is_active": False,
            "status": "NOT_PURCHASED",
            "card_number": None,
            "valid_till": None,
            "period_start": None,
            "remaining_days": 0,
            "can_renew": settings_obj.enabled,
            "renewal_message": None if settings_obj.enabled else "Membership purchases are currently disabled by administration.",
            "latest_purchase_id": None,
            "total_periods_count": 0,
            "periods_history": [],
        }

    # Evaluate expiry authoritatively
    valid_till = membership.get("valid_till")
    if valid_till and isinstance(valid_till, datetime):
        if valid_till.tzinfo is None:
            valid_till = valid_till.replace(tzinfo=timezone.utc)
    else:
        valid_till = None

    period_start = membership.get("current_period_start")
    if period_start and isinstance(period_start, datetime) and period_start.tzinfo is None:
        period_start = period_start.replace(tzinfo=timezone.utc)

    is_currently_valid = valid_till is not None and valid_till > now
    membership_status = MembershipStatusEnum.ACTIVE.value if is_currently_valid else MembershipStatusEnum.EXPIRED.value

    # Auto-synchronize status if expired in database
    if not is_currently_valid and membership.get("is_active"):
        await db.memberships.update_one(
            {"_id": membership["_id"]},
            {"$set": {"status": MembershipStatusEnum.EXPIRED.value, "is_active": False, "updated_at": now}},
        )
        await db.users.update_one(
            {"$or": [{"_id": _to_object_id(user_id)}, {"id": str(user_id)}]},
            {"$set": {"has_membership": False}},
        )

    remaining_days = 0
    if is_currently_valid and valid_till:
        delta = valid_till - now
        remaining_days = max(0, delta.days + (1 if delta.seconds > 0 else 0))

    # Evaluate renewal eligibility dynamically against active business settings
    can_renew = True
    renewal_msg = None

    if not settings_obj.enabled:
        can_renew = False
        renewal_msg = "Membership renewals are currently disabled by platform administration."
    elif is_currently_valid and not settings_obj.allow_renewal_while_active:
        can_renew = False
        renewal_msg = "Renewals are not permitted while your current membership period is active."
    elif not is_currently_valid and not settings_obj.allow_renewal_after_expiry:
        can_renew = False
        renewal_msg = "Renewals for expired memberships are disabled."

    # Parse periods history
    history = membership.get("periods_history", [])

    qr_payload = None
    if is_currently_valid and membership.get("card_number"):
        qr_payload = create_qr_payload({
            "card_number": membership.get("card_number"),
            "user_id": str(user_id),
            "status": "ACTIVE",
            "valid_till": valid_till.isoformat() if valid_till else None,
        })

    return {
        "is_active": is_currently_valid,
        "status": membership_status,
        "card_number": membership.get("card_number"),
        "valid_till": valid_till,
        "period_start": period_start,
        "remaining_days": remaining_days,
        "can_renew": can_renew,
        "renewal_message": renewal_msg,
        "latest_purchase_id": membership.get("latest_purchase_id"),
        "total_periods_count": membership.get("total_periods_count", len(history)),
        "periods_history": history,
        "qr_payload": qr_payload,
    }


# ==============================================================================
# 3. Membership Purchase Initiation & Snapshotting
# ==============================================================================

async def initiate_membership_purchase(
    user_id: str,
    idempotency_key: Optional[str] = None,
) -> dict:
    """Initiate a membership purchase or renewal.
    Snapshots authoritative pricing and duration from persisted database settings,
    generates an authentic Razorpay test-mode provider order, and records the pending purchase.
    """
    settings_obj = await get_membership_settings()

    # 1. Enforce business availability
    if not settings_obj.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Membership purchases are currently disabled by platform administration.",
        )

    # 2. Check existing customer membership and renewal permissions
    status_info = await get_customer_membership_status(user_id)
    is_renewal = status_info["status"] in (MembershipStatusEnum.ACTIVE.value, MembershipStatusEnum.EXPIRED.value)

    if not status_info["can_renew"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=status_info["renewal_message"] or "Membership purchase is currently not permitted.",
        )

    # 3. Idempotency Check: Reuse existing pending purchase if idempotency key matches
    if idempotency_key:
        existing_purchase = await db.membership_purchases.find_one({
            "user_id": str(user_id),
            "idempotency_key": idempotency_key,
            "status": MembershipPurchaseStatusEnum.PENDING_PAYMENT.value,
        })
        if existing_purchase:
            return {
                "purchase_id": existing_purchase["purchase_id"],
                "order_id": existing_purchase["purchase_id"],
                "provider_order_id": existing_purchase["provider_order_id"],
                "amount_paise": existing_purchase["amount_paise"],
                "currency": existing_purchase["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
                "display_name": existing_purchase["snapshotted_config"].get("display_name", settings_obj.display_name),
                "snapshotted_validity_days": existing_purchase["snapshotted_config"].get("validity_days", settings_obj.validity_days),
                "config_version": existing_purchase["snapshotted_config"].get("version", settings_obj.version),
                "is_renewal": existing_purchase.get("is_renewal", is_renewal),
            }

    # 4. Snapshot current configuration authoritatively
    snapshotted_config = {
        "price_paise": settings_obj.price_paise,
        "validity_days": settings_obj.validity_days,
        "renewal_policy": settings_obj.renewal_policy.value,
        "display_name": settings_obj.display_name,
        "description": settings_obj.description,
        "version": settings_obj.version,
    }

    now = datetime.now(timezone.utc)
    purchase_id = f"PUR-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # 5. Create genuine Razorpay Sandbox Provider Order
    # Guard against placeholder test keys
    if (
        not settings.RAZORPAY_KEY_ID
        or "placeholder" in settings.RAZORPAY_KEY_ID.lower()
        or "yourtestkey" in settings.RAZORPAY_KEY_ID.lower()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid Razorpay Test Key ID is not configured in backend environment",
        )

    client = get_razorpay_client()
    try:
        rzp_order = client.order.create({
            "amount": settings_obj.price_paise,
            "currency": "INR",
            "receipt": purchase_id,
            "notes": {
                "purchase_id": purchase_id,
                "user_id": str(user_id),
                "type": "MEMBERSHIP",
                "config_version": str(settings_obj.version),
            },
        })
        provider_order_id = rzp_order["id"]
    except Exception as e:
        logger.error(f"Failed to create Razorpay order for membership purchase: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment provider order creation failed: {str(e)}",
        )

    # 6. Insert persistent membership purchase record
    purchase_doc = {
        "purchase_id": purchase_id,
        "user_id": str(user_id),
        "idempotency_key": idempotency_key,
        "status": MembershipPurchaseStatusEnum.PENDING_PAYMENT.value,
        "payment_status": "AWAITING_PAYMENT",
        "amount_paise": settings_obj.price_paise,
        "currency": "INR",
        "provider_order_id": provider_order_id,
        "snapshotted_config": snapshotted_config,
        "is_renewal": is_renewal,
        "created_at": now,
        "updated_at": now,
    }
    await db.membership_purchases.insert_one(purchase_doc)

    # 7. Create tracking record in payments collection for unified audit
    payment_id = f"PAY-{purchase_id}"
    await db.payments.insert_one({
        "payment_id": payment_id,
        "order_id": purchase_id,
        "order_number": purchase_id,
        "payment_type": "MEMBERSHIP",
        "user_id": str(user_id),
        "amount_paise": settings_obj.price_paise,
        "currency": "INR",
        "provider_order_id": provider_order_id,
        "status": "ATTEMPTED",
        "created_at": now,
        "updated_at": now,
        "audit_history": [
            {
                "status": "ATTEMPTED",
                "changed_by": "CUSTOMER",
                "changed_at": now,
                "notes": f"Membership purchase initiated: {settings_obj.display_name} (v{settings_obj.version})",
            }
        ],
    })

    return {
        "purchase_id": purchase_id,
        "order_id": purchase_id,
        "provider_order_id": provider_order_id,
        "amount_paise": settings_obj.price_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID,
        "display_name": settings_obj.display_name,
        "snapshotted_validity_days": settings_obj.validity_days,
        "config_version": settings_obj.version,
        "is_renewal": is_renewal,
    }


# ==============================================================================
# 4. Cryptographic Payment Verification & Period Activation
# ==============================================================================

async def verify_membership_payment(
    user_id: str,
    purchase_id: str,
    provider_order_id: str,
    provider_payment_id: str,
    provider_signature: str,
) -> dict:
    """Cryptographically verify payment signature and activate the membership period authoritatively."""
    now = datetime.now(timezone.utc)

    # 1. Cryptographic HMAC-SHA256 signature verification
    expected_sig = compute_razorpay_signature(
        provider_order_id=provider_order_id,
        provider_payment_id=provider_payment_id,
        secret=settings.RAZORPAY_KEY_SECRET,
    )

    is_valid = hmac.compare_digest(expected_sig, provider_signature)
    if not is_valid:
        # Fallback to Razorpay SDK verification utility
        try:
            client = get_razorpay_client()
            client.utility.verify_payment_signature({
                "razorpay_order_id": provider_order_id,
                "razorpay_payment_id": provider_payment_id,
                "razorpay_signature": provider_signature,
            })
            is_valid = True
        except Exception:
            is_valid = False

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cryptographic payment signature verification failed",
        )

    # 2. Retrieve purchase document
    purchase = await db.membership_purchases.find_one({"purchase_id": purchase_id})
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Membership purchase '{purchase_id}' not found",
        )

    # 3. Customer ownership isolation
    if str(purchase.get("user_id")) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this membership purchase",
        )

    # 4. Provider order binding assertion
    if purchase.get("provider_order_id") != provider_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider order ID does not match the purchase record",
        )

    # 5. Idempotent check: If already paid and activated, return clean response without re-extension
    if purchase.get("status") == MembershipPurchaseStatusEnum.PAID.value:
        membership = await db.memberships.find_one({"user_id": str(user_id)})
        return {
            "success": True,
            "status": MembershipStatusEnum.ACTIVE.value,
            "membership_status": MembershipStatusEnum.ACTIVE.value,
            "card_number": membership.get("card_number") if membership else None,
            "period_start": purchase.get("period_start"),
            "valid_till": purchase.get("period_end"),
            "purchase_id": purchase_id,
            "message": "Membership payment was already verified and activated (Idempotent replay).",
        }

    # 6. Apply snapshotted duration and renewal policy to calculate period boundaries
    snapshotted = purchase.get("snapshotted_config", {})
    validity_days = snapshotted.get("validity_days", 334)
    renewal_policy = snapshotted.get("renewal_policy", RenewalPolicyEnum.EXTEND_FROM_EXPIRY.value)

    existing_membership = await db.memberships.find_one({"user_id": str(user_id)})

    current_valid_till = existing_membership.get("valid_till") if existing_membership else None
    if current_valid_till and isinstance(current_valid_till, datetime) and current_valid_till.tzinfo is None:
        current_valid_till = current_valid_till.replace(tzinfo=timezone.utc)

    # Calculate period start and expiry
    if (
        existing_membership
        and current_valid_till
        and current_valid_till > now
        and renewal_policy == RenewalPolicyEnum.EXTEND_FROM_EXPIRY.value
    ):
        # Active membership renewal: extend from existing expiry date
        period_start = current_valid_till
        period_end = period_start + timedelta(days=validity_days)
    else:
        # Initial purchase, expired membership, or start-from-activation policy
        period_start = now
        period_end = period_start + timedelta(days=validity_days)

    # Ensure card number exists
    card_number = existing_membership.get("card_number") if existing_membership else None
    if not card_number:
        card_number = f"BC-MEM-{user_id[:6].upper()}-{uuid.uuid4().hex[:4].upper()}"

    period_item = {
        "purchase_id": purchase_id,
        "period_start": period_start,
        "period_end": period_end,
        "price_paise": purchase.get("amount_paise", snapshotted.get("price_paise", 10000)),
        "validity_days": validity_days,
        "config_version": snapshotted.get("version", 1),
        "renewal_policy": renewal_policy,
        "activated_at": now,
    }

    # 7. Update/Upsert membership record in MongoDB
    await db.memberships.update_one(
        {"user_id": str(user_id)},
        {
            "$set": {
                "user_id": str(user_id),
                "card_number": card_number,
                "status": MembershipStatusEnum.ACTIVE.value,
                "is_active": True,
                "current_period_start": period_start,
                "valid_till": period_end,
                "latest_purchase_id": purchase_id,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
            "$inc": {"total_periods_count": 1},
            "$push": {
                "periods_history": period_item,
            },
        },
        upsert=True,
    )

    # 8. Mark purchase record as PAID
    await db.membership_purchases.update_one(
        {"purchase_id": purchase_id},
        {
            "$set": {
                "status": MembershipPurchaseStatusEnum.PAID.value,
                "payment_status": "PAID",
                "provider_payment_id": provider_payment_id,
                "provider_signature": provider_signature,
                "period_start": period_start,
                "period_end": period_end,
                "activated_at": now,
                "updated_at": now,
            }
        },
    )

    # 9. Mark unified payment record as SUCCESS
    await db.payments.update_one(
        {"order_id": purchase_id},
        {
            "$set": {
                "status": "SUCCESS",
                "provider_payment_id": provider_payment_id,
                "provider_signature": provider_signature,
                "verified_at": now,
                "updated_at": now,
            },
            "$push": {
                "audit_history": {
                    "status": "SUCCESS",
                    "changed_by": "PAYMENT_VERIFIED",
                    "changed_at": now,
                    "notes": f"Membership period activated: {validity_days} days (valid till {period_end.isoformat()})",
                }
            },
        },
    )

    # 10. Update user profile flag for backward compatibility
    await db.users.update_one(
        {"$or": [{"_id": _to_object_id(user_id)}, {"id": str(user_id)}]},
        {"$set": {"has_membership": True, "membership_status": "ACTIVE"}},
    )

    logger.info(f"Membership activated for customer {user_id}: card={card_number}, valid_till={period_end}")

    return {
        "success": True,
        "status": MembershipStatusEnum.ACTIVE.value,
        "membership_status": MembershipStatusEnum.ACTIVE.value,
        "card_number": card_number,
        "period_start": period_start,
        "valid_till": period_end,
        "purchase_id": purchase_id,
        "message": f"Membership successfully activated for {validity_days} days!",
    }


# ==============================================================================
# 5. Cancellation & Dismissal
# ==============================================================================

async def cancel_membership_purchase(user_id: str, purchase_id: str, reason: Optional[str] = None) -> dict:
    """Record customer dismissal of membership payment window without corrupting order state."""
    purchase = await db.membership_purchases.find_one({"purchase_id": purchase_id})
    if not purchase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")

    if str(purchase.get("user_id")) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if purchase.get("status") == MembershipPurchaseStatusEnum.PAID.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel an already paid membership purchase")

    now = datetime.now(timezone.utc)
    await db.membership_purchases.update_one(
        {"purchase_id": purchase_id},
        {
            "$set": {
                "status": MembershipPurchaseStatusEnum.CANCELLED.value,
                "failure_reason": reason or "Customer closed checkout modal",
                "updated_at": now,
            }
        },
    )

    await db.payments.update_one(
        {"order_id": purchase_id},
        {
            "$set": {
                "status": "CANCELLED",
                "failure_reason": reason or "Customer closed checkout modal",
                "updated_at": now,
            }
        },
    )

    return {"success": True, "purchase_id": purchase_id, "status": "CANCELLED"}


# ==============================================================================
# 6. Customer History & Admin Management Queries
# ==============================================================================

async def get_customer_purchase_history(user_id: str, skip: int = 0, limit: int = 20) -> dict:
    """Retrieve paginated membership purchases and renewals for the authenticated customer."""
    query = {"user_id": str(user_id)}
    total = await db.membership_purchases.count_documents(query)
    cursor = db.membership_purchases.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    return {"items": items, "total": total, "skip": skip, "limit": limit}


async def admin_list_memberships(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
) -> dict:
    """Paginated list of all customer memberships with status filters and customer search."""
    now = datetime.now(timezone.utc)
    query: Dict[str, Any] = {}

    if status_filter:
        s_upper = status_filter.upper()
        if s_upper == "ACTIVE":
            query["status"] = "ACTIVE"
            query["valid_till"] = {"$gt": now}
        elif s_upper == "EXPIRED":
            query["$or"] = [{"status": "EXPIRED"}, {"valid_till": {"$lte": now}}]

    if search:
        search_rgx = {"$regex": search.strip(), "$options": "i"}
        # Find any matching users by email, mobile, or name
        matching_users = await db.users.find(
            {"$or": [{"email": search_rgx}, {"mobile": search_rgx}, {"full_name": search_rgx}, {"name": search_rgx}]},
            {"_id": 1}
        ).to_list(100)
        matching_ids = [str(u["_id"]) for u in matching_users]

        search_clauses: List[Dict[str, Any]] = [
            {"card_number": search_rgx},
            {"user_id": search_rgx},
        ]
        if matching_ids:
            search_clauses.append({"user_id": {"$in": matching_ids}})

        query["$or"] = search_clauses

    total = await db.memberships.count_documents(query)
    active_count = await db.memberships.count_documents({"status": "ACTIVE", "valid_till": {"$gt": now}})
    expired_count = await db.memberships.count_documents({"$or": [{"status": "EXPIRED"}, {"valid_till": {"$lte": now}}]})

    cursor = db.memberships.find(query).sort("valid_till", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        uid = doc.get("user_id")
        user = None
        if uid:
            user = await db.users.find_one({"$or": [{"_id": _to_object_id(uid)}, {"id": str(uid)}]})

        valid_till = doc.get("valid_till")
        if valid_till and isinstance(valid_till, datetime) and valid_till.tzinfo is None:
            valid_till = valid_till.replace(tzinfo=timezone.utc)
        is_active = bool(valid_till and valid_till > now and doc.get("status") == "ACTIVE")
        rem_days = max(0, (valid_till - now).days) if is_active and valid_till else 0

        items.append({
            "id": str(doc["_id"]),
            "membership_id": str(doc["_id"]),
            "user_id": str(uid),
            "user_name": user.get("full_name") or user.get("name") if user else "Customer",
            "user_mobile": user.get("mobile") if user else "",
            "user_email": user.get("email") if user else "",
            "card_number": doc.get("card_number"),
            "status": "ACTIVE" if is_active else "EXPIRED",
            "is_active": is_active,
            "current_period_start": doc.get("current_period_start"),
            "valid_till": valid_till,
            "remaining_days": rem_days,
            "total_periods_count": doc.get("total_periods_count", len(doc.get("periods_history", []))),
            "latest_purchase_id": doc.get("latest_purchase_id"),
            "updated_at": doc.get("updated_at"),
        })

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "active_count": active_count,
        "expired_count": expired_count,
    }


async def admin_get_membership_detail(membership_id_or_user_id: str) -> dict:
    """Retrieve full details of a customer's membership, linked purchases, and audit metadata."""
    oid = _to_object_id(membership_id_or_user_id)
    query = {"$or": [{"user_id": str(membership_id_or_user_id)}]}
    if oid:
        query["$or"].append({"_id": oid})

    membership = await db.memberships.find_one(query)
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")

    membership["_id"] = str(membership["_id"])
    uid = membership["user_id"]

    # Fetch user info
    user = await db.users.find_one({"$or": [{"_id": _to_object_id(uid)}, {"id": str(uid)}]})
    if user:
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        membership["user"] = user

    # Fetch linked purchases
    purchases_cursor = db.membership_purchases.find({"user_id": str(uid)}).sort("created_at", -1)
    purchases = []
    async for p in purchases_cursor:
        p["_id"] = str(p["_id"])
        purchases.append(p)
    membership["purchases"] = purchases

    return membership
