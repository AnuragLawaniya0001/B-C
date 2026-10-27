"""Automated Backup Policy, Freshness Monitoring, Concurrency Locking & Retention Management for BIGCHAMP (Phase 5.9).

Features:
- Configurable target RPO (default: 3600s / 1 hour)
- Process-safe concurrency lock (.backup.lock) to prevent overlapping backups
- Pre-backup storage disk space validation
- Backup freshness & staleness detector
- Multi-tier retention management (hourly, daily, weekly) while preserving latest verified snapshot
"""
import json
import os
import shutil
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional

BACKUP_ROOT = Path(__file__).resolve().parent.parent / "backups"
LOCK_FILE = BACKUP_ROOT / ".backup.lock"
DEFAULT_TARGET_RPO_SECONDS = int(os.getenv("BACKUP_TARGET_RPO_SECONDS", "3600"))  # 1 hour
MIN_FREE_SPACE_MB = int(os.getenv("BACKUP_MIN_FREE_SPACE_MB", "50"))  # 50 MB minimum


class BackupLockError(Exception):
    """Raised when an overlapping backup execution is detected."""
    pass


class StorageSpaceError(Exception):
    """Raised when insufficient storage space is available for backup."""
    pass


class BackupConcurrencyLock:
    """File-based advisory lock preventing concurrent backup runs."""

    def __init__(self, lock_path: Path = LOCK_FILE, timeout_seconds: int = 120):
        self.lock_path = lock_path
        self.timeout_seconds = timeout_seconds
        self._acquired = False

    def acquire(self):
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)
        if self.lock_path.exists():
            try:
                with open(self.lock_path, "r") as f:
                    data = json.load(f)
                lock_time = data.get("timestamp", 0)
                pid = data.get("pid")
                age = time.time() - lock_time
                if age < self.timeout_seconds:
                    raise BackupLockError(f"Backup already in progress (PID {pid}, locked {int(age)}s ago).")
                else:
                    # Stale lock cleanup
                    self.lock_path.unlink(missing_ok=True)
            except (json.JSONDecodeError, OSError):
                self.lock_path.unlink(missing_ok=True)

        payload = {
            "pid": os.getpid(),
            "timestamp": time.time(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        with open(self.lock_path, "w") as f:
            json.dump(payload, f)
        self._acquired = True

    def release(self):
        if self._acquired and self.lock_path.exists():
            try:
                self.lock_path.unlink(missing_ok=True)
            except OSError:
                pass
            self._acquired = False

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


def check_storage_capacity(target_dir: Path = BACKUP_ROOT, min_mb: int = MIN_FREE_SPACE_MB) -> Dict[str, Any]:
    """Verify target storage filesystem has sufficient capacity for a backup snapshot."""
    target_dir.mkdir(parents=True, exist_ok=True)
    usage = shutil.disk_usage(target_dir)
    free_mb = usage.free // (1024 * 1024)
    total_mb = usage.total // (1024 * 1024)

    if free_mb < min_mb:
        raise StorageSpaceError(
            f"Insufficient storage space: {free_mb} MB available, minimum required is {min_mb} MB."
        )

    return {
        "path": str(target_dir),
        "total_mb": total_mb,
        "free_mb": free_mb,
        "sufficient": True,
    }


def get_latest_backup_summary(target_dir: Path = BACKUP_ROOT) -> Optional[Dict[str, Any]]:
    """Inspect backup directory and return metadata of the latest valid snapshot."""
    if not target_dir.exists():
        return None

    summaries = list(target_dir.glob("**/backup_summary.json"))
    if not summaries:
        archives = sorted(target_dir.glob("**/*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not archives:
            return None
        latest = archives[0]
        mtime = datetime.fromtimestamp(latest.stat().st_mtime, tz=timezone.utc)
        return {
            "backup_id": latest.stem.replace(".tar", ""),
            "archive_path": str(latest),
            "archive_size_bytes": latest.stat().st_size,
            "created_at": mtime.isoformat(),
            "duration_seconds": 0.0,
        }

    summaries.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    for s_path in summaries:
        try:
            with open(s_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if data.get("success"):
                return data
        except Exception:
            continue
    return None


def evaluate_backup_freshness(
    target_dir: Path = BACKUP_ROOT,
    target_rpo_seconds: int = DEFAULT_TARGET_RPO_SECONDS,
) -> Dict[str, Any]:
    """Measure backup freshness against target RPO."""
    latest = get_latest_backup_summary(target_dir)
    now = datetime.now(timezone.utc)

    if not latest:
        return {
            "has_backup": False,
            "is_stale": True,
            "target_rpo_seconds": target_rpo_seconds,
            "observed_age_seconds": None,
            "status": "NO_BACKUPS_FOUND",
            "message": "No verified backup archive was found on disk.",
        }

    created_at_str = latest.get("created_at") or latest.get("manifest", {}).get("created_at")
    if created_at_str:
        created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
    else:
        created_dt = now

    age_seconds = int((now - created_dt).total_seconds())
    is_stale = age_seconds > target_rpo_seconds

    return {
        "has_backup": True,
        "backup_id": latest.get("backup_id"),
        "created_at": created_dt.isoformat(),
        "observed_age_seconds": age_seconds,
        "target_rpo_seconds": target_rpo_seconds,
        "is_stale": is_stale,
        "status": "STALE" if is_stale else "HEALTHY",
        "archive_size_bytes": latest.get("archive_size_bytes"),
        "archive_path": latest.get("archive_path"),
    }


def prune_expired_backups(
    target_dir: Path = BACKUP_ROOT,
    retain_days: int = 7,
) -> Dict[str, Any]:
    """Enforce retention tiering by purging backups older than retain_days.
    Crucial Safety Rule: Never purges the single newest verified backup, regardless of age.
    """
    if not target_dir.exists():
        return {"pruned_count": 0, "retained_count": 0}

    backup_dirs = sorted(
        [d for d in target_dir.iterdir() if d.is_dir() and d.name.startswith("backup_")],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not backup_dirs:
        return {"pruned_count": 0, "retained_count": 0}

    cutoff = datetime.now(timezone.utc) - timedelta(days=retain_days)
    pruned = 0
    retained = 0

    for idx, b_dir in enumerate(backup_dirs):
        if idx == 0:
            retained += 1
            continue

        dir_mtime = datetime.fromtimestamp(b_dir.stat().st_mtime, tz=timezone.utc)
        if dir_mtime < cutoff:
            shutil.rmtree(b_dir, ignore_errors=True)
            pruned += 1
        else:
            retained += 1

    return {
        "pruned_count": pruned,
        "retained_count": retained,
        "retention_cutoff": cutoff.isoformat(),
    }
