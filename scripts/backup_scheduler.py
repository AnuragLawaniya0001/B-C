"""Automated MongoDB Backup Scheduler & Lifecycle Runner for BIGCHAMP (Phase 5.9).

Provides:
- One-shot execution (--once)
- Concurrency protection
- Storage capacity assertion
- Automatic encryption
- Freshness measurement and alerts
- Retention pruning
- Standalone scheduler mode (--daemon)
"""
import argparse
import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Insert project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.backup_mongodb import execute_backup, BACKUP_ROOT
from scripts.backup_policy import (
    BackupConcurrencyLock,
    check_storage_capacity,
    evaluate_backup_freshness,
    prune_expired_backups,
    DEFAULT_TARGET_RPO_SECONDS,
)
from scripts.storage_adapter import EncryptedArchiveAdapter, get_backup_assurance_report


async def run_backup_cycle(encrypt: bool = True, prune_days: int = 7) -> dict:
    """Execute complete automated backup cycle with safeguards and encryption."""
    t0 = time.perf_counter()
    print(f"[*] Starting backup cycle at {datetime.now(timezone.utc).isoformat()}...")

    # 1. Capacity check
    storage_info = check_storage_capacity(BACKUP_ROOT)
    print(f"[+] Storage verified: {storage_info['free_mb']} MB free on filesystem.")

    # 2. Acquire concurrency lock
    with BackupConcurrencyLock():
        # 3. Execute logical snapshot
        backup_res = await execute_backup()
        assert backup_res["success"], "Backup execution returned non-success!"

        archive_path = Path(backup_res["archive_path"])

        # 4. Encrypt if requested
        enc_res = None
        if encrypt:
            enc_adapter = EncryptedArchiveAdapter()
            enc_target = archive_path.with_suffix(".tar.gz.enc")
            enc_res = enc_adapter.encrypt_file(archive_path, enc_target)
            print(f"[+] Archive encrypted with AES-256: {enc_target.name} ({enc_res['encrypted_size_bytes']} bytes)")

        # 5. Prune expired backups according to retention policy
        prune_res = prune_expired_backups(BACKUP_ROOT, retain_days=prune_days)
        if prune_res["pruned_count"] > 0:
            print(f"[+] Pruned {prune_res['pruned_count']} expired backup(s). Retained {prune_res['retained_count']} snapshot(s).")

        # 6. Evaluate freshness
        freshness = evaluate_backup_freshness(BACKUP_ROOT, target_rpo_seconds=DEFAULT_TARGET_RPO_SECONDS)

        duration = round(time.perf_counter() - t0, 3)
        summary = {
            "success": True,
            "backup_id": backup_res["backup_id"],
            "archive_path": str(archive_path),
            "archive_size_bytes": backup_res["archive_size_bytes"],
            "archive_sha256": backup_res["archive_sha256"],
            "encrypted": bool(enc_res),
            "encrypted_path": enc_res["encrypted_path"] if enc_res else None,
            "collections_backed_up": backup_res["total_collections"],
            "documents_backed_up": backup_res["total_documents"],
            "duration_seconds": duration,
            "freshness": freshness,
        }

        # Write cycle log
        log_file = BACKUP_ROOT / "latest_cycle_log.json"
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        print(f"[+] Backup cycle completed successfully in {duration}s. Status: {freshness['status']}")
        return summary


def main():
    parser = argparse.ArgumentParser(description="BIGCHAMP Backup Scheduler & Runner")
    parser.add_argument("--once", action="store_true", help="Run a single backup cycle and exit")
    parser.add_argument("--freshness", action="store_true", help="Evaluate backup freshness against target RPO")
    parser.add_argument("--assurance", action="store_true", help="Display 4-tier backup assurance report")
    parser.add_argument("--prune", type=int, default=0, help="Prune backups older than N days")
    parser.add_argument("--no-encrypt", action="store_true", help="Skip archive encryption")
    parser.add_argument("--interval", type=int, default=3600, help="Scheduler loop interval in seconds (default: 3600)")

    args = parser.parse_args()

    if args.freshness:
        freshness = evaluate_backup_freshness(BACKUP_ROOT)
        print(json.dumps(freshness, indent=2))
        sys.exit(0 if not freshness["is_stale"] else 1)

    if args.assurance:
        report = get_backup_assurance_report()
        print(json.dumps(report, indent=2))
        sys.exit(0)

    if args.prune > 0:
        res = prune_expired_backups(BACKUP_ROOT, retain_days=args.prune)
        print(json.dumps(res, indent=2))
        sys.exit(0)

    if args.once:
        summary = asyncio.run(run_backup_cycle(encrypt=not args.no_encrypt))
        sys.exit(0 if summary["success"] else 1)

    # Daemon scheduler loop
    print(f"[*] Starting BIGCHAMP Backup Daemon (Interval: {args.interval}s, Target RPO: {DEFAULT_TARGET_RPO_SECONDS}s)...")
    while True:
        try:
            asyncio.run(run_backup_cycle(encrypt=not args.no_encrypt))
        except Exception as e:
            print(f"[!] Backup cycle failed: {e}", file=sys.stderr)
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
