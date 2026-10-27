"""Admin audit logging endpoints."""
from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, Optional

from app.core.dependencies import get_current_admin
from app.services.audit_service import get_admin_audit_logs

router = APIRouter(prefix="/admin", tags=["Admin Audit"])


@router.get("/audit-logs", summary="List admin audit logs with filtering (Admin)")
async def admin_audit_logs(
    actor: Optional[str] = Query(None, description="Filter by admin email"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    resource: Optional[str] = Query(None, description="Filter by resource type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_admin: dict = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Retrieve immutable audit trail of admin actions."""
    data = await get_admin_audit_logs(actor=actor, action=action, resource=resource, skip=skip, limit=limit)
    return {
        "success": True,
        "data": data,
    }
