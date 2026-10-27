"""Pydantic schemas for Order Management and Server-Authoritative Checkout."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr


class OrderStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    PACKED = "PACKED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    RETURN_REQUESTED = "RETURN_REQUESTED"
    RETURN_APPROVED = "RETURN_APPROVED"
    RETURN_REJECTED = "RETURN_REJECTED"
    RETURNED = "RETURNED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"
    REQUIRES_RECONCILIATION = "REQUIRES_RECONCILIATION"


class PaymentStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"


# Allowed state transitions for OrderStatus
VALID_ORDER_TRANSITIONS: Dict[OrderStatus, List[OrderStatus]] = {
    OrderStatus.PENDING_PAYMENT: [OrderStatus.CONFIRMED, OrderStatus.REQUIRES_RECONCILIATION, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.REQUIRES_RECONCILIATION, OrderStatus.CANCELLED],
    OrderStatus.REQUIRES_RECONCILIATION: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    OrderStatus.DELIVERED: [OrderStatus.RETURN_REQUESTED],
    OrderStatus.RETURN_REQUESTED: [OrderStatus.RETURN_APPROVED, OrderStatus.RETURN_REJECTED, OrderStatus.CANCELLED],
    OrderStatus.RETURN_APPROVED: [OrderStatus.RETURNED, OrderStatus.REFUND_PENDING, OrderStatus.REFUNDED],
    OrderStatus.RETURN_REJECTED: [OrderStatus.DELIVERED],
    OrderStatus.RETURNED: [OrderStatus.REFUND_PENDING, OrderStatus.REFUNDED, OrderStatus.PARTIALLY_REFUNDED],
    OrderStatus.REFUND_PENDING: [OrderStatus.REFUNDED, OrderStatus.PARTIALLY_REFUNDED],
    OrderStatus.PARTIALLY_REFUNDED: [OrderStatus.REFUNDED],
    OrderStatus.REFUNDED: [],  # Terminal
    OrderStatus.CANCELLED: [OrderStatus.REFUND_PENDING, OrderStatus.REFUNDED],
}


class DeliveryAddressSchema(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Customer recipient name")
    phone: str = Field(..., min_length=10, max_length=15, description="Contact phone number")
    street_address: str = Field(..., min_length=5, max_length=250, description="Apartment, house number, street")
    city: str = Field(..., min_length=2, max_length=100, description="City / Town")
    state: str = Field(..., min_length=2, max_length=100, description="State / Province")
    pin_code: str = Field(..., min_length=4, max_length=10, description="Postal / PIN Code")


class ShipmentTrackingSchema(BaseModel):
    carrier: str = Field(..., min_length=2, max_length=50, description="Courier or carrier name")
    tracking_number: str = Field(..., min_length=3, max_length=100, description="Shipment tracking identifier/AWB")
    tracking_url: Optional[str] = Field(default=None, max_length=300)
    estimated_delivery: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    notes: Optional[str] = None


class OrderCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=300, description="Cancellation reason")


class OrderReturnItemRequest(BaseModel):
    product_id: str = Field(..., min_length=1)
    qty: int = Field(default=1, ge=1)
    reason: Optional[str] = None


class OrderReturnRequest(BaseModel):
    items: List[OrderReturnItemRequest] = Field(..., min_length=1)
    reason: str = Field(..., min_length=3, max_length=500)
    bank_or_upi_details: Optional[str] = None


class AdminReturnReviewRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REJECT")
    notes: Optional[str] = None
    restock_inventory: bool = Field(default=True)


class AdminRefundRequest(BaseModel):
    amount_paise: Optional[int] = Field(default=None, ge=100, description="Full refund if omitted, or partial paise amount")
    refund_method: str = Field(default="GATEWAY", description="GATEWAY or WALLET")
    reason: str = Field(..., min_length=3, max_length=300)
    restock_items: bool = Field(default=True)


class OrderItemRequest(BaseModel):
    product_id: str = Field(..., min_length=1, description="Product ID or unique slug")
    qty: int = Field(default=1, ge=1, le=50, description="Positive purchase quantity")


class OrderCreateRequest(BaseModel):
    items: List[OrderItemRequest] = Field(..., min_length=1, description="List of items to purchase")
    delivery_address: DeliveryAddressSchema
    coupon_code: Optional[str] = Field(default=None, max_length=50, description="Optional discount coupon code")
    idempotency_key: Optional[str] = Field(default=None, max_length=100, description="Client-generated key to prevent duplicate orders")
    notes: Optional[str] = Field(default=None, max_length=300, description="Optional customer delivery instructions")


class OrderItemSnapshot(BaseModel):
    product_id: str
    slug: str
    name: str
    category: str
    unit_price_paise: int
    regular_price_paise: int
    is_member_price: bool = False
    qty: int
    line_total_paise: int
    image: Optional[str] = None


class OrderStatusHistoryEntry(BaseModel):
    status: OrderStatus
    previous_status: Optional[OrderStatus] = None
    changed_by: str
    changed_at: datetime
    notes: Optional[str] = None


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus = Field(..., description="Target order status")
    notes: Optional[str] = Field(default=None, max_length=300, description="Reason or operational tracking notes")


class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_mobile: Optional[str] = None
    is_member: bool = False
    items: List[OrderItemSnapshot]
    subtotal_paise: int
    discount_paise: int = 0
    coupon_code: Optional[str] = None
    delivery_charge_paise: int = 0
    tax_paise: int = 0
    final_payable_paise: int
    business_config_snapshot: Optional[Dict[str, Any]] = None
    delivery_address: DeliveryAddressSchema
    order_status: OrderStatus
    payment_status: PaymentStatus
    idempotency_key: Optional[str] = None
    tracking: Optional[ShipmentTrackingSchema] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    return_request: Optional[Dict[str, Any]] = None
    refund_summary: Optional[Dict[str, Any]] = None
    status_history: List[OrderStatusHistoryEntry] = []
    created_at: datetime
    updated_at: datetime


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    skip: int
    limit: int
