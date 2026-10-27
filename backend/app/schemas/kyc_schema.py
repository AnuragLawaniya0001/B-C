"""Pydantic schemas for Manual KYC Review Workflow and Audit Trail."""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class KYCStatusEnum(str, Enum):
    NOT_SUBMITTED = "NOT_SUBMITTED"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RESUBMISSION_REQUESTED = "RESUBMISSION_REQUESTED"


class DocumentTypeEnum(str, Enum):
    AADHAAR_MASKED = "AADHAAR_MASKED"
    PAN = "PAN"
    VOTER_ID = "VOTER_ID"
    DEFENSE_ID = "DEFENSE_ID"
    PASSPORT = "PASSPORT"


class KYCSubmitRequest(BaseModel):
    id_type: DocumentTypeEnum = Field(..., description="Document type: AADHAAR_MASKED, PAN, VOTER_ID, DEFENSE_ID")
    id_number_masked: str = Field(..., min_length=4, max_length=50, description="Masked ID identifier (e.g. XXXX-XXXX-1234)")
    document_url: str = Field(..., min_length=5, max_length=500, description="Secure document file URI or storage key")
    full_name: str = Field(..., min_length=2, max_length=120, description="Legal full name as printed on ID")
    dob: Optional[str] = Field(None, max_length=20, description="Date of birth YYYY-MM-DD")
    notes: Optional[str] = Field(None, max_length=300)


class KYCReviewRequest(BaseModel):
    status: KYCStatusEnum = Field(..., description="Target status: APPROVED, REJECTED, RESUBMISSION_REQUESTED")
    rejection_reason: Optional[str] = Field(None, max_length=300, description="User-facing rejection reason")
    internal_notes: Optional[str] = Field(None, max_length=500, description="Audit note recorded by reviewer")


class KYCDocumentResponse(BaseModel):
    id: str
    user_id: str
    id_type: str
    id_number_masked: str
    full_name: str
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
