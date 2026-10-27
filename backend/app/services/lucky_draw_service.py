"""Authoritative Lucky Draw Engine, Cryptographic Fairness & Prize Credit Service."""
from datetime import datetime, timezone
import hashlib
import random
import secrets
import string
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.database import db
from app.schemas.lucky_draw_schema import LuckyDrawStatusEnum, LuckyDrawCycleCreateRequest, LuckyDrawExecuteRequest
from app.services.order_service import is_user_verified_member
from app.services.settings_service import get_business_rules
from app.services.wallet_service import execute_wallet_transaction


def _to_object_id(val: Any) -> Optional[ObjectId]:
    if isinstance(val, ObjectId):
        return val
    if isinstance(val, str) and ObjectId.is_valid(val):
        return ObjectId(val)
    return None


def serialize_draw_cycle(doc: dict) -> dict:
    if not doc:
        return {}
    res = dict(doc)
    res["id"] = str(res.pop("_id", ""))
    return res


async def create_draw_cycle(req: LuckyDrawCycleCreateRequest, admin_user: dict) -> dict:
    """Admin initializes a prospective draw cycle with period boundaries."""
    if req.end_date <= req.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cycle end_date must be strictly after start_date",
        )

    rules = await get_business_rules()
    prize_paise = req.prize_paise if req.prize_paise is not None else int(rules.get("lucky_draw_prize_paise", 50000))
    now = datetime.now(timezone.utc)
    cycle_num = f"LD-{now.strftime('%Y%m')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=5))}" if 'string' in globals() else f"LD-{now.strftime('%Y%m%d%H%M%S')}"

    doc = {
        "cycle_code": cycle_num,
        "cycle_name": req.cycle_name.strip(),
        "start_date": req.start_date,
        "end_date": req.end_date,
        "prize_paise": prize_paise,
        "status": LuckyDrawStatusEnum.CREATED.value,
        "created_by": admin_user.get("email", "admin"),
        "entries": [],
        "entry_count": 0,
        "winner": None,
        "created_at": now,
        "updated_at": now,
    }

    res = await db.lucky_draws.insert_one(doc)
    doc["_id"] = res.inserted_id
    return serialize_draw_cycle(doc)


async def snapshot_cycle_entries(cycle_id: str, admin_user: dict) -> dict:
    """Generate immutable snapshot of verified Cookey purchases and active members."""
    oid = _to_object_id(cycle_id)
    cycle = await db.lucky_draws.find_one({"$or": [{"_id": oid}, {"cycle_code": cycle_id}]})
    if not cycle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lucky draw cycle not found")

    if cycle.get("status") == LuckyDrawStatusEnum.EXECUTED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot snapshot an already executed cycle")

    start_date = cycle["start_date"]
    end_date = cycle["end_date"]
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)

    # Find paid Cookey orders within cycle interval
    cursor = db.orders.find({
        "items.is_cookey": True,
        "payment_status": "PAID",
        "order_status": {"$nin": ["CANCELLED", "REFUNDED"]},
        "created_at": {"$gte": start_date, "$lte": end_date},
    })

    entries = []
    seen_users = set()
    async for order in cursor:
        uid = order.get("user_id")
        if not uid or uid in seen_users:
            continue
        # Verify customer currently holds active membership
        is_member = await is_user_verified_member(uid)
        if is_member:
            seen_users.add(uid)
            entries.append({
                "user_id": uid,
                "order_number": order.get("order_number"),
                "purchased_at": order.get("created_at"),
            })

    now = datetime.now(timezone.utc)
    await db.lucky_draws.update_one(
        {"_id": cycle["_id"]},
        {
            "$set": {
                "entries": entries,
                "entry_count": len(entries),
                "status": LuckyDrawStatusEnum.SNAPSHOT_TAKEN.value,
                "snapshot_at": now,
                "snapshot_by": admin_user.get("email", "admin"),
                "updated_at": now,
            }
        },
    )

    cycle["entries"] = entries
    cycle["entry_count"] = len(entries)
    cycle["status"] = LuckyDrawStatusEnum.SNAPSHOT_TAKEN.value
    return serialize_draw_cycle(cycle)


async def execute_draw_cycle(
    cycle_id: str,
    req: LuckyDrawExecuteRequest,
    admin_user: dict,
) -> dict:
    """Execute fair random selection using secrets or test seed.
    If legal approval is unconfigured, live real-money credit is blocked and rejected.
    """
    oid = _to_object_id(cycle_id)
    cycle = await db.lucky_draws.find_one({"$or": [{"_id": oid}, {"cycle_code": cycle_id}]})
    if not cycle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lucky draw cycle not found")

    if cycle.get("status") == LuckyDrawStatusEnum.EXECUTED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This cycle has already been executed")

    entries = cycle.get("entries") or []
    if not entries:
        # Snapshot on demand if empty
        snap_res = await snapshot_cycle_entries(cycle_id, admin_user)
        entries = snap_res.get("entries") or []

    if not entries:
        return {
            "cycle_code": cycle.get("cycle_code"),
            "status": "NO_ENTRIES",
            "message": "No eligible active member Cookey purchases found in this draw cycle period",
            "winner": None,
        }

    rules = await get_business_rules()
    legal_approved = bool(rules.get("lucky_draw_legal_approved", False))

    # If live real-money contest execution is attempted without explicit legal/business approval
    if not req.dry_run and not legal_approved:
        await db.lucky_draws.update_one(
            {"_id": cycle["_id"]},
            {"$set": {"status": LuckyDrawStatusEnum.BLOCKED.value, "updated_at": datetime.now(timezone.utc)}},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Live draw execution is BLOCKED — LEGAL/BUSINESS APPROVAL REQUIRED. Enable lucky_draw_legal_approved in business settings or run in dry_run mode.",
        )

    # Perform fair random selection
    if req.seed_for_testing is not None:
        rng = random.Random(req.seed_for_testing)
        winner_entry = rng.choice(entries)
        entropy_source = f"DETERMINISTIC_TEST_SEED_{req.seed_for_testing}"
    else:
        winner_entry = secrets.choice(entries)
        entropy_source = "OS_CRYPTOGRAPHIC_PRNG_SECRETS"

    winner_id = winner_entry["user_id"]
    prize_paise = int(cycle.get("prize_paise", 50000))
    now = datetime.now(timezone.utc)

    # Calculate audit hash of selection
    raw_evidence = f"{cycle.get('cycle_code')}|{winner_id}|{prize_paise}|{now.isoformat()}|{entropy_source}"
    audit_hash = hashlib.sha256(raw_evidence.encode("utf-8")).hexdigest()

    winner_record = {
        "user_id": winner_id,
        "winning_order": winner_entry.get("order_number"),
        "prize_paise": prize_paise,
        "entropy_source": entropy_source,
        "audit_hash": audit_hash,
        "selected_at": now.isoformat(),
        "dry_run": req.dry_run,
    }

    if req.dry_run:
        return {
            "cycle_code": cycle.get("cycle_code"),
            "status": "SIMULATED_DRY_RUN",
            "message": "Draw execution simulated successfully without financial mutation",
            "winner": winner_record,
            "total_entries": len(entries),
        }

    # Credit prize to winner's wallet idempotently
    wallet_res = await execute_wallet_transaction(
        user_id=winner_id,
        amount_paise=prize_paise,
        transaction_type="CREDIT",
        category="LUCKY_DRAW_PRIZE",
        idempotency_key=f"LD_PRIZE_{cycle.get('cycle_code')}",
        notes=f"Lucky draw prize: {cycle.get('cycle_name')}",
    )

    await db.lucky_draws.update_one(
        {"_id": cycle["_id"]},
        {
            "$set": {
                "status": LuckyDrawStatusEnum.EXECUTED.value,
                "winner": winner_record,
                "executed_at": now,
                "executed_by": admin_user.get("email", "admin"),
                "wallet_transaction": wallet_res,
                "updated_at": now,
            }
        },
    )

    return {
        "cycle_code": cycle.get("cycle_code"),
        "status": LuckyDrawStatusEnum.EXECUTED.value,
        "winner": winner_record,
        "wallet_credit": wallet_res,
        "message": f"Lucky draw executed. Winner {winner_id} credited ₹{prize_paise/100:.2f} to wallet.",
    }


async def list_draw_cycles(skip: int = 0, limit: int = 50) -> dict:
    """Admin inspects all draw cycles with status and winner records."""
    total = await db.lucky_draws.count_documents({})
    cursor = db.lucky_draws.find({}).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append(serialize_draw_cycle(doc))
    return {"total": total, "items": items, "skip": skip, "limit": limit}
