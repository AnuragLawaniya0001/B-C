"""Partner user authentication endpoints."""
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_partner
from app.core.rate_limit import check_rate_limit
from app.schemas.auth_schema import (
    PartnerLoginRequest,
    PartnerUserResponse,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/partner/auth", tags=["partner-auth"])


@router.post("/login", response_model=TokenResponse, summary="Partner user login")
async def partner_login(request: PartnerLoginRequest):
    """Authenticate partner account with email and password.
    Rate limited to 5 attempts per 5 minutes per email.
    """
    check_rate_limit(f"partner_login:{request.email}", max_requests=5, window_seconds=300)
    result = await auth_service.partner_login(request.email, request.password)
    return TokenResponse(**result)


@router.get("/me", response_model=PartnerUserResponse, summary="Get current partner user profile")
async def get_partner_me(current_partner: dict = Depends(get_current_partner)):
    """Retrieve authenticated partner user profile."""
    return PartnerUserResponse(**current_partner)
