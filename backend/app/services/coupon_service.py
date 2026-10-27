"""Authoritative backend discount calculation and coupon validation service."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


def _parse_datetime(val) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=timezone.utc) if val.tzinfo is None else val
    if isinstance(val, str):
        try:
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
        except Exception:
            return None
    return None


def compute_coupon_status(coupon: dict) -> str:
    """Compute live dynamic status: ACTIVE, SCHEDULED, EXPIRED, or INACTIVE."""
    if not coupon.get("active", True):
        return "INACTIVE"

    now = datetime.now(timezone.utc)
    start_date = _parse_datetime(coupon.get("start_date"))
    end_date = _parse_datetime(coupon.get("end_date"))

    if start_date and now < start_date:
        return "SCHEDULED"
    if end_date and now > end_date:
        return "EXPIRED"

    total_limit = coupon.get("total_usage_limit")
    times_used = coupon.get("times_used", 0)
    if total_limit is not None and times_used >= total_limit:
        return "EXPIRED"

    return "ACTIVE"


def validate_and_calculate_coupon_discount(
    coupon: dict,
    items: List[Dict[str, Any]],
    client_subtotal_paise: Optional[int] = 0,
) -> Tuple[bool, int, int, str, Optional[str]]:
    """Authoritatively validate coupon rules and calculate exact discount in paise.
    Returns: (is_valid, discount_paise, final_total_paise, message, reason_code)
    """
    safe_client_subtotal = max(0, client_subtotal_paise or 0)

    if not coupon:
        return False, 0, safe_client_subtotal, "Coupon code not found", "NOT_FOUND"

    status = compute_coupon_status(coupon)
    if status == "INACTIVE":
        return False, 0, safe_client_subtotal, "This coupon is currently inactive", "INACTIVE"
    if status == "SCHEDULED":
        start_dt = _parse_datetime(coupon.get("start_date"))
        start_str = start_dt.strftime("%d %b %Y") if hasattr(start_dt, "strftime") else "soon"
        return False, 0, safe_client_subtotal, f"This offer starts on {start_str}", "SCHEDULED"
    if status == "EXPIRED":
        return False, 0, safe_client_subtotal, "This coupon code has expired", "EXPIRED"

    # Check total usage limit
    total_limit = coupon.get("total_usage_limit")
    times_used = coupon.get("times_used", 0)
    if total_limit is not None and times_used >= total_limit:
        return False, 0, safe_client_subtotal, "Maximum global usage limit reached for this coupon", "LIMIT_EXCEEDED"

    # Authoritative subtotal calculation
    if items:
        computed_subtotal = sum(int(item.get("price_paise", 0)) * int(item.get("qty", 1)) for item in items)
    else:
        computed_subtotal = safe_client_subtotal

    # Minimum order value check
    min_order_paise = coupon.get("min_order_paise", 0) or 0
    if computed_subtotal < min_order_paise:
        min_rupees = min_order_paise / 100
        return (
            False,
            0,
            computed_subtotal,
            f"Minimum order of ₹{min_rupees:,.2f} required to apply coupon {coupon.get('code')}",
            "MIN_ORDER_NOT_MET",
        )

    # Eligible items filtering
    applicable_categories = [c.upper() for c in (coupon.get("applicable_categories") or [])]
    applicable_product_ids = [str(pid) for pid in (coupon.get("applicable_product_ids") or [])]

    if items and (applicable_categories or applicable_product_ids):
        eligible_items = []
        for item in items:
            cat = str(item.get("category", "")).upper()
            pid = str(item.get("product_id", ""))

            cat_match = not applicable_categories or cat in applicable_categories
            prod_match = not applicable_product_ids or pid in applicable_product_ids

            if cat_match and prod_match:
                eligible_items.append(item)

        if not eligible_items:
            cat_list = ", ".join(applicable_categories) if applicable_categories else "selected items"
            return (
                False,
                0,
                computed_subtotal,
                f"Coupon {coupon.get('code')} is only valid on: {cat_list}",
                "NO_ELIGIBLE_ITEMS",
            )

        eligible_subtotal = sum(int(item.get("price_paise", 0)) * int(item.get("qty", 1)) for item in eligible_items)
    else:
        eligible_subtotal = computed_subtotal

    # Calculate discount amount
    discount_type = coupon.get("discount_type", "PERCENTAGE")
    discount_val = float(coupon.get("discount_value", 0))

    if discount_type == "PERCENTAGE":
        raw_discount = int(eligible_subtotal * (discount_val / 100.0))
        max_discount_paise = coupon.get("max_discount_paise")
        if max_discount_paise is not None and max_discount_paise > 0:
            discount_paise = min(raw_discount, max_discount_paise)
        else:
            discount_paise = raw_discount
    else:  # FIXED_AMOUNT
        discount_paise = min(int(discount_val), eligible_subtotal)

    discount_paise = max(0, min(discount_paise, computed_subtotal))
    final_total_paise = max(0, computed_subtotal - discount_paise)

    return True, discount_paise, final_total_paise, f"Coupon {coupon.get('code')} applied successfully!", None
