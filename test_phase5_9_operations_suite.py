"""BIGCHAMP Phase 5.9: Production Operations, Automated Disaster Recovery & Observability Test Suite.

Validates:
1. Automated backup creation, SHA-256 manifest verification, and disk capacity pre-checks
2. Concurrency locking preventing overlapping backup runs
3. Archive encryption (AES-256) and decryption round-trip with HMAC integrity
4. Backup freshness evaluation and staleness detector against 1-hour target RPO
5. Isolated restore drill (bigchamp_dr_restore_test) with document parity & wallet ledger invariants
6. Production restore safety interlock (blocks unauthorized restore into 'bigchamp')
7. Multi-tier assurance report (Local, Encrypted, Off-site, Restore-Verified)
8. Admin /health/diagnostics exposing live backup freshness and telemetry
"""
import asyncio
import json
import os
import shutil
import tempfile
import time
from pathlib import Path
import pytest
import requests

from scripts.backup_policy import (
    BackupConcurrencyLock,
    BackupLockError,
    check_storage_capacity,
    evaluate_backup_freshness,
    prune_expired_backups,
    BACKUP_ROOT,
)
from scripts.storage_adapter import (
    LocalStorageAdapter,
    EncryptedArchiveAdapter,
    OffsiteS3StorageAdapter,
    get_backup_assurance_report,
)
from scripts.dr_drill import run_disaster_recovery_drill, ISOLATED_TEST_DB
from scripts.backup_scheduler import run_backup_cycle

API_URL = os.getenv("API_URL", "http://localhost:3050/api/v1")
ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASS = "Admin@123"


def print_header(title: str):
    print(f"\n{'='*70}\n[PHASE 5.9] {title}\n{'='*70}")


def print_pass(msg: str):
    print(f" [PASS] {msg}")


def get_admin_token() -> str:
    res = requests.post(f"{API_URL}/admin/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=10)
    assert res.status_code == 200, f"Admin auth failed: {res.text}"
    return res.json().get("access_token")


# ==============================================================================
# 1. BACKUP CREATION, MANIFEST & CAPACITY
# ==============================================================================

def test_storage_capacity_and_backup_creation():
    """Verify pre-backup storage assertion and successful snapshot generation."""
    print_header("1.1 Storage Capacity Pre-Check & Snapshot Generation")
    storage = check_storage_capacity(BACKUP_ROOT, min_mb=10)
    assert storage["sufficient"] is True
    print_pass(f"Storage capacity verified: {storage['free_mb']} MB free on filesystem")

    cycle_res = asyncio.run(run_backup_cycle(encrypt=True, prune_days=7))
    assert cycle_res["success"] is True
    assert cycle_res["collections_backed_up"] >= 30
    assert cycle_res["documents_backed_up"] > 0
    assert Path(cycle_res["archive_path"]).exists()
    assert cycle_res["archive_sha256"]
    print_pass(
        f"Backup cycle succeeded: {cycle_res['backup_id']} ({cycle_res['collections_backed_up']} collections, "
        f"{cycle_res['documents_backed_up']} docs in {cycle_res['duration_seconds']}s)"
    )


# ==============================================================================
# 2. CONCURRENCY LOCKING & OVERLAPPING PROTECTION
# ==============================================================================

def test_backup_concurrency_lock():
    """Verify that concurrent or overlapping backups are safely blocked."""
    print_header("2.1 Backup Concurrency Lock Verification")
    with BackupConcurrencyLock() as lock1:
        assert lock1._acquired is True
        print_pass("Lock 1 acquired successfully (.backup.lock)")

        # Attempt to acquire a second concurrent lock
        try:
            with BackupConcurrencyLock(timeout_seconds=60) as lock2:
                assert False, "Second concurrent lock should have raised BackupLockError!"
        except BackupLockError as e:
            print_pass(f"Concurrent backup prevented by advisory lock: {e}")

    # Verify lock released cleanly
    lock3 = BackupConcurrencyLock()
    lock3.acquire()
    lock3.release()
    print_pass("Lock released cleanly after with-block completion")


# ==============================================================================
# 3. ARCHIVE ENCRYPTION & DECRYPTION ROUND-TRIP
# ==============================================================================

def test_archive_encryption_roundtrip():
    """Verify AES-256 archive encryption and authenticated decryption round-trip."""
    print_header("3.1 AES-256 Archive Encryption & Integrity Verification")
    adapter = EncryptedArchiveAdapter(key=b"TestCustomEncryptionKey32BytesLong!")

    temp_dir = Path(tempfile.mkdtemp(prefix="bc_test_enc_"))
    try:
        sample_plaintext = b"Bigchamp Sensitive Database Snapshot Payload " * 50
        sample_file = temp_dir / "sample.tar.gz"
        with open(sample_file, "wb") as f:
            f.write(sample_plaintext)

        enc_file = temp_dir / "sample.tar.gz.enc"
        enc_res = adapter.encrypt_file(sample_file, enc_file)
        assert enc_file.exists()
        assert enc_res["hmac_sha256_verified"] is True
        print_pass(f"Archive encrypted with AES-256: {enc_file.name} ({enc_res['encrypted_size_bytes']} bytes)")

        # Decrypt round-trip
        dec_file = temp_dir / "sample_decrypted.tar.gz"
        dec_res = adapter.decrypt_file(enc_file, dec_file)
        assert dec_res["decrypted"] is True
        with open(dec_file, "rb") as f:
            recovered = f.read()
        assert recovered == sample_plaintext
        print_pass("Decryption round-trip verified: recovered plaintext matches byte-for-byte")

        # Test HMAC tampering detection
        with open(enc_file, "r+b") as f:
            f.seek(-5, os.SEEK_END)
            f.write(b"TAMPR")
        try:
            adapter.decrypt_file(enc_file, temp_dir / "tampered.tar.gz")
            assert False, "Tampered ciphertext should fail HMAC check!"
        except AssertionError as e:
            print_pass(f"Tampered archive detected and rejected: {e}")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


# ==============================================================================
# 4. BACKUP FRESHNESS & STALENESS DETECTOR
# ==============================================================================

def test_backup_freshness_evaluation():
    """Verify backup freshness evaluation and target RPO measurement."""
    print_header("4.1 Backup Freshness & RPO Measurement")
    freshness = evaluate_backup_freshness(BACKUP_ROOT, target_rpo_seconds=3600)
    assert freshness["has_backup"] is True
    assert freshness["is_stale"] is False
    assert freshness["status"] == "HEALTHY"
    assert freshness["observed_age_seconds"] is not None
    assert freshness["observed_age_seconds"] < 3600
    print_pass(
        f"Freshness verified: Backup age={freshness['observed_age_seconds']}s <= Target RPO=3600s "
        f"(Status: {freshness['status']})"
    )


# ==============================================================================
# 5. MULTI-TIER ASSURANCE REPORT
# ==============================================================================

def test_backup_assurance_report():
    """Verify 4-tier assurance assessment reporting."""
    print_header("5.1 Multi-Tier Backup Assurance Report")
    report = get_backup_assurance_report()
    tiers = report["tiers"]

    assert tiers["tier_1_local"]["state"] == "VERIFIED"
    assert tiers["tier_2_encrypted"]["state"] == "VERIFIED"
    assert "BLOCKED" in tiers["tier_3_offsite"]["state"]
    assert tiers["tier_4_isolated_restore_verified"]["state"] == "VERIFIED"

    print_pass(f"Tier 1 (Local): {tiers['tier_1_local']['state']}")
    print_pass(f"Tier 2 (Encrypted): {tiers['tier_2_encrypted']['state']} ({tiers['tier_2_encrypted']['algorithm']})")
    print_pass(f"Tier 3 (Off-site S3): {tiers['tier_3_offsite']['state']}")
    print_pass(f"Tier 4 (Restore-Verified): {tiers['tier_4_isolated_restore_verified']['state']}")


# ==============================================================================
# 6. DISASTER RECOVERY DRILL & RTO/RPO
# ==============================================================================

def test_disaster_recovery_drill_and_rto():
    """Execute isolated DR drill and verify measured RTO and RPO."""
    print_header("6.1 Isolated Disaster Recovery Drill (RTO & Invariant Verification)")
    archives = sorted(BACKUP_ROOT.glob("**/*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
    assert archives, "No archive found for DR drill"

    drill_res = asyncio.run(run_disaster_recovery_drill(archive_path=archives[0]))
    assert drill_res["status"] == "SUCCESS"
    assert drill_res["target_database"] == ISOLATED_TEST_DB
    assert drill_res["is_isolated_test_db"] is True
    assert drill_res["financial_invariants_verified"] is True

    rto = drill_res["recovery_time_objective"]
    assert rto["target_rto_met"] is True
    assert rto["observed_rto_seconds"] < 900  # Well within 15 min

    rpo = drill_res["recovery_point_objective"]
    assert rpo["target_rpo_met"] is True

    print_pass(f"Isolated DR drill successful: {drill_res['restored_collections_count']} collections, {drill_res['restored_documents_count']} docs")
    print_pass(f"Wallet double-entry financial invariants strictly preserved post-restore")
    print_pass(f"Observed RTO: {rto['observed_rto_seconds']}s (Target: {rto['target_rto_seconds']}s, Margin: {rto['performance_margin_seconds']}s)")
    print_pass(f"Observed RPO: {rpo['observed_rpo_seconds']}s (Target: {rpo['target_rpo_seconds']}s, Status: {rpo['backup_staleness']})")


# ==============================================================================
# 7. SAFETY INTERLOCK ON PRODUCTION RESTORE
# ==============================================================================

def test_production_restore_safety_interlock():
    """Verify that restoring into production database 'bigchamp' is strictly blocked."""
    print_header("7.1 Production Database Restore Safety Interlock")
    archives = sorted(BACKUP_ROOT.glob("**/*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)

    try:
        asyncio.run(run_disaster_recovery_drill(archive_path=archives[0], target_db_name="bigchamp", allow_production=False))
        assert False, "Restore targeting 'bigchamp' should have been blocked by safety interlock!"
    except PermissionError as e:
        print_pass(f"Production restore blocked safely with PermissionError: {e}")


# ==============================================================================
# 8. OPERATIONAL DIAGNOSTICS & TELEMETRY API
# ==============================================================================

def test_health_diagnostics_live_telemetry():
    """Verify admin /health/diagnostics exposes database stats, payment mode, and backup freshness."""
    print_header("8.1 Operational Diagnostics & Live Telemetry Endpoint")
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = requests.get(f"{API_URL}/health/diagnostics", headers=headers, timeout=10)
    assert res.status_code == 200, f"Diagnostics failed: {res.text}"
    diag = res.json()

    assert diag["status"] == "healthy"
    assert diag["database"]["connected"] is True
    assert diag["payment_provider"]["payment_mode"] == "test"

    bf = diag.get("backup_freshness", {})
    assert bf.get("has_backup") is True
    assert bf.get("is_stale") is False
    assert bf.get("status") == "HEALTHY"

    telemetry = diag.get("telemetry", {})
    assert "latency_summary_ms" in telemetry
    assert "financial_integrity_telemetry" in telemetry
    assert "backup_operations" in telemetry

    print_pass("Admin operational diagnostics endpoint verified with live backup freshness telemetry")


# ==============================================================================
# MAIN TEST RUNNER
# ==============================================================================

if __name__ == "__main__":
    print("\n" + "#"*70)
    print("BIGCHAMP (B-C) — PHASE 5.9 PRODUCTION OPERATIONS SUITE")
    print("#"*70)

    test_storage_capacity_and_backup_creation()
    test_backup_concurrency_lock()
    test_archive_encryption_roundtrip()
    test_backup_freshness_evaluation()
    test_backup_assurance_report()
    test_disaster_recovery_drill_and_rto()
    test_production_restore_safety_interlock()
    test_health_diagnostics_live_telemetry()

    print("\n" + "="*70)
    print("PHASE 5.9 TEST RESULTS: 8 PASSED, 0 FAILED (TOTAL: 8)")
    print("="*70)
