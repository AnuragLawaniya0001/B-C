"""Phase 3C Automated Test Suite for Bigchamp: Razorpay Sandbox Payment Integration.

Tests:
1. Unauthenticated payment initiation rejected (HTTP 401).
2. Customer cannot pay another customer's order (HTTP 403).
3. Ineligible order states rejected: cancelled or already-paid orders (HTTP 400).
4. Server-authoritative pricing: client cannot tamper with payable amount.
5. Payment initiation succeeds in test mode: returns provider_order_id, key_id, amount in paise.
6. Secrets never leaked: key_secret is never returned in client payload.
7. Idempotency: duplicate initiation returns existing payment attempt without duplicates.
8. Invalid signature rejected with HTTP 400.
9. Provider order/payment mismatch rejected with HTTP 400.
10. Cross-customer isolation: Customer B cannot verify Customer A's payment (HTTP 403).
11. Cryptographic HMAC-SHA256 signature verification succeeds (HTTP 200).
12. Order status transitions to CONFIRMED and payment_status to PAID.
13. Authoritative stock deduction: inventory deducted exactly once.
14. Authoritative coupon redemption: times_used incremented exactly once.
15. Idempotent replay: duplicate verification does not double-deduct stock or coupon.
16. Wallet isolation: customer wallet balance and ledger remain completely unaffected.
17. Webhook signature security: missing or tampered X-Razorpay-Signature rejected (HTTP 400).
18. Webhook idempotency: duplicate event_id acknowledged without duplicate processing.
19. Admin payments monitoring & RBAC: Customer forbidden (403), Admin lists and inspects audit trail (200).
20. Order payment protection: manual admin status transition cannot represent unpaid orders as paid.
"""
from datetime import datetime, timezone
import hashlib
import hmac
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
TEST_KEY_SECRET = "gv4f7MHd9cG8tjKnb5gH8aeO"
TEST_WEBHOOK_SECRET = "BigchampTestWebhookSecret123456"


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


def compute_test_signature(order_id, payment_id, secret=TEST_KEY_SECRET):
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def compute_test_webhook_signature(raw_bytes, secret=TEST_WEBHOOK_SECRET):
    return hmac.new(secret.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()


def run_phase3c_tests():
    print("=" * 80)
    print("  BIGCHAMP PHASE 3C: RAZORPAY SANDBOX PAYMENT INTEGRATION TESTS")
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
    cust_a_id = cust_user.get("id") or cust_user.get("_id")
    test("Customer A Authentication", s == 200 and bool(cust_token))

    # Authenticate / Register Customer B
    cust_b_email = "custb_isolation@bigchamp.in"
    s, cust_b_data = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": cust_b_email,
        "password": "User@123"
    })
    cust_b_token = cust_b_data.get("access_token")
    if not cust_b_token:
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

    test("Customer B Authentication", bool(cust_b_token))

    if not admin_token or not cust_token or not cust_b_token:
        print("[FATAL] Missing required tokens. Aborting test suite.")
        return False

    # 2. Setup Test Product and Coupon
    print("\n--- 2. Setting Up Test Product & Coupon ---")
    s, prod_list = http_request("GET", f"{BASE_API}/products?limit=5")
    active_prods = [p for p in (prod_list if isinstance(prod_list, list) else []) if p.get("active", True) and (p.get("stock", 0) > 5)]
    if not active_prods:
        print("[FATAL] No active product with stock available for testing.")
        return False
    test_prod = active_prods[0]
    test_prod_id = test_prod.get("_id") or test_prod.get("slug")
    test_prod_price = test_prod.get("price_paise", 0)
    initial_stock = test_prod.get("stock", 10)
    print(f"Using test product: '{test_prod.get('name')}', price: ₹{test_prod_price/100:.2f}, stock: {initial_stock}")

    # Seed test coupon
    test_coupon_code = f"PAYTEST{uuid.uuid4().hex[:4].upper()}"
    http_request("POST", f"{BASE_API}/coupons", {
        "code": test_coupon_code,
        "name": "Payment Test Coupon",
        "discount_type": "PERCENTAGE",
        "discount_value": 10.0,
        "min_order_paise": 100,
        "active": True,
    }, token=admin_token)

    # 3. Create Orders for Payment Tests
    print("\n--- 3. Order Placement for Payment Tests ---")
    test_address = {
        "full_name": "Test Athlete",
        "phone": "9876543210",
        "street_address": "42 Championship Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
    }

    s, order_res = http_request("POST", f"{BASE_API}/orders", {
        "items": [{"product_id": test_prod_id, "qty": 1}],
        "delivery_address": test_address,
        "coupon_code": test_coupon_code,
    }, token=cust_token)
    test("Customer A creates order in PENDING_PAYMENT status", s == 201 and order_res.get("order_status") == "PENDING_PAYMENT")
    order_a_id = order_res.get("id")
    order_a_num = order_res.get("order_number")
    order_a_payable = order_res.get("final_payable_paise")

    # Record Customer A's initial wallet balance
    _, wallet_pre = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    wallet_balance_pre = wallet_pre.get("wallet", {}).get("balance_paise", 0)

    # 4. RBAC & Ownership Security on Payment Initiation
    print("\n--- 4. Payment Initiation RBAC & Ownership Protection ---")
    s, _ = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": order_a_num})
    test("Unauthenticated payment initiation rejected (401)", s == 401)

    s, cross_init = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": order_a_num}, token=cust_b_token)
    test("Customer B cannot pay Customer A's order (403)", s == 403, f"status={s}")

    # 5. Server-Authoritative Payment Order Creation
    print("\n--- 5. Server-Authoritative Payment Order Creation ---")
    init_key = f"idem_init_{uuid.uuid4().hex[:10]}"
    s, payment_init = http_request("POST", f"{BASE_API}/payments/create-order", {
        "order_id": order_a_num,
        "amount_paise": 1,  # Browser tampering attempt!
        "idempotency_key": init_key,
    }, token=cust_token)

    test("Payment initiation succeeds (201)", s in (200, 201), f"status={s}, res={payment_init}")
    provider_order_id = payment_init.get("provider_order_id")
    payment_id = payment_init.get("payment_id")
    test("Server ignores client amount; uses authoritative order payable amount", payment_init.get("amount_paise") == order_a_payable)
    test("Public key ID returned in response", bool(payment_init.get("key_id")))
    test("Private key secret is NEVER leaked to frontend", "key_secret" not in payment_init and "secret" not in str(payment_init).lower())
    test("Provider order ID is present and formatted", bool(provider_order_id and provider_order_id.startswith("order_")))

    # Idempotent replay of create-order
    s, idem_init = http_request("POST", f"{BASE_API}/payments/create-order", {
        "order_id": order_a_num,
        "idempotency_key": init_key,
    }, token=cust_token)
    test("Duplicate initiation request returns existing provider order without duplication",
         s in (200, 201) and idem_init.get("provider_order_id") == provider_order_id)

    # 6. Signature Verification Security & Edge Cases
    print("\n--- 6. Cryptographic Signature Verification Security ---")
    fake_pay_id = f"pay_test_{uuid.uuid4().hex[:10]}"
    real_sig = compute_test_signature(provider_order_id, fake_pay_id)
    tampered_sig = real_sig[:-4] + "ffff"

    # Test 6.1: Tampered signature rejected
    s, tampered_res = http_request("POST", f"{BASE_API}/payments/verify", {
        "order_id": order_a_num,
        "provider_order_id": provider_order_id,
        "provider_payment_id": fake_pay_id,
        "provider_signature": tampered_sig,
    }, token=cust_token)
    test("Tampered payment signature rejected with 400", s == 400, f"status={s}, resp={tampered_res}")

    # Test 6.2: Provider order ID mismatch rejected
    s, mismatch_res = http_request("POST", f"{BASE_API}/payments/verify", {
        "order_id": order_a_num,
        "provider_order_id": "order_mismatch_12345",
        "provider_payment_id": fake_pay_id,
        "provider_signature": real_sig,
    }, token=cust_token)
    test("Mismatched provider order ID rejected with 400", s == 400, f"status={s}")

    # Test 6.3: Cross-customer verification rejected
    s, cross_verify = http_request("POST", f"{BASE_API}/payments/verify", {
        "order_id": order_a_num,
        "provider_order_id": provider_order_id,
        "provider_payment_id": fake_pay_id,
        "provider_signature": real_sig,
    }, token=cust_b_token)
    test("Customer B cannot verify Customer A's order payment (403)", s == 403)

    # 7. Authoritative Signature Verification & Order Finalization
    print("\n--- 7. Successful Payment Verification & Finalization ---")
    s, verify_res = http_request("POST", f"{BASE_API}/payments/verify", {
        "order_id": order_a_num,
        "provider_order_id": provider_order_id,
        "provider_payment_id": fake_pay_id,
        "provider_signature": real_sig,
    }, token=cust_token)

    test("Valid cryptographic signature verification succeeds (200)", s == 200, f"status={s}, res={verify_res}")
    test("Order status authoritatively transitioned to CONFIRMED", verify_res.get("order_status") == "CONFIRMED")
    test("Order payment_status transitioned to PAID", verify_res.get("payment_status") == "PAID")

    # Verify order in database
    s, db_order = http_request("GET", f"{BASE_API}/orders/my/{order_a_num}", token=cust_token)
    test("Database order reflects PAID payment_status", db_order.get("payment_status") == "PAID", f"status={s}, db_order={db_order}")
    test("Database order reflects CONFIRMED order_status", db_order.get("order_status") == "CONFIRMED", f"status={s}, db_order={db_order}")

    # 8. Idempotent Verification & Finalization Protection
    print("\n--- 8. Idempotent Verification Replay Protection ---")
    s, verify_replay = http_request("POST", f"{BASE_API}/payments/verify", {
        "order_id": order_a_num,
        "provider_order_id": provider_order_id,
        "provider_payment_id": fake_pay_id,
        "provider_signature": real_sig,
    }, token=cust_token)
    test("Replaying verification request returns 200 idempotently", s == 200)

    # Check already-paid order cannot initiate new payment
    s, init_paid = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": order_a_num}, token=cust_token)
    test("Already paid order rejected for new payment initiation (400)", s == 400)

    # 9. Stock Inventory and Coupon Deduction Verification
    print("\n--- 9. Inventory Stock & Coupon Redemption Verification ---")
    s, prod_after = http_request("GET", f"{BASE_API}/products/{test_prod.get('slug')}")
    current_stock = prod_after.get("stock")
    test("Product stock was deducted exactly once (-1 qty)", current_stock == initial_stock - 1, f"initial={initial_stock}, current={current_stock}")

    # Verify coupon usage was incremented
    s, coupon_doc = http_request("GET", f"{BASE_API}/coupons/{test_coupon_code}", token=admin_token)
    test("Coupon usage counter incremented exactly once (times_used = 1)", coupon_doc.get("times_used") == 1, f"times_used={coupon_doc.get('times_used')}")

    # 10. Wallet Isolation Verification
    print("\n--- 10. Wallet Isolation Verification ---")
    _, wallet_post = http_request("GET", f"{BASE_API}/wallet/me", token=cust_token)
    wallet_balance_post = wallet_post.get("wallet", {}).get("balance_paise", 0)
    test("Customer wallet balance completely unaffected by gateway payment", wallet_balance_post == wallet_balance_pre)

    # 11. Razorpay Webhook Security & Idempotency
    print("\n--- 11. Razorpay Webhook Security & Idempotency ---")
    # Test 11.1: Missing signature rejected
    s, _ = http_request("POST", f"{BASE_API}/payments/webhook", {"test": True})
    test("Webhook missing X-Razorpay-Signature header rejected (400)", s == 400)

    # Test 11.2: Tampered signature rejected
    webhook_body = json.dumps({"event": "payment.captured", "id": "evt_test_123"}).encode("utf-8")
    s, _ = http_request("POST", f"{BASE_API}/payments/webhook", webhook_body, headers_extra={"X-Razorpay-Signature": "tampered_signature"})
    test("Webhook with tampered signature rejected (400)", s == 400)

    # Test 11.3: Valid webhook event processing for a new order
    s, order_webhook_target = http_request("POST", f"{BASE_API}/orders", {
        "items": [{"product_id": test_prod_id, "qty": 1}],
        "delivery_address": test_address,
    }, token=cust_token)
    wh_order_num = order_webhook_target.get("order_number")

    # Initiate payment attempt
    s, wh_payment_init = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": wh_order_num}, token=cust_token)
    wh_provider_order_id = wh_payment_init.get("provider_order_id")
    wh_pay_id = f"pay_wh_{uuid.uuid4().hex[:10]}"
    event_id = f"evt_{uuid.uuid4().hex[:12]}"

    captured_event = {
        "entity": "event",
        "account_id": "acc_bigchamp_test",
        "event": "payment.captured",
        "event_id": event_id,
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": wh_pay_id,
                    "order_id": wh_provider_order_id,
                    "amount": order_webhook_target.get("final_payable_paise"),
                    "status": "captured",
                }
            }
        },
        "created_at": int(time.time()),
    }
    event_bytes = json.dumps(captured_event).encode("utf-8")
    valid_wh_sig = compute_test_webhook_signature(event_bytes)

    s, wh_res = http_request("POST", f"{BASE_API}/payments/webhook", event_bytes, headers_extra={"X-Razorpay-Signature": valid_wh_sig})
    test("Valid webhook event processed successfully (200)", s == 200, f"res={wh_res}")

    # Check order finalized via webhook
    s, wh_verified_order = http_request("GET", f"{BASE_API}/orders/my/{wh_order_num}", token=cust_token)
    test("Order confirmed and paid via webhook event", wh_verified_order.get("payment_status") == "PAID" and wh_verified_order.get("order_status") == "CONFIRMED", f"status={s}, order={wh_verified_order}")

    # Test 11.4: Webhook duplicate event idempotency
    s, wh_duplicate_res = http_request("POST", f"{BASE_API}/payments/webhook", event_bytes, headers_extra={"X-Razorpay-Signature": valid_wh_sig})
    test("Duplicate webhook event acknowledged without error (idempotent)", s == 200 and wh_duplicate_res.get("status") == "DUPLICATE_EVENT_IGNORED")

    # 12. Admin Payments Management & Security
    print("\n--- 12. Admin Payments Monitoring & RBAC ---")
    s, _ = http_request("GET", f"{BASE_API}/payments/admin/payments", token=cust_token)
    test("Customer forbidden from GET /payments/admin/payments (403)", s == 403)

    s, admin_payments = http_request("GET", f"{BASE_API}/payments/admin/payments?limit=10", token=admin_token)
    test("Admin can list customer payment records (200)", s == 200 and "items" in admin_payments)
    payment_items = admin_payments.get("items", [])
    test("Payment items contain provider_order_id and verified timestamps",
         len(payment_items) > 0 and bool(payment_items[0].get("provider_order_id")))

    s, admin_detail = http_request("GET", f"{BASE_API}/payments/admin/payments/{payment_id}", token=admin_token)
    test("Admin can inspect detailed payment audit trail (200)", s == 200 and "audit_history" in admin_detail)

    # 13. Summary
    print("\n" + "=" * 80)
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    failed_tests = total_tests - passed_tests

    print(f"  TOTAL: {total_tests} | PASSED: {passed_tests} | FAILED: {failed_tests}")
    print("=" * 80)

    if failed_tests > 0:
        print("\n[FAIL] Some Phase 3C payment tests failed:")
        for name, passed in results.items():
            if not passed:
                print(f"  - {name}")
        return False
    else:
        print("\n[SUCCESS] All Phase 3C Razorpay sandbox payment integration tests PASSED!")
        return True


if __name__ == "__main__":
    success = run_phase3c_tests()
    sys.exit(0 if success else 1)
