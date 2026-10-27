"""FastAPI endpoints for customer membership lifecycle (Phase 4.1)."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user
from app.schemas.membership_schema import (
    PublicMembershipSettingsResponse,
    MembershipStatusResponse,
    MembershipPurchaseInitiateRequest,
    MembershipPurchaseInitiateResponse,
    MembershipVerifyRequest,
    MembershipCancelRequest,
)
from app.services.membership_service import (
    get_membership_settings,
    get_customer_membership_status,
    initiate_membership_purchase,
    verify_membership_payment,
    cancel_membership_purchase,
    get_customer_purchase_history,
)

router = APIRouter(prefix="/membership", tags=["Membership"])


@router.get(
    "/settings",
    response_model=PublicMembershipSettingsResponse,
    summary="Retrieve current public dynamic membership settings",
)
async def get_public_membership_settings():
    """Returns dynamic membership configuration, pricing, validity duration, and display text."""
    settings_obj = await get_membership_settings()
    return {
        "enabled": settings_obj.enabled,
        "price_paise": settings_obj.price_paise,
        "price_inr": settings_obj.price_paise / 100.0,
        "validity_days": settings_obj.validity_days,
        "renewal_policy": settings_obj.renewal_policy.value,
        "allow_renewal_while_active": settings_obj.allow_renewal_while_active,
        "allow_renewal_after_expiry": settings_obj.allow_renewal_after_expiry,
        "display_name": settings_obj.display_name,
        "description": settings_obj.description,
        "benefits": settings_obj.benefits,
        "version": settings_obj.version,
    }


@router.get(
    "/status",
    response_model=MembershipStatusResponse,
    summary="Get authenticated customer's authoritative membership status",
)
async def get_membership_status(current_user: dict = Depends(get_current_user)):
    """Authoritative status, remaining days, and dynamic renewal eligibility."""
    return await get_customer_membership_status(current_user["id"])


@router.post(
    "/purchase",
    response_model=MembershipPurchaseInitiateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate membership purchase or renewal with dynamic pricing snapshot",
)
async def initiate_purchase(
    payload: MembershipPurchaseInitiateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Snapshots current dynamic price and duration, creates Razorpay test order, and initiates pending purchase."""
    return await initiate_membership_purchase(
        user_id=current_user["id"],
        idempotency_key=payload.idempotency_key,
    )


@router.post(
    "/verify",
    summary="Cryptographically verify payment signature and activate membership period",
)
async def verify_purchase_payment(
    payload: MembershipVerifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Verify Razorpay payment signature and authoritatively activate the customer's membership."""
    return await verify_membership_payment(
        user_id=current_user["id"],
        purchase_id=payload.purchase_id,
        provider_order_id=payload.order_id,
        provider_payment_id=payload.payment_id,
        provider_signature=payload.signature,
    )


@router.post(
    "/cancel",
    summary="Record customer checkout modal dismissal",
)
async def cancel_purchase(
    payload: MembershipCancelRequest,
    current_user: dict = Depends(get_current_user),
):
    """Marks pending payment attempt as cancelled without failing order or preventing retry."""
    return await cancel_membership_purchase(
        user_id=current_user["id"],
        purchase_id=payload.purchase_id,
        reason=payload.reason,
    )


@router.get(
    "/history",
    summary="Customer membership purchases and renewals history",
)
async def get_purchase_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve all historical purchases, renewals, and applied configurations."""
    return await get_customer_purchase_history(
        user_id=current_user["id"],
        skip=skip,
        limit=limit,
    )


@router.get("/autopay/status", summary="Check AutoPay / recurring mandate capability and boundary")
async def get_autopay_boundary_status():
    """Returns Razorpay recurring subscription readiness and boundary status."""
    from app.services.subscription_service import RazorpayAutoPayAdapter
    return RazorpayAutoPayAdapter.get_adapter_status()
