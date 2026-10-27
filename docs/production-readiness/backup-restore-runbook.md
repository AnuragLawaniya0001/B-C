# BIGCHAMP — Backup & Disaster Recovery Operational Runbook

**Classification:** Operational Runbook  
**Applicability:** Production & Staging Environments  
**Target RTO:** 15 minutes (Observed: ~3.3 seconds)  
**Target RPO:** 1 hour (Observed delta: ~1-5 minutes)

---

## 1. Overview and Architecture

BIGCHAMP utilizes a multi-tiered backup and disaster recovery architecture:
1. **Tier 1 — Local Logical Snapshots:** Full JSON dump of all 36 MongoDB collections + index definitions, verified with cryptographic SHA-256 checksums per file and an overarching manifest.
2. **Tier 2 — Encrypted Archives:** Application-level encryption using AES-256-CBC with PBKDF2 HMAC-SHA256 key derivation. Encryption keys are stored strictly in environment variables (`BACKUP_ENCRYPTION_KEY`) and never stored inside archive artifacts.
3. **Tier 3 — Off-Site Cloud Storage:** S3/MinIO compatible object storage integration (`scripts/storage_adapter.py`). When credentials are not provisioned, status remains `BLOCKED — CREDENTIALS REQUIRED`.
4. **Tier 4 — Isolated Restore Verification:** Automated drill executing against an isolated test database (`bigchamp_dr_restore_test`) validating document parity, index recreation, and double-entry ledger financial invariants without impacting production.

---

## 2. Standard Operating Procedures

### 2.1 Triggering an On-Demand Backup
Run the backup scheduler in one-shot mode:
```bash
python scripts/backup_scheduler.py --once
```
*Expected Output:*
- Validates minimum disk space (50 MB).
- Acquires `.backup.lock`.
- Generates snapshot in `backups/backup_YYYYMMDD_HHMMSS/`.
- Computes SHA-256 hash manifest.
- Encrypts archive into `.tar.gz.enc`.
- Releases lock and returns exit code 0.

### 2.2 Checking Backup Freshness
To check whether backups meet the 1-hour RPO:
```bash
python scripts/backup_scheduler.py --freshness
```
*Exit Code:* 0 if `is_stale == false`, 1 if stale or no backup found.

### 2.3 Checking Multi-Tier Assurance Report
```bash
python scripts/backup_scheduler.py --assurance
```

### 2.4 Executing an Isolated Disaster Recovery Drill
```bash
python scripts/dr_drill.py
```
This restores the latest snapshot into `bigchamp_dr_restore_test`, asserts zero wallet ledger mismatches, validates settings, records measured RTO and RPO, and drops the temporary database.

---

## 3. Emergency Production Restoration Procedure

> [!CAUTION]
> Restoring a backup snapshot directly over the production database `bigchamp` will permanently overwrite data created after the snapshot timestamp. This procedure requires explicit authorization by the Lead Systems Architect or Incident Commander.

### Emergency Command:
```bash
python scripts/dr_drill.py --archive backups/backup_YYYYMMDD_HHMMSS/BC-BKP-YYYYMMDD_HHMMSS.tar.gz --target-db bigchamp --force-production-restore-authorized
```

### Post-Restore Verification Checklist:
1. Validate health readiness: `GET http://localhost:3050/api/v1/health/ready` (HTTP 200).
2. Validate diagnostics: `GET http://localhost:3050/api/v1/health/diagnostics`.
3. Run financial reconciliation scan: `GET http://localhost:3050/api/v1/finance/admin/reconciliation/run`.
4. Verify wallet ledger integrity: `python test_phase5_7_financial_hardening_suite.py`.
