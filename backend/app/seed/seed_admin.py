from datetime import datetime
from app.core.security import hash_password


async def seed_admin(db) -> dict:
    """Seed default super administrator account (idempotent)."""
    email = "admin@bigchamp.in"
    existing = await db.admins.find_one({"email": email})
    if existing:
        print(f"[SKIP] Admin '{email}' already exists.")
        return {"seeded": 0, "skipped": 1}

    admin_doc = {
        "email": email,
        "password_hash": hash_password("Admin@123"),
        "name": "Super Admin",
        "role": "SUPER_ADMIN",
        "active": True,
        "created_at": datetime.utcnow(),
    }
    await db.admins.insert_one(admin_doc)
    print(f"[SEED] Created default admin: {email} / Admin@123")
    return {"seeded": 1, "skipped": 0}
