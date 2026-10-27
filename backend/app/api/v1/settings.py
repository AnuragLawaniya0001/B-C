from fastapi import APIRouter
from app.core.database import db

router = APIRouter(prefix="/settings", tags=["settings"])

WHITELISTED_PUBLIC_KEYS = [
    "membership_settings",
    "business_rules",
    "membership_policy",
    "site_contact",
    "social_links",
    "feature_flags",
    "default_language",
    "seo_defaults",
]


@router.get("/public")
async def get_public_settings():
    """Return safe public platform settings for customer and partner frontends."""
    cursor = db.settings.find({"key": {"$in": WHITELISTED_PUBLIC_KEYS}})
    settings_dict = {}
    async for doc in cursor:
        settings_dict[doc["key"]] = doc.get("value")

    # Guarantee all whitelisted keys exist in return object (None if not seeded)
    for key in WHITELISTED_PUBLIC_KEYS:
        if key not in settings_dict:
            settings_dict[key] = None

    if settings_dict.get("business_rules"):
        from app.services.settings_service import DEFAULT_BUSINESS_RULES
        settings_dict["business_rules"] = {**DEFAULT_BUSINESS_RULES, **settings_dict["business_rules"]}
    elif settings_dict.get("business_rules") is None:
        from app.services.settings_service import DEFAULT_BUSINESS_RULES
        settings_dict["business_rules"] = dict(DEFAULT_BUSINESS_RULES)

    return settings_dict
