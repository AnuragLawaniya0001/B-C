"""Core business logic service for authentication, registration, tokens, and profiles."""
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
from bson import ObjectId

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.schemas.auth_schema import RegisterRequest, UpdateProfileRequest, ResetPasswordRequest
from app.services.otp_service import generate_and_store_otp, verify_otp, _ensure_utc
from app.utils.response import (
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)


def _to_object_id(id_str: str):
    """Safely convert string to ObjectId if valid, else return raw string."""
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str


async def check_user_membership(user_id: str) -> bool:
    """Check if user has an active membership record in memberships collection."""
    db = get_db()
    obj_id = _to_object_id(user_id)
    now = datetime.now(timezone.utc)
    membership = await db.memberships.find_one({
        "$or": [{"user_id": str(user_id)}, {"user_id": obj_id}],
        "is_active": True,
    })
    if not membership:
        return False
    valid_till = membership.get("valid_till")
    if valid_till:
        if isinstance(valid_till, datetime):
            if valid_till.tzinfo is None:
                valid_till = valid_till.replace(tzinfo=timezone.utc)
            if now > valid_till:
                return False
    return True


def _format_user_doc(doc: dict, has_membership: bool = False) -> dict:
    """Format MongoDB user document for responses, converting _id to id string."""
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", ""))
    doc.pop("password_hash", None)
    doc["has_membership"] = has_membership
    return doc


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Retrieve user by ID from users collection."""
    db = get_db()
    obj_id = _to_object_id(user_id)
    doc = await db.users.find_one({"$or": [{"_id": obj_id}, {"_id": user_id}]})
    if doc:
        has_membership = await check_user_membership(user_id)
        doc["has_membership"] = has_membership
    return doc


async def get_admin_by_id(admin_id: str) -> Optional[dict]:
    """Retrieve administrator by ID from admins collection."""
    db = get_db()
    obj_id = _to_object_id(admin_id)
    doc = await db.admins.find_one({"$or": [{"_id": obj_id}, {"_id": admin_id}]})
    return doc


async def get_partner_user_by_id(partner_user_id: str) -> Optional[dict]:
    """Retrieve partner user by ID from partner_users or partners collection."""
    db = get_db()
    obj_id = _to_object_id(partner_user_id)
    doc = await db.partner_users.find_one({"$or": [{"_id": obj_id}, {"_id": partner_user_id}]})
    if not doc:
        doc = await db.partners.find_one({"$or": [{"_id": obj_id}, {"_id": partner_user_id}]})
    return doc


async def send_otp(identifier: str, purpose: str) -> dict:
    """Send an OTP code for registration, login, or password reset.
    Validates user existence based on purpose:
    - REGISTER: user must NOT already exist
    - LOGIN / RESET_PASSWORD: user MUST exist
    """
    db = get_db()
    identifier = identifier.strip()

    # Query for existing user matching identifier as email or mobile
    existing_user = await db.users.find_one({
        "$or": [{"email": identifier}, {"mobile": identifier}]
    })

    if purpose == "REGISTER":
        if existing_user:
            raise ValidationError("User already registered with this identifier")
    elif purpose in ("LOGIN", "RESET_PASSWORD"):
        if not existing_user:
            raise NotFoundError("No account found with this identifier")
    else:
        raise ValidationError(f"Invalid OTP purpose: {purpose}")

    otp = await generate_and_store_otp(identifier, purpose)

    response = {
        "message": f"OTP sent successfully to {identifier}",
        "expires_in_seconds": 300,
    }

    if settings.ENV == "development":
        response["mock_otp"] = otp
        response["dev_otp"] = otp

    return response


async def register_user(payload: RegisterRequest) -> dict:
    """Register a new customer account (Free User).
    Flow:
    1. Verify identifier was OTP-verified within last 10 minutes
    2. Check email / mobile not already taken
    3. Hash password
    4. Insert user document
    5. NOTE: Free users do NOT get a wallet created upon registration.
       Wallet is created only upon membership card purchase (Prompt #6).
    6. Return tokens + user profile + has_membership: False
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    ten_minutes_ago = now - timedelta(minutes=10)

    # 1. Verify OTP record in otp_store was verified within last 10 min
    otp_record = await db.otp_store.find_one({
        "identifier": payload.identifier,
        "purpose": "REGISTER",
        "used": True,
    }, sort=[("created_at", -1)])

    if not otp_record:
        raise ValidationError("Please verify your email/mobile with OTP first.")

    # Check verification / creation time within last 10 min
    record_time = _ensure_utc(otp_record.get("verified_at") or otp_record.get("created_at", now))
    if record_time < ten_minutes_ago:
        raise ValidationError("OTP verification expired. Please verify OTP again.")

    # 2. Determine and validate email and mobile
    email = payload.email
    mobile = payload.mobile

    if not email and "@" in payload.identifier:
        email = payload.identifier
    if not mobile and "@" not in payload.identifier:
        mobile = payload.identifier

    if email:
        existing_email = await db.users.find_one({"email": email})
        if existing_email:
            raise ValidationError("Email already registered")

    if mobile:
        existing_mobile = await db.users.find_one({"mobile": mobile})
        if existing_mobile:
            raise ValidationError("Mobile number already registered")

    # 3. Hash password
    password_hash = hash_password(payload.password)

    # 4. Generate user referral code and validate referring code if present
    my_referral_code = f"BC{uuid.uuid4().hex[:6].upper()}"
    referrer = None
    referred_by_code = None
    referred_by_user_id = None

    if payload.referral_code:
        clean_ref = payload.referral_code.strip().upper()
        # Find referrer
        ref_user = await db.users.find_one({"referral_code": clean_ref})
        if ref_user and str(ref_user.get("_id")) != "":
            # Anti-self referral (matching email or mobile)
            if (email and ref_user.get("email") == email) or (mobile and ref_user.get("mobile") == mobile):
                pass
            else:
                referrer = ref_user
                referred_by_code = clean_ref
                referred_by_user_id = str(ref_user["_id"])

    # 5. Insert user document
    user_doc = {
        "email": email,
        "mobile": mobile,
        "full_name": payload.full_name,
        "password_hash": password_hash,
        "role": "USER",
        "referral_code": my_referral_code,
        "referred_by_code": referred_by_code,
        "referred_by_user_id": referred_by_user_id,
        "kyc_status": "NOT_SUBMITTED",
        "is_army": False,
        "army_verified": False,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # 6. Record pending referral attribution if referrer exists
    if referrer and referred_by_user_id:
        await db.referrals.insert_one({
            "referrer_user_id": referred_by_user_id,
            "referrer_name": referrer.get("full_name", ""),
            "referee_user_id": user_id,
            "referee_name": payload.full_name,
            "referral_code": referred_by_code,
            "status": "PENDING",
            "reward_amount_paise": 5000,
            "qualifying_order_number": None,
            "created_at": now,
            "rewarded_at": None,
        })

    # 7. Generate tokens and return (has_membership: false for free user)
    access_token = create_access_token({"sub": user_id, "role": "USER"})
    refresh_token = create_refresh_token({"sub": user_id, "role": "USER"})
    print(f"Token issued for user {user_id}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "has_membership": False,
        "user": {
            "id": user_id,
            "email": email,
            "mobile": mobile,
            "full_name": payload.full_name,
            "role": "USER",
            "referral_code": my_referral_code,
            "kyc_status": "NOT_SUBMITTED",
            "is_army": False,
            "army_verified": False,
            "is_active": True,
            "has_membership": False,
            "created_at": now,
        },
    }


async def login(identifier: str, password: str) -> dict:
    """Authenticate user with identifier and password."""
    db = get_db()
    identifier = identifier.strip()

    user = await db.users.find_one({
        "$or": [{"email": identifier}, {"mobile": identifier}]
    })

    if not user:
        raise UnauthorizedError("Invalid credentials")

    if not user.get("is_active", True):
        raise ForbiddenError("Account is suspended")

    if not verify_password(password, user.get("password_hash", "")):
        raise UnauthorizedError("Invalid credentials")

    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": now, "updated_at": now}},
    )

    user_id = str(user["_id"])
    has_membership = await check_user_membership(user_id)

    access_token = create_access_token({"sub": user_id, "role": "USER"})
    refresh_token = create_refresh_token({"sub": user_id, "role": "USER"})
    print(f"Token issued for user {user_id}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "has_membership": has_membership,
        "user": {
            "id": user_id,
            "email": user.get("email"),
            "mobile": user.get("mobile"),
            "full_name": user.get("full_name"),
            "role": user.get("role", "USER"),
            "kyc_status": user.get("kyc_status", "NOT_SUBMITTED"),
            "is_army": user.get("is_army", False),
            "army_verified": user.get("army_verified", False),
            "is_active": user.get("is_active", True),
            "has_membership": has_membership,
            "created_at": user.get("created_at"),
            "last_login_at": now,
        },
    }


async def refresh_access_token(refresh_token: str) -> dict:
    """Refresh access token using a valid refresh token."""
    try:
        payload = decode_token(refresh_token)
    except Exception:
        raise UnauthorizedError("Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid token type")

    sub = payload.get("sub")
    role = payload.get("role", "USER")

    if not sub:
        raise UnauthorizedError("Invalid token subject")

    has_membership = False
    if role in ("ADMIN", "SUPER_ADMIN"):
        account = await get_admin_by_id(sub)
        is_active = account.get("active", account.get("is_active", True)) if account else False
    elif role == "PARTNER":
        account = await get_partner_user_by_id(sub)
        is_active = account.get("is_active", account.get("active", True)) if account else False
    else:
        account = await get_user_by_id(sub)
        is_active = account.get("is_active", True) if account else False
        has_membership = await check_user_membership(sub)

    if not account:
        raise UnauthorizedError("User not found")

    if not is_active:
        raise ForbiddenError("Account is suspended")

    token_data = {"sub": sub, "role": role}
    if "partner_id" in payload:
        token_data["partner_id"] = payload["partner_id"]

    new_access_token = create_access_token(token_data)
    print(f"Token issued for user {sub}")

    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "has_membership": has_membership,
    }


async def admin_login(email: str, password: str) -> dict:
    """Authenticate administrator from admins collection."""
    db = get_db()
    email = email.strip()

    admin = await db.admins.find_one({"email": email})
    if not admin:
        raise UnauthorizedError("Invalid credentials")

    is_active = admin.get("active", admin.get("is_active", True))
    if not is_active:
        raise ForbiddenError("Account is suspended")

    if not verify_password(password, admin.get("password_hash", "")):
        raise UnauthorizedError("Invalid credentials")

    now = datetime.now(timezone.utc)
    await db.admins.update_one(
        {"_id": admin["_id"]},
        {"$set": {"last_login_at": now, "updated_at": now}},
    )

    admin_id = str(admin["_id"])
    access_token = create_access_token({"sub": admin_id, "role": "ADMIN"})
    refresh_token = create_refresh_token({"sub": admin_id, "role": "ADMIN"})
    print(f"Token issued for user {admin_id}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "has_membership": None,
        "user": {
            "id": admin_id,
            "email": admin.get("email"),
            "full_name": admin.get("name") or admin.get("full_name", "Admin"),
            "role": "ADMIN",
            "is_active": is_active,
            "created_at": admin.get("created_at"),
        },
    }


async def partner_login(email: str, password: str) -> dict:
    """Authenticate partner user from partner_users collection."""
    db = get_db()
    email = email.strip()

    partner_user = await db.partner_users.find_one({"email": email})
    if not partner_user:
        partner_doc = await db.partners.find_one({"email": email})
        if partner_doc and partner_doc.get("password"):
            is_active = partner_doc.get("status") in ("APPROVED", "ACTIVE")
            if not is_active:
                raise ForbiddenError("Partner account is pending approval or suspended")
            if not verify_password(password, partner_doc.get("password")):
                raise UnauthorizedError("Invalid credentials")
            pu_id = str(partner_doc["_id"])
            now = datetime.now(timezone.utc)
            await db.partners.update_one({"_id": partner_doc["_id"]}, {"$set": {"last_login_at": now}})
            access_token = create_access_token({"sub": pu_id, "role": "PARTNER", "partner_id": pu_id})
            refresh_token = create_refresh_token({"sub": pu_id, "role": "PARTNER", "partner_id": pu_id})
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "has_membership": None,
                "user": {
                    "id": pu_id,
                    "email": partner_doc.get("email"),
                    "full_name": partner_doc.get("contact_person") or partner_doc.get("business_name", "Partner User"),
                    "role": "PARTNER",
                    "partner_id": pu_id,
                    "is_active": is_active,
                    "created_at": partner_doc.get("created_at"),
                },
            }
        raise UnauthorizedError("Invalid credentials")

    is_active = partner_user.get("is_active", partner_user.get("active", True))
    if not is_active:
        raise ForbiddenError("Account is suspended")

    if not verify_password(password, partner_user.get("password_hash", "")):
        raise UnauthorizedError("Invalid credentials")

    now = datetime.now(timezone.utc)
    await db.partner_users.update_one(
        {"_id": partner_user["_id"]},
        {"$set": {"last_login_at": now, "updated_at": now}},
    )

    pu_id = str(partner_user["_id"])
    partner_id = str(partner_user.get("partner_id", ""))

    access_token = create_access_token({"sub": pu_id, "role": "PARTNER", "partner_id": partner_id})
    refresh_token = create_refresh_token({"sub": pu_id, "role": "PARTNER", "partner_id": partner_id})
    print(f"Token issued for user {pu_id}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "has_membership": None,
        "user": {
            "id": pu_id,
            "email": partner_user.get("email"),
            "full_name": partner_user.get("full_name") or partner_user.get("name", "Partner User"),
            "role": "PARTNER",
            "partner_id": partner_id,
            "is_active": is_active,
            "created_at": partner_user.get("created_at"),
        },
    }


async def update_user_profile(user_id: str, updates: UpdateProfileRequest) -> dict:
    """Update profile fields for the authenticated user."""
    db = get_db()
    obj_id = _to_object_id(user_id)

    user = await db.users.find_one({"$or": [{"_id": obj_id}, {"_id": user_id}]})
    if not user:
        raise NotFoundError("User not found")

    update_fields = {}
    if updates.full_name is not None:
        name_val = updates.full_name.strip()
        if len(name_val) < 2:
            raise ValidationError("Full name must be at least 2 characters")
        update_fields["full_name"] = name_val

    if updates.email is not None:
        email_val = updates.email.strip()
        if email_val != user.get("email"):
            existing = await db.users.find_one({"email": email_val})
            if existing:
                raise ValidationError("Email already registered")
            update_fields["email"] = email_val

    if updates.mobile is not None:
        mobile_val = updates.mobile.strip()
        if mobile_val != user.get("mobile"):
            existing = await db.users.find_one({"mobile": mobile_val})
            if existing:
                raise ValidationError("Mobile number already registered")
            update_fields["mobile"] = mobile_val

    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": update_fields},
        )
        user.update(update_fields)

    has_membership = await check_user_membership(user_id)
    return _format_user_doc(user, has_membership=has_membership)


async def reset_password(payload: ResetPasswordRequest) -> dict:
    """Reset customer password using verified OTP or direct OTP validation."""
    db = get_db()
    identifier = payload.identifier.strip()

    user = await db.users.find_one({
        "$or": [{"email": identifier}, {"mobile": identifier}]
    })
    if not user:
        raise NotFoundError("No account found with this identifier")

    if payload.otp:
        await verify_otp(identifier, payload.otp.strip(), "RESET_PASSWORD")
    else:
        now = datetime.now(timezone.utc)
        ten_minutes_ago = now - timedelta(minutes=10)
        otp_record = await db.otp_store.find_one({
            "identifier": identifier,
            "purpose": "RESET_PASSWORD",
            "used": True,
        }, sort=[("created_at", -1)])

        if not otp_record:
            raise ValidationError("Please verify your email/mobile with OTP first.")

        record_time = _ensure_utc(otp_record.get("verified_at") or otp_record.get("created_at", now))
        if record_time < ten_minutes_ago:
            raise ValidationError("OTP verification expired. Please request a new OTP.")

    new_hash = hash_password(payload.new_password)
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": now}},
    )

    return {"message": "Password reset successfully. Please login with your new password."}

