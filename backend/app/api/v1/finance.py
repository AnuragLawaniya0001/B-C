"""Admin financial management, reporting, CSV export, and reconciliation endpoints."""
from fastapi import APIRouter, Depends, Query, Response
from typing import Dict, Any, Optional

from app.core.dependencies import get_current_admin
from app.services.finance_service import (
    get_financial_overview,
    export_financial_report_csv,
    run_payment_reconciliation,
)

router = APIRouter(prefix="/admin/finance", tags=["Admin Finance & Reporting"])


@router.get("/overview", summary="Get comprehensive platform financial summary (Admin)")
async def admin_finance_overview(
    start_date: Optional[str] = Query(None, description="ISO format start date"),
    end_date: Optional[str] = Query(None, description="ISO format end date"),
    current_admin: dict = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Retrieve authoritative financial snapshot: gross/net sales, refunds, taxes, delivery fees, membership revenue, wallet liability, and partner payables."""
    data = await get_financial_overview(start_date=start_date, end_date=end_date)
    return {
        "success": True,
        "data": data,
    }


@router.get("/export", summary="Export orders and sales financial report as CSV (Admin)")
async def admin_export_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_admin: dict = Depends(get_current_admin),
):
    """Download RFC 4180 CSV export of order financial records with taxes, discounts, delivery, and refunds."""
    csv_content = await export_financial_report_csv(start_date=start_date, end_date=end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=bigchamp_finance_{start_date or 'all'}.csv"
        },
    )


@router.get("/reconciliation", summary="Run automated payment and order integrity reconciliation (Admin)")
async def admin_finance_reconciliation(
    current_admin: dict = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Scan payments, operations, and orders for state discrepancies, stale pending payments, and unfulfilled captures."""
    recon_result = await run_payment_reconciliation()
    return {
        "success": True,
        "data": recon_result,
    }
