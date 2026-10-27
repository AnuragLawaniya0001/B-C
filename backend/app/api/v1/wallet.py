"""FastAPI endpoints for Customer Wallet and Administrative Ledger Management."""
import re
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.core.database import db
from app.core.dependencies import get_current_user, get_current_admin
from app.schemas.wallet_schema import (
    WalletResponse,
    WalletTransactionResponse,
    WalletTransactionListResponse,
    CustomerWalletSummaryResponse,
    AdminWalletAdjustmentRequest,
    AdminWalletListResponse,
    AdminWalletListItemResponse,
    WalletReconciliationResponse,
    WalletRecoveryRequest,
    WalletRecoveryResponse,
    TransactionDirection,
    TransactionType,
)
from app.services.wallet_service import (
    _to_object_id,
    serialize_doc,
    get_or_create_wallet,
    execute_wallet_transaction,
    reconcile_wallet,
    recover_wallet_operations,
)

router = APIRouter(prefix="/wallet", tags=["Wallet"])


# ==============================================================================
# Customer Endpoints
# ==============================================================================

@router.get("/me", response_model=CustomerWalletSummaryResponse, summary="Get customer wallet summary & recent activity")
async def get_my_wallet(
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the authenticated customer's wallet balance and summary metrics."""
    user_id = current_user["id"]
    wallet = await get_or_create_wallet(user_id)

    # Fetch recent transactions
    cursor = db.wallet_transactions.find({"user_id": user_id}).sort("created_at", -1).limit(5)
    recent = []
    total_credited = 0
    total_debited = 0
    total_count = 0

    async for doc in cursor:
        recent.append(serialize_doc(doc))

    # Aggregates
    all_txns = db.wallet_transactions.find({"user_id": user_id, "status": "SUCCESS"})
    async for t in all_txns:
        total_count += 1
        amt = int(t.get("amount_paise", 0))
        if t.get("direction") == "CREDIT":
            total_credited += amt
        elif t.get("direction") == "DEBIT":
            total_debited += amt

    return {
        "wallet": serialize_doc(wallet),
        "total_credited_paise": total_credited,
        "total_debited_paise": total_debited,
        "total_transactions": total_count,
        "recent_transactions": recent,
    }


@router.get("/me/transactions", response_model=WalletTransactionListResponse, summary="List authenticated customer's transaction ledger")
async def get_my_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Paginated list of immutable ledger entries for the authenticated customer."""
    user_id = current_user["id"]
    query = {"user_id": user_id}

    total = await db.wallet_transactions.count_documents(query)
    cursor = db.wallet_transactions.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_doc(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/me/transactions/{transaction_id_or_num}", response_model=WalletTransactionResponse, summary="Get single transaction detail")
async def get_my_transaction_detail(
    transaction_id_or_num: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve details of a single ledger transaction with strict customer ownership protection."""
    user_id = current_user["id"]
    oid = _to_object_id(transaction_id_or_num)

    query = {
        "$and": [
            {"user_id": user_id},
            {"$or": [{"transaction_id": transaction_id_or_num}] + ([{"_id": oid}] if oid else [])},
        ]
    }

    doc = await db.wallet_transactions.find_one(query)
    if not doc:
        # Check if transaction exists for another user to throw 403 Forbidden
        exists_elsewhere = await db.wallet_transactions.find_one(
            {"$or": [{"transaction_id": transaction_id_or_num}] + ([{"_id": oid}] if oid else [])}
        )
        if exists_elsewhere:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this transaction",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction '{transaction_id_or_num}' not found",
        )

    return serialize_doc(doc)


# ==============================================================================
# Admin Endpoints
# ==============================================================================

@router.get("/admin/wallets", response_model=AdminWalletListResponse, summary="List customer wallets with search & filters (Admin)")
async def list_customer_wallets_admin(
    search: Optional[str] = Query(None, description="Search by customer name, email, or user ID"),
    wallet_status: Optional[str] = Query(None, description="Filter by wallet status: ACTIVE, LOCKED, SUSPENDED"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Admin inspection of customer wallets and active balances."""
    query = {}
    if wallet_status and wallet_status.upper() != "ALL":
        query["status"] = wallet_status.upper()

    # If search keyword provided, resolve matching user IDs from users collection
    if search and search.strip():
        s = search.strip()
        s_regex = {"$regex": re.escape(s), "$options": "i"}
        users_cursor = db.users.find({
            "$or": [
                {"email": s_regex},
                {"name": s_regex},
                {"mobile": s_regex},
            ]
        }, {"_id": 1})

        matching_user_ids = []
        async for u in users_cursor:
            matching_user_ids.append(str(u["_id"]))

        # Include direct user_id match
        matching_user_ids.append(s)
        query["user_id"] = {"$in": matching_user_ids}

    total = await db.wallets.count_documents(query)
    cursor = db.wallets.find(query).sort("updated_at", -1).skip(skip).limit(limit)

    items = []
    async for w in cursor:
        uid = w.get("user_id")
        user_doc = None
        oid = _to_object_id(uid)
        if oid:
            user_doc = await db.users.find_one({"_id": oid})
        if not user_doc:
            user_doc = await db.users.find_one({"_id": uid})

        # Count transactions
        txn_count = await db.wallet_transactions.count_documents({"user_id": uid})

        items.append({
            "wallet": serialize_doc(w),
            "customer_name": user_doc.get("name") if user_doc else "Unknown Customer",
            "customer_email": user_doc.get("email") if user_doc else None,
            "customer_mobile": user_doc.get("mobile") if user_doc else None,
            "is_member": bool(user_doc.get("is_member") or user_doc.get("user_type") == "MEMBER") if user_doc else False,
            "transaction_count": txn_count,
        })

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/admin/wallets/{user_id}", response_model=CustomerWalletSummaryResponse, summary="Inspect customer wallet and ledger (Admin)")
async def inspect_customer_wallet_admin(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve customer's wallet and full ledger summary for administrative review."""
    wallet = await get_or_create_wallet(user_id)

    cursor = db.wallet_transactions.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    recent = []
    total_credited = 0
    total_debited = 0
    total_count = 0

    async for doc in cursor:
        recent.append(serialize_doc(doc))

    all_txns = db.wallet_transactions.find({"user_id": user_id, "status": "SUCCESS"})
    async for t in all_txns:
        total_count += 1
        amt = int(t.get("amount_paise", 0))
        if t.get("direction") == "CREDIT":
            total_credited += amt
        elif t.get("direction") == "DEBIT":
            total_debited += amt

    return {
        "wallet": serialize_doc(wallet),
        "total_credited_paise": total_credited,
        "total_debited_paise": total_debited,
        "total_transactions": total_count,
        "recent_transactions": recent,
    }


@router.post("/admin/adjust", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED, summary="Controlled administrative balance adjustment (Admin)")
async def adjust_customer_wallet_admin(
    payload: AdminWalletAdjustmentRequest,
    x_fault_injection: Optional[str] = Header(None, alias="X-Fault-Injection"),
    current_admin: dict = Depends(get_current_admin),
):
    """Authoritative administrative balance adjustment with positive amount, mandatory reason, and audit logging.
    Guarantees integer paise arithmetic and prevents negative balances on debit.
    """
    if payload.amount_paise is not None:
        amount_paise = payload.amount_paise
    elif payload.amount_rupees is not None:
        amount_paise = round(payload.amount_rupees * 100)
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either amount_rupees or amount_paise must be provided and greater than zero",
        )

    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Adjustment amount must be strictly greater than zero",
        )

    admin_email = current_admin.get("email", "admin")

    txn = await execute_wallet_transaction(
        user_id=payload.user_id,
        direction=payload.direction,
        amount_paise=amount_paise,
        transaction_type=TransactionType.ADJUSTMENT,
        reason=payload.reason,
        description=payload.notes,
        reference_type=payload.reference_type or "ADMIN_ADJUSTMENT",
        reference_id=payload.reference_id,
        idempotency_key=payload.idempotency_key,
        actor="ADMIN",
        actor_id=admin_email,
        metadata={"admin_email": admin_email, "notes": payload.notes},
        _fault_injection=x_fault_injection,
    )

    return txn


@router.get("/admin/reconcile/{user_id}", response_model=WalletReconciliationResponse, summary="Reconcile wallet balance against ledger (Admin)")
async def reconcile_customer_wallet_admin(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Detect and report any discrepancy between the wallet balance, pending operations, and the sum of ledger entries."""
    reconciliation = await reconcile_wallet(user_id)
    return reconciliation


@router.post("/admin/recover", response_model=WalletRecoveryResponse, summary="Idempotent administrative failure recovery (Admin)")
async def recover_wallet_operations_admin(
    payload: Optional[WalletRecoveryRequest] = None,
    current_admin: dict = Depends(get_current_admin),
):
    """Authoritative administrative recovery engine.
    Scans for incomplete operations across crashes or interrupted mutations,
    safely restores missing ledger records for applied balances, and cancels unapplied operations.
    """
    admin_email = current_admin.get("email", "admin")
    target_user_id = payload.user_id if payload else None
    notes = payload.notes if payload else None

    recovery_result = await recover_wallet_operations(
        user_id=target_user_id,
        admin_email=admin_email,
        notes=notes,
    )
    return recovery_result

