"""Pydantic schemas for Dynamic Membership System (Phase 4.1)."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class RenewalPolicyEnum(str, Enum):
    EXTEND_FROM_EXPIRY = "EXTEND_FROM_EXPIRY"
    START_FROM_ACTIVATION = "START_FROM_ACTIVATION"


class MembershipStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    PENDING = "PENDING"
    REQUIRES_RECONCILIATION = "REQUIRES_RECONCILIATION"


class MembershipPurchaseStatusEnum(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"
    REQUIRES_RECONCILIATION = "REQUIRES_RECONCILIATION"


class MembershipSettingsSchema(BaseModel):
    """Authoritative schema for admin-configured membership business settings."""
    enabled: bool = Field(default=True, description="Whether new membership purchases/renewals are enabled")
    price_paise: int = Field(default=10000, ge=100, le=10000000, description="Membership fee in integer paise (e.g. 10000 = ₹100.00)")
    validity_days: int = Field(default=334, ge=1, le=3650, description="Membership validity duration in days")
    renewal_policy: RenewalPolicyEnum = Field(default=RenewalPolicyEnum.EXTEND_FROM_EXPIRY, description="Policy for calculating new validity period")
    allow_renewal_while_active: bool = Field(default=True, description="Allow renewal before current membership expires")
    allow_renewal_after_expiry: bool = Field(default=True, description="Allow renewal after current membership has expired")
    display_name: str = Field(default="Bigchamp Digital Membership Card", min_length=2, max_length=120)
    description: str = Field(
        default="Annual digital sports privilege pass with partner benefits, store discounts, and athletic community privileges.",
        min_length=5,
        max_length=1000
    )
    benefits: List[str] = Field(
        default_factory=lambda: [
            "Member-exclusive pricing across all Bigchamp store gear and apparel",
            "QR privilege check-in at affiliated sports dormitories and physio centers",
            "Priority access and participation in athletic community events",
            "Exclusive eligibility for upcoming Cookey and community offers",
        ]
    )
    version: int = Field(default=1, ge=1, description="Monotonically increasing configuration version")

    @field_validator("price_paise")
    @classmethod
    def validate_price(cls, v: int) -> int:
        if v < 100:
            raise ValueError("Membership price must be at least 100 paise (₹1.00)")
        return v

    @field_validator("validity_days")
    @classmethod
    def validate_validity(cls, v: int) -> int:
        if v < 1 or v > 3650:
            raise ValueError("Membership validity must be between 1 and 3650 days (approx. 10 years)")
        return v


class UpdateMembershipSettingsRequest(BaseModel):
    """Admin request to update membership settings. Version is automatically incremented."""
    enabled: Optional[bool] = None
    price_paise: Optional[int] = Field(None, ge=100, le=10000000)
    validity_days: Optional[int] = Field(None, ge=1, le=3650)
    renewal_policy: Optional[RenewalPolicyEnum] = None
    allow_renewal_while_active: Optional[bool] = None
    allow_renewal_after_expiry: Optional[bool] = None
    display_name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = Field(None, min_length=5, max_length=1000)
    benefits: Optional[List[str]] = None


class PublicMembershipSettingsResponse(BaseModel):
    """Safe public representation of membership settings for client display."""
    enabled: bool
    price_paise: int
    price_inr: float
    validity_days: int
    renewal_policy: str
    allow_renewal_while_active: bool
    allow_renewal_after_expiry: bool
    display_name: str
    description: str
    benefits: List[str]
    version: int


class MembershipPurchaseInitiateRequest(BaseModel):
    idempotency_key: Optional[str] = Field(None, max_length=120)


class MembershipPurchaseInitiateResponse(BaseModel):
    purchase_id: str
    order_id: str
    provider_order_id: str
    amount_paise: int
    currency: str
    key_id: str
    display_name: str
    snapshotted_validity_days: int
    config_version: int
    is_renewal: bool


class MembershipVerifyRequest(BaseModel):
    purchase_id: str
    razorpay_order_id: Optional[str] = None
    provider_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    provider_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    provider_signature: Optional[str] = None

    @property
    def order_id(self) -> str:
        return self.razorpay_order_id or self.provider_order_id or ""

    @property
    def payment_id(self) -> str:
        return self.razorpay_payment_id or self.provider_payment_id or ""

    @property
    def signature(self) -> str:
        return self.razorpay_signature or self.provider_signature or ""


class MembershipPeriodHistoryItem(BaseModel):
    purchase_id: str
    period_start: datetime
    period_end: datetime
    price_paise: int
    validity_days: int
    config_version: int
    activated_at: datetime
    renewal_policy: Optional[str] = None


class MembershipStatusResponse(BaseModel):
    is_active: bool
    status: str
    card_number: Optional[str] = None
    valid_till: Optional[datetime] = None
    period_start: Optional[datetime] = None
    remaining_days: int = 0
    can_renew: bool = True
    renewal_message: Optional[str] = None
    latest_purchase_id: Optional[str] = None
    total_periods_count: int = 0
    periods_history: List[MembershipPeriodHistoryItem] = Field(default_factory=list)
    qr_payload: Optional[str] = None


class MembershipCancelRequest(BaseModel):
    purchase_id: str
    reason: Optional[str] = "Customer closed membership checkout modal"


class AdminMembershipListItem(BaseModel):
    membership_id: str
    id: Optional[str] = None
    user_id: str
    user_name: Optional[str] = "Customer"
    user_mobile: Optional[str] = ""
    user_email: Optional[str] = ""
    card_number: Optional[str] = None
    status: str
    is_active: bool
    current_period_start: Optional[datetime] = None
    valid_till: Optional[datetime] = None
    remaining_days: int = 0
    total_periods_count: int = 0
    latest_purchase_id: Optional[str] = None
    updated_at: Optional[datetime] = None


class AdminMembershipListResponse(BaseModel):
    items: List[AdminMembershipListItem]
    total: int
    skip: int
    limit: int
    active_count: int
    expired_count: int
