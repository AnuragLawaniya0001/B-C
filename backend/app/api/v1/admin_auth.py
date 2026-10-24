"""Administrator authentication endpoints."""
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_admin
from app.core.rate_limit import check_rate_limit
from app.schemas.auth_schema import (
    AdminLoginRequest,
    AdminResponse,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


@router.post("/login", response_model=TokenResponse, summary="Admin login")
async def admin_login(request: AdminLoginRequest):
    """Authenticate administrator account with email and password.
    Rate limited to 5 attempts per 5 minutes per email.
    """
    check_rate_limit(f"admin_login:{request.email}", max_requests=5, window_seconds=300)
    result = await auth_service.admin_login(request.email, request.password)
    return TokenResponse(**result)


@router.get("/me", response_model=AdminResponse, summary="Get current admin profile")
async def get_admin_me(current_admin: dict = Depends(get_current_admin)):
    """Retrieve authenticated administrator profile."""
    return AdminResponse(**current_admin)
