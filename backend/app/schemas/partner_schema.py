"""Pydantic schemas for Offline Partner Lifecycle, Commissions & Settlements."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr


class PartnerStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"
    ACTIVE = "ACTIVE"


class PartnerBusinessType(str, Enum):
    DORMITORY = "DORMITORY"
    PHYSIO_CLINIC = "PHYSIO_CLINIC"
    SPORTS_ACADEMY = "SPORTS_ACADEMY"
    OTHER = "OTHER"


class CommissionStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    PAYABLE = "PAYABLE"
    PAID = "PAID"
    REVERSED = "REVERSED"


class PartnerApplyRequest(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=150)
    contact_person: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: Optional[str] = Field(default="Partner@123", min_length=6)
    business_type: PartnerBusinessType = Field(default=PartnerBusinessType.DORMITORY)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5, max_length=300)
    pincode: str = Field(..., min_length=4, max_length=10)
    commission_rate_percent: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    notes: Optional[str] = Field(default=None, max_length=500)


class PartnerStatusUpdateRequest(BaseModel):
    status: PartnerStatus
    commission_rate_percent: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    notes: Optional[str] = Field(default=None, max_length=500)


class PartnerSettlementRequest(BaseModel):
    amount_paise: int = Field(..., ge=100, description="Amount to settle in paise")
    payment_reference: str = Field(..., min_length=3, max_length=100, description="Bank UTR / NEFT / IMPS reference")
    notes: Optional[str] = Field(default=None, max_length=300)


class PartnerResponse(BaseModel):
    id: str
    business_name: str
    contact_person: str
    email: str
    phone: str
    business_type: str
    city: str
    state: str
    address: str
    pincode: str
    status: PartnerStatus
    commission_rate_percent: float
    total_earned_paise: int = 0
    total_settled_paise: int = 0
    pending_payout_paise: int = 0
    created_at: datetime
    updated_at: datetime


class PartnerCommissionResponse(BaseModel):
    id: str
    commission_id: str
    partner_id: str
    source_type: str
    source_id: str
    gross_amount_paise: int
    commission_rate_percent: float
    commission_amount_paise: int
    status: CommissionStatus
    notes: Optional[str] = None
    created_at: datetime


class PartnerVerifyMemberRequest(BaseModel):
    qr_payload: Optional[str] = Field(None, description="Signed QR payload scanned by partner camera")
    card_number: Optional[str] = Field(None, description="Manual card number lookup fallback (e.g. BC-MEM-...)")


class PartnerRedeemRequest(BaseModel):
    qr_payload: Optional[str] = Field(None, description="Signed QR payload scanned by partner camera")
    card_number: Optional[str] = Field(None, description="Manual card number lookup fallback")
    service_type: str = Field(default="DORMITORY_CHECKIN", description="Service privilege redeemed: DORMITORY_CHECKIN, PHYSIO_SESSION, FACILITY_ACCESS")
    idempotency_key: Optional[str] = Field(None, description="Client idempotency key to prevent double scan")
    notes: Optional[str] = Field(None, max_length=300)
