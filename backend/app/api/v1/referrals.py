"""API routes for customer referral system and loyalty rewards."""
from fastapi import APIRouter, Depends, Query
from typing import Dict, Any

from app.core.dependencies import get_current_user, get_current_admin
from app.services.referral_service import get_user_referral_summary, admin_list_referrals

router = APIRouter(tags=["Referrals"])


@router.get("/referrals/me", summary="Get current user referral stats, code, and invited list")
async def get_my_referral_info(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Retrieve personal referral code, shareable link, earned reward totals, and invited users list."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    data = await get_user_referral_summary(user_id)
    return {
        "success": True,
        "data": data
    }


@router.get("/admin/referrals/list", summary="List all referral attributions (Admin)")
async def admin_get_referrals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_admin: dict = Depends(get_current_admin)
) -> Dict[str, Any]:
    """Admin view of all referral links, statuses (PENDING/COMPLETED), and credit payouts."""
    data = await admin_list_referrals(skip=skip, limit=limit)
    return {
        "success": True,
        "data": data
    }
