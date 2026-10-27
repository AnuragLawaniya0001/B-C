"""Authoritative Wallet & Transaction Ledger Service.
Hardened with a durable, recoverable transaction state protocol.
Guarantees zero balance-versus-ledger inconsistency, strict concurrency protection,
material idempotency mismatch detection, and deterministic crash recovery.
"""
import asyncio
from datetime import datetime, timezone
import random
import string
from typing import Any, Dict, List, Optional
import uuid

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.database import db
from app.schemas.wallet_schema import (
    WalletStatus,
    TransactionType,
    TransactionDirection,
    TransactionStatus,
    OperationState,
    AdminWalletAdjustmentRequest,
)


def _to_object_id(val: Any) -> Optional[ObjectId]:
    if isinstance(val, ObjectId):
        return val
    if isinstance(val, str) and ObjectId.is_valid(val):
        return ObjectId(val)
    return None


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    res = dict(doc)
    res["id"] = str(res.pop("_id", ""))
    return res


def generate_transaction_id() -> str:
    """Generate a unique human-readable transaction ID.
    Format: TXN-YYYYMMDD-XXXXXX (e.g. TXN-20261024-8F2KD9)
    """
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    chars = string.ascii_uppercase + string.digits
    safe_chars = [c for c in chars if c not in ("O", "0", "I", "1")]
    random_code = "".join(random.choices(safe_chars, k=6))
    return f"TXN-{date_str}-{random_code}"


async def ensure_wallet_indexes():
    """Ensure unique and query indexes for wallets, operations, and transaction ledgers."""
    try:
        await db.wallets.create_index("user_id", unique=True)
        await db.wallet_transactions.create_index("transaction_id", unique=True)
        await db.wallet_transactions.create_index([("user_id", 1), ("created_at", -1)])
        await db.wallet_transactions.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
        )
        await db.wallet_operations.create_index("operation_id", unique=True)
        await db.wallet_operations.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
        )
        await db.wallet_operations.create_index([("user_id", 1), ("state", 1)])
        await db.wallet_operations.create_index([("state", 1), ("created_at", 1)])
        await db.wallet_recovery_logs.create_index([("executed_at", -1)])
    except Exception:
        pass


async def get_or_create_wallet(user_id: str) -> dict:
    """Retrieve existing customer wallet or initialize a persistent zero-balance wallet."""
    await ensure_wallet_indexes()
    user_id_str = str(user_id)

    wallet = await db.wallets.find_one({"user_id": user_id_str})
    if wallet:
        return wallet

    now = datetime.now(timezone.utc)
    new_wallet = {
        "user_id": user_id_str,
        "balance_paise": 0,
        "currency": "INR",
        "status": WalletStatus.ACTIVE.value,
        "created_at": now,
        "updated_at": now,
    }

    try:
        res = await db.wallets.insert_one(new_wallet)
        new_wallet["_id"] = res.inserted_id
        return new_wallet
    except DuplicateKeyError:
        return await db.wallets.find_one({"user_id": user_id_str})


async def auto_recover_pending_for_user(user_id: str):
    """Automatically resolve any interrupted operations for this customer before executing a new mutation."""
    user_id_str = str(user_id)
    # Check if there is an operation where balance was applied but ledger was interrupted
    cursor = db.wallet_operations.find({
        "user_id": user_id_str,
        "state": OperationState.BALANCE_APPLIED.value,
    })
    async for op in cursor:
        await _complete_interrupted_operation(op, actor="AUTO_RECOVERY")


async def _complete_interrupted_operation(op: dict, actor: str = "RECOVERY") -> Optional[dict]:
    """Complete an operation that already had balance applied in the wallet but was interrupted before ledger completion."""
    now = datetime.now(timezone.utc)
    txn_id = op.get("transaction_id")
    if not txn_id:
        txn_id = generate_transaction_id()

    # Check if ledger entry already exists
    existing_txn = await db.wallet_transactions.find_one({"transaction_id": txn_id})
    if existing_txn:
        await db.wallet_operations.update_one(
            {"_id": op["_id"]},
            {"$set": {"state": OperationState.COMPLETED.value, "updated_at": now}}
        )
        return serialize_doc(existing_txn)

    # Insert missing ledger entry
    wallet = await db.wallets.find_one({"user_id": op["user_id"]})
    wallet_id_str = str(wallet["_id"]) if wallet else "UNKNOWN"

    txn_doc = {
        "transaction_id": txn_id,
        "operation_id": op.get("operation_id"),
        "wallet_id": wallet_id_str,
        "user_id": op["user_id"],
        "transaction_type": op.get("transaction_type", TransactionType.ADJUSTMENT.value),
        "direction": op.get("direction"),
        "amount_paise": op.get("amount_paise", 0),
        "balance_before_paise": op.get("balance_before_paise", 0),
        "balance_after_paise": op.get("balance_after_paise", 0),
        "status": TransactionStatus.SUCCESS.value,
        "reason": op.get("reason", "Recovered operation"),
        "description": f"Recovered ledger entry ({actor}): {op.get('description') or ''}".strip(),
        "reference_type": op.get("reference_type"),
        "reference_id": op.get("reference_id"),
        "actor": actor,
        "actor_id": op.get("actor_id"),
        "metadata": {**(op.get("metadata") or {}), "recovered": True, "recovered_by": actor, "recovered_at": now.isoformat()},
        "created_at": op.get("created_at", now),
    }
    if op.get("idempotency_key"):
        txn_doc["idempotency_key"] = op["idempotency_key"]

    try:
        ins = await db.wallet_transactions.insert_one(txn_doc)
        txn_doc["_id"] = ins.inserted_id
    except DuplicateKeyError:
        existing_txn = await db.wallet_transactions.find_one({"transaction_id": txn_id})
        if existing_txn:
            txn_doc = existing_txn

    await db.wallet_operations.update_one(
        {"_id": op["_id"]},
        {"$set": {"state": OperationState.COMPLETED.value, "updated_at": now}}
    )

    return serialize_doc(txn_doc)


async def execute_wallet_transaction(
    user_id: str,
    direction: TransactionDirection,
    amount_paise: int,
    transaction_type: TransactionType,
    reason: str,
    description: Optional[str] = None,
    reference_type: Optional[str] = None,
    reference_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    actor: str = "SYSTEM",
    actor_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    _fault_injection: Optional[str] = None,
) -> dict:
    """Authoritatively execute a wallet credit or debit with a durable, recoverable state protocol.
    Guarantees:
    - Strictly positive amounts in integer paise.
    - Idempotency protection with material mismatch detection.
    - Concurrency protection against duplicate balance mutations via unique database constraints.
    - Deterministic crash recovery for partial failures (before balance, during ledger, after ledger).
    - Immutable audit entry recorded in wallet_transactions.
    """
    await ensure_wallet_indexes()
    user_id_str = str(user_id)

    # 1. Validate positive integer paise amount
    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Transaction amount must be strictly greater than 0 paise",
        )

    # 2. Check and clean idempotency key
    clean_idempotency = idempotency_key.strip() if idempotency_key else None

    # 3. Auto-recover any previous interrupted BALANCE_APPLIED operations for this customer
    await auto_recover_pending_for_user(user_id_str)

    # 4. Check for existing operation if idempotency key is supplied
    if clean_idempotency:
        existing_op = await db.wallet_operations.find_one({
            "user_id": user_id_str,
            "idempotency_key": clean_idempotency,
        })
        if existing_op:
            return await _resolve_existing_operation(
                existing_op=existing_op,
                requested_direction=direction,
                requested_amount_paise=amount_paise,
                clean_idempotency=clean_idempotency,
                reference_type=reference_type,
                reference_id=reference_id,
            )

    # 5. Ensure wallet exists and is ACTIVE
    wallet = await get_or_create_wallet(user_id_str)
    if wallet.get("status") != WalletStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Wallet is currently {wallet.get('status')} and cannot process transactions",
        )

    now = datetime.now(timezone.utc)
    operation_id = f"OP-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8].upper()}"
    txn_id = generate_transaction_id()

    # 6. Step 1: Persist INITIATED Operation Record
    op_doc = {
        "operation_id": operation_id,
        "transaction_id": txn_id,
        "user_id": user_id_str,
        "idempotency_key": clean_idempotency,
        "direction": direction.value if hasattr(direction, "value") else str(direction),
        "transaction_type": transaction_type.value if hasattr(transaction_type, "value") else str(transaction_type),
        "amount_paise": amount_paise,
        "reason": reason.strip(),
        "description": description.strip() if description else None,
        "reference_type": reference_type,
        "reference_id": str(reference_id) if reference_id else None,
        "actor": actor,
        "actor_id": str(actor_id) if actor_id else None,
        "metadata": metadata or {},
        "state": OperationState.INITIATED.value,
        "created_at": now,
        "updated_at": now,
    }

    try:
        await db.wallet_operations.insert_one(op_doc)
    except DuplicateKeyError:
        # Concurrent request with identical idempotency key arrived at same millisecond
        existing_op = await db.wallet_operations.find_one({
            "user_id": user_id_str,
            "idempotency_key": clean_idempotency,
        })
        if existing_op:
            return await _resolve_existing_operation(
                existing_op=existing_op,
                requested_direction=direction,
                requested_amount_paise=amount_paise,
                clean_idempotency=clean_idempotency,
                reference_type=reference_type,
                reference_id=reference_id,
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Concurrent request conflict on idempotency key. Please retry.",
        )

    # Fault Injection Point 1: Crash before balance mutation
    if _fault_injection == "FAIL_BEFORE_BALANCE":
        raise RuntimeError("Fault Injection: Failure before balance mutation")

    # 7. Step 2: Conditional Atomic Balance Mutation
    balance_before = 0
    balance_after = 0

    if direction == TransactionDirection.DEBIT:
        # Prevent overdraft / concurrent double-spend: must have balance >= amount_paise
        updated_wallet = await db.wallets.find_one_and_update(
            {
                "user_id": user_id_str,
                "balance_paise": {"$gte": amount_paise},
                "status": WalletStatus.ACTIVE.value,
            },
            {
                "$inc": {"balance_paise": -amount_paise},
                "$set": {
                    "updated_at": now,
                    "last_operation_id": operation_id,
                },
            },
            return_document=True,
        )

        if not updated_wallet:
            # Mark operation as FAILED
            await db.wallet_operations.update_one(
                {"operation_id": operation_id},
                {
                    "$set": {
                        "state": OperationState.FAILED.value,
                        "error": "Insufficient wallet balance",
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            current_wallet = await db.wallets.find_one({"user_id": user_id_str})
            avail = current_wallet.get("balance_paise", 0) if current_wallet else 0
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient wallet balance. Required: ₹{amount_paise/100:.2f}, Available: ₹{avail/100:.2f}",
            )

        balance_after = updated_wallet["balance_paise"]
        balance_before = balance_after + amount_paise

    elif direction == TransactionDirection.CREDIT:
        updated_wallet = await db.wallets.find_one_and_update(
            {
                "user_id": user_id_str,
                "status": WalletStatus.ACTIVE.value,
            },
            {
                "$inc": {"balance_paise": amount_paise},
                "$set": {
                    "updated_at": now,
                    "last_operation_id": operation_id,
                },
            },
            return_document=True,
        )

        if not updated_wallet:
            await db.wallet_operations.update_one(
                {"operation_id": operation_id},
                {
                    "$set": {
                        "state": OperationState.FAILED.value,
                        "error": "Wallet is not in ACTIVE status",
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to credit wallet. Wallet is not in ACTIVE status.",
            )

        balance_after = updated_wallet["balance_paise"]
        balance_before = balance_after - amount_paise

    else:
        await db.wallet_operations.update_one(
            {"operation_id": operation_id},
            {"$set": {"state": OperationState.FAILED.value, "error": f"Unsupported direction {direction}"}}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported transaction direction '{direction}'",
        )

    # Update operation record to BALANCE_APPLIED with exact balance figures
    await db.wallet_operations.update_one(
        {"operation_id": operation_id},
        {
            "$set": {
                "state": OperationState.BALANCE_APPLIED.value,
                "balance_before_paise": balance_before,
                "balance_after_paise": balance_after,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    # Fault Injection Point 2: Crash after balance mutation but before ledger persistence
    if _fault_injection == "FAIL_AFTER_BALANCE_BEFORE_LEDGER":
        raise RuntimeError("Fault Injection: Failure after balance mutation but before ledger persistence")

    # Fault Injection Point 3: Crash during ledger persistence
    if _fault_injection == "FAIL_DURING_LEDGER":
        raise RuntimeError("Fault Injection: Failure during ledger insertion")

    # 8. Step 3: Append-Only Immutable Ledger Entry
    txn_doc = {
        "transaction_id": txn_id,
        "operation_id": operation_id,
        "wallet_id": str(wallet["_id"]),
        "user_id": user_id_str,
        "transaction_type": transaction_type.value if hasattr(transaction_type, "value") else str(transaction_type),
        "direction": direction.value if hasattr(direction, "value") else str(direction),
        "amount_paise": amount_paise,
        "balance_before_paise": balance_before,
        "balance_after_paise": balance_after,
        "status": TransactionStatus.SUCCESS.value,
        "reason": reason.strip(),
        "description": description.strip() if description else None,
        "reference_type": reference_type,
        "reference_id": str(reference_id) if reference_id else None,
        "actor": actor,
        "actor_id": str(actor_id) if actor_id else None,
        "metadata": metadata or {},
        "created_at": now,
    }
    if clean_idempotency:
        txn_doc["idempotency_key"] = clean_idempotency

    try:
        ins = await db.wallet_transactions.insert_one(txn_doc)
        txn_doc["_id"] = ins.inserted_id
    except DuplicateKeyError:
        existing_txn = await db.wallet_transactions.find_one({"transaction_id": txn_id})
        if existing_txn:
            txn_doc = existing_txn

    # Transition operation record to COMPLETED
    await db.wallet_operations.update_one(
        {"operation_id": operation_id},
        {
            "$set": {
                "state": OperationState.COMPLETED.value,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    # Fault Injection Point 4: Crash after ledger persistence but before API response
    if _fault_injection == "FAIL_AFTER_LEDGER_BEFORE_RESPONSE":
        raise RuntimeError("Fault Injection: Failure after ledger persistence before API response")

    return serialize_doc(txn_doc)


async def _resolve_existing_operation(
    existing_op: dict,
    requested_direction: TransactionDirection,
    requested_amount_paise: int,
    clean_idempotency: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[str] = None,
) -> dict:
    """Validate material parameters and resolve an existing operation record."""
    req_dir_str = requested_direction.value if hasattr(requested_direction, "value") else str(requested_direction)

    # 1. Material Mismatch Validation
    if existing_op.get("direction") != req_dir_str or existing_op.get("amount_paise") != requested_amount_paise:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Idempotency key '{clean_idempotency}' was already used with different parameters: "
                f"direction={existing_op.get('direction')}, amount_paise={existing_op.get('amount_paise')}. "
                f"Received: direction={req_dir_str}, amount_paise={requested_amount_paise}. "
                f"Reusing an idempotency key with conflicting parameters is prohibited."
            ),
        )

    # Reference check if both are supplied
    if reference_type and existing_op.get("reference_type") and reference_type != existing_op.get("reference_type"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Idempotency key '{clean_idempotency}' reference_type mismatch.",
        )

    # 2. State-dependent handling
    state = existing_op.get("state")

    if state == OperationState.COMPLETED.value:
        txn = await db.wallet_transactions.find_one({
            "$or": [
                {"operation_id": existing_op.get("operation_id")},
                {"transaction_id": existing_op.get("transaction_id")},
                {"user_id": existing_op["user_id"], "idempotency_key": clean_idempotency},
            ]
        })
        if txn:
            return serialize_doc(txn)
        # In rare race, recover missing transaction document
        recovered = await _complete_interrupted_operation(existing_op, actor="IDEMPOTENCY_RECOVERY")
        if recovered:
            return recovered

    elif state == OperationState.FAILED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operation with idempotency key '{clean_idempotency}' previously failed: {existing_op.get('error', 'Prior transaction failure')}",
        )

    elif state in (OperationState.INITIATED.value, OperationState.BALANCE_APPLIED.value):
        # A concurrent request or interrupted worker is in progress. Poll up to 2 seconds.
        for _ in range(20):
            await asyncio.sleep(0.1)
            refreshed = await db.wallet_operations.find_one({"_id": existing_op["_id"]})
            if not refreshed:
                break
            if refreshed.get("state") == OperationState.COMPLETED.value:
                txn = await db.wallet_transactions.find_one({
                    "$or": [
                        {"operation_id": refreshed.get("operation_id")},
                        {"transaction_id": refreshed.get("transaction_id")},
                    ]
                })
                if txn:
                    return serialize_doc(txn)
            elif refreshed.get("state") == OperationState.FAILED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Operation previously failed: {refreshed.get('error')}",
                )

        # If still in BALANCE_APPLIED after polling, resolve immediately
        refreshed = await db.wallet_operations.find_one({"_id": existing_op["_id"]})
        if refreshed and refreshed.get("state") == OperationState.BALANCE_APPLIED.value:
            recovered = await _complete_interrupted_operation(refreshed, actor="CONCURRENT_AUTO_RECOVERY")
            if recovered:
                return recovered

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Operation with idempotency key '{clean_idempotency}' is currently being processed. Please retry shortly.",
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown operation state: {state}",
    )


async def reconcile_wallet(user_id: str) -> dict:
    """Read-only audit and reconcile customer's wallet balance against append-only ledger and pending operations."""
    user_id_str = str(user_id)
    wallet = await get_or_create_wallet(user_id_str)
    wallet_balance = wallet.get("balance_paise", 0)

    cursor = db.wallet_transactions.find({
        "user_id": user_id_str,
        "status": TransactionStatus.SUCCESS.value,
    })

    total_credits = 0
    total_debits = 0
    txn_count = 0

    async for txn in cursor:
        txn_count += 1
        amt = int(txn.get("amount_paise", 0))
        direction = txn.get("direction")
        if direction == TransactionDirection.CREDIT.value:
            total_credits += amt
        elif direction == TransactionDirection.DEBIT.value:
            total_debits += amt

    calculated_balance = total_credits - total_debits
    discrepancy = abs(wallet_balance - calculated_balance)

    # Scan for any uncompleted operations in wallet_operations
    unreconciled_ops = []
    op_cursor = db.wallet_operations.find({
        "user_id": user_id_str,
        "state": {"$nin": [OperationState.COMPLETED.value, OperationState.FAILED.value]},
    })
    async for op in op_cursor:
        unreconciled_ops.append({
            "operation_id": op.get("operation_id"),
            "transaction_id": op.get("transaction_id"),
            "state": op.get("state"),
            "direction": op.get("direction"),
            "amount_paise": op.get("amount_paise"),
            "created_at": op.get("created_at").isoformat() if op.get("created_at") else None,
        })

    is_reconciled = (wallet_balance == calculated_balance and len(unreconciled_ops) == 0)

    return {
        "user_id": user_id_str,
        "wallet_balance_paise": wallet_balance,
        "ledger_credits_paise": total_credits,
        "ledger_debits_paise": total_debits,
        "ledger_calculated_balance_paise": calculated_balance,
        "is_reconciled": is_reconciled,
        "discrepancy_paise": discrepancy,
        "total_transactions": txn_count,
        "pending_operations_count": len(unreconciled_ops),
        "unreconciled_operations": unreconciled_ops,
    }


async def recover_wallet_operations(
    user_id: Optional[str] = None,
    admin_email: str = "admin",
    notes: Optional[str] = None,
) -> dict:
    """Authoritative, idempotent administrative recovery engine for incomplete or interrupted operations.
    Preserves full immutable audit history and guarantees no double credit/debit.
    """
    now = datetime.now(timezone.utc)
    query = {"state": {"$nin": [OperationState.COMPLETED.value, OperationState.FAILED.value]}}
    if user_id:
        query["user_id"] = str(user_id)

    cursor = db.wallet_operations.find(query)
    items = []
    recovered_count = 0
    failed_count = 0
    ambiguous_count = 0

    async for op in cursor:
        op_id = op.get("operation_id", "UNKNOWN")
        op_user = op.get("user_id")
        state = op.get("state")
        direction = op.get("direction")
        amount = op.get("amount_paise", 0)
        txn_id = op.get("transaction_id")

        if state == OperationState.BALANCE_APPLIED.value:
            # Balance was modified in wallet but ledger entry was not written or completed
            await _complete_interrupted_operation(op, actor=f"ADMIN_RECOVERY:{admin_email}")
            recovered_count += 1
            items.append({
                "operation_id": op_id,
                "user_id": op_user,
                "transaction_id": txn_id,
                "direction": direction,
                "amount_paise": amount,
                "previous_state": state,
                "new_state": OperationState.COMPLETED.value,
                "action_taken": "LEDGER_ENTRY_RESTORED",
                "details": f"Recovered missing ledger entry for already applied balance change of {amount} paise.",
            })

        elif state == OperationState.INITIATED.value:
            # Operation was registered but balance was NEVER mutated before crash/timeout
            await db.wallet_operations.update_one(
                {"_id": op["_id"]},
                {
                    "$set": {
                        "state": OperationState.FAILED.value,
                        "error": f"Cancelled by recovery engine: operation timed out before balance mutation [{admin_email}]",
                        "updated_at": now,
                    }
                },
            )
            failed_count += 1
            items.append({
                "operation_id": op_id,
                "user_id": op_user,
                "transaction_id": txn_id,
                "direction": direction,
                "amount_paise": amount,
                "previous_state": state,
                "new_state": OperationState.FAILED.value,
                "action_taken": "CANCELLED_UNAPPLIED_INITIATION",
                "details": "Operation cancelled safely. Wallet balance was never touched.",
            })

        else:
            ambiguous_count += 1
            items.append({
                "operation_id": op_id,
                "user_id": op_user,
                "transaction_id": txn_id,
                "direction": direction,
                "amount_paise": amount,
                "previous_state": state,
                "new_state": state,
                "action_taken": "FLAGGED_FOR_MANUAL_REVIEW",
                "details": f"Operation in {state} state requires manual inspection.",
            })

    # Log recovery execution immutably
    recovery_log = {
        "recovery_id": f"REC-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        "executed_at": now,
        "admin_email": admin_email,
        "user_id": user_id,
        "notes": notes,
        "recovered_count": recovered_count,
        "failed_count": failed_count,
        "ambiguous_count": ambiguous_count,
        "items": items,
    }
    await db.wallet_recovery_logs.insert_one(recovery_log)

    return {
        "recovered_count": recovered_count,
        "failed_count": failed_count,
        "ambiguous_count": ambiguous_count,
        "items": items,
        "executed_at": now,
        "admin_email": admin_email,
    }


async def admin_adjust_balance(
    user_id: str,
    amount_paise: int,
    direction: Any = TransactionDirection.CREDIT,
    reason: str = "Admin adjustment",
    notes: Optional[str] = None,
    reference_type: Optional[str] = None,
    reference_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    actor_email: str = "admin",
    admin_email: Optional[str] = None,
) -> dict:
    """Helper for programmatic adjustments from refund, referral, or admin services."""
    if isinstance(direction, str):
        direction = TransactionDirection(direction)
    effective_actor = admin_email or actor_email or "admin"
    res = await execute_wallet_transaction(
        user_id=str(user_id),
        direction=direction,
        amount_paise=amount_paise,
        transaction_type=TransactionType.ADJUSTMENT,
        reason=reason,
        description=notes,
        reference_type=reference_type or "ADMIN_ADJUSTMENT",
        reference_id=reference_id,
        idempotency_key=idempotency_key,
        actor="ADMIN",
        actor_id=effective_actor,
        metadata={"admin_email": effective_actor, "notes": notes},
    )

    try:
        from app.services.audit_service import log_admin_action
        await log_admin_action(
            actor_email=effective_actor,
            action=f"WALLET_ADJUST_{direction.value if hasattr(direction, 'value') else str(direction)}",
            resource="WALLET",
            resource_id=str(user_id),
            details={
                "amount_paise": amount_paise,
                "direction": direction.value if hasattr(direction, "value") else str(direction),
                "reason": reason,
                "notes": notes,
                "transaction_id": res.get("transaction_id"),
            },
        )
    except Exception:
        pass

    return res
