from datetime import datetime, timedelta


async def seed_banners(db) -> dict:
    """Seed promotional banners for homepage and promotional slots (idempotent)."""
    now = datetime.utcnow()
    end_date = now + timedelta(days=30)

    banners_data = [
        {
            "title": "Cookey — Members Only ₹100",
            "image_url": "/images/banners/cookey.jpg",
            "link": "/cookey",
            "position": "homepage_top",
            "start_date": now,
            "end_date": end_date,
            "active": True,
            "order": 1,
            "created_at": now,
        },
        {
            "title": "Army Personnel — Extra 10% Off",
            "image_url": "/images/banners/army.jpg",
            "link": "/army-offer",
            "position": "homepage_top",
            "start_date": now,
            "end_date": end_date,
            "active": True,
            "order": 2,
            "created_at": now,
        },
        {
            "title": "Get ₹100 Sports Gear Voucher",
            "image_url": "/images/banners/gear.jpg",
            "link": "/store",
            "position": "homepage_middle",
            "start_date": now,
            "end_date": end_date,
            "active": True,
            "order": 1,
            "created_at": now,
        },
    ]

    seeded = 0
    skipped = 0
    for banner in banners_data:
        existing = await db.banners.find_one({
            "title": banner["title"],
            "position": banner["position"]
        })
        if existing:
            print(f"[SKIP] Banner '{banner['title']}' ({banner['position']}) already exists.")
            skipped += 1
        else:
            await db.banners.insert_one(banner)
            print(f"[SEED] Inserted banner '{banner['title']}'")
            seeded += 1

    return {"seeded": seeded, "skipped": skipped}
