"""Authoritative Order Management and Checkout Business Logic Service."""
from datetime import datetime, timezone, timedelta
import random
import string
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import db
from app.schemas.order_schema import (
    OrderStatus,
    PaymentStatus,
    OrderCreateRequest,
    OrderStatusUpdateRequest,
    ShipmentTrackingSchema,
    VALID_ORDER_TRANSITIONS,
)
from app.services.coupon_service import validate_and_calculate_coupon_discount
from app.services.settings_service import get_business_rules


def _to_object_id(val: Any) -> Optional[ObjectId]:
    if isinstance(val, ObjectId):
        return val
    if isinstance(val, str) and ObjectId.is_valid(val):
        return ObjectId(val)
    return None


async def ensure_order_indexes():
    """Ensure unique and query indexes for the orders collection."""
    try:
        await db.orders.create_index("order_number", unique=True)
        await db.orders.create_index([("user_id", 1), ("created_at", -1)])
        await db.orders.create_index("order_status")
        await db.orders.create_index("payment_status")
        try:
            await db.orders.drop_index("user_id_1_idempotency_key_1")
        except Exception:
            pass
        await db.orders.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
        )
        await db.orders.create_index([("user_id", 1), ("items.is_cookey", 1), ("created_at", -1)])
        await db.cookey_reservations.create_index([("user_id", 1), ("status", 1)])
    except Exception:
        pass


def generate_order_number() -> str:
    """Generate a unique human-readable order number.
    Format: BC-YYYYMMDD-XXXXXX (e.g. BC-20261024-K9B3T2)
    """
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    chars = string.ascii_uppercase + string.digits
    # Exclude ambiguous characters O, 0, I, 1
    safe_chars = [c for c in chars if c not in ("O", "0", "I", "1")]
    random_code = "".join(random.choices(safe_chars, k=6))
    return f"BC-{date_str}-{random_code}"


async def is_user_verified_member(user_id: str) -> bool:
    """Check if customer holds a currently valid active Bigchamp membership."""
    if not user_id:
        return False

    oid = _to_object_id(user_id)
    query = {
        "$or": [{"user_id": user_id}] + ([{"user_id": oid}] if oid else []),
        "status": "ACTIVE",
    }
    membership = await db.memberships.find_one(query)
    if not membership:
        # Check alternative is_active flag
        query_alt = {
            "$or": [{"user_id": user_id}] + ([{"user_id": oid}] if oid else []),
            "is_active": True,
        }
        membership = await db.memberships.find_one(query_alt)

    if not membership:
        return False

    # Check validity date if present
    valid_till = membership.get("valid_till")
    if valid_till:
        now = datetime.now(timezone.utc)
        if isinstance(valid_till, datetime):
            if valid_till.tzinfo is None:
                valid_till = valid_till.replace(tzinfo=timezone.utc)
            if now > valid_till:
                return False
        elif isinstance(valid_till, str):
            try:
                vt_dt = datetime.fromisoformat(valid_till.replace("Z", "+00:00"))
                if vt_dt.tzinfo is None:
                    vt_dt = vt_dt.replace(tzinfo=timezone.utc)
                if now > vt_dt:
                    return False
            except Exception:
                pass

    return True


async def check_cookey_eligibility(user_id: Optional[str]) -> dict:
    """Evaluate customer eligibility to purchase Cookey under DB-backed weekly cooldown & membership rules."""
    rules = await get_business_rules()
    cooldown_days = int(rules.get("cookey_cooldown_days", 7))
    max_per_week = int(rules.get("cookey_max_per_week", 1))
    price_paise = int(rules.get("cookey_price_paise", 10000))
    requires_member = bool(rules.get("cookey_requires_membership", True))

    if not user_id:
        return {
            "is_eligible": False,
            "is_member": False,
            "requires_membership": requires_member,
            "cooldown_days": cooldown_days,
            "max_per_week": max_per_week,
            "price_paise": price_paise,
            "last_purchased_at": None,
            "next_eligible_at": None,
            "remaining_seconds": 0,
            "message": "Login and an active Bigchamp membership are required to purchase Cookey.",
        }

    is_member = await is_user_verified_member(user_id)
    if requires_member and not is_member:
        return {
            "is_eligible": False,
            "is_member": False,
            "requires_membership": requires_member,
            "cooldown_days": cooldown_days,
            "max_per_week": max_per_week,
            "price_paise": price_paise,
            "last_purchased_at": None,
            "next_eligible_at": None,
            "remaining_seconds": 0,
            "message": "Cookey is exclusive to verified active Bigchamp members. Please activate membership first.",
        }

    now_utc = datetime.now(timezone.utc)
    cutoff = now_utc - timedelta(days=cooldown_days)

    qualifying_order = await db.orders.find_one(
        {
            "user_id": user_id,
            "items.is_cookey": True,
            "order_status": {"$nin": [OrderStatus.CANCELLED.value, OrderStatus.REFUNDED.value]},
            "payment_status": {"$in": [PaymentStatus.PAID.value, PaymentStatus.PENDING.value, PaymentStatus.NOT_STARTED.value]},
            "created_at": {"$gte": cutoff},
        },
        sort=[("created_at", -1)],
    )

    if qualifying_order:
        last_dt = qualifying_order.get("created_at")
        if isinstance(last_dt, datetime) and last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        next_dt = last_dt + timedelta(days=cooldown_days)
        rem_sec = max(0, int((next_dt - now_utc).total_seconds()))
        return {
            "is_eligible": False,
            "is_member": is_member,
            "requires_membership": requires_member,
            "cooldown_days": cooldown_days,
            "max_per_week": max_per_week,
            "price_paise": price_paise,
            "last_purchased_at": last_dt.isoformat(),
            "next_eligible_at": next_dt.isoformat(),
            "remaining_seconds": rem_sec,
            "message": f"Weekly Cookey purchase limit reached. You can purchase again at {next_dt.strftime('%Y-%m-%d %H:%M:%S UTC')}.",
        }

    return {
        "is_eligible": True,
        "is_member": is_member,
        "requires_membership": requires_member,
        "cooldown_days": cooldown_days,
        "max_per_week": max_per_week,
        "price_paise": price_paise,
        "last_purchased_at": None,
        "next_eligible_at": None,
        "remaining_seconds": 0,
        "message": "You are eligible to purchase Cookey.",
    }


def serialize_order_doc(doc: dict) -> dict:
    """Serialize MongoDB order document for Pydantic response."""
    if not doc:
        return {}
    res = dict(doc)
    res["id"] = str(res.pop("_id", ""))
    return res


async def create_authoritative_order(user: dict, req: OrderCreateRequest) -> dict:
    """Create a new customer order with server-authoritative pricing and coupon validation."""
    await ensure_order_indexes()
    user_id = str(user.get("id") or user.get("_id", ""))

    # 1. Idempotency Check: if idempotency_key supplied, return previously created order
    clean_idempotency_key = req.idempotency_key.strip() if req.idempotency_key else None
    if clean_idempotency_key:
        existing_order = await db.orders.find_one({
            "user_id": user_id,
            "idempotency_key": clean_idempotency_key,
        })
        if existing_order:
            return serialize_order_doc(existing_order)

    # 2. Validate items list
    if not req.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

    # Aggregate quantities for duplicate product entries in request
    item_quantities: Dict[str, int] = {}
    for it in req.items:
        pid = it.product_id.strip()
        if it.qty <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Quantity for product '{pid}' must be at least 1")
        item_quantities[pid] = item_quantities.get(pid, 0) + it.qty

    # Fetch dynamic platform business rules
    rules = await get_business_rules()

    # Validate max items per order rule
    max_items = int(rules.get("max_items_per_order", 50))
    total_qty = sum(item_quantities.values())
    if total_qty > max_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total items in order ({total_qty}) exceeds platform limit of {max_items}",
        )

    # 3. Check customer membership status authoritatively
    is_member = await is_user_verified_member(user_id)
    default_member_discount_pct = float(rules.get("default_member_discount_percent", 0.0))

    # 4. Fetch all requested products from MongoDB
    snapshots: List[dict] = []
    authoritative_items_for_coupon: List[dict] = []

    for pid, qty in item_quantities.items():
        oid = _to_object_id(pid)
        product_query = {"$or": [{"slug": pid}]}
        if oid:
            product_query["$or"].append({"_id": oid})

        product = await db.products.find_one(product_query)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with identifier '{pid}' not found",
            )

        if not product.get("active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.get('name')}' is currently unavailable or archived",
            )

        stock = product.get("stock")
        if stock is not None:
            if stock <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.get('name')}' is currently out of stock",
                )
            if qty > stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.get('name')}'. Requested: {qty}, Available: {stock}",
                )

        regular_price = int(product.get("price_paise", 0))
        member_price = int(product.get("member_price_paise", 0))

        # Member pricing applied only if customer holds verified membership
        if is_member and member_price > 0 and member_price < regular_price:
            unit_price = member_price
            used_member_price = True
        elif is_member and default_member_discount_pct > 0.0:
            # Dynamic platform member discount fallback
            discounted = int(round(regular_price * (1.0 - default_member_discount_pct / 100.0)))
            if discounted < regular_price:
                unit_price = discounted
                used_member_price = True
            else:
                unit_price = regular_price
                used_member_price = False
        else:
            unit_price = regular_price
            used_member_price = False

        is_cookey = bool(product.get("is_cookey") or product.get("slug") == "cookey-members-only")
        if is_cookey:
            cookey_cfg_price = int(rules.get("cookey_price_paise", 0))
            if cookey_cfg_price > 0:
                unit_price = cookey_cfg_price

        line_total = unit_price * qty
        images = product.get("images") or []
        image_url = images[0] if images else None

        item_snapshot = {
            "product_id": str(product.get("_id")),
            "slug": product.get("slug", ""),
            "name": product.get("name", ""),
            "category": (product.get("category") or "GENERAL").upper(),
            "unit_price_paise": unit_price,
            "regular_price_paise": regular_price,
            "is_member_price": used_member_price,
            "is_cookey": is_cookey,
            "qty": qty,
            "line_total_paise": line_total,
            "image": image_url,
        }
        snapshots.append(item_snapshot)

        authoritative_items_for_coupon.append({
            "product_id": str(product.get("_id")),
            "category": (product.get("category") or "GENERAL").upper(),
            "price_paise": unit_price,
            "qty": qty,
        })

    # 4b. Enforce authoritative Cookey weekly purchase & membership limits
    cookey_items = [s for s in snapshots if s.get("is_cookey")]
    reservation_id = None
    if cookey_items:
        cookey_qty = sum(s["qty"] for s in cookey_items)
        max_per_week = int(rules.get("cookey_max_per_week", 1))
        if cookey_qty > max_per_week:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weekly Cookey limit exceeded. Maximum {max_per_week} Cookey allowed per order/week.",
            )

        requires_member = bool(rules.get("cookey_requires_membership", True))
        if requires_member and not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cookey is exclusive to verified active Bigchamp members. Please activate membership first.",
            )

        cooldown_days = int(rules.get("cookey_cooldown_days", 7))
        now_check = datetime.now(timezone.utc)
        cutoff = now_check - timedelta(days=cooldown_days)

        qualifying_order = await db.orders.find_one(
            {
                "user_id": user_id,
                "items.is_cookey": True,
                "order_status": {"$nin": [OrderStatus.CANCELLED.value, OrderStatus.REFUNDED.value]},
                "payment_status": {"$in": [PaymentStatus.PAID.value, PaymentStatus.PENDING.value, PaymentStatus.NOT_STARTED.value]},
                "created_at": {"$gte": cutoff},
            },
            sort=[("created_at", -1)],
        )
        if qualifying_order:
            last_dt = qualifying_order.get("created_at")
            if isinstance(last_dt, datetime) and last_dt.tzinfo is None:
                last_dt = last_dt.replace(tzinfo=timezone.utc)
            next_dt = last_dt + timedelta(days=cooldown_days)
            rem_sec = max(0, int((next_dt - now_check).total_seconds()))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weekly Cookey purchase limit reached. You can purchase again at {next_dt.isoformat()} (in {rem_sec} seconds).",
            )

        # Atomic reservation protection against parallel race conditions
        active_res = await db.cookey_reservations.find_one({
            "user_id": user_id,
            "status": "RESERVED",
            "expires_at": {"$gt": now_check},
        })
        if active_res:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A Cookey checkout is already in progress for your account. Please wait a moment before trying again.",
            )

        res_insert = await db.cookey_reservations.insert_one({
            "user_id": user_id,
            "status": "RESERVED",
            "reserved_at": now_check,
            "expires_at": now_check + timedelta(minutes=15),
        })
        reservation_id = res_insert.inserted_id

    # 5. Compute Subtotal
    subtotal_paise = sum(s["line_total_paise"] for s in snapshots)

    # Validate minimum order value rule
    min_order_value_paise = int(rules.get("min_order_value_paise", 0))
    if min_order_value_paise > 0 and subtotal_paise < min_order_value_paise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order subtotal (₹{subtotal_paise / 100:.2f}) does not meet the minimum required order value of ₹{min_order_value_paise / 100:.2f}",
        )

    # 6. Authoritative Coupon Revalidation & Calculation
    discount_paise = 0
    applied_coupon_code = None

    if req.coupon_code and req.coupon_code.strip():
        code_upper = req.coupon_code.strip().upper()
        coupon = await db.coupons.find_one({"code": code_upper})
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_upper}' is invalid or does not exist",
            )

        is_valid, calc_discount, _, msg, reason = validate_and_calculate_coupon_discount(
            coupon=coupon,
            items=authoritative_items_for_coupon,
            client_subtotal_paise=subtotal_paise,
        )

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon '{code_upper}' is not applicable: {msg}",
            )

        discount_paise = calc_discount
        applied_coupon_code = code_upper

    # Dynamic delivery charge calculation
    standard_delivery = int(rules.get("standard_delivery_charge_paise", 0))
    free_threshold = int(rules.get("free_delivery_threshold_paise", 50000))

    if standard_delivery > 0:
        if free_threshold > 0 and subtotal_paise >= free_threshold:
            delivery_charge_paise = 0
        else:
            delivery_charge_paise = standard_delivery
    else:
        delivery_charge_paise = 0

    # Dynamic tax calculation
    tax_percent = float(rules.get("tax_percent", 0.0))
    taxable_amount = max(0, subtotal_paise - discount_paise)
    tax_paise = int(round(taxable_amount * (tax_percent / 100.0))) if tax_percent > 0 else 0

    final_payable_paise = max(0, subtotal_paise - discount_paise + delivery_charge_paise + tax_paise)

    # 7. Generate Unique Order Number with retry loop
    order_number = None
    for _ in range(5):
        candidate_num = generate_order_number()
        exists = await db.orders.find_one({"order_number": candidate_num})
        if not exists:
            order_number = candidate_num
            break

    if not order_number:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate unique order number. Please retry.",
        )

    now = datetime.now(timezone.utc)
    initial_status = OrderStatus.PENDING_PAYMENT
    initial_payment = PaymentStatus.NOT_STARTED

    history_entry = {
        "status": initial_status.value,
        "previous_status": None,
        "changed_by": user.get("email", "customer"),
        "changed_at": now,
        "notes": "Order placed by customer (pending payment)",
    }

    # 8. Persist Order in MongoDB with immutable business config snapshot
    order_doc = {
        "order_number": order_number,
        "user_id": user_id,
        "customer_name": req.delivery_address.full_name.strip(),
        "customer_email": user.get("email"),
        "customer_mobile": user.get("mobile") or req.delivery_address.phone.strip(),
        "is_member": is_member,
        "items": snapshots,
        "subtotal_paise": subtotal_paise,
        "discount_paise": discount_paise,
        "coupon_code": applied_coupon_code,
        "delivery_charge_paise": delivery_charge_paise,
        "tax_paise": tax_paise,
        "final_payable_paise": final_payable_paise,
        "business_config_snapshot": {
            "standard_delivery_charge_paise": standard_delivery,
            "free_delivery_threshold_paise": free_threshold,
            "default_member_discount_percent": default_member_discount_pct,
            "tax_percent": tax_percent,
            "min_order_value_paise": min_order_value_paise,
            "max_items_per_order": max_items,
            "applied_at": now.isoformat(),
        },
        "delivery_address": req.delivery_address.model_dump(),
        "order_status": initial_status.value,
        "payment_status": initial_payment.value,
        "status_history": [history_entry],
        "created_at": now,
        "updated_at": now,
    }
    if clean_idempotency_key:
        order_doc["idempotency_key"] = clean_idempotency_key

    insert_result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = insert_result.inserted_id

    if reservation_id:
        await db.cookey_reservations.update_one(
            {"_id": reservation_id},
            {"$set": {"status": "COMMITTED", "order_number": order_number}}
        )

    return serialize_order_doc(order_doc)


async def update_order_status(order_id_or_num: str, req: OrderStatusUpdateRequest, admin_user: dict) -> dict:
    """Update order status with state machine validation and append to audit history."""
    oid = _to_object_id(order_id_or_num)
    query = {"$or": [{"order_number": order_id_or_num}]}
    if oid:
        query["$or"].append({"_id": oid})

    order = await db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order '{order_id_or_num}' not found")

    try:
        current_status = OrderStatus(order.get("order_status", OrderStatus.PENDING_PAYMENT.value))
    except ValueError:
        current_status = OrderStatus.PENDING_PAYMENT

    target_status = req.status
    if current_status == target_status:
        return serialize_order_doc(order)

    valid_targets = VALID_ORDER_TRANSITIONS.get(current_status, [])
    if target_status not in valid_targets:
        valid_targets_str = ", ".join(t.value for t in valid_targets) if valid_targets else "None (terminal state)"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid order status transition from '{current_status.value}' to '{target_status.value}'. Allowed transitions: [{valid_targets_str}]",
        )

    now = datetime.now(timezone.utc)
    admin_email = admin_user.get("email", "admin")

    history_entry = {
        "status": target_status.value,
        "previous_status": current_status.value,
        "changed_by": admin_email,
        "changed_at": now,
        "notes": req.notes.strip() if req.notes else f"Status changed to {target_status.value} by {admin_email}",
    }

    updated = await db.orders.find_one_and_update(
        {"_id": order["_id"]},
        {
            "$set": {
                "order_status": target_status.value,
                "updated_at": now,
                "updated_by": admin_email,
            },
            "$push": {
                "status_history": history_entry
            },
        },
        return_document=True,
    )

    if target_status in (OrderStatus.CANCELLED, OrderStatus.REFUNDED):
        await db.cookey_reservations.update_many(
            {"order_number": order.get("order_number")},
            {"$set": {"status": target_status.value, "released_at": now}}
        )

    return serialize_order_doc(updated)


async def update_order_tracking(order_id_or_num: str, tracking: ShipmentTrackingSchema, admin_user: dict) -> dict:
    """Update shipment tracking and transition order to SHIPPED if currently PROCESSING or PACKED."""
    oid = _to_object_id(order_id_or_num)
    query = {"$or": [{"order_number": order_id_or_num}]}
    if oid:
        query["$or"].append({"_id": oid})

    order = await db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order '{order_id_or_num}' not found")

    now = datetime.now(timezone.utc)
    admin_email = admin_user.get("email", "admin")
    tracking_data = tracking.model_dump()
    if not tracking_data.get("shipped_at"):
        tracking_data["shipped_at"] = now

    current_status = order.get("order_status")
    target_status = OrderStatus.SHIPPED.value if current_status in [
        OrderStatus.PROCESSING.value,
        OrderStatus.PACKED.value,
        OrderStatus.CONFIRMED.value,
    ] else current_status

    history_entry = {
        "status": target_status,
        "previous_status": current_status,
        "changed_by": admin_email,
        "changed_at": now,
        "notes": f"Tracking updated: {tracking.carrier} #{tracking.tracking_number}",
    }

    updated = await db.orders.find_one_and_update(
        {"_id": order["_id"]},
        {
            "$set": {
                "tracking": tracking_data,
                "order_status": target_status,
                "updated_at": now,
                "updated_by": admin_email,
            },
            "$push": {"status_history": history_entry},
        },
        return_document=True,
    )
    return serialize_order_doc(updated)
