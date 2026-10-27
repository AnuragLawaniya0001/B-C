"""FastAPI endpoints for Customer KYC Submission, Status Tracking & Admin Verification."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.dependencies import get_current_user, get_current_admin
from app.schemas.kyc_schema import KYCSubmitRequest, KYCReviewRequest
from app.services.kyc_service import (
    submit_user_kyc,
    get_user_kyc,
    admin_list_kyc,
    admin_review_kyc,
)
from app.services.kyc_provider_service import AutomatedKYCProviderAdapter

router = APIRouter(prefix="/kyc", tags=["KYC"])


@router.post("/submit", status_code=status.HTTP_201_CREATED, summary="Customer submits KYC documents")
async def submit_kyc(
    payload: KYCSubmitRequest,
    current_user: dict = Depends(get_current_user),
):
    """Customer uploads identity document reference for verification."""
    user_id = str(current_user["id"])
    return await submit_user_kyc(user_id=user_id, req=payload)


@router.get("/me", summary="Customer inspects own KYC verification status")
async def get_my_kyc(current_user: dict = Depends(get_current_user)):
    """Retrieve authenticated customer's current KYC status and notes."""
    user_id = str(current_user["id"])
    return await get_user_kyc(user_id=user_id)


@router.get("/provider-status", summary="Check automated KYC provider readiness and boundary")
async def get_provider_boundary_status():
    """Returns provider integration capabilities, sandbox status, and prerequisites."""
    return AutomatedKYCProviderAdapter.get_provider_status()


@router.get("/admin/list", summary="List pending and reviewed KYC submissions (Admin)")
async def list_kyc_submissions_admin(
    status_filter: Optional[str] = Query(None, description="PENDING_REVIEW, APPROVED, REJECTED, RESUBMISSION_REQUESTED"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Admin inspects customer KYC queue with masked identifiers."""
    return await admin_list_kyc(status_filter=status_filter, skip=skip, limit=limit)


@router.patch("/admin/{user_id}/review", summary="Approve, reject, or request resubmission (Admin)")
async def review_kyc_admin(
    user_id: str,
    payload: KYCReviewRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin completes review, records rejection reason or approval with audit trail."""
    return await admin_review_kyc(target_user_id=user_id, req=payload, admin_user=current_admin)
