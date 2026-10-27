"""Disaster Recovery Drill Runner & RTO/RPO Verification Engine for BIGCHAMP (Phase 5.9).

Features:
- Isolated database restoration drill (bigchamp_dr_restore_test)
- Hard safety interlock preventing accidental production restoration
- End-to-end parity validation: collections, documents, unique indexes, settings, and wallet double-entry ledger
- Accurate measurement of observed RTO (recovery duration) and observed RPO (snapshot delta)
- Generates structured JSON disaster recovery audit report
"""
import argparse
import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.restore_mongodb import execute_restore, ISOLATED_TEST_DB
from scripts.backup_policy import evaluate_backup_freshness, BACKUP_ROOT, DEFAULT_TARGET_RPO_SECONDS

DEFAULT_TARGET_RTO_SECONDS = 900  # 15 minutes


async def run_disaster_recovery_drill(
    archive_path: Path,
    target_db_name: str = ISOLATED_TEST_DB,
    allow_production: bool = False,
) -> Dict[str, Any]:
    """Execute non-destructive DR drill with strict safety and invariant checks."""
    t0 = time.perf_counter()
    now_utc = datetime.now(timezone.utc)

    # 1. Strict production protection gate
    if target_db_name == "bigchamp" and not allow_production:
        raise PermissionError(
            "CRITICAL SAFETY INTERLOCK: Restoration directly into production database 'bigchamp' "
            "is strictly blocked. To rehearse DR safely, omit target_db_name to use 'bigchamp_dr_restore_test'. "
            "If an authorized disaster recovery is explicitly required, pass --force-production-restore-authorized."
        )

    # 2. Evaluate backup freshness & baseline RPO
    freshness = evaluate_backup_freshness(BACKUP_ROOT, target_rpo_seconds=DEFAULT_TARGET_RPO_SECONDS)
    observed_rpo_seconds = freshness.get("observed_age_seconds", 0)

    # 3. Execute isolated restore & invariant validation
    restore_res = await execute_restore(archive_path=archive_path, target_db_name=target_db_name)

    total_duration = round(time.perf_counter() - t0, 3)
    target_rto_seconds = DEFAULT_TARGET_RTO_SECONDS
    rto_met = total_duration <= target_rto_seconds
    rpo_met = (observed_rpo_seconds is not None) and (observed_rpo_seconds <= DEFAULT_TARGET_RPO_SECONDS)

    report = {
        "drill_id": f"DR-DRILL-{now_utc.strftime('%Y%m%d_%H%M%S')}",
        "timestamp": now_utc.isoformat(),
        "status": "SUCCESS" if (restore_res["success"] and restore_res["financial_invariants_verified"]) else "FAILED",
        "archive_inspected": str(archive_path),
        "target_database": target_db_name,
        "is_isolated_test_db": (target_db_name != "bigchamp"),
        "restored_collections_count": restore_res["restored_collections"],
        "restored_documents_count": restore_res["restored_documents"],
        "financial_invariants_verified": restore_res["financial_invariants_verified"],
        "recovery_time_objective": {
            "target_rto_seconds": target_rto_seconds,
            "observed_rto_seconds": total_duration,
            "target_rto_met": rto_met,
            "performance_margin_seconds": round(target_rto_seconds - total_duration, 2),
        },
        "recovery_point_objective": {
            "target_rpo_seconds": DEFAULT_TARGET_RPO_SECONDS,
            "observed_rpo_seconds": observed_rpo_seconds,
            "target_rpo_met": rpo_met,
            "backup_created_at": freshness.get("created_at"),
            "backup_staleness": freshness.get("status"),
        },
    }

    # Save drill artifact
    report_file = BACKUP_ROOT / "latest_dr_drill_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return report


def main():
    parser = argparse.ArgumentParser(description="BIGCHAMP Disaster Recovery Drill Runner")
    parser.add_argument("--archive", type=str, default="", help="Path to backup archive (defaults to latest)")
    parser.add_argument("--target-db", type=str, default=ISOLATED_TEST_DB, help=f"Destination DB (defaults to {ISOLATED_TEST_DB})")
    parser.add_argument("--force-production-restore-authorized", action="store_true", help="Explicit override for emergency production restore")

    args = parser.parse_args()

    archive = Path(args.archive) if args.archive else None
    if not archive:
        archives = sorted(BACKUP_ROOT.glob("**/*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not archives:
            print("[!] No backup archive found to run drill.", file=sys.stderr)
            sys.exit(1)
        archive = archives[0]

    report = asyncio.run(
        run_disaster_recovery_drill(
            archive_path=archive,
            target_db_name=args.target_db,
            allow_production=args.force_production_restore_authorized,
        )
    )

    print(json.dumps(report, indent=2))
    sys.exit(0 if report["status"] == "SUCCESS" else 1)


if __name__ == "__main__":
    main()
