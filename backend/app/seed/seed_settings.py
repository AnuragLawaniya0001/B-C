from datetime import datetime


async def seed_settings(db) -> dict:
    """Seed default global settings, membership policies, and business rules (idempotent)."""
    now = datetime.utcnow()
    settings_data = [
        {
            "key": "business_rules",
            "value": {
                "card_fee_paise": 10000,
                "card_validity_days": 334,
                "joining_cashback_percent": 10,
                "cookey_price_paise": 10000,
                "cookey_cooldown_days": 7,
                "cookey_max_per_week": 1,
                "army_extra_discount_percent": 10,
                "lucky_draw_prize_paise": 50000,
                "lucky_draw_frequency": "weekly",
            },
            "updated_at": now,
        },
        {
            "key": "membership_policy",
            "value": {
                "general_shopping_requires_membership": False,
                "cookey_requires_membership": True,
                "dormitory_booking_requires_membership": True,
                "physio_booking_requires_membership": True,
                "wallet_requires_membership": True,
                "army_discount_requires_membership": True,
                "lucky_draw_requires_membership": True,
                "guest_checkout_allowed": False,
            },
            "updated_at": now,
        },
        {
            "key": "site_contact",
            "value": {
                "email": "support@bigchamp.in",
                "phone": "+91 9000000000",
                "address": "Bigchamp HQ, New Delhi, India",
                "working_hours": "Mon-Sat, 10 AM to 7 PM",
            },
            "updated_at": now,
        },
        {
            "key": "social_links",
            "value": {
                "instagram": "https://instagram.com/bigchamp",
                "youtube": "https://youtube.com/@bigchamp",
                "facebook": "https://facebook.com/bigchamp",
                "twitter": "https://twitter.com/bigchamp",
            },
            "updated_at": now,
        },
        {
            "key": "feature_flags",
            "value": {
                "cookey_enabled": True,
                "army_offer_enabled": True,
                "maintenance_mode": False,
                "booking_enabled": False,
                "lucky_draw_enabled": True,
            },
            "updated_at": now,
        },
        {
            "key": "default_language",
            "value": {
                "code": "en",
                "name": "English",
                "available_languages": [
                    {"code": "en", "name": "English"},
                    {"code": "hi", "name": "हिन्दी"},
                ],
            },
            "updated_at": now,
        },
        {
            "key": "seo_defaults",
            "value": {
                "title": "Bigchamp — Sports, Student & Defense Ecosystem",
                "description": "India's first ecosystem for athletes, students & defense personnel. Get your ₹100 digital membership card today.",
                "og_image": "/images/og-default.jpg",
                "keywords": ["sports", "membership", "dormitory", "physio", "army"],
            },
            "updated_at": now,
        },
    ]

    seeded = 0
    skipped = 0
    for item in settings_data:
        key = item["key"]
        existing = await db.settings.find_one({"key": key})
        if existing:
            print(f"[SKIP] Setting '{key}' already exists.")
            skipped += 1
        else:
            await db.settings.insert_one(item)
            print(f"[SEED] Inserted setting '{key}'")
            seeded += 1

    return {"seeded": seeded, "skipped": skipped}
