from datetime import datetime, timezone
from app.core.security import hash_password


async def seed_partners(db) -> dict:
    """Seed verified offline partners and partner user accounts (idempotent)."""
    now = datetime.now(timezone.utc)
    partners_data = [
        {
            "name": "Delhi Sports Dormitory",
            "type": "DORMITORY",
            "city": "Delhi",
            "address": "Near JLN Stadium, New Delhi",
            "discount_percent": 15,
            "verified": True,
            "active": True,
            "images": ["/images/partners/dorm-delhi-1.jpg"],
            "created_at": now,
        },
        {
            "name": "Mumbai Athlete Stay",
            "type": "DORMITORY",
            "city": "Mumbai",
            "address": "Andheri West, Mumbai",
            "discount_percent": 12,
            "verified": True,
            "active": True,
            "images": ["/images/partners/dorm-mumbai-1.jpg"],
            "created_at": now,
        },
        {
            "name": "Bangalore Student Hostel",
            "type": "DORMITORY",
            "city": "Bangalore",
            "address": "Koramangala, Bangalore",
            "discount_percent": 10,
            "verified": True,
            "active": True,
            "images": ["/images/partners/dorm-bangalore-1.jpg"],
            "created_at": now,
        },
        {
            "name": "Pune Exam Stay",
            "type": "DORMITORY",
            "city": "Pune",
            "address": "FC Road, Pune",
            "discount_percent": 10,
            "verified": True,
            "active": True,
            "images": ["/images/partners/dorm-pune-1.jpg"],
            "created_at": now,
        },
        {
            "name": "Delhi Sports Physio Clinic",
            "type": "PHYSIO",
            "city": "Delhi",
            "address": "Connaught Place, New Delhi",
            "discount_percent": 20,
            "verified": True,
            "active": True,
            "images": ["/images/partners/physio-delhi-1.jpg"],
            "created_at": now,
        },
        {
            "name": "Mumbai Rehab Center",
            "type": "PHYSIO",
            "city": "Mumbai",
            "address": "Bandra, Mumbai",
            "discount_percent": 18,
            "verified": True,
            "active": True,
            "images": ["/images/partners/physio-mumbai-1.jpg"],
            "created_at": now,
        },
    ]

    seeded = 0
    skipped = 0
    for partner in partners_data:
        existing = await db.partners.find_one({"name": partner["name"]})
        if existing:
            print(f"[SKIP] Partner '{partner['name']}' already exists.")
            skipped += 1
        else:
            await db.partners.insert_one(partner)
            print(f"[SEED] Inserted partner '{partner['name']}' ({partner['type']} in {partner['city']})")
            seeded += 1

    # Seed default partner login accounts into partner_users
    physio_partner = await db.partners.find_one({"name": "Delhi Sports Physio Clinic"})
    dorm_partner = await db.partners.find_one({"name": "Delhi Sports Dormitory"})

    partner_users_data = [
        {
            "email": "partner@apexphysio.in",
            "password_hash": hash_password("Partner@123"),
            "full_name": "Dr. Aryan Mehta",
            "role": "PARTNER",
            "partner_id": str(physio_partner["_id"]) if physio_partner else "",
            "is_active": True,
            "created_at": now,
        },
        {
            "email": "partner@dormitory.in",
            "password_hash": hash_password("Partner@123"),
            "full_name": "Delhi Dormitory Host",
            "role": "PARTNER",
            "partner_id": str(dorm_partner["_id"]) if dorm_partner else "",
            "is_active": True,
            "created_at": now,
        },
    ]

    for pu in partner_users_data:
        existing_pu = await db.partner_users.find_one({"email": pu["email"]})
        if existing_pu:
            print(f"[SKIP] Partner user '{pu['email']}' already exists.")
            skipped += 1
        else:
            await db.partner_users.insert_one(pu)
            print(f"[SEED] Created default partner user: {pu['email']} / Partner@123")
            seeded += 1

    return {"seeded": seeded, "skipped": skipped}
