"""Customer user profile management endpoints."""
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.schemas.auth_schema import (
    UpdateProfileRequest,
    UserProfileResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfileResponse, summary="Get full user profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve full customer profile (sensitive internal fields excluded)."""
    return UserProfileResponse(**current_user)


@router.patch("/me", response_model=UserProfileResponse, summary="Update user profile")
async def update_user_profile(
    updates: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update profile information for the authenticated customer."""
    updated = await auth_service.update_user_profile(current_user["id"], updates)
    return UserProfileResponse(**updated)
