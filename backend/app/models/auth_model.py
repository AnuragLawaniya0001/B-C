"""Pydantic database models for authentication and user records."""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class OtpDocument(BaseModel):
    """Schema representing an OTP record stored in otp_store collection."""
    identifier: str = Field(..., description="Email or mobile number")
    otp: str = Field(..., description="6-digit one-time password")
    purpose: str = Field(..., description="REGISTER | LOGIN | RESET_PASSWORD")
    attempts: int = Field(default=0, description="Verification attempts counter")
    used: bool = Field(default=False, description="Whether OTP has been successfully verified")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(..., description="Timestamp when OTP expires")
    verified_at: Optional[datetime] = Field(default=None, description="Timestamp when verified")


class UserDocument(BaseModel):
    """Schema representing a user stored in users collection."""
    email: Optional[str] = Field(default=None, description="User email address")
    mobile: Optional[str] = Field(default=None, description="User mobile number")
    full_name: str = Field(..., description="User full name")
    password_hash: str = Field(..., description="Bcrypt hashed password")
    role: str = Field(default="USER", description="Account role: USER | ADMIN | PARTNER")
    kyc_status: str = Field(default="NOT_SUBMITTED", description="KYC status")
    is_army: bool = Field(default=False, description="Whether user claims defense personnel status")
    army_verified: bool = Field(default=False, description="Whether defense credentials verified")
    is_active: bool = Field(default=True, description="Account active status")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = Field(default=None, description="Timestamp of last successful login")
