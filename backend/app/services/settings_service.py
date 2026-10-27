from datetime import datetime
from typing import Optional, Dict, Any
from app.core.database import db

# Default fallback if database has not been seeded yet
DEFAULT_BUSINESS_RULES: Dict[str, Any] = {
    "card_fee_paise": 10000,
    "card_validity_days": 334,
    "joining_cashback_percent": 10,
    "cookey_price_paise": 10000,
    "cookey_cooldown_days": 7,
    "cookey_max_per_week": 1,
    "army_extra_discount_percent": 10,
    "lucky_draw_prize_paise": 50000,
    "lucky_draw_frequency": "weekly",
    "standard_delivery_charge_paise": 0,
    "free_delivery_threshold_paise": 50000,
    "default_member_discount_percent": 10.0,
    "min_order_value_paise": 0,
    "max_items_per_order": 50,
    "partner_default_commission_percent": 15.0,
    "tax_percent": 0.0,
}

DEFAULT_MEMBERSHIP_POLICY: Dict[str, Any] = {
    "general_shopping_requires_membership": False,
    "cookey_requires_membership": True,
    "dormitory_booking_requires_membership": True,
    "physio_booking_requires_membership": True,
    "wallet_requires_membership": True,
    "army_discount_requires_membership": True,
    "lucky_draw_requires_membership": True,
    "guest_checkout_allowed": False,
}


async def get_setting(key: str) -> Optional[Dict[str, Any]]:
    """Retrieve setting document value by unique key."""
    doc = await db.settings.find_one({"key": key})
    if doc and "value" in doc:
        return doc["value"]
    return None


async def get_business_rules() -> Dict[str, Any]:
    """Retrieve active business rules configuration from settings collection."""
    rules = await get_setting("business_rules")
    if rules:
        return {**DEFAULT_BUSINESS_RULES, **rules}
    return dict(DEFAULT_BUSINESS_RULES)


async def get_membership_policy() -> Dict[str, Any]:
    """Returns membership_policy dict. Falls back to safe defaults if missing."""
    policy = await get_setting("membership_policy")
    if policy:
        return policy
    return DEFAULT_MEMBERSHIP_POLICY


async def get_dynamic_membership_settings() -> Dict[str, Any]:
    """Retrieve dynamic membership configuration settings."""
    from app.services.membership_service import get_membership_settings
    settings_obj = await get_membership_settings()
    return settings_obj.model_dump()


async def update_setting(key: str, value: Dict[str, Any], admin_id: Optional[str] = None) -> bool:
    """Update or upsert a setting entry in the settings collection."""
    now = datetime.utcnow()
    update_data: Dict[str, Any] = {
        "key": key,
        "value": value,
        "updated_at": now,
    }
    if admin_id:
        update_data["updated_by"] = admin_id

    result = await db.settings.update_one(
        {"key": key},
        {"$set": update_data},
        upsert=True,
    )
    return result.acknowledged
