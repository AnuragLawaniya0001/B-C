"""Operational health, readiness, and diagnostic endpoints (Phase 5.3)."""
import time
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.database import get_db, db
from app.core.dependencies import get_current_admin
from app.core.metrics import metrics

router = APIRouter(prefix="/health", tags=["Operational Health & Diagnostics"])


@router.get("", summary="Basic API operational status")
@router.get("/live", summary="Liveness probe: verifies process is alive")
async def liveness_probe() -> Dict[str, Any]:
    """Lightweight process liveness probe.
    Does NOT query database or external providers. Safe for frequent polling (every 5-10s).
    """
    return {
        "status": "alive",
        "service": "bigchamp-api",
        "environment": settings.ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ready", summary="Readiness probe: verifies system can serve traffic")
async def readiness_probe() -> Dict[str, Any]:
    """Readiness probe verifying essential persistence dependencies.
    Fails with HTTP 503 if primary MongoDB database is unreachable or unresponsive.
    """
    t0 = time.perf_counter()
    try:
        # Ping MongoDB server availability with 2.0s timeout
        await db.command("ping")
        db_latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        # Confirm settings collection exists
        settings_count = await db.settings.count_documents({})
        is_ready = settings_count > 0

        return {
            "status": "ready" if is_ready else "degraded",
            "service": "bigchamp-api",
            "database": {
                "connected": True,
                "latency_ms": db_latency_ms,
                "configured": is_ready,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        db_latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unready",
                "service": "bigchamp-api",
                "database": {
                    "connected": False,
                    "latency_ms": db_latency_ms,
                    "error": "Database unreachable",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


@router.get("/db", summary="Legacy database connection check")
async def get_db_health(database=Depends(get_db)):
    """Health check endpoint verifying connection to MongoDB."""
    try:
        await database.command("ping")
        return {"db": "connected"}
    except Exception:
        return {"db": "disconnected"}


@router.get(
    "/diagnostics",
    summary="Restricted operational diagnostics (Admin Only)",
)
async def operational_diagnostics(current_admin: dict = Depends(get_current_admin)) -> Dict[str, Any]:
    """Deep operational diagnostics and infrastructure health telemetry.
    Restricted to authenticated platform administrators.
    Exposes connection states, configuration integrity, payment mode, and metrics summary.
    """
    # 1. MongoDB detailed stats
    db_stats = {}
    try:
        server_info = await db.command("buildInfo")
        db_stats = {
            "version": server_info.get("version"),
            "connected": True,
        }
    except Exception as e:
        db_stats = {"connected": False, "error": str(e)}

    # 2. Payment provider readiness
    payment_diagnostics = {
        "payment_mode": settings.PAYMENT_MODE,
        "key_id_configured": bool(settings.RAZORPAY_KEY_ID and not settings.RAZORPAY_KEY_ID.startswith("your")),
        "secret_configured": bool(settings.RAZORPAY_KEY_SECRET and not settings.RAZORPAY_KEY_SECRET.startswith("your")),
        "webhook_secret_configured": bool(settings.RAZORPAY_WEBHOOK_SECRET),
    }

    # 3. Telemetry summary
    metrics_summary = metrics.get_summary()

    # 4. Backup freshness inspection (Phase 5.9)
    backup_freshness = {}
    try:
        import sys
        from pathlib import Path
        sys.path.insert(0, "/app")
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))
        from scripts.backup_policy import evaluate_backup_freshness
        backup_freshness = evaluate_backup_freshness()
    except Exception as e:
        backup_freshness = {"status": "UNKNOWN", "error": str(e)}

    return {
        "status": "healthy",
        "environment": settings.ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_stats,
        "payment_provider": payment_diagnostics,
        "backup_freshness": backup_freshness,
        "telemetry": metrics_summary,
    }
