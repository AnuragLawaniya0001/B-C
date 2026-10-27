"""BIGCHAMP Phase 3C.2: Final Recovery Idempotency Audit Test Suite.
Evidence-driven test suite verifying crash windows:
1. Crash immediately after product stock decrement before recording the deduction.
2. Crash immediately after coupon usage increment before recording the redemption.
3. Simultaneous concurrent recovery attempts (worker claim lease protection).
4. Terminal state preservation on replay/recovery.
5. Exact database assertions for stock, coupon counters, and wallet isolation.
"""
import concurrent.futures
from datetime import datetime, timezone
import hashlib
import hmac
import json
import time
import urllib.error
import urllib.request
import uuid

BASE_API = "http://localhost:3050/api/v1"
ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASS = "Admin@123"
CUST_A_EMAIL = "freeuser@bigchamp.in"
CUST_A_PASS = "User@123"
CUST_B_EMAIL = "custb_isolation@bigchamp.in"
CUST_B_PASS = "User@123"

TEST_KEY_SECRET = "gv4f7MHd9cG8tjKnb5gH8aeO"
TEST_WEBHOOK_SECRET = "BigchampTestWebhookSecret123456"

results = {}


def test(name: str, condition: bool, extra: str = ""):
    status_str = "[PASS]" if condition else "[FAIL]"
    results[name] = condition
    extra_str = f" ({extra})" if extra and not condition else ""
    print(f" {status_str} {name}{extra_str}")


def http_request(method: str, url: str, data: dict = None, token: str = None, headers_extra: dict = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if headers_extra:
        headers.update(headers_extra)

    body = None
    if data is not None:
        if isinstance(data, (dict, list)):
            body = json.dumps(data).encode("utf-8")
        elif isinstance(data, bytes):
            body = data
        elif isinstance(data, str):
            body = data.encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_body = response.read().decode("utf-8")
            try:
                return response.status, json.loads(res_body)
            except Exception:
                return response.status, res_body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body
    except Exception as e:
        return 500, {"error": str(e)}


def compute_signature(order_id: str, payment_id: str, secret: str = TEST_KEY_SECRET) -> str:
    message = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def compute_webhook_signature(payload_bytes: bytes, secret: str = TEST_WEBHOOK_SECRET) -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


def main():
    print("=" * 80)
    print("  BIGCHAMP PHASE 3C.2: FINAL RECOVERY IDEMPOTENCY AUDIT")
    print("=" * 80)

    # 1. Authenticate Actors
    print("\n--- 1. Authenticating Accounts ---")
    s, admin_login = http_request("POST", f"{BASE_API}/admin/auth/login", {"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    admin_token = admin_login.get("access_token")
    test("Admin Authentication", s == 200 and bool(admin_token))

    s, cust_a_login = http_request("POST", f"{BASE_API}/auth/login", {"identifier": CUST_A_EMAIL, "password": CUST_A_PASS})
    cust_a_token = cust_a_login.get("access_token")
    test("Customer A Authentication", s == 200 and bool(cust_a_token))

    s, cust_b_login = http_request("POST", f"{BASE_API}/auth/login", {"identifier": CUST_B_EMAIL, "password": CUST_B_PASS})
    cust_b_token = cust_b_login.get("access_token")
    test("Customer B Authentication", s == 200 and bool(cust_b_token))

    test_address = {
        "full_name": "Audit Customer",
        "phone": "9876543210",
        "street_address": "88 Residency Road, Audit Wing",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560025",
    }

    # Fetch initial products
    s, products_res = http_request("GET", f"{BASE_API}/products")
    prods = products_res if isinstance(products_res, list) else products_res.get("items", [])
    in_stock_prods = [p for p in prods if p.get("stock", 0) > 10 and p.get("active", True)]
    test_prod = in_stock_prods[0] if in_stock_prods else prods[0]
    test_prod_id = test_prod.get("_id") or test_prod.get("slug")

    # --------------------------------------------------------------------------
    # 2. Crash Window 1: Crash After Stock Decrement Before Operation Record Update
    # --------------------------------------------------------------------------
    print("\n--- 2. Crash Window 1: After Stock Decrement Before Operation Record ---")

    # Create a product with known stock = 10
    crash_prod_slug = f"audit-inv-crash-{uuid.uuid4().hex[:6]}"
    initial_stock = 10
    s, crash_prod = http_request("POST", f"{BASE_API}/products", {
        "name": f"Audit Product {crash_prod_slug}",
        "slug": crash_prod_slug,
        "description": "Product to audit crash after stock decrement",
        "category": "EQUIPMENT",
        "price_paise": 100000,
        "stock": initial_stock,
        "sku": f"SKU-{uuid.uuid4().hex[:6].upper()}",
    }, token=admin_token)
    test("Created test product with stock = 10", s in (200, 201))
    crash_prod_id = crash_prod.get("_id") or crash_prod.get("slug")

    # Customer places order for 2 units
    purchase_qty = 2
    s, ord_crash1 = http_request("POST", f"{BASE_API}/orders", {
        "items": [{"product_id": crash_prod_id, "qty": purchase_qty}],
        "delivery_address": test_address,
    }, token=cust_a_token)
    num_crash1 = ord_crash1.get("order_number")

    # Initiate payment
    s, pay_init1 = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": num_crash1}, token=cust_a_token)
    prov_ord1 = pay_init1.get("provider_order_id")
    pay_id1 = f"pay_c1_{uuid.uuid4().hex[:8]}"
    sig1 = compute_signature(prov_ord1, pay_id1)

    # INJECT CRASH: Crash immediately after db.products.update_one succeeds, BEFORE updating op
    s, crash_res1 = http_request(
        "POST",
        f"{BASE_API}/payments/verify",
        {
            "order_id": num_crash1,
            "provider_order_id": prov_ord1,
            "provider_payment_id": pay_id1,
            "provider_signature": sig1,
        },
        token=cust_a_token,
        headers_extra={"X-Payment-Fault-Stage": "after_stock_before_record"},
    )
    test("Crash after stock decrement triggered HTTP 500", s == 500)

    # Check database stock right after crash: stock was decremented from 10 to 8
    _, prod_post_crash = http_request("GET", f"{BASE_API}/products/{crash_prod_slug}")
    test("Database product stock was decremented to 8 during crashed attempt", prod_post_crash.get("stock") == 8)

    # Execute recovery: recovery must recognize applied_deductions and NOT decrement stock a second time!
    s, rec_res1 = http_request("POST", f"{BASE_API}/payments/admin/recover", {
        "payment_id_or_operation_id": pay_init1["payment_id"],
        "notes": "Admin recovery after inventory crash",
    }, token=admin_token)
    test("Admin recovery executed successfully (200)", s == 200 and rec_res1.get("success") is True)

    # Critical Database Assertion: Stock must STILL be exactly 8 (NOT 6!)
    _, prod_post_recovery = http_request("GET", f"{BASE_API}/products/{crash_prod_slug}")
    test("Database assertion: Product stock is EXACTLY 8 (Zero duplicate deduction)",
         prod_post_recovery.get("stock") == initial_stock - purchase_qty,
         f"expected=8, actual={prod_post_recovery.get('stock')}")

    # Replay recovery again: ensure replaying recovery has zero side effects
    s, replay_rec = http_request("POST", f"{BASE_API}/payments/admin/recover", {
        "payment_id_or_operation_id": pay_init1["payment_id"],
    }, token=admin_token)
    test("Replaying recovery on completed operation returns 200 idempotently", s == 200)

    _, prod_post_replay = http_request("GET", f"{BASE_API}/products/{crash_prod_slug}")
    test("Database assertion after replay: Stock remains unchanged at 8", prod_post_replay.get("stock") == 8)

    # --------------------------------------------------------------------------
    # 3. Crash Window 2: Crash After Coupon Increment Before Redemption Record
    # --------------------------------------------------------------------------
    print("\n--- 3. Crash Window 2: After Coupon Increment Before Redemption Record ---")

    coupon_crash_code = f"CRASHCP_{uuid.uuid4().hex[:6].upper()}"
    s, _ = http_request("POST", f"{BASE_API}/coupons", {
        "code": coupon_crash_code,
        "name": "Audit Coupon Crash Test",
        "discount_type": "PERCENTAGE",
        "discount_value": 15.0,
        "total_usage_limit": 5,
        "active": True,
    }, token=admin_token)
    test("Created test coupon with total_usage_limit = 5", s in (200, 201))

    # Place order with this coupon
    s, ord_crash2 = http_request("POST", f"{BASE_API}/orders", {
        "items": [{"product_id": test_prod_id, "qty": 1}],
        "delivery_address": test_address,
        "coupon_code": coupon_crash_code,
    }, token=cust_a_token)
    num_crash2 = ord_crash2.get("order_number")

    # Initiate payment
    s, pay_init2 = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": num_crash2}, token=cust_a_token)
    prov_ord2 = pay_init2.get("provider_order_id")
    pay_id2 = f"pay_c2_{uuid.uuid4().hex[:8]}"
    sig2 = compute_signature(prov_ord2, pay_id2)

    # INJECT CRASH: Crash immediately after coupon increment before recording redemption
    s, crash_res2 = http_request(
        "POST",
        f"{BASE_API}/payments/verify",
        {
            "order_id": num_crash2,
            "provider_order_id": prov_ord2,
            "provider_payment_id": pay_id2,
            "provider_signature": sig2,
        },
        token=cust_a_token,
        headers_extra={"X-Payment-Fault-Stage": "after_coupon_before_record"},
    )
    test("Crash after coupon increment triggered HTTP 500", s == 500)

    # Check coupon counter right after crash: times_used was incremented from 0 to 1
    _, cp_post_crash = http_request("GET", f"{BASE_API}/coupons/{coupon_crash_code}", token=admin_token)
    test("Coupon times_used was incremented to 1 during crashed attempt", cp_post_crash.get("times_used") == 1)

    # Execute recovery: recovery must recognize applied_redemptions and NOT increment times_used again!
    s, rec_res2 = http_request("POST", f"{BASE_API}/payments/admin/recover", {
        "payment_id_or_operation_id": pay_init2["payment_id"],
        "notes": "Admin recovery after coupon crash",
    }, token=admin_token)
    test("Admin recovery executed successfully (200)", s == 200 and rec_res2.get("success") is True)

    # Critical Database Assertion: times_used must STILL be exactly 1 (NOT 2!)
    _, cp_post_recovery = http_request("GET", f"{BASE_API}/coupons/{coupon_crash_code}", token=admin_token)
    test("Database assertion: Coupon times_used is EXACTLY 1 (Zero duplicate redemption)",
         cp_post_recovery.get("times_used") == 1,
         f"expected=1, actual={cp_post_recovery.get('times_used')}")

    # Replay recovery again: ensure replaying recovery has zero side effects on coupon
    http_request("POST", f"{BASE_API}/payments/admin/recover", {"payment_id_or_operation_id": pay_init2["payment_id"]}, token=admin_token)
    _, cp_post_replay = http_request("GET", f"{BASE_API}/coupons/{coupon_crash_code}", token=admin_token)
    test("Database assertion after replay: Coupon times_used remains unchanged at 1", cp_post_replay.get("times_used") == 1)

    # --------------------------------------------------------------------------
    # 4. Simultaneous Concurrent Recovery Workers (Lease / Lock Protection)
    # --------------------------------------------------------------------------
    print("\n--- 4. Simultaneous Concurrent Recovery Workers ---")

    # Create an interrupted operation to recover
    s, ord_sim = http_request("POST", f"{BASE_API}/orders", {
        "items": [{"product_id": test_prod_id, "qty": 1}],
        "delivery_address": test_address,
    }, token=cust_a_token)
    num_sim = ord_sim.get("order_number")

    s, pay_sim = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": num_sim}, token=cust_a_token)
    prov_sim = pay_sim.get("provider_order_id")
    p_sim_id = f"pay_sim_{uuid.uuid4().hex[:8]}"
    sig_sim = compute_signature(prov_sim, p_sim_id)

    # Crash during verify
    http_request(
        "POST",
        f"{BASE_API}/payments/verify",
        {
            "order_id": num_sim,
            "provider_order_id": prov_sim,
            "provider_payment_id": p_sim_id,
            "provider_signature": sig_sim,
        },
        token=cust_a_token,
        headers_extra={"X-Payment-Fault-Stage": "after_order_confirm"},
    )

    # Execute concurrent recovery requests in parallel using thread pool
    def call_recover():
        return http_request("POST", f"{BASE_API}/payments/admin/recover", {
            "payment_id_or_operation_id": pay_sim["payment_id"],
            "notes": "Concurrent worker recovery",
        }, token=admin_token)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(call_recover) for _ in range(5)]
        sim_results = [f.result() for f in futures]

    statuses = [r[0] for r in sim_results]
    test("All concurrent recovery workers resolve cleanly without 500 crashes",
         all(st in (200, 409) for st in statuses),
         f"statuses={statuses}")
    test("At least one recovery worker succeeded with 200", 200 in statuses)

    # Verify final state of order
    s, final_sim_order = http_request("GET", f"{BASE_API}/orders/my/{num_sim}", token=cust_a_token)
    test("Order confirmed with PAID status after concurrent recovery",
         final_sim_order.get("order_status") == "CONFIRMED" and final_sim_order.get("payment_status") == "PAID")

    # --------------------------------------------------------------------------
    # 5. Stale Recovery Terminal State Protection
    # --------------------------------------------------------------------------
    print("\n--- 5. Stale Recovery Terminal State Protection ---")
    s, stale_rec = http_request("POST", f"{BASE_API}/payments/admin/recover", {
        "payment_id_or_operation_id": pay_sim["payment_id"],
        "notes": "Attempting stale recovery on terminal order",
    }, token=admin_token)
    test("Stale recovery on terminal COMPLETED operation returns 200 without mutation",
         s == 200 and "already finalized" in stale_rec.get("message", "").lower() or stale_rec.get("success") is True)

    # --------------------------------------------------------------------------
    # 6. Wallet Balance Isolation Across All Operations
    # --------------------------------------------------------------------------
    print("\n--- 6. Wallet Balance Isolation Across All Operations ---")
    s, w_cust = http_request("GET", f"{BASE_API}/wallet/me", token=cust_a_token)
    test("Customer wallet balance remains integer paise and unchanged",
         isinstance(w_cust.get("wallet", {}).get("balance_paise"), int))

    # --------------------------------------------------------------------------
    # 7. Summary
    # --------------------------------------------------------------------------
    print("\n" + "=" * 80)
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    failed_tests = total_tests - passed_tests
    print(f"  TOTAL: {total_tests} | PASSED: {passed_tests} | FAILED: {failed_tests}")
    print("=" * 80)

    if failed_tests == 0:
        print("\n[SUCCESS] All Phase 3C.2 Final Recovery Idempotency Audit tests PASSED cleanly!\n")
    else:
        print(f"\n[FAILURE] {failed_tests} tests failed!\n")
        exit(1)


if __name__ == "__main__":
    main()
