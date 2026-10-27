"""FastAPI endpoints for Razorpay Sandbox Payments, Durable Recovery, and Webhook Processing."""
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status

from app.core.config import settings
from app.core.database import db
from app.core.dependencies import get_current_user, get_current_admin
from app.schemas.payment_schema import (
    PaymentCreateOrderRequest,
    PaymentCreateOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PaymentCancelRequest,
    PaymentRecoverRequest,
    PaymentRecoverResponse,
    PaymentResponse,
    PaymentListResponse,
    PaymentOperationResponse,
    PaymentOperationListResponse,
)
from app.services.payment_service import (
    create_payment_order,
    verify_payment,
    cancel_payment_attempt,
    recover_payment_operation,
    process_webhook,
    serialize_doc,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


# ==============================================================================
# Customer Endpoints
# ==============================================================================

@router.post("/create-order", response_model=PaymentCreateOrderResponse, status_code=status.HTTP_201_CREATED, summary="Create Razorpay test-mode payment order")
async def create_razorpay_order(
    payload: PaymentCreateOrderRequest,
    current_user: dict = Depends(get_current_user),
):
    """Initiate a Razorpay payment order for an authenticated customer's unpaid order."""
    user_id = current_user["id"]
    res = await create_payment_order(
        user_id=user_id,
        order_id_or_num=payload.order_id,
        idempotency_key=payload.idempotency_key,
    )
    return res


@router.post("/verify", response_model=PaymentVerifyResponse, summary="Verify Razorpay payment signature & confirm order")
async def verify_razorpay_payment(
    payload: PaymentVerifyRequest,
    x_payment_fault_stage: Optional[str] = Header(None, alias="X-Payment-Fault-Stage"),
    current_user: dict = Depends(get_current_user),
):
    """Cryptographically verify Razorpay payment signature and authoritatively confirm order and inventory."""
    user_id = current_user["id"]
    # Fault injection is strictly guarded: only allowed in development
    fault = x_payment_fault_stage if settings.ENV == "development" else None

    res = await verify_payment(
        user_id=user_id,
        order_id_or_num=payload.order_id,
        provider_order_id=payload.provider_order_id,
        provider_payment_id=payload.provider_payment_id,
        provider_signature=payload.provider_signature,
        fault_stage=fault,
    )
    return res


@router.post("/cancel", summary="Cancel an active payment attempt")
async def cancel_customer_payment(
    payload: PaymentCancelRequest,
    current_user: dict = Depends(get_current_user),
):
    """Allow customer to cancel a checkout attempt without modifying an already paid order."""
    user_id = current_user["id"]
    res = await cancel_payment_attempt(
        user_id=user_id,
        order_id_or_num=payload.order_id,
        provider_order_id=payload.provider_order_id,
        reason=payload.reason,
    )
    return res


@router.get("/my-payments", response_model=PaymentListResponse, summary="List authenticated customer's payment history")
async def get_my_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve paginated payment records for the authenticated customer."""
    user_id = current_user["id"]
    query = {"user_id": user_id}
    total = await db.payments.count_documents(query)
    cursor = db.payments.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_doc(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}


# ==============================================================================
# Public Webhook Endpoint
# ==============================================================================

@router.post("/webhook", summary="Razorpay Webhook receiver")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
):
    """Process incoming Razorpay webhook notifications with cryptographic signature verification and idempotency."""
    raw_body = await request.body()
    result = await process_webhook(raw_body=raw_body, signature_header=x_razorpay_signature)
    return result


# ==============================================================================
# Admin Endpoints
# ==============================================================================

@router.get("/admin/payments", response_model=PaymentListResponse, summary="List payments with search & filters (Admin)")
async def list_payments_admin(
    search: Optional[str] = Query(None, description="Search by payment ID, order number, customer name or provider ID"),
    status: Optional[str] = Query(None, description="Filter by status: ATTEMPTED, SUCCESS, FAILED, REQUIRES_RECONCILIATION"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Admin inspection of customer payments across the ecosystem."""
    query = {}
    if status and status.upper() != "ALL":
        query["status"] = status.upper()

    if search and search.strip():
        term = search.strip()
        query["$or"] = [
            {"payment_id": {"$regex": term, "$options": "i"}},
            {"order_number": {"$regex": term, "$options": "i"}},
            {"customer_name": {"$regex": term, "$options": "i"}},
            {"provider_order_id": {"$regex": term, "$options": "i"}},
            {"provider_payment_id": {"$regex": term, "$options": "i"}},
        ]

    total = await db.payments.count_documents(query)
    cursor = db.payments.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_doc(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/admin/payments/{payment_id}", response_model=PaymentResponse, summary="Get payment detail & audit history (Admin)")
async def get_payment_detail_admin(
    payment_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve details and complete audit trail for a specific payment."""
    doc = await db.payments.find_one({"$or": [{"payment_id": payment_id}, {"provider_order_id": payment_id}]})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment '{payment_id}' not found",
        )
    return serialize_doc(doc)


@router.post("/admin/recover", response_model=PaymentRecoverResponse, summary="Recover interrupted payment finalization (Admin)")
async def recover_payment_admin(
    payload: PaymentRecoverRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Inspect and safely execute missing finalization steps for an interrupted payment operation."""
    actor_email = current_admin.get("email", "admin")
    res = await recover_payment_operation(
        payment_id_or_operation_id=payload.payment_id_or_operation_id,
        actor=actor_email,
        notes=payload.notes,
    )
    return res


@router.get("/admin/operations", response_model=PaymentOperationListResponse, summary="List durable payment operations (Admin)")
async def list_operations_admin(
    state: Optional[str] = Query(None, description="Filter by state: INITIATED, ORDER_CONFIRMED, COMPLETED, REQUIRES_RECONCILIATION"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """List durable payment operations to monitor recovery and reconciliation states."""
    query = {}
    if state and state.upper() != "ALL":
        query["state"] = state.upper()

    total = await db.payment_operations.count_documents(query)
    cursor = db.payment_operations.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_doc(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}
