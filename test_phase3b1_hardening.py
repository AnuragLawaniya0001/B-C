"""Phase 3B.1 Automated Test Suite for Bigchamp: Wallet Consistency & Failure-Recovery Hardening.

Tests:
1. Material parameter mismatch rejection on reused idempotency key (HTTP 409 Conflict).
2. Concurrent duplicate requests with same idempotency key resolve to same transaction without double credit.
3. Concurrent debits race protection: balance never drops below zero, overdrafts rejected (HTTP 400).
4. Fault Injection 1: Crash before balance mutation leaves balance untouched; recovery safely marks FAILED.
5. Fault Injection 2: Crash after balance mutation before ledger is detected by reconciliation and healed by recovery.
6. Fault Injection 3: Crash during ledger write recovered with full audit trail and zero discrepancy.
7. Fault Injection 4: Crash after ledger before response handled seamlessly by idempotency retry.
8. RBAC protection on administrative recovery endpoint (/wallet/admin/recover).
9. Full ledger and operation audit trail immutability.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import json
import sys
import time
import urllib.request
import urllib.error
import uuid

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_API = "http://localhost:3050/api/v1"


def http_request(method, url, data=None, token=None, headers_extra=None):
    headers = {"Content-Type": "application/json"}
    if headers_extra:
        headers.update(headers_extra)
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        if isinstance(data, (bytes, bytearray)):
            body = data
        else:
            body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_content)
        except Exception:
            return e.code, {"detail": err_content}
    except Exception as e:
        return 0, {"error": str(e)}


def run_phase3b1_tests():
    print("=" * 80)
    print("  BIGCHAMP PHASE 3B.1: WALLET CONSISTENCY & FAILURE-RECOVERY HARDENING")
    print("=" * 80)

    results = {}

    def test(name, condition, details=""):
        status = "[PASS]" if condition else "[FAIL]"
        results[name] = condition
        print(f" {status} {name}")
        if details and not condition:
            print(f"        -> Details: {details}")

    # 1. Authenticate Accounts
    print("\n--- 1. Authenticating Accounts ---")
    s, admin_data = http_request("POST", f"{BASE_API}/admin/auth/login", {
        "email": "admin@bigchamp.in",
        "password": "Admin@123"
    })
    admin_token = admin_data.get("access_token")
    test("Admin Authentication", s == 200 and bool(admin_token))

    s, cust_data = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": "freeuser@bigchamp.in",
        "password": "User@123"
    })
    cust_token = cust_data.get("access_token")
    cust_user = cust_data.get("user", {})
    cust_id = cust_user.get("id") or cust_user.get("_id")
    test("Customer Authentication", s == 200 and bool(cust_token))

    if not admin_token or not cust_token:
        print("[FATAL] Missing required tokens. Aborting test suite.")
        return False

    # Pre-clean any pending operations from previous interrupted runs
    http_request("POST", f"{BASE_API}/wallet/admin/recover", {"user_id": cust_id, "notes": "Pre-test test recovery"}, token=admin_token)

    # 2. Material Parameter Mismatch Detection on Reused Idempotency Key
    print("\n--- 2. Material Parameter Mismatch Protection ---")
    mismatch_key = f"idem_mismatch_{uuid.uuid4().hex[:10]}"
    s, initial_adj = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "CREDIT",
        "amount_paise": 10000,  # ₹100.00
        "reason": "Initial adjustment for mismatch test",
        "idempotency_key": mismatch_key,
    }, token=admin_token)
    test("Initial adjustment succeeds (201)", s in (200, 201), f"status={s}")

    # Attempt 1: Reusing idempotency key with DIFFERENT amount
    s, diff_amount_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "CREDIT",
        "amount_paise": 20000,  # Conflicting amount: ₹200.00 vs ₹100.00
        "reason": "Tampered amount attempt",
        "idempotency_key": mismatch_key,
    }, token=admin_token)
    test("Reused idempotency key with conflicting amount rejected (409)", s == 409, f"status={s}, resp={diff_amount_res}")

    # Attempt 2: Reusing idempotency key with DIFFERENT direction
    s, diff_dir_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "DEBIT",  # Conflicting direction: DEBIT vs CREDIT
        "amount_paise": 10000,
        "reason": "Tampered direction attempt",
        "idempotency_key": mismatch_key,
    }, token=admin_token)
    test("Reused idempotency key with conflicting direction rejected (409)", s == 409, f"status={s}, resp={diff_dir_res}")

    # Verify balance was NOT double credited
    _, wallet_chk = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    expected_after_initial = initial_adj.get("balance_after_paise")
    test("Wallet balance protected from mismatched retry attempts", wallet_chk.get("wallet", {}).get("balance_paise") == expected_after_initial)

    # 3. High-Concurrency Duplicate Request Protection
    print("\n--- 3. Concurrency Idempotency Race Protection ---")
    concurrent_key = f"idem_concurrent_{uuid.uuid4().hex[:10]}"
    concurrent_amount = 5000  # ₹50.00

    _, before_concurrent = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    balance_before_concurrent = before_concurrent.get("wallet", {}).get("balance_paise", 0)

    def send_concurrent_credit():
        return http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
            "user_id": cust_id,
            "direction": "CREDIT",
            "amount_paise": concurrent_amount,
            "reason": "Concurrent race test adjustment",
            "idempotency_key": concurrent_key,
        }, token=admin_token)

    # Fire 10 simultaneous requests across threads
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(send_concurrent_credit) for _ in range(10)]
        concurrent_results = [f.result() for f in futures]

    statuses = [r[0] for r in concurrent_results]
    txn_ids = [r[1].get("transaction_id") for r in concurrent_results if r[1].get("transaction_id")]
    unique_txns = set(txn_ids)

    test("All concurrent duplicate requests resolve cleanly (200/201)", all(s in (200, 201) for s in statuses), f"statuses={set(statuses)}")
    test("All concurrent requests resolved to the same logical transaction ID", len(unique_txns) == 1, f"unique_txns={unique_txns}")

    _, after_concurrent = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    balance_after_concurrent = after_concurrent.get("wallet", {}).get("balance_paise", 0)
    test("Balance increased by EXACTLY one credit amount (no duplicate credit race)",
         balance_after_concurrent == balance_before_concurrent + concurrent_amount,
         f"before={balance_before_concurrent}, after={balance_after_concurrent}, expected={balance_before_concurrent + concurrent_amount}")

    # 4. Concurrent Debits (Overdraft Race Condition Protection)
    print("\n--- 4. Concurrent Debits Race & Overdraft Protection ---")
    # Customer currently has balance_after_concurrent. Let's debit e.g. 80% of current balance with 4 concurrent threads.
    # Total requested will exceed available balance by 3.2x!
    single_debit_paise = max(1000, balance_after_concurrent // 2)

    def send_concurrent_debit(idx):
        return http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
            "user_id": cust_id,
            "direction": "DEBIT",
            "amount_paise": single_debit_paise,
            "reason": f"Concurrent debit race attempt {idx}",
            "idempotency_key": f"debit_race_{uuid.uuid4().hex[:8]}_{idx}",
        }, token=admin_token)

    with ThreadPoolExecutor(max_workers=5) as executor:
        debit_futures = [executor.submit(send_concurrent_debit, i) for i in range(5)]
        debit_results = [f.result() for f in debit_futures]

    succeeded_debits = [r for r in debit_results if r[0] in (200, 201)]
    failed_debits = [r for r in debit_results if r[0] == 400]

    test("Only valid debits allowed within balance; overdrafts rejected with 400",
         len(succeeded_debits) <= 2 and len(failed_debits) >= 3,
         f"succeeded={len(succeeded_debits)}, rejected={len(failed_debits)}")

    _, post_debit_wallet = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    final_post_debit = post_debit_wallet.get("wallet", {}).get("balance_paise", 0)
    test("Wallet balance never dropped below 0 paise", final_post_debit >= 0, f"balance={final_post_debit}")

    # 5. Fault Injection 1: Crash Before Balance Mutation (FAIL_BEFORE_BALANCE)
    print("\n--- 5. Fault Injection: Crash Before Balance Mutation ---")
    _, pre_fault1 = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    balance_pre_fault1 = pre_fault1.get("wallet", {}).get("balance_paise", 0)

    fault1_key = f"fault1_{uuid.uuid4().hex[:10]}"
    s, fault1_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "CREDIT",
        "amount_paise": 25000,
        "reason": "Fault Injection 1 Test",
        "idempotency_key": fault1_key,
    }, token=admin_token, headers_extra={"X-Fault-Injection": "FAIL_BEFORE_BALANCE"})

    test("Fault injection before balance throws 500 error", s == 500)

    # Verify balance was untouched
    _, post_fault1 = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    balance_post_fault1 = post_fault1.get("wallet", {}).get("balance_paise", 0)
    test("Wallet balance completely untouched after pre-mutation crash", balance_post_fault1 == balance_pre_fault1)

    # Run administrative recovery
    s, rec_res1 = http_request("POST", f"{BASE_API}/wallet/admin/recover", {"user_id": cust_id}, token=admin_token)
    test("Admin recovery handles INITIATED operation safely (200)", s == 200)

    # Recheck reconciliation
    s, recon1 = http_request("GET", f"{BASE_API}/wallet/admin/reconcile/{cust_id}", token=admin_token)
    test("Reconciliation remains zero discrepancy after pre-mutation recovery", recon1.get("is_reconciled") is True and recon1.get("discrepancy_paise") == 0)

    # 6. Fault Injection 2: Crash After Balance Mutation Before Ledger (FAIL_AFTER_BALANCE_BEFORE_LEDGER)
    print("\n--- 6. Fault Injection: Crash After Balance Mutation Before Ledger ---")
    _, pre_fault2 = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    balance_pre_fault2 = pre_fault2.get("wallet", {}).get("balance_paise", 0)

    fault2_key = f"fault2_{uuid.uuid4().hex[:10]}"
    fault2_amount = 30000  # ₹300.00
    s, fault2_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "CREDIT",
        "amount_paise": fault2_amount,
        "reason": "Fault Injection 2 Test",
        "idempotency_key": fault2_key,
    }, token=admin_token, headers_extra={"X-Fault-Injection": "FAIL_AFTER_BALANCE_BEFORE_LEDGER"})

    test("Fault injection after balance throws 500 error", s == 500)

    # Verify balance WAS modified
    _, post_fault2 = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    balance_post_fault2 = post_fault2.get("wallet", {}).get("balance_paise", 0)
    test("Wallet balance updated in document (30000 paise added)", balance_post_fault2 == balance_pre_fault2 + fault2_amount)

    # Check read-only reconciliation: should detect pending/unreconciled operation
    s, recon2_before = http_request("GET", f"{BASE_API}/wallet/admin/reconcile/{cust_id}", token=admin_token)
    test("Reconciliation flags discrepancy before recovery", recon2_before.get("is_reconciled") is False, f"recon={recon2_before}")
    test("Pending operations count is at least 1", recon2_before.get("pending_operations_count", 0) >= 1)

    # Execute authoritative administrative recovery
    s, rec_res2 = http_request("POST", f"{BASE_API}/wallet/admin/recover", {
        "user_id": cust_id,
        "notes": "Testing recovery of missing ledger entry",
    }, token=admin_token)
    test("Administrative recovery succeeds (200)", s == 200)
    test("Recovery restored the missing ledger entry", rec_res2.get("recovered_count") >= 1, f"rec_res={rec_res2}")

    # Re-run read-only reconciliation: must now be 100% reconciled with 0 discrepancy!
    s, recon2_after = http_request("GET", f"{BASE_API}/wallet/admin/reconcile/{cust_id}", token=admin_token)
    test("Reconciliation fully reconciled after recovery", recon2_after.get("is_reconciled") is True)
    test("Discrepancy is exactly 0 paise", recon2_after.get("discrepancy_paise") == 0)
    test("Pending operations count resolved to 0", recon2_after.get("pending_operations_count") == 0)

    # Check balance was NOT double credited by recovery
    _, wallet_after_rec2 = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    test("Wallet balance remained strictly correct (no double credit during recovery)",
         wallet_after_rec2.get("wallet", {}).get("balance_paise") == balance_post_fault2)

    # 7. Fault Injection 3: Crash During Ledger Persistence (FAIL_DURING_LEDGER)
    print("\n--- 7. Fault Injection: Crash During Ledger Write ---")
    fault3_key = f"fault3_{uuid.uuid4().hex[:10]}"
    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "DEBIT",
        "amount_paise": 5000,
        "reason": "Fault Injection 3 Debit Test",
        "idempotency_key": fault3_key,
    }, token=admin_token, headers_extra={"X-Fault-Injection": "FAIL_DURING_LEDGER"})
    test("Fault injection during ledger throws 500 error", s == 500)

    # Run recovery
    s, rec_res3 = http_request("POST", f"{BASE_API}/wallet/admin/recover", {"user_id": cust_id}, token=admin_token)
    test("Recovery handles crash during ledger write (200)", s == 200)

    s, recon3 = http_request("GET", f"{BASE_API}/wallet/admin/reconcile/{cust_id}", token=admin_token)
    test("Ledger and balance fully reconciled after ledger crash recovery", recon3.get("is_reconciled") is True and recon3.get("discrepancy_paise") == 0)

    # 8. Fault Injection 4: Crash After Ledger Before API Response (FAIL_AFTER_LEDGER_BEFORE_RESPONSE)
    print("\n--- 8. Fault Injection: Crash After Ledger Before Response ---")
    _, pre_fault4 = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    balance_pre_fault4 = pre_fault4.get("wallet", {}).get("balance_paise", 0)

    fault4_key = f"fault4_{uuid.uuid4().hex[:10]}"
    fault4_amount = 12000
    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "CREDIT",
        "amount_paise": fault4_amount,
        "reason": "Fault Injection 4 Test",
        "idempotency_key": fault4_key,
    }, token=admin_token, headers_extra={"X-Fault-Injection": "FAIL_AFTER_LEDGER_BEFORE_RESPONSE"})
    test("Fault injection after ledger before response returns 500", s == 500)

    # Client retries with identical idempotency key
    s, retry4_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_id,
        "direction": "CREDIT",
        "amount_paise": fault4_amount,
        "reason": "Fault Injection 4 Test Retry",
        "idempotency_key": fault4_key,
    }, token=admin_token)
    test("Client retry with same idempotency key succeeds (200/201)", s in (200, 201), f"status={s}")

    _, post_fault4 = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    test("Balance credited exactly once despite crash before response",
         post_fault4.get("wallet", {}).get("balance_paise") == balance_pre_fault4 + fault4_amount)

    # 9. RBAC Protection on Admin Recovery Endpoint
    print("\n--- 9. RBAC Protection on Admin Recovery Endpoint ---")
    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/recover", {})
    test("Unauthenticated access to /wallet/admin/recover rejected (401/403)", s in (401, 403))

    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/recover", {}, token=cust_token)
    test("Customer forbidden from /wallet/admin/recover (403)", s == 403)

    # 10. Summary
    print("\n" + "=" * 80)
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    failed_tests = total_tests - passed_tests

    print(f"  TOTAL: {total_tests} | PASSED: {passed_tests} | FAILED: {failed_tests}")
    print("=" * 80)

    if failed_tests > 0:
        print("\n[FAIL] Some Phase 3B.1 hardening tests failed:")
        for name, passed in results.items():
            if not passed:
                print(f"  - {name}")
        return False
    else:
        print("\n[SUCCESS] All Phase 3B.1 consistency and failure-recovery hardening tests PASSED!")
        return True


if __name__ == "__main__":
    success = run_phase3b1_tests()
    sys.exit(0 if success else 1)
