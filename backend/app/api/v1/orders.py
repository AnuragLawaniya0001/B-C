"""FastAPI endpoints for Order Management & Checkout Foundation."""
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import db
from app.core.dependencies import get_current_user, get_current_admin
from app.schemas.order_schema import (
    OrderCreateRequest,
    OrderStatusUpdateRequest,
    OrderResponse,
    OrderListResponse,
    OrderCancelRequest,
    OrderReturnRequest,
    AdminReturnReviewRequest,
    AdminRefundRequest,
    ShipmentTrackingSchema,
)
from app.services.order_service import (
    _to_object_id,
    serialize_order_doc,
    create_authoritative_order,
    update_order_status,
    update_order_tracking,
)
from app.services.refund_service import (
    customer_cancel_order,
    customer_request_return,
    admin_review_return,
    process_admin_refund,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=OrderResponse, summary="Create customer order (Authenticated)")
async def create_order(
    payload: OrderCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Customer places a new order.
    Prices, membership discounts, and coupon validity are calculated strictly on the backend.
    Initial state: PENDING_PAYMENT / NOT_STARTED.
    """
    order = await create_authoritative_order(current_user, payload)
    return order


@router.get("/my", response_model=OrderListResponse, summary="List authenticated customer's own orders")
async def get_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List orders belonging to the authenticated customer."""
    user_id = current_user["id"]
    query = {"user_id": user_id}

    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_order_doc(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/my/{order_id_or_num}", response_model=OrderResponse, summary="Get customer's own single order detail")
async def get_my_order_detail(
    order_id_or_num: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve details of a customer's own order. Rejects unauthorized access from other customers."""
    user_id = current_user["id"]
    oid = _to_object_id(order_id_or_num)

    query = {
        "$and": [
            {"user_id": user_id},
            {"$or": [{"order_number": order_id_or_num}] + ([{"_id": oid}] if oid else [])},
        ]
    }

    doc = await db.orders.find_one(query)
    if not doc:
        # Check if order exists but belongs to another user
        exists_elsewhere = await db.orders.find_one(
            {"$or": [{"order_number": order_id_or_num}] + ([{"_id": oid}] if oid else [])}
        )
        if exists_elsewhere:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this order",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id_or_num}' not found",
        )

    return serialize_order_doc(doc)


@router.get("", response_model=OrderListResponse, summary="List all orders with filters (Admin)")
async def get_all_orders_admin(
    search: Optional[str] = Query(None, description="Search by order number, name, email, or mobile"),
    order_status: Optional[str] = Query(None, description="Filter by order status"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve all platform orders with search, status filters, and pagination."""
    query = {}

    if order_status and order_status.upper() != "ALL":
        query["order_status"] = order_status.upper()

    if payment_status and payment_status.upper() != "ALL":
        query["payment_status"] = payment_status.upper()

    if search and search.strip():
        s = search.strip()
        s_regex = {"$regex": re.escape(s), "$options": "i"}
        query["$or"] = [
            {"order_number": s_regex},
            {"customer_name": s_regex},
            {"customer_email": s_regex},
            {"customer_mobile": s_regex},
        ]

    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_order_doc(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/{order_id_or_num}", response_model=OrderResponse, summary="Get any order detail (Admin)")
async def get_order_detail_admin(
    order_id_or_num: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve full order details for administrative inspection."""
    oid = _to_object_id(order_id_or_num)
    query = {"$or": [{"order_number": order_id_or_num}]}
    if oid:
        query["$or"].append({"_id": oid})

    doc = await db.orders.find_one(query)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id_or_num}' not found",
        )

    return serialize_order_doc(doc)


@router.patch("/{order_id_or_num}/status", response_model=OrderResponse, summary="Update order status (Admin)")
@router.patch("/admin/{order_id_or_num}/status", response_model=OrderResponse, include_in_schema=False)
async def update_order_status_admin(
    order_id_or_num: str,
    payload: OrderStatusUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Transition an order to a new lifecycle state with transition validation and audit trail."""
    updated = await update_order_status(order_id_or_num, payload, current_admin)
    return updated


@router.post("/my/{order_id_or_num}/cancel", response_model=OrderResponse, summary="Customer cancels eligible order")
async def cancel_my_order(
    order_id_or_num: str,
    payload: OrderCancelRequest,
    current_user: dict = Depends(get_current_user),
):
    """Customer self-service cancellation with policy check, stock restoration, and wallet refund if paid."""
    user_id = current_user["id"]
    user_email = current_user.get("email", "customer")
    updated = await customer_cancel_order(order_id_or_num, payload.reason, user_id, user_email)
    return updated


@router.post("/my/{order_id_or_num}/return", response_model=OrderResponse, summary="Customer requests return for delivered order")
async def return_my_order(
    order_id_or_num: str,
    payload: OrderReturnRequest,
    current_user: dict = Depends(get_current_user),
):
    """Customer requests return on delivered items with validation of ordered quantities."""
    user_id = current_user["id"]
    user_email = current_user.get("email", "customer")
    items_dicts = [it.model_dump() for it in payload.items]
    updated = await customer_request_return(
        order_number=order_id_or_num,
        items=items_dicts,
        reason=payload.reason,
        bank_or_upi_details=payload.bank_or_upi_details,
        user_id=user_id,
        user_email=user_email,
    )
    return updated


@router.post("/admin/{order_id_or_num}/tracking", response_model=OrderResponse, summary="Admin updates tracking information")
async def update_tracking_admin(
    order_id_or_num: str,
    payload: ShipmentTrackingSchema,
    current_admin: dict = Depends(get_current_admin),
):
    """Add or update tracking information and advance order to SHIPPED if in packing/processing."""
    updated = await update_order_tracking(order_id_or_num, payload, current_admin)
    return updated


@router.post("/admin/{order_id_or_num}/review-return", response_model=OrderResponse, summary="Admin reviews return request")
async def review_return_admin(
    order_id_or_num: str,
    payload: AdminReturnReviewRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin approves or rejects customer return request with optional inventory restock."""
    updated = await admin_review_return(
        order_number=order_id_or_num,
        decision=payload.decision,
        notes=payload.notes,
        restock_inventory=payload.restock_inventory,
        admin_user=current_admin,
    )
    return updated


@router.post("/admin/{order_id_or_num}/refund", response_model=OrderResponse, summary="Admin executes order refund")
async def refund_order_admin(
    order_id_or_num: str,
    payload: AdminRefundRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Authoritative refund execution via Gateway or Wallet with bounded amounts."""
    updated = await process_admin_refund(
        order_number=order_id_or_num,
        amount_paise=payload.amount_paise,
        refund_method=payload.refund_method,
        reason=payload.reason,
        restock_items=payload.restock_items,
        admin_user=current_admin,
    )
    return updated


@router.get("/admin/returns/list", summary="List orders with return requests (Admin)")
async def list_returns_admin(
    status_filter: Optional[str] = Query(None, description="RETURN_REQUESTED, RETURN_APPROVED, RETURN_REJECTED"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """List orders that have active return requests."""
    query = {"return_request": {"$ne": None}}
    if status_filter and status_filter.upper() != "ALL":
        query["return_request.status"] = status_filter.upper()

    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("return_request.requested_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_order_doc(doc))

    return {"items": items, "total": total, "skip": skip, "limit": limit}

