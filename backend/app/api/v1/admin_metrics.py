"""Admin telemetry and metrics inspection endpoints (Phase 5.3)."""
from typing import Dict, Any
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_admin
from app.core.metrics import metrics

router = APIRouter(prefix="/admin/metrics", tags=["Admin Telemetry"])


@router.get("", summary="Retrieve platform telemetry and operational metrics (Admin)")
async def get_platform_metrics(current_admin: dict = Depends(get_current_admin)) -> Dict[str, Any]:
    """Retrieve operational telemetry, route traffic, HTTP status distribution, and financial invariants."""
    return {
        "success": True,
        "data": metrics.get_summary(),
    }
