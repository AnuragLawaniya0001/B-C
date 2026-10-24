"""OTP generation and verification service."""
import random
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.core.database import get_db

OTP_TTL_SECONDS = 300  # 5 minutes
MAX_ATTEMPTS = 5


def _ensure_utc(dt: datetime) -> datetime:
    """Ensure datetime object is timezone-aware in UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def generate_and_store_otp(identifier: str, purpose: str) -> str:
    """Generates a 6-digit OTP, stores in otp_store collection.
    Deletes any previous unused OTPs for same identifier+purpose.
    Returns the OTP.
    """
    db = get_db()
    otp = str(random.randint(100000, 999999))
    now = datetime.now(timezone.utc)

    # Invalidate previous unused OTPs for the same identifier and purpose
    await db.otp_store.delete_many({
        "identifier": identifier,
        "purpose": purpose,
        "used": False,
    })

    await db.otp_store.insert_one({
        "identifier": identifier,
        "otp": otp,
        "purpose": purpose,
        "attempts": 0,
        "used": False,
        "created_at": now,
        "expires_at": now + timedelta(seconds=OTP_TTL_SECONDS),
    })

    if settings.ENV == "development":
        print(f"[OTP] Identifier: {identifier}, Purpose: {purpose}, Code: {otp}")

    return otp


async def verify_otp(identifier: str, otp: str, purpose: str) -> bool:
    """Returns True if OTP matches & is valid.
    Increments attempts on mismatch.
    Marks OTP used after successful verification.
    Raises ValueError with reason if invalid.
    """
    db = get_db()
    record = await db.otp_store.find_one({
        "identifier": identifier,
        "purpose": purpose,
        "used": False,
    })

    if not record:
        raise ValueError("No OTP found. Request a new one.")

    expires_at = _ensure_utc(record["expires_at"])
    now = datetime.now(timezone.utc)

    if expires_at < now:
        raise ValueError("OTP expired")

    if record.get("attempts", 0) >= MAX_ATTEMPTS:
        raise ValueError("Too many attempts. Request new OTP.")

    if record["otp"] != otp:
        await db.otp_store.update_one(
            {"_id": record["_id"]},
            {"$inc": {"attempts": 1}},
        )
        remaining = MAX_ATTEMPTS - record.get("attempts", 0) - 1
        raise ValueError(f"Invalid OTP. {remaining} attempts left.")

    await db.otp_store.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "used": True,
                "verified_at": now,
            }
        },
    )
    return True
