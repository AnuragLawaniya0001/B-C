"""Phase 3B Automated Test Suite for Bigchamp: Wallet & Transaction Ledger Foundation.

Tests:
1. Unauthenticated access rejected (HTTP 401).
2. Customer wallet retrieval & lazy initialization (/wallet/me).
3. RBAC protection: Customer forbidden from admin wallet endpoints (HTTP 403).
4. Cross-customer isolation: Customer B cannot inspect Customer A's transactions (HTTP 403).
5. Input validation: Zero, negative amounts, missing reason, or invalid direction rejected (HTTP 422).
6. Admin credit adjustment: Authoritative atomic credit, integer paise balance before/after.
7. Idempotency protection: Duplicate idempotency key returns existing transaction without double crediting.
8. Admin debit adjustment: Authoritative atomic debit with integer paise balance reduction.
9. Overdraft prevention: Debit exceeding available balance rejected (HTTP 400).
10. Customer transaction ledger listing & pagination (/wallet/me/transactions).
11. Customer transaction detail inspection (/wallet/me/transactions/{id}).
12. Admin wallet listing & inspection (/wallet/admin/wallets, /wallet/admin/wallets/{user_id}).
13. Authoritative ledger reconciliation (/wallet/admin/reconcile/{user_id}) verifies zero discrepancy.
14. Immutable ledger protection: No update/delete mutations permitted on ledger records.
15. Persistence verification across queries and database records.
"""
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


def run_phase3b_tests():
    print("=" * 75)
    print("  BIGCHAMP PHASE 3B: WALLET & TRANSACTION LEDGER FOUNDATION TESTS")
    print("=" * 75)

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
    test("Admin Authentication", s == 200 and bool(admin_token), f"status={s}")

    s, cust_data = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": "freeuser@bigchamp.in",
        "password": "User@123"
    })
    cust_token = cust_data.get("access_token")
    cust_user = cust_data.get("user", {})
    cust_a_id = cust_user.get("id") or cust_user.get("_id")
    test("Customer A Authentication", s == 200 and bool(cust_token), f"status={s}, user_id={cust_a_id}")

    # Register/Login Customer B for cross-customer isolation tests
    cust_b_email = "custb_isolation@bigchamp.in"
    s, cust_b_data = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": cust_b_email,
        "password": "User@123"
    })
    cust_b_token = cust_b_data.get("access_token")
    cust_b_user = cust_b_data.get("user", {})
    if not cust_b_token:
        # Register Customer B through standard OTP flow
        _, otp_res = http_request("POST", f"{BASE_API}/auth/send-otp", {"identifier": cust_b_email, "purpose": "REGISTER"})
        otp_code = otp_res.get("dev_otp") or otp_res.get("mock_otp")
        if otp_code:
            http_request("POST", f"{BASE_API}/auth/verify-otp", {"identifier": cust_b_email, "otp": otp_code, "purpose": "REGISTER"})
            s, reg_res = http_request("POST", f"{BASE_API}/auth/register", {
                "identifier": cust_b_email,
                "email": cust_b_email,
                "mobile": "9998887711",
                "full_name": "Customer B Isolation",
                "password": "User@123",
            })
            cust_b_token = reg_res.get("access_token")
            cust_b_user = reg_res.get("user", {})

    cust_b_id = cust_b_user.get("id") or cust_b_user.get("_id")
    test("Customer B Authentication", bool(cust_b_token), f"user_id={cust_b_id}")

    if not admin_token or not cust_token or not cust_b_token:
        print("\n[FATAL] Missing required tokens. Aborting test suite.")
        return False

    # 2. Unauthenticated access rejected
    print("\n--- 2. Unauthenticated Access Protection ---")
    s, _ = http_request("GET", f"{BASE_API}/wallet/me")
    test("GET /wallet/me rejects unauthenticated request (401)", s == 401, f"status={s}")

    s, _ = http_request("GET", f"{BASE_API}/wallet/me/transactions")
    test("GET /wallet/me/transactions rejects unauthenticated request (401)", s == 401, f"status={s}")

    s, _ = http_request("GET", f"{BASE_API}/wallet/admin/wallets")
    test("GET /wallet/admin/wallets rejects unauthenticated request (401/403)", s in (401, 403), f"status={s}")

    # 3. Customer A Wallet Initialization & Summary
    print("\n--- 3. Customer Wallet Retrieval & Initialization ---")
    s, wallet_summary = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    wallet_me = wallet_summary.get("wallet", {})
    test("GET /wallet/me returns 200 with wallet summary", s == 200 and "balance_paise" in wallet_me, f"status={s}, resp={wallet_summary}")
    test("Wallet currency is INR", wallet_me.get("currency") == "INR")
    test("Wallet status is ACTIVE", wallet_me.get("status") == "ACTIVE")
    test("Monetary balance is integer paise", isinstance(wallet_me.get("balance_paise"), int))
    initial_balance = wallet_me.get("balance_paise", 0)

    # 4. RBAC Protection on Admin Endpoints
    print("\n--- 4. RBAC Protection on Admin Endpoints ---")
    s, _ = http_request("GET", f"{BASE_API}/wallet/admin/wallets", token=cust_token)
    test("Customer forbidden from GET /wallet/admin/wallets (403)", s == 403, f"status={s}")

    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "CREDIT",
        "amount_paise": 10000,
        "reason": "Unauthorized attempt"
    }, token=cust_token)
    test("Customer forbidden from POST /wallet/admin/adjust (403)", s == 403, f"status={s}")

    s, _ = http_request("GET", f"{BASE_API}/wallet/admin/reconcile/{cust_a_id}", token=cust_token)
    test("Customer forbidden from GET /wallet/admin/reconcile (403)", s == 403, f"status={s}")

    # 5. Input Validation for Adjustments
    print("\n--- 5. Input Validation for Adjustments ---")
    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "CREDIT",
        "amount_paise": 0,
        "reason": "Zero amount test"
    }, token=admin_token)
    test("Adjustment with 0 paise rejected (422)", s == 422, f"status={s}")

    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "CREDIT",
        "amount_paise": -500,
        "reason": "Negative amount test"
    }, token=admin_token)
    test("Adjustment with negative paise rejected (422)", s == 422, f"status={s}")

    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "CREDIT",
        "amount_paise": 1000,
        "reason": ""  # empty reason
    }, token=admin_token)
    test("Adjustment with empty reason rejected (422)", s == 422, f"status={s}")

    s, _ = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "INVALID_DIR",
        "amount_paise": 1000,
        "reason": "Invalid direction"
    }, token=admin_token)
    test("Adjustment with invalid direction rejected (422)", s == 422, f"status={s}")

    # 6. Admin Manual Credit Adjustment
    print("\n--- 6. Authoritative Admin Credit Adjustment ---")
    credit_amount = 50000  # ₹500.00
    credit_idempotency = f"idem_credit_{uuid.uuid4().hex[:12]}"
    s, credit_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "CREDIT",
        "amount_paise": credit_amount,
        "reason": "Phase 3B foundation test credit",
        "reference_type": "ADMIN_ADJUSTMENT",
        "reference_id": "TEST_REF_001",
        "idempotency_key": credit_idempotency
    }, token=admin_token)
    test("Admin credit succeeds (201/200)", s in (200, 201), f"status={s}, res={credit_res}")
    txn_credit_id = credit_res.get("transaction_id")
    test("Transaction ID generated with TXN- prefix", bool(txn_credit_id and txn_credit_id.startswith("TXN-")))
    test("Transaction direction is CREDIT", credit_res.get("direction") == "CREDIT")
    test("Transaction amount matches exactly in paise", credit_res.get("amount_paise") == credit_amount)
    test("Balance before + amount equals balance after", credit_res.get("balance_after_paise") == (credit_res.get("balance_before_paise", 0) + credit_amount))
    test("Transaction status is SUCCESS", credit_res.get("status") == "SUCCESS")
    post_credit_balance = credit_res.get("balance_after_paise", 0)

    # 7. Idempotency Protection
    print("\n--- 7. Idempotency Protection ---")
    s, idem_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "CREDIT",
        "amount_paise": credit_amount,
        "reason": "Phase 3B duplicate test credit",
        "idempotency_key": credit_idempotency
    }, token=admin_token)
    test("Repeating request with same idempotency key succeeds (200/201)", s in (200, 201))
    test("Returns same transaction ID", idem_res.get("transaction_id") == txn_credit_id)

    # Verify Customer A balance was NOT credited twice
    _, cust_wallet_after_idem = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    test("Balance NOT double-credited (idempotency enforced)", cust_wallet_after_idem.get("wallet", {}).get("balance_paise") == post_credit_balance)

    # 8. Admin Manual Debit Adjustment
    print("\n--- 8. Authoritative Admin Debit Adjustment ---")
    debit_amount = 15000  # ₹150.00
    debit_idempotency = f"idem_debit_{uuid.uuid4().hex[:12]}"
    s, debit_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "DEBIT",
        "amount_paise": debit_amount,
        "reason": "Phase 3B foundation test debit",
        "idempotency_key": debit_idempotency
    }, token=admin_token)
    test("Admin debit succeeds (201/200)", s in (200, 201), f"status={s}")
    txn_debit_id = debit_res.get("transaction_id")
    test("Debit transaction direction is DEBIT", debit_res.get("direction") == "DEBIT")
    test("Balance before - amount equals balance after", debit_res.get("balance_after_paise") == (debit_res.get("balance_before_paise", 0) - debit_amount))
    expected_balance = post_credit_balance - debit_amount
    test("Customer balance reflects exact debit", debit_res.get("balance_after_paise") == expected_balance)

    # 9. Overdraft Prevention / Insufficient Balance
    print("\n--- 9. Overdraft Prevention ---")
    s, over_res = http_request("POST", f"{BASE_API}/wallet/admin/adjust", {
        "user_id": cust_a_id,
        "direction": "DEBIT",
        "amount_paise": 9999999,  # Far exceeds balance
        "reason": "Overdraft test attempt"
    }, token=admin_token)
    test("Debit exceeding available balance rejected (400)", s == 400, f"status={s}, res={over_res}")

    # Check balance remained unaffected after failed debit
    _, cust_wallet_after_over = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    test("Balance unchanged after overdraft attempt", cust_wallet_after_over.get("wallet", {}).get("balance_paise") == expected_balance)

    # 10. Customer Transaction Ledger Listing
    print("\n--- 10. Customer Transaction Ledger Listing ---")
    s, txns_res = http_request("GET", f"{BASE_API}/wallet/me/transactions?limit=10", token=cust_token)
    test("Customer retrieves own transaction list (200)", s == 200 and "items" in txns_res)
    cust_txns = txns_res.get("items", [])
    test("Ledger contains at least credit and debit transactions", len(cust_txns) >= 2)
    test("Transactions ordered newest first", len(cust_txns) >= 2 and cust_txns[0].get("created_at") >= cust_txns[-1].get("created_at"))

    # 11. Customer Transaction Detail & Isolation
    print("\n--- 11. Customer Transaction Detail & Privacy Isolation ---")
    s, txn_detail = http_request("GET", f"{BASE_API}/wallet/me/transactions/{txn_credit_id}", token=cust_token)
    test("Customer A can view their own transaction detail (200)", s == 200 and txn_detail.get("transaction_id") == txn_credit_id)

    # Customer B attempts to inspect Customer A's transaction
    s, cross_res = http_request("GET", f"{BASE_API}/wallet/me/transactions/{txn_credit_id}", token=cust_b_token)
    test("Customer B CANNOT view Customer A's transaction (403)", s == 403, f"status={s}")

    # 12. Admin Wallet Management Endpoints
    print("\n--- 12. Admin Wallet Management Endpoints ---")
    s, admin_list = http_request("GET", f"{BASE_API}/wallet/admin/wallets?limit=10", token=admin_token)
    test("Admin can list customer wallets (200)", s == 200 and "items" in admin_list)

    s, admin_wallet_detail = http_request("GET", f"{BASE_API}/wallet/admin/wallets/{cust_a_id}", token=admin_token)
    test("Admin can inspect specific customer wallet and history (200)", s == 200 and "wallet" in admin_wallet_detail)
    test("Admin response includes recent_transactions", "recent_transactions" in admin_wallet_detail)

    # 13. Authoritative Reconciliation Engine
    print("\n--- 13. Authoritative Ledger Reconciliation ---")
    s, recon_res = http_request("GET", f"{BASE_API}/wallet/admin/reconcile/{cust_a_id}", token=admin_token)
    test("Admin reconciliation check returns 200", s == 200)
    test("Reconciliation status is_reconciled is True", recon_res.get("is_reconciled") is True)
    test("Discrepancy is exactly 0 paise", recon_res.get("discrepancy_paise") == 0)
    test("Wallet balance matches sum of ledger credits minus debits", recon_res.get("wallet_balance_paise") == recon_res.get("ledger_calculated_balance_paise"))

    # 14. Immutable Ledger Verification
    print("\n--- 14. Ledger Immutability Verification ---")
    # Verify no PUT or DELETE endpoints exist for transactions
    s, _ = http_request("PUT", f"{BASE_API}/wallet/me/transactions/{txn_credit_id}", {"amount_paise": 99999}, token=cust_token)
    test("PUT /wallet/me/transactions returns 405 Method Not Allowed", s == 405, f"status={s}")

    s, _ = http_request("DELETE", f"{BASE_API}/wallet/me/transactions/{txn_credit_id}", token=admin_token)
    test("DELETE /wallet/me/transactions returns 405 Method Not Allowed", s == 405, f"status={s}")

    # 15. Summary & Results
    print("\n" + "=" * 75)
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    failed_tests = total_tests - passed_tests

    print(f"  TOTAL: {total_tests} | PASSED: {passed_tests} | FAILED: {failed_tests}")
    print("=" * 75)

    if failed_tests > 0:
        print("\n[FAIL] Some Phase 3B wallet tests failed:")
        for name, passed in results.items():
            if not passed:
                print(f"  - {name}")
        return False
    else:
        print("\n[SUCCESS] All Phase 3B wallet tests PASSED cleanly!")
        return True


if __name__ == "__main__":
    success = run_phase3b_tests()
    sys.exit(0 if success else 1)
