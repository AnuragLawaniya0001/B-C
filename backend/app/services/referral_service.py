"""Referral and customer loyalty reward service."""
from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.core.database import get_db
from app.services.wallet_service import admin_adjust_balance


async def get_user_referral_summary(user_id: str) -> Dict[str, Any]:
    """Retrieve or generate referral code, stats, and referees list for a customer."""
    db = get_db()
    
    # Try ObjectId conversion
    try:
        query_id = ObjectId(user_id)
    except Exception:
        query_id = user_id

    user = await db.users.find_one({"_id": query_id})
    if not user:
        return {
            "referral_code": "",
            "share_url": "",
            "total_referrals": 0,
            "rewarded_count": 0,
            "total_earned_paise": 0,
            "referrals": []
        }

    referral_code = user.get("referral_code")
    if not referral_code:
        referral_code = f"BC{uuid.uuid4().hex[:6].upper()}"
        await db.users.update_one({"_id": query_id}, {"$set": {"referral_code": referral_code}})

    cursor = db.referrals.find({"referrer_user_id": str(user["_id"])}).sort("created_at", -1)
    referrals_docs = await cursor.to_list(length=100)

    total_referrals = len(referrals_docs)
    rewarded_count = sum(1 for r in referrals_docs if r.get("status") == "COMPLETED")
    total_earned_paise = sum(r.get("reward_amount_paise", 0) for r in referrals_docs if r.get("status") == "COMPLETED")

    formatted_referrals = [
        {
            "id": str(r["_id"]),
            "referee_name": r.get("referee_name", "Anonymous"),
            "status": r.get("status", "PENDING"),
            "reward_amount_paise": r.get("reward_amount_paise", 0),
            "qualifying_order_number": r.get("qualifying_order_number"),
            "created_at": r.get("created_at"),
            "rewarded_at": r.get("rewarded_at")
        }
        for r in referrals_docs
    ]

    return {
        "referral_code": referral_code,
        "share_url": f"https://bigchamp.in/register?ref={referral_code}",
        "total_referrals": total_referrals,
        "rewarded_count": rewarded_count,
        "total_earned_paise": total_earned_paise,
        "referrals": formatted_referrals
    }


async def qualify_referral_on_order(user_id: str, order_number: str) -> Optional[Dict[str, Any]]:
    """Idempotently qualify and credit referral reward when a referee places their first order."""
    db = get_db()
    now = datetime.now(timezone.utc)

    # Find pending referral for this user
    pending = await db.referrals.find_one({"referee_user_id": str(user_id), "status": "PENDING"})
    if not pending:
        return None

    # Fetch dynamic reward setting
    setting = await db.settings.find_one({"key": "business_rules"})
    reward_paise = 5000  # Default ₹50
    if setting and isinstance(setting.get("value"), dict):
        reward_paise = setting["value"].get("referral_reward_paise", 5000)

    referrer_id = pending.get("referrer_user_id")

    # Atomic update to prevent duplicate reward on concurrent order completions
    res = await db.referrals.update_one(
        {"_id": pending["_id"], "status": "PENDING"},
        {
            "$set": {
                "status": "COMPLETED",
                "reward_amount_paise": reward_paise,
                "qualifying_order_number": order_number,
                "rewarded_at": now,
                "updated_at": now
            }
        }
    )

    if res.modified_count == 0:
        return None  # Already processed concurrently

    # Credit referrer wallet if reward > 0
    if reward_paise > 0 and referrer_id:
        try:
            await admin_adjust_balance(
                user_id=referrer_id,
                amount_paise=reward_paise,
                direction="CREDIT",
                reason=f"Referral reward for first order {order_number} by referee"
            )
        except Exception as e:
            # If referrer wallet adjust fails (e.g. referrer has no wallet yet), log and proceed
            print(f"Warning: could not adjust referrer wallet: {e}")

    return {
        "status": "COMPLETED",
        "referrer_id": referrer_id,
        "reward_amount_paise": reward_paise,
        "order_number": order_number
    }


async def reverse_referral_on_cancellation(order_number: str, reason: str = "Order cancelled/refunded") -> Optional[Dict[str, Any]]:
    """Safely reverse referral reward if the qualifying order is cancelled or fully refunded."""
    db = get_db()
    now = datetime.now(timezone.utc)

    # Find completed referral tied to this qualifying order
    referral = await db.referrals.find_one({
        "qualifying_order_number": order_number,
        "status": "COMPLETED"
    })
    if not referral:
        return None

    # Atomic transition from COMPLETED to REVERSED to prevent double debit
    res = await db.referrals.update_one(
        {"_id": referral["_id"], "status": "COMPLETED"},
        {
            "$set": {
                "status": "REVERSED",
                "reversal_reason": reason,
                "reversed_at": now,
                "updated_at": now
            }
        }
    )
    if res.modified_count == 0:
        return None

    reward_amt = int(referral.get("reward_amount_paise", 0))
    referrer_id = referral.get("referrer_user_id")

    recovered_paise = 0
    unrecovered_paise = 0
    recovery_status = "FULL_RECOVERY"

    if reward_amt > 0 and referrer_id:
        from app.services.wallet_service import get_or_create_wallet
        ref_wallet = await get_or_create_wallet(referrer_id)
        current_bal = int(ref_wallet.get("balance_paise", 0))

        if current_bal >= reward_amt:
            # Full recovery
            recovered_paise = reward_amt
            unrecovered_paise = 0
            recovery_status = "FULL_RECOVERY"
            try:
                await admin_adjust_balance(
                    user_id=referrer_id,
                    amount_paise=reward_amt,
                    direction="DEBIT",
                    reason=f"Reversal of referral reward for order #{order_number}: {reason}",
                    admin_email="system@bigchamp.in",
                    reference_type="REFERRAL_REVERSAL",
                    reference_id=str(referral["_id"]),
                )
            except Exception as e:
                print(f"Warning: could not debit referrer wallet on full reversal: {e}")
        elif current_bal > 0:
            # Partial recovery: debit what's available without negative wallet overdraft
            recovered_paise = current_bal
            unrecovered_paise = reward_amt - current_bal
            recovery_status = "PARTIAL_RECOVERY"
            try:
                await admin_adjust_balance(
                    user_id=referrer_id,
                    amount_paise=current_bal,
                    direction="DEBIT",
                    reason=f"Partial reversal of referral reward for order #{order_number} ({current_bal}/{reward_amt} paise): {reason}",
                    admin_email="system@bigchamp.in",
                    reference_type="REFERRAL_REVERSAL",
                    reference_id=str(referral["_id"]),
                )
            except Exception as e:
                print(f"Warning: could not debit referrer wallet on partial reversal: {e}")
        else:
            # Zero balance: unrecovered, requires admin tracking
            recovered_paise = 0
            unrecovered_paise = reward_amt
            recovery_status = "UNRECOVERED_INSUFFICIENT_FUNDS"

        # Update referral document with explicit accounting recovery fields
        await db.referrals.update_one(
            {"_id": referral["_id"]},
            {
                "$set": {
                    "recovery_status": recovery_status,
                    "recovered_amount_paise": recovered_paise,
                    "unrecovered_amount_paise": unrecovered_paise,
                    "requires_admin_review": (unrecovered_paise > 0),
                    "updated_at": now,
                }
            },
        )

        # Track unrecovered debt liability on referrer user account
        if unrecovered_paise > 0:
            ref_oid = _to_object_id(referrer_id)
            if ref_oid:
                await db.users.update_one(
                    {"_id": ref_oid},
                    {"$inc": {"outstanding_referral_recovery_paise": unrecovered_paise}, "$set": {"updated_at": now}},
                )

        # Audit trail
        try:
            from app.services.audit_service import log_admin_action
            await log_admin_action(
                actor_email="system@bigchamp.in",
                action="REFERRAL_REWARD_REVERSAL",
                resource="REFERRAL",
                resource_id=str(referral["_id"]),
                details={
                    "order_number": order_number,
                    "reward_amount_paise": reward_amt,
                    "recovered_amount_paise": recovered_paise,
                    "unrecovered_amount_paise": unrecovered_paise,
                    "recovery_status": recovery_status,
                },
            )
        except Exception:
            pass

    return {
        "status": "REVERSED",
        "recovery_status": recovery_status,
        "referrer_id": referrer_id,
        "reversed_amount_paise": reward_amt,
        "recovered_amount_paise": recovered_paise,
        "unrecovered_amount_paise": unrecovered_paise,
        "order_number": order_number,
    }


async def admin_list_referrals(skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    """Admin view of all referral attribution records."""
    db = get_db()
    total = await db.referrals.count_documents({})
    cursor = db.referrals.find({}).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)

    return {
        "total": total,
        "items": [
            {
                "id": str(r["_id"]),
                "referrer_user_id": r.get("referrer_user_id"),
                "referrer_name": r.get("referrer_name"),
                "referee_user_id": r.get("referee_user_id"),
                "referee_name": r.get("referee_name"),
                "referral_code": r.get("referral_code"),
                "status": r.get("status"),
                "reward_amount_paise": r.get("reward_amount_paise", 0),
                "qualifying_order_number": r.get("qualifying_order_number"),
                "created_at": r.get("created_at"),
                "rewarded_at": r.get("rewarded_at")
            }
            for r in items
        ]
    }
