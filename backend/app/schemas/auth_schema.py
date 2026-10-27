"""Pydantic schemas for auth requests and responses."""
from datetime import datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.core.security import validate_password_strength


class OtpPurpose(str, Enum):
    REGISTER = "REGISTER"
    LOGIN = "LOGIN"
    RESET_PASSWORD = "RESET_PASSWORD"


class SendOtpRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    identifier: str = Field(..., min_length=3, description="Email address or 10-digit mobile number")
    purpose: OtpPurpose = Field(..., description="REGISTER | LOGIN | RESET_PASSWORD")

    @field_validator("identifier")
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Identifier cannot be empty")
        return clean


class VerifyOtpRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    identifier: str = Field(..., min_length=3, description="Email address or mobile number")
    otp: str = Field(..., min_length=4, max_length=10, description="One-time password")
    purpose: OtpPurpose = Field(..., description="REGISTER | LOGIN | RESET_PASSWORD")


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    identifier: str = Field(..., min_length=3, description="Email address or mobile number verified via OTP")
    password: str = Field(..., min_length=8, description="Password with min 8 chars, 1 upper, 1 lower, 1 digit")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name")
    email: Optional[str] = Field(default=None, description="Optional if identifier is mobile")
    mobile: Optional[str] = Field(default=None, description="Optional if identifier is email")
    referral_code: Optional[str] = Field(default=None, description="Optional referral code of referring user")

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        is_valid, msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(msg)
        return v

    @field_validator("full_name")
    @classmethod
    def check_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return cleaned


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    identifier: str = Field(..., min_length=3, description="Email address or mobile number")
    password: str = Field(..., min_length=1, description="Account password")


class RefreshTokenRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    refresh_token: str = Field(..., min_length=10, description="Valid refresh token")


class AdminLoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(..., min_length=3, description="Administrator email address")
    password: str = Field(..., min_length=1, description="Administrator password")


class PartnerLoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(..., min_length=3, description="Partner user email address")
    password: str = Field(..., min_length=1, description="Partner password")


class UpdateProfileRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[str] = Field(default=None)
    mobile: Optional[str] = Field(default=None)


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    identifier: str = Field(..., min_length=3, description="Email address or mobile number")
    otp: Optional[str] = Field(default=None, description="Optional OTP code if not verified prior")
    new_password: str = Field(..., min_length=8, description="New password")

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        is_valid, msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(msg)
        return v


# Response Schemas

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    full_name: str
    role: str = "USER"
    kyc_status: str = "NOT_SUBMITTED"
    is_army: bool = False
    army_verified: bool = False
    is_active: bool = True
    has_membership: bool = False
    created_at: Optional[datetime] = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    full_name: str
    role: str = "USER"
    kyc_status: str = "NOT_SUBMITTED"
    is_army: bool = False
    army_verified: bool = False
    is_active: bool = True
    has_membership: bool = False
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None


class AdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str = "ADMIN"
    is_active: bool = True
    created_at: Optional[datetime] = None


class PartnerUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str = "PARTNER"
    partner_id: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: Optional[Any] = None
    has_membership: Optional[bool] = False


class OtpResponse(BaseModel):
    message: str
    expires_in_seconds: int
    mock_otp: Optional[str] = None
    dev_otp: Optional[str] = None


class MessageResponse(BaseModel):
    message: str
