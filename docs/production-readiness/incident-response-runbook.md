# BIGCHAMP — Incident Response & Operational Runbook

**Classification:** Operational Incident Response Runbook  
**Applicability:** Production Operations  
**Audience:** SREs, Systems Architects, On-Call Engineers  

---

## 1. Incident Severity Definitions

- **SEV-0 (Critical Financial / Data Corruption):** Active double-debit, wallet ledger discrepancy, unauthorized payment capture, or database corruption. Immediate response (< 15 mins).
- **SEV-1 (Major Outage):** Primary API down, checkout broken for all users, database unreachable. Response (< 30 mins).
- **SEV-2 (Degraded Performance / Gated Feature Failure):** High latency (> 500ms p95), partner QR scanner errors, webhook processing delayed. Response (< 2 hours).
- **SEV-3 (Minor / Informational):** Stale non-critical cache, admin report formatting defect. Next business day.

---

## 2. Incident Scenarios & Remediation Protocols

### Scenario 1: Primary MongoDB Unreachable (`GET /health/ready` returns 503)
1. **Diagnosis:** Check container status:
   ```bash
   docker ps -f name=bigchamp-mongodb
   docker logs --tail 100 bigchamp-mongodb
   ```
2. **Action:**
   - If container stopped: `docker compose up -d mongodb`.
   - Verify port 27017 is listening.
   - Inspect disk usage: `docker exec bigchamp-mongodb df -h`.
   - Validate readiness probe returns HTTP 200.

### Scenario 2: Razorpay Webhook Ingestion Backlog or Signature Failure
1. **Diagnosis:**
   - Inspect `/health/diagnostics` for `webhook_duplicate` and `signature_rejected` counts.
   - Query `db.payment_webhook_events` for events with `status: "PENDING"`.
2. **Action:**
   - If signatures failing: verify `RAZORPAY_WEBHOOK_SECRET` matches the secret configured in Razorpay Dashboard.
   - If events stuck in `PENDING`: run recovery scanner:
     ```bash
     docker exec bigchamp-app python -c "from app.services.payment_service import reconcile_pending_payments; import asyncio; asyncio.run(reconcile_pending_payments())"
     ```

### Scenario 3: Wallet Ledger Discrepancy Alert (`discrepancies > 0`)
1. **Diagnosis:** Run customer audit:
   ```bash
   python -c "
   import requests
   res = requests.post('http://localhost:3050/api/v1/admin/auth/login', json={'email': 'admin@bigchamp.in', 'password': 'Admin@123'}).json()
   token = res.get('access_token')
   headers = {'Authorization': f'Bearer {token}'}
   reconcile = requests.get('http://localhost:3050/api/v1/wallet/admin/reconcile?user_id=TARGET_USER_ID', headers=headers).json()
   print(reconcile)
   "
   ```
2. **Action:**
   - Never manually overwrite wallet balances in MongoDB directly!
   - Execute authorized recovery via `POST /api/v1/wallet/admin/recover` which creates compensating ledger entries with audit metadata.

### Scenario 4: Stale Backup Alert (`is_stale: true`)
1. **Diagnosis:**
   ```bash
   python scripts/backup_scheduler.py --freshness
   ```
2. **Action:**
   - Check if `.backup.lock` is stale: remove lock file if process terminated.
   - Verify storage space: `python scripts/backup_policy.py`.
   - Trigger manual snapshot: `python scripts/backup_scheduler.py --once`.
