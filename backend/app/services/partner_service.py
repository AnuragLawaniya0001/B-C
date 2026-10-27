"""Authoritative Partner Business Lifecycle, Commission & Settlement Service."""
from datetime import datetime, timezone
import random
import string
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.security import hash_password, verify_qr_payload
from app.core.database import db
from app.schemas.partner_schema import PartnerStatus, CommissionStatus, PartnerApplyRequest
from app.services.settings_service import get_business_rules


def _to_object_id(val: Any) -> Optional[ObjectId]:
    if isinstance(val, ObjectId):
        return val
    if isinstance(val, str) and ObjectId.is_valid(val):
        return ObjectId(val)
    return None


def serialize_partner(doc: dict) -> dict:
    if not doc:
        return {}
    res = dict(doc)
    res["id"] = str(res.pop("_id", ""))
    if "password" in res:
        del res["password"]
    return res


async def ensure_partner_indexes():
    try:
        await db.partners.create_index("email", unique=True)
        await db.partner_commissions.create_index("commission_id", unique=True)
        await db.partner_commissions.create_index([("partner_id", 1), ("created_at", -1)])
        await db.partner_commissions.create_index([("partner_id", 1), ("source_id", 1)], unique=True)
        await db.partner_commissions.create_index("source_id")
        await db.partner_settlements.create_index("settlement_id", unique=True)
        await db.partner_settlements.create_index(
            "payment_reference",
            unique=True,
            partialFilterExpression={"payment_reference": {"$type": "string"}},
        )
        await db.scan_logs.create_index([("card_number", 1), ("created_at", -1)])
        await db.scan_logs.create_index([("partner_id", 1), ("created_at", -1)])
    except Exception:
        pass


async def apply_partner(payload: PartnerApplyRequest) -> Dict[str, Any]:
    """Partner submits onboarding application."""
    await ensure_partner_indexes()
    clean_email = payload.email.strip().lower()

    existing = await db.partners.find_one({"email": clean_email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Partner application with email '{clean_email}' already exists",
        )

    rules = await get_business_rules()
    default_comm = float(rules.get("partner_default_commission_percent", 15.0))
    comm_rate = payload.commission_rate_percent if payload.commission_rate_percent is not None else default_comm

    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password(payload.password[:72]) if payload.password else None

    partner_doc = {
        "business_name": payload.business_name.strip(),
        "contact_person": payload.contact_person.strip(),
        "email": clean_email,
        "phone": payload.phone.strip(),
        "password": hashed_pwd,
        "business_type": payload.business_type.value,
        "city": payload.city.strip(),
        "state": payload.state.strip(),
        "address": payload.address.strip(),
        "pincode": payload.pincode.strip(),
        "status": PartnerStatus.PENDING.value,
        "commission_rate_percent": comm_rate,
        "total_earned_paise": 0,
        "total_settled_paise": 0,
        "pending_payout_paise": 0,
        "notes": payload.notes,
        "created_at": now,
        "updated_at": now,
    }

    insert_res = await db.partners.insert_one(partner_doc)
    partner_doc["_id"] = insert_res.inserted_id
    return serialize_partner(partner_doc)


async def admin_list_partners(status_filter: Optional[str] = None, search: Optional[str] = None, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    """Admin retrieves partner applications with filters and search."""
    await ensure_partner_indexes()
    query = {}
    if status_filter and status_filter.upper() != "ALL":
        query["status"] = status_filter.upper()

    if search and search.strip():
        import re
        s = search.strip()
        reg = {"$regex": re.escape(s), "$options": "i"}
        query["$or"] = [
            {"business_name": reg},
            {"contact_person": reg},
            {"email": reg},
            {"city": reg},
        ]

    total = await db.partners.count_documents(query)
    cursor = db.partners.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_partner(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}


async def admin_update_partner_status(partner_id: str, new_status: str, commission_rate: Optional[float], notes: Optional[str], admin_user: dict) -> Dict[str, Any]:
    """Admin approves, rejects, suspends, or activates a partner."""
    oid = _to_object_id(partner_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid partner ID")

    partner = await db.partners.find_one({"_id": oid})
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    now = datetime.now(timezone.utc)
    admin_email = admin_user.get("email", "admin")

    update_fields: Dict[str, Any] = {
        "status": new_status,
        "updated_at": now,
        "updated_by": admin_email,
    }
    if commission_rate is not None:
        update_fields["commission_rate_percent"] = commission_rate
    if notes:
        update_fields["admin_notes"] = notes

    updated = await db.partners.find_one_and_update(
        {"_id": oid},
        {"$set": update_fields},
        return_document=True,
    )
    try:
        from app.services.audit_service import log_admin_action
        await log_admin_action(
            actor_email=admin_email,
            action=f"PARTNER_STATUS_{new_status}",
            resource="PARTNER",
            resource_id=partner_id,
            details={"status": new_status, "commission_rate": commission_rate, "notes": notes},
        )
    except Exception:
        pass
    return serialize_partner(updated)


async def record_partner_commission(
    partner_id: str,
    source_type: str,
    source_id: str,
    gross_amount_paise: int,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Snapshot and record commission for an eligible transaction."""
    await ensure_partner_indexes()
    oid = _to_object_id(partner_id)
    partner = await db.partners.find_one({"$or": [{"_id": oid}, {"email": partner_id}]})
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Partner '{partner_id}' not found")

    p_id_str = str(partner["_id"])

    # Idempotent replay protection: Never create duplicate commission for the same source transaction
    existing = await db.partner_commissions.find_one({"partner_id": p_id_str, "source_id": source_id})
    if existing:
        existing["id"] = str(existing.pop("_id", ""))
        return existing

    # Snapshot rate
    rate = float(partner.get("commission_rate_percent", 15.0))
    commission_amount = int(round(gross_amount_paise * (rate / 100.0)))
    now = datetime.now(timezone.utc)

    comm_id = f"COM-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"

    comm_doc = {
        "commission_id": comm_id,
        "partner_id": p_id_str,
        "partner_name": partner.get("business_name", ""),
        "source_type": source_type,
        "source_id": source_id,
        "gross_amount_paise": gross_amount_paise,
        "commission_rate_percent": rate,
        "commission_amount_paise": commission_amount,
        "status": CommissionStatus.APPROVED.value,
        "notes": notes,
        "created_at": now,
    }
    await db.partner_commissions.insert_one(comm_doc)

    # Increment partner earnings
    await db.partners.update_one(
        {"_id": partner["_id"]},
        {
            "$inc": {
                "total_earned_paise": commission_amount,
                "pending_payout_paise": commission_amount,
            },
            "$set": {"updated_at": now},
        },
    )

    comm_doc["id"] = str(comm_doc.pop("_id", ""))
    return comm_doc


async def reverse_partner_commission(source_id: str, reason: str = "Order cancelled/refunded") -> Optional[Dict[str, Any]]:
    """Reverse commission associated with cancelled or refunded transaction."""
    comm = await db.partner_commissions.find_one({"source_id": source_id, "status": CommissionStatus.APPROVED.value})
    if not comm:
        return None

    now = datetime.now(timezone.utc)
    rev_amount = int(comm.get("commission_amount_paise", 0))

    await db.partner_commissions.update_one(
        {"_id": comm["_id"]},
        {"$set": {"status": CommissionStatus.REVERSED.value, "reversal_reason": reason, "reversed_at": now}},
    )

    # Decrement partner pending payout
    oid = _to_object_id(comm["partner_id"])
    if oid:
        await db.partners.update_one(
            {"_id": oid},
            {
                "$inc": {
                    "total_earned_paise": -rev_amount,
                    "pending_payout_paise": -rev_amount,
                },
                "$set": {"updated_at": now},
            },
        )
    return comm


async def get_partner_earnings(partner_id: str) -> Dict[str, Any]:
    """Retrieve partner earnings summary and transaction ledger."""
    oid = _to_object_id(partner_id)
    partner = await db.partners.find_one({"$or": [{"_id": oid}, {"email": partner_id}]})
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    p_id = str(partner["_id"])
    cursor = db.partner_commissions.find({"partner_id": p_id}).sort("created_at", -1).limit(50)
    commissions = []
    async for c in cursor:
        c["id"] = str(c.pop("_id", ""))
        commissions.append(c)

    cursor_set = db.partner_settlements.find({"partner_id": p_id}).sort("created_at", -1).limit(20)
    settlements = []
    async for s in cursor_set:
        s["id"] = str(s.pop("_id", ""))
        settlements.append(s)

    return {
        "partner": serialize_partner(partner),
        "total_earned_paise": partner.get("total_earned_paise", 0),
        "total_settled_paise": partner.get("total_settled_paise", 0),
        "pending_payout_paise": partner.get("pending_payout_paise", 0),
        "recent_commissions": commissions,
        "recent_settlements": settlements,
    }


async def process_partner_settlement(partner_id: str, amount_paise: int, payment_reference: str, notes: Optional[str], admin_email: str) -> Dict[str, Any]:
    """Admin executes payout settlement to partner with atomic balance reservation."""
    await ensure_partner_indexes()
    oid = _to_object_id(partner_id)
    partner = await db.partners.find_one({"$or": [{"_id": oid}, {"email": partner_id}]})
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Settlement amount must be greater than 0 paise",
        )

    # Idempotent replay protection: Never deduct balance twice for the same payment reference
    clean_ref = payment_reference.strip()
    existing_settle = await db.partner_settlements.find_one({"payment_reference": clean_ref})
    if existing_settle:
        existing_settle["id"] = str(existing_settle.pop("_id", ""))
        p_current = await db.partners.find_one({"$or": [{"_id": oid}, {"email": partner_id}]})
        return {
            "settlement": existing_settle,
            "partner": serialize_partner(p_current),
            "replayed": True,
        }

    now = datetime.now(timezone.utc)
    settle_id = f"SET-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"

    # Atomic conditional update: strictly deducts only if pending_payout_paise >= amount_paise
    # Prevents concurrent requests from overdrawing the partner's balance
    updated = await db.partners.find_one_and_update(
        {
            "_id": partner["_id"],
            "pending_payout_paise": {"$gte": amount_paise},
        },
        {
            "$inc": {
                "total_settled_paise": amount_paise,
                "pending_payout_paise": -amount_paise,
            },
            "$set": {"updated_at": now},
        },
        return_document=True,
    )

    if not updated:
        current_pending = int(partner.get("pending_payout_paise", 0))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Settlement amount ₹{amount_paise/100:.2f} cannot exceed available pending payout of ₹{current_pending/100:.2f}",
        )

    settlement_doc = {
        "settlement_id": settle_id,
        "partner_id": str(partner["_id"]),
        "partner_name": partner.get("business_name", ""),
        "amount_paise": amount_paise,
        "payment_reference": clean_ref,
        "status": "COMPLETED",
        "notes": notes,
        "created_at": now,
        "processed_by": admin_email,
    }

    try:
        await db.partner_settlements.insert_one(settlement_doc)
    except Exception as set_err:
        from pymongo.errors import DuplicateKeyError
        # Compensate: rollback the balance deduction
        await db.partners.update_one(
            {"_id": partner["_id"]},
            {
                "$inc": {
                    "total_settled_paise": -amount_paise,
                    "pending_payout_paise": amount_paise,
                },
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )
        if isinstance(set_err, DuplicateKeyError):
            dup = await db.partner_settlements.find_one({"payment_reference": clean_ref})
            if dup:
                dup["id"] = str(dup.pop("_id", ""))
                return {"settlement": dup, "partner": serialize_partner(partner), "replayed": True}
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Settlement persistence failed. Partner balance safely restored: {set_err}",
        )

    settlement_doc["id"] = str(settlement_doc.pop("_id", ""))

    try:
        from app.services.audit_service import log_admin_action
        await log_admin_action(
            actor_email=admin_email,
            action="PARTNER_SETTLEMENT",
            resource="PARTNER",
            resource_id=str(partner["_id"]),
            details={"settlement_id": settle_id, "amount_paise": amount_paise, "reference": payment_reference},
        )
    except Exception:
        pass

    return {
        "settlement": settlement_doc,
        "partner": serialize_partner(updated),
    }


def _mask_mobile(mobile: Optional[str]) -> str:
    if not mobile or len(mobile) < 4:
        return "******"
    return f"******{mobile[-4:]}"


def _mask_name(name: Optional[str]) -> str:
    if not name:
        return "Member"
    parts = name.strip().split()
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0]}."


async def verify_member_for_partner(
    partner_user: dict,
    qr_payload: Optional[str] = None,
    card_number: Optional[str] = None,
) -> dict:
    """Partner verifies member validity via camera QR payload or manual card lookup."""
    partner_status = partner_user.get("status")
    if partner_status not in (PartnerStatus.APPROVED.value, PartnerStatus.ACTIVE.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Partner account is not approved or active to perform member verification",
        )

    resolved_card = None
    if qr_payload:
        try:
            decoded = verify_qr_payload(qr_payload.strip())
            resolved_card = decoded.get("card_number")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid, tampered, or malformed QR code signature",
            )
    elif card_number:
        resolved_card = card_number.strip().upper()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either valid qr_payload or manual card_number must be provided",
        )

    if not resolved_card:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Card identifier could not be resolved from QR code payload",
        )

    membership = await db.memberships.find_one({"card_number": resolved_card})
    if not membership:
        return {
            "verified": False,
            "status": "NOT_FOUND",
            "card_number": resolved_card,
            "message": "Membership record not found for this card number",
        }

    valid_till = membership.get("valid_till")
    now = datetime.now(timezone.utc)
    is_valid = bool(membership.get("is_active", True) and membership.get("status") == "ACTIVE")
    if valid_till:
        if isinstance(valid_till, datetime) and valid_till.tzinfo is None:
            valid_till = valid_till.replace(tzinfo=timezone.utc)
        if now > valid_till:
            is_valid = False

    user_id = membership.get("user_id")
    customer_doc = None
    if user_id:
        customer_doc = await db.users.find_one({
            "$or": [{"_id": _to_object_id(user_id)}, {"id": str(user_id)}]
        })

    masked_name = _mask_name(customer_doc.get("name") if customer_doc else None)
    masked_mobile = _mask_mobile(customer_doc.get("mobile") if customer_doc else None)

    # Record verification check in audit scan logs
    partner_id = str(partner_user.get("_id") or partner_user.get("id"))
    scan_log = {
        "partner_id": partner_id,
        "partner_name": partner_user.get("business_name", ""),
        "card_number": resolved_card,
        "action": "VERIFICATION_CHECK",
        "verified": is_valid,
        "created_at": now,
    }
    await db.scan_logs.insert_one(scan_log)

    if not is_valid:
        return {
            "verified": False,
            "status": "EXPIRED" if valid_till and now > valid_till else "INACTIVE",
            "card_number": resolved_card,
            "customer_name": masked_name,
            "valid_till": valid_till.isoformat() if valid_till else None,
            "message": "Membership is expired or inactive",
        }

    return {
        "verified": True,
        "status": "ACTIVE",
        "card_number": resolved_card,
        "customer_name": masked_name,
        "customer_mobile": masked_mobile,
        "valid_till": valid_till.isoformat() if valid_till else None,
        "membership_type": "BIGCHAMP_DIGITAL_PASS",
        "message": "Verified active Bigchamp member",
    }


async def redeem_service_for_partner(partner_user: dict, req: Any) -> dict:
    """Partner executes privilege redemption with duplicate prevention and audit logging."""
    partner_status = partner_user.get("status")
    if partner_status not in (PartnerStatus.APPROVED.value, PartnerStatus.ACTIVE.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Partner account is not approved or active to perform service redemptions",
        )

    partner_id = str(partner_user.get("_id") or partner_user.get("id"))

    # Idempotency check if idempotency_key provided
    if req.idempotency_key and req.idempotency_key.strip():
        existing = await db.scan_logs.find_one({
            "partner_id": partner_id,
            "idempotency_key": req.idempotency_key.strip(),
        })
        if existing:
            existing["id"] = str(existing.pop("_id", ""))
            return {"status": "SUCCESS", "redemption": existing, "replayed": True}

    # Verify membership validity first
    verify_res = await verify_member_for_partner(
        partner_user=partner_user,
        qr_payload=req.qr_payload,
        card_number=req.card_number,
    )
    if not verify_res.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot redeem service: {verify_res.get('message')}",
        )

    card_number = verify_res.get("card_number")
    service_type = (req.service_type or "DORMITORY_CHECKIN").strip().upper()
    now = datetime.now(timezone.utc)
    today_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Protect against same-day duplicate redemption for the same privilege
    dup = await db.scan_logs.find_one({
        "partner_id": partner_id,
        "card_number": card_number,
        "service_type": service_type,
        "action": "SERVICE_REDEMPTION",
        "created_at": {"$gte": today_midnight},
    })
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Privilege '{service_type}' has already been redeemed for card {card_number} today",
        )

    redemption_code = f"RED-{now.strftime('%Y%m%d')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"
    log_doc = {
        "redemption_id": redemption_code,
        "partner_id": partner_id,
        "partner_name": partner_user.get("business_name", ""),
        "card_number": card_number,
        "customer_name": verify_res.get("customer_name"),
        "service_type": service_type,
        "action": "SERVICE_REDEMPTION",
        "idempotency_key": req.idempotency_key.strip() if req.idempotency_key else None,
        "notes": req.notes.strip() if req.notes else None,
        "created_at": now,
    }
    await db.scan_logs.insert_one(log_doc)
    log_doc["id"] = str(log_doc.pop("_id", ""))

    return {
        "status": "SUCCESS",
        "redemption_id": redemption_code,
        "card_number": card_number,
        "service_type": service_type,
        "partner_name": partner_user.get("business_name"),
        "redeemed_at": now.isoformat(),
        "message": f"Successfully redeemed privilege '{service_type}' for member {card_number}",
    }


async def admin_get_scan_logs(
    partner_id: Optional[str] = None,
    action: Optional[str] = None,
    card_number: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """Admin inspects verification and redemption logs across offline partners."""
    query: Dict[str, Any] = {}
    if partner_id:
        query["partner_id"] = partner_id
    if action:
        query["action"] = action
    if card_number:
        query["card_number"] = card_number.strip().upper()

    total = await db.scan_logs.count_documents(query)
    cursor = db.scan_logs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id", ""))
        items.append(doc)

    return {"total": total, "items": items, "skip": skip, "limit": limit}
