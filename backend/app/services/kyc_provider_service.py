"""External Automated KYC Provider Adapter Interface (Safe Boundary).
Documents required credentials, regulatory sandbox protocols, and maintains BLOCKED status
until approved enterprise credentials (UIDAI e-KYC / Digilocker / HyperVerge / Cashfree) are provided.
"""
from typing import Dict, Any


class AutomatedKYCProviderAdapter:
    """Safe integration interface for third-party automated identity verification.
    Live automated verification remains BLOCKED until approved enterprise provider credentials
    and regulatory data privacy review are documented.
    """

    PROVIDER_NAME: str = "UIDAI_DIGILOCKER_MOCK_BOUNDARY"
    STATUS: str = "BLOCKED — CREDENTIALS/APPROVAL REQUIRED"

    @classmethod
    def get_provider_status(cls) -> Dict[str, Any]:
        """Expose authoritative boundary capability and integration prerequisites."""
        return {
            "provider": cls.PROVIDER_NAME,
            "status": cls.STATUS,
            "automated_e_kyc_enabled": False,
            "live_selfie_liveness_enabled": False,
            "defense_service_id_ocr_enabled": False,
            "manual_review_fallback_active": True,
            "required_prerequisites": [
                "Approved Digilocker / UIDAI Sub-AUA agreement",
                "Licensed OCR & Facematch SDK API keys (HyperVerge / Cashfree / Signzy)",
                "Documented Customer Consent Architecture (DPDP Act 2023 compliance)",
                "Statutory 12-digit Aadhaar truncation & masking vault",
            ],
            "fallback_workflow": "Manual administrative review queue via /api/v1/kyc/admin/list",
        }

    @classmethod
    async def verify_document_automated(cls, user_id: str, document_payload: dict) -> dict:
        """Automated verification entrypoint - rejected safely when credentials unconfigured."""
        return {
            "success": False,
            "error_code": "PROVIDER_UNCONFIGURED",
            "message": "Automated government identity verification is currently pending provider credentials. Document routed to manual administrative review queue.",
            "status": "BLOCKED — CREDENTIALS REQUIRED",
        }
