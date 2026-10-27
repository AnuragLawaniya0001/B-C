"""FastAPI endpoints for Lucky Draw Lifecycle, Immutable Snapshots & Controlled Draws."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.dependencies import get_current_admin
from app.schemas.lucky_draw_schema import LuckyDrawCycleCreateRequest, LuckyDrawExecuteRequest
from app.services.lucky_draw_service import (
    create_draw_cycle,
    snapshot_cycle_entries,
    execute_draw_cycle,
    list_draw_cycles,
)
from app.services.settings_service import get_business_rules

router = APIRouter(prefix="/lucky-draw", tags=["Lucky Draw"])


@router.get("/status", summary="Public/Admin inspects lucky draw engine readiness and regulatory boundary")
async def get_lucky_draw_engine_status():
    """Returns engine readiness, legal approval status, and default prize."""
    rules = await get_business_rules()
    legal_approved = bool(rules.get("lucky_draw_legal_approved", False))
    return {
        "engine_ready": True,
        "legal_approval_status": "APPROVED — LIVE CONTEST PERMITTED" if legal_approved else "BLOCKED — LEGAL/BUSINESS APPROVAL REQUIRED",
        "live_draw_enabled": legal_approved,
        "dry_run_simulation_available": True,
        "frequency": rules.get("lucky_draw_frequency", "weekly"),
        "default_prize_paise": rules.get("lucky_draw_prize_paise", 50000),
        "requires_active_membership": bool(rules.get("lucky_draw_requires_membership", True)),
    }


@router.post("/admin/cycles", status_code=status.HTTP_201_CREATED, summary="Initialize lucky draw cycle (Admin)")
async def create_cycle_admin(
    payload: LuckyDrawCycleCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin schedules prospective lucky draw window."""
    return await create_draw_cycle(req=payload, admin_user=current_admin)


@router.get("/admin/cycles", summary="List lucky draw cycles and outcomes (Admin)")
async def list_cycles_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Admin inspects historical and scheduled draw cycles."""
    return await list_draw_cycles(skip=skip, limit=limit)


@router.post("/admin/cycles/{cycle_id}/snapshot", summary="Freeze eligible Cookey purchase snapshot (Admin)")
async def snapshot_cycle_admin(
    cycle_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin freezes immutable list of active member Cookey buyers for the draw cycle."""
    return await snapshot_cycle_entries(cycle_id=cycle_id, admin_user=current_admin)


@router.post("/admin/cycles/{cycle_id}/execute", summary="Execute auditable random selection (Admin)")
async def execute_cycle_admin(
    cycle_id: str,
    payload: LuckyDrawExecuteRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Execute cryptographically fair random draw with audit hashing and optional dry run."""
    return await execute_draw_cycle(cycle_id=cycle_id, req=payload, admin_user=current_admin)
