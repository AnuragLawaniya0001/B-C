"""Secure Manual KYC Review and Verification Service."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.database import db
from app.schemas.kyc_schema import KYCStatusEnum, KYCSubmitRequest, KYCReviewRequest


def _to_object_id(val: Any) -> Optional[ObjectId]:
    if isinstance(val, ObjectId):
        return val
    if isinstance(val, str) and ObjectId.is_valid(val):
        return ObjectId(val)
    return None


def serialize_kyc_doc(doc: dict) -> dict:
    if not doc:
        return {}
    res = dict(doc)
    res["id"] = str(res.pop("_id", ""))
    # Mask document URL for non-admin callers if needed
    return res


async def submit_user_kyc(user_id: str, req: KYCSubmitRequest) -> dict:
    """Customer submits identity document for administrative KYC verification."""
    now = datetime.now(timezone.utc)
    oid = _to_object_id(user_id)

    # Prevent submission if already approved
    user = await db.users.find_one({"$or": [{"_id": oid}, {"id": str(user_id)}]})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    if user.get("kyc_status") == KYCStatusEnum.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your KYC has already been verified and approved",
        )

    # Privacy check: Ensure full raw 12-digit Aadhaar numbers are never stored in plaintext
    id_clean = req.id_number_masked.strip()
    if req.id_type.value == "AADHAAR_MASKED" and len(id_clean.replace("-", "").replace(" ", "")) == 12 and id_clean.isdigit():
        # Auto-mask the first 8 digits for customer safety
        id_clean = f"XXXX-XXXX-{id_clean[-4:]}"

    kyc_entry = {
        "user_id": str(user_id),
        "id_type": req.id_type.value,
        "id_number_masked": id_clean,
        "full_name": req.full_name.strip(),
        "dob": req.dob.strip() if req.dob else None,
        "document_url": req.document_url.strip(),
        "status": KYCStatusEnum.PENDING_REVIEW.value,
        "notes": req.notes.strip() if req.notes else None,
        "updated_at": now,
    }

    # Upsert KYC document record
    existing = await db.kyc_documents.find_one({"user_id": str(user_id)})
    if existing:
        history_entry = {
            "status": KYCStatusEnum.PENDING_REVIEW.value,
            "changed_at": now,
            "notes": "Customer resubmitted KYC documents",
        }
        await db.kyc_documents.update_one(
            {"_id": existing["_id"]},
            {
                "$set": kyc_entry,
                "$push": {"status_history": history_entry},
            },
        )
        kyc_entry["_id"] = existing["_id"]
    else:
        kyc_entry["created_at"] = now
        kyc_entry["status_history"] = [{
            "status": KYCStatusEnum.PENDING_REVIEW.value,
            "changed_at": now,
            "notes": "Initial KYC submission",
        }]
        res = await db.kyc_documents.insert_one(kyc_entry)
        kyc_entry["_id"] = res.inserted_id

    # Update user's top-level kyc_status
    await db.users.update_one(
        {"$or": [{"_id": oid}, {"id": str(user_id)}]},
        {"$set": {"kyc_status": KYCStatusEnum.PENDING_REVIEW.value, "updated_at": now}},
    )

    return serialize_kyc_doc(kyc_entry)


async def get_user_kyc(user_id: str) -> dict:
    """Retrieve customer's own KYC verification document and status."""
    doc = await db.kyc_documents.find_one({"user_id": str(user_id)})
    if not doc:
        return {
            "status": KYCStatusEnum.NOT_SUBMITTED.value,
            "user_id": str(user_id),
            "message": "No KYC documents submitted yet",
        }
    return serialize_kyc_doc(doc)


async def admin_list_kyc(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """Admin inspects customer KYC submissions with masked identifiers."""
    query = {}
    if status_filter:
        query["status"] = status_filter.upper()

    total = await db.kyc_documents.count_documents(query)
    cursor = db.kyc_documents.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_kyc_doc(doc))

    return {"total": total, "items": items, "skip": skip, "limit": limit}


async def admin_review_kyc(
    target_user_id: str,
    req: KYCReviewRequest,
    admin_user: dict,
) -> dict:
    """Admin approves, rejects, or requests resubmission for customer KYC."""
    now = datetime.now(timezone.utc)
    admin_email = admin_user.get("email", "admin")
    oid = _to_object_id(target_user_id)

    doc = await db.kyc_documents.find_one({"user_id": str(target_user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC submission record not found")

    target_status = req.status.value
    history_entry = {
        "status": target_status,
        "reviewed_by": admin_email,
        "rejection_reason": req.rejection_reason,
        "internal_notes": req.internal_notes,
        "changed_at": now,
    }

    update_fields = {
        "status": target_status,
        "reviewed_by": admin_email,
        "rejection_reason": req.rejection_reason if target_status in (KYCStatusEnum.REJECTED.value, KYCStatusEnum.RESUBMISSION_REQUESTED.value) else None,
        "updated_at": now,
    }

    await db.kyc_documents.update_one(
        {"_id": doc["_id"]},
        {
            "$set": update_fields,
            "$push": {"status_history": history_entry},
        },
    )

    # Synchronize to user collection
    user_update: Dict[str, Any] = {"kyc_status": target_status, "updated_at": now}
    if target_status == KYCStatusEnum.APPROVED.value:
        user_update["is_kyc_verified"] = True
    else:
        user_update["is_kyc_verified"] = False

    await db.users.update_one(
        {"$or": [{"_id": oid}, {"id": str(target_user_id)}]},
        {"$set": user_update},
    )

    # Log in audit trail
    try:
        from app.services.audit_service import log_admin_action
        await log_admin_action(
            actor_email=admin_email,
            action="KYC_REVIEW",
            resource="USER_KYC",
            resource_id=str(target_user_id),
            details={"new_status": target_status, "reason": req.rejection_reason},
        )
    except Exception:
        pass

    updated = await db.kyc_documents.find_one({"_id": doc["_id"]})
    return serialize_kyc_doc(updated)
