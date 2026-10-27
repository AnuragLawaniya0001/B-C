"""FastAPI endpoints for Offline Partner Management, Applications, Commissions & Settlements."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_admin, get_current_partner
from app.schemas.partner_schema import (
    PartnerApplyRequest,
    PartnerStatusUpdateRequest,
    PartnerSettlementRequest,
    PartnerResponse,
    PartnerVerifyMemberRequest,
    PartnerRedeemRequest,
)
from app.services.partner_service import (
    apply_partner,
    admin_list_partners,
    admin_update_partner_status,
    get_partner_earnings,
    process_partner_settlement,
    record_partner_commission,
    verify_member_for_partner,
    redeem_service_for_partner,
    admin_get_scan_logs,
)

router = APIRouter(prefix="/partners", tags=["partners"])


@router.post("/apply", status_code=status.HTTP_201_CREATED, summary="Submit partner onboarding application")
async def submit_partner_application(payload: PartnerApplyRequest):
    """Offline sports hostel, dormitory, or physio clinic submits partnership application."""
    result = await apply_partner(payload)
    return result


@router.get("/me/earnings", summary="Partner views own earnings and commission summary")
async def get_my_earnings(current_partner: dict = Depends(get_current_partner)):
    """Authenticated partner checks pending payouts and commission ledger."""
    partner_id = str(current_partner.get("_id") or current_partner.get("id"))
    return await get_partner_earnings(partner_id)


@router.post("/verify-member", summary="Partner verifies customer membership via QR scan or card number")
async def verify_member(
    payload: PartnerVerifyMemberRequest,
    current_partner: dict = Depends(get_current_partner),
):
    """Authenticated partner checks membership validity and status without exposing sensitive user data."""
    return await verify_member_for_partner(
        partner_user=current_partner,
        qr_payload=payload.qr_payload,
        card_number=payload.card_number,
    )


@router.post("/redeem", summary="Partner redeems member privilege (e.g. checkin/physio)")
async def redeem_privilege(
    payload: PartnerRedeemRequest,
    current_partner: dict = Depends(get_current_partner),
):
    """Authenticated partner records a one-time privilege redemption with duplicate prevention."""
    return await redeem_service_for_partner(
        partner_user=current_partner,
        req=payload,
    )


@router.get("/admin/list", summary="List partner applications and directories (Admin)")
async def list_partners_admin(
    status_filter: Optional[str] = Query(None, description="PENDING, APPROVED, REJECTED, SUSPENDED, ACTIVE"),
    search: Optional[str] = Query(None, description="Search by business name, email, or city"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Admin inspects partner applications with filter, search, and pagination."""
    return await admin_list_partners(status_filter=status_filter, search=search, skip=skip, limit=limit)


@router.get("/admin/{partner_id}", summary="Get partner details and commission ledger (Admin)")
async def get_partner_admin(
    partner_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin views partner profile, balance, and commission audit history."""
    return await get_partner_earnings(partner_id)


@router.patch("/admin/{partner_id}/status", summary="Approve, reject, or update partner status (Admin)")
async def update_partner_status_admin(
    partner_id: str,
    payload: PartnerStatusUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin reviews partner onboarding or modifies status and custom commission rate."""
    return await admin_update_partner_status(
        partner_id=partner_id,
        new_status=payload.status.value,
        commission_rate=payload.commission_rate_percent,
        notes=payload.notes,
        admin_user=current_admin,
    )


@router.post("/admin/{partner_id}/settlement", summary="Execute payout settlement for partner (Admin)")
async def settle_partner_admin(
    partner_id: str,
    payload: PartnerSettlementRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin records payout settlement against pending commissions."""
    admin_email = current_admin.get("email", "admin")
    return await process_partner_settlement(
        partner_id=partner_id,
        amount_paise=payload.amount_paise,
        payment_reference=payload.payment_reference,
        notes=payload.notes,
        admin_email=admin_email,
    )


@router.post("/admin/{partner_id}/commission", summary="Record partner booking/referral commission (Admin)")
async def credit_partner_commission_admin(
    partner_id: str,
    source_type: str = Query("BOOKING", description="BOOKING, REFERRAL, STORE_ORDER"),
    source_id: str = Query(..., description="Unique booking ID or order ID"),
    gross_amount_paise: int = Query(..., ge=100, description="Gross booking/purchase value in paise"),
    notes: Optional[str] = Query(None),
    current_admin: dict = Depends(get_current_admin),
):
    """Record an eligible transaction commission for an offline partner."""
    return await record_partner_commission(
        partner_id=partner_id,
        source_type=source_type,
        source_id=source_id,
        gross_amount_paise=gross_amount_paise,
        notes=notes,
    )


@router.get("/admin/scan-logs", summary="List partner verification and redemption audit logs (Admin)")
async def list_scan_logs_admin(
    partner_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    card_number: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Admin inspects partner QR scan verifications and service redemptions."""
    return await admin_get_scan_logs(
        partner_id=partner_id,
        action=action,
        card_number=card_number,
        skip=skip,
        limit=limit,
    )
