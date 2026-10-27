"""Pydantic schemas for Razorpay Sandbox Payment Integration."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    INITIATED = "INITIATED"
    ATTEMPTED = "ATTEMPTED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REQUIRES_RECONCILIATION = "REQUIRES_RECONCILIATION"


class PaymentOperationState(str, Enum):
    INITIATED = "INITIATED"
    ORDER_CONFIRMED = "ORDER_CONFIRMED"
    INVENTORY_DEDUCTED = "INVENTORY_DEDUCTED"
    COUPON_REDEEMED = "COUPON_REDEEMED"
    COMPLETED = "COMPLETED"
    REQUIRES_RECONCILIATION = "REQUIRES_RECONCILIATION"


class PaymentCreateOrderRequest(BaseModel):
    order_id: str = Field(..., min_length=1, description="Order ID or order number to pay for")
    idempotency_key: Optional[str] = Field(default=None, max_length=100, description="Optional client idempotency key")


class PaymentCreateOrderResponse(BaseModel):
    payment_id: str
    order_id: str
    order_number: str
    amount_paise: int
    currency: str = "INR"
    provider: str = "RAZORPAY"
    provider_order_id: str
    key_id: str
    status: PaymentStatus
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_mobile: Optional[str] = None


class PaymentVerifyRequest(BaseModel):
    order_id: str = Field(..., min_length=1, description="Order ID or order number")
    provider_order_id: str = Field(..., min_length=1, description="Razorpay order ID (order_...)")
    provider_payment_id: str = Field(..., min_length=1, description="Razorpay payment ID (pay_...)")
    provider_signature: str = Field(..., min_length=1, description="Razorpay HMAC signature")


class PaymentVerifyResponse(BaseModel):
    success: bool
    payment_id: str
    order_id: str
    order_number: str
    order_status: str
    payment_status: str
    amount_paise: int
    message: str
    verified_at: Optional[datetime] = None
    requires_reconciliation: bool = False
    discrepancy: Optional[str] = None


class PaymentCancelRequest(BaseModel):
    order_id: str = Field(..., min_length=1, description="Order ID or order number")
    provider_order_id: Optional[str] = Field(default=None, description="Optional Razorpay provider order ID")
    reason: Optional[str] = Field(default="Customer cancelled checkout modal", max_length=200)


class PaymentRecoverRequest(BaseModel):
    payment_id_or_operation_id: str = Field(..., min_length=1, description="Payment ID or POP Operation ID to recover")
    notes: Optional[str] = Field(default="Admin manual recovery", max_length=250)


class PaymentRecoverResponse(BaseModel):
    success: bool
    operation_id: str
    state: str
    message: str
    recovered_steps: List[str] = []
    discrepancy: Optional[str] = None


class PaymentAuditEntry(BaseModel):
    status: PaymentStatus
    changed_by: str
    changed_at: datetime
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    payment_id: str
    order_id: str
    order_number: Optional[str] = ""
    user_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    provider: str = "RAZORPAY"
    provider_order_id: str
    provider_payment_id: Optional[str] = None
    amount_paise: int
    currency: str = "INR"
    status: PaymentStatus
    provider_status: Optional[str] = None
    failure_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    audit_history: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime


class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    skip: int
    limit: int


class PaymentOperationResponse(BaseModel):
    id: str
    operation_id: str
    payment_id: str
    order_id: str
    order_number: str
    user_id: str
    state: PaymentOperationState
    steps: Dict[str, bool] = {}
    items_deducted: List[Dict[str, Any]] = []
    discrepancy: Optional[str] = None
    discrepancy_details: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class PaymentOperationListResponse(BaseModel):
    items: List[PaymentOperationResponse]
    total: int
    skip: int
    limit: int
