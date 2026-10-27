"""Razorpay Subscriptions / AutoPay Recurring Mandate Service (Integration Boundary).
Maintains robust lifecycle state machine for recurring digital pass renewals.
Kept in safe BLOCKED state until enterprise merchant recurring debits approval is granted.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.database import db


class MandateStatusEnum(str, Enum):
    NOT_CONFIGURED = "NOT_CONFIGURED"
    CREATED = "CREATED"
    AUTHENTICATED = "AUTHENTICATED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    HALTED = "HALTED"
    BLOCKED = "BLOCKED — CREDENTIALS/APPROVAL REQUIRED"


class AutoPayMandateInitiateRequest(BaseModel):
    idempotency_key: Optional[str] = None
    plan_name: str = Field(default="Bigchamp Pass Annual Renewal", max_length=100)


class RazorpayAutoPayAdapter:
    """Production integration adapter for Razorpay Recurring Subscriptions / e-Mandates.
    Status is strictly BLOCKED until approved merchant recurring debit credentials are authenticated.
    """

    PROVIDER_NAME: str = "RAZORPAY_RECURRING_MANDATES"
    STATUS: MandateStatusEnum = MandateStatusEnum.BLOCKED

    @classmethod
    def get_adapter_status(cls) -> Dict[str, Any]:
        """Expose current AutoPay readiness and regulatory prerequisites."""
        return {
            "provider": cls.PROVIDER_NAME,
            "status": cls.STATUS.value,
            "is_live_enabled": False,
            "supported_instruments": ["UPI_AUTOPAY", "ENACH", "CARDS_SI"],
            "required_prerequisites": [
                "Approved Razorpay Subscriptions Add-on contract",
                "Bank sponsor / NPCI e-Mandate live terminal ID",
                "Reserve Bank of India (RBI) recurring debit notification webhook SLA (24h pre-debit SMS)",
                "Customer cancellation and mandate pause UI controls",
            ],
            "fallback_mechanism": "Manual one-click annual digital renewal via /api/v1/membership/purchase",
        }

    @classmethod
    async def initiate_mandate(cls, user_id: str, req: AutoPayMandateInitiateRequest) -> dict:
        """Attempt to initiate recurring mandate - safely rejects with clear explanation."""
        return {
            "success": False,
            "status": cls.STATUS.value,
            "error_code": "AUTOPAY_MERCHANT_CREDENTIALS_REQUIRED",
            "message": "AutoPay recurring subscription is currently BLOCKED pending bank sponsor approvals. Please use one-time annual membership purchase.",
        }

    @classmethod
    async def cancel_mandate(cls, user_id: str, mandate_id: str) -> dict:
        """Customer cancels registered mandate."""
        now = datetime.now(timezone.utc)
        await db.mandates.update_one(
            {"user_id": str(user_id), "mandate_id": mandate_id},
            {"$set": {"status": MandateStatusEnum.CANCELLED.value, "cancelled_at": now}},
        )
        return {"status": MandateStatusEnum.CANCELLED.value, "mandate_id": mandate_id}
