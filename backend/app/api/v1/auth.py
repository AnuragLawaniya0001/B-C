"""Customer authentication endpoints: OTP, registration, login, and tokens."""
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.core.rate_limit import check_rate_limit
from app.schemas.auth_schema import (
    LoginRequest,
    MessageResponse,
    OtpResponse,
    RefreshTokenRequest,
    RegisterRequest,
    SendOtpRequest,
    TokenResponse,
    UserResponse,
    VerifyOtpRequest,
)
from app.services import auth_service, otp_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp", response_model=OtpResponse, summary="Send one-time password")
async def send_otp(request: SendOtpRequest):
    """Generate and dispatch an OTP to a mobile number or email address.
    Rate limited to 3 requests per 5 minutes per identifier.
    In development mode, returns the mock_otp/dev_otp directly in response.
    """
    check_rate_limit(f"send_otp:{request.identifier}", max_requests=3, window_seconds=300)
    result = await auth_service.send_otp(request.identifier, request.purpose.value)
    return OtpResponse(
        message=result["message"],
        expires_in_seconds=result["expires_in_seconds"],
        mock_otp=result.get("mock_otp"),
        dev_otp=result.get("dev_otp"),
    )


@router.post("/verify-otp", response_model=MessageResponse, summary="Verify one-time password")
async def verify_otp(request: VerifyOtpRequest):
    """Verify an OTP code for a specified identifier and purpose.
    Rate limited to 10 attempts per 5 minutes.
    """
    check_rate_limit(f"verify_otp:{request.identifier}", max_requests=10, window_seconds=300)
    try:
        await otp_service.verify_otp(request.identifier, request.otp, request.purpose.value)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return MessageResponse(message="OTP verified")


@router.post("/register", response_model=TokenResponse, summary="Register customer account")
async def register(request: RegisterRequest):
    """Register a new customer account. Requires prior OTP verification within 10 minutes.
    Automatically creates a zero-balance wallet and returns JWT tokens.
    """
    result = await auth_service.register_user(request)
    return TokenResponse(**result)


@router.post("/login", response_model=TokenResponse, summary="Customer login")
async def login(request: LoginRequest):
    """Authenticate customer via email or mobile number and password.
    Rate limited to 5 attempts per 5 minutes per identifier.
    """
    check_rate_limit(f"login:{request.identifier}", max_requests=5, window_seconds=300)
    result = await auth_service.login(request.identifier, request.password)
    return TokenResponse(**result)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(request: RefreshTokenRequest):
    """Exchange a valid refresh token for a newly signed access token."""
    result = await auth_service.refresh_access_token(request.refresh_token)
    return TokenResponse(**result)


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve the authenticated customer's profile."""
    return UserResponse(**current_user)


@router.post("/logout", response_model=MessageResponse, summary="Logout session")
async def logout(current_user: dict = Depends(get_current_user)):
    """Log out currently authenticated user (stateless session termination)."""
    return MessageResponse(message="Logged out successfully")
