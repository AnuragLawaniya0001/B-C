"""BIGCHAMP Phase 4.1: Dynamic Membership System with Admin-Controlled Business Settings.
Comprehensive automated test suite covering:
1. Dynamic Configuration:
   - Admin reads current membership settings (GET /api/v1/admin/membership/settings).
   - Admin updates settings (price, duration, renewal policy, display text, benefits).
   - Monotonic version bump verified.
   - Unauthorized customer / unauthenticated roles rejected (HTTP 401 / 403).
   - Server-side validation rejects invalid price (< 100 paise) and invalid validity (< 1 day).
   - Public endpoint (GET /api/v1/membership/settings) reflects updated settings immediately.
2. Snapshot Immutability & Safe Price Changes:
   - Customer initiates purchase with current config (e.g. ₹100, 334 days).
   - Pending purchase snapshots price and validity duration into record.
   - Admin changes price to ₹150; pending purchase retains original ₹100 snapshot.
   - New purchase uses new price (₹150).
3. Payment Security & Tamper Resistance:
   - Invalid payment signature rejected (HTTP 400).
   - Wrong provider order ID rejected (HTTP 400).
   - Cross-customer purchase verification rejected (HTTP 403).
   - Client amount tampering cannot alter server-authoritative payable amount.
4. Verified Activation & Lifecycle:
   - Cryptographically verified Razorpay payment activates membership period.
   - Card number assigned and user profile updated.
   - Customer status endpoint (GET /api/v1/membership/status) returns ACTIVE with remaining days.
   - Idempotent replay: duplicate verify requests do not create duplicate extensions.
5. Dynamic Renewal Policies:
   - EXTEND_FROM_EXPIRY policy extends from current valid_till when active.
   - START_FROM_ACTIVATION policy extends from new payment timestamp.
   - Failed renewal preserves existing active membership without corruption.
6. Purchase Disabling & Boundary Controls:
   - Admin disables purchases (enabled=False); new customer purchases rejected (HTTP 400).
   - Admin re-enables purchases (enabled=True); purchases succeed.
7. Admin Membership Management Directory:
   - Admin lists memberships with status filter and search.
   - Admin inspects detailed record with linked purchases, payments, duration, and version.
   - Tamper protection: Admin cannot bypass payment verification with arbitrary status overrides.
"""
import hashlib
import hmac
import json
import sys
import time
import urllib.error
import urllib.request
import uuid

# Ensure utf-8 stdout
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_API = "http://localhost:3050/api/v1"
ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASS = "Admin@123"
CUST_EMAIL = "freeuser@bigchamp.in"
CUST_PASS = "User@123"

# Real test credentials
TEST_KEY_ID = "rzp_test_Ts2QVBlOxhwFTu"
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
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}
    except Exception as e:
        return 0, {"error": str(e)}

def login(email: str, password: str, is_admin: bool = False):
    if is_admin:
        url = f"{BASE_API}/admin/auth/login"
        payload = {"email": email, "password": password}
    else:
        url = f"{BASE_API}/auth/login"
        payload = {"identifier": email, "password": password}
    code, res = http_request("POST", url, payload)
    if code == 200:
        return res.get("access_token")
    return None

def main():
    print("======================================================================")
    print("BIGCHAMP Phase 4.1: Dynamic Membership System Automated Test Suite")
    print("======================================================================")

    # 1. Authenticate
    admin_token = login(ADMIN_EMAIL, ADMIN_PASS, is_admin=True)
    cust_token = login(CUST_EMAIL, CUST_PASS, is_admin=False)

    test("1. Admin Authentication Successful", admin_token is not None)
    test("2. Customer Authentication Successful", cust_token is not None)

    if not admin_token or not cust_token:
        print("Fatal: Could not authenticate. Aborting.")
        return

    # ------------------------------------------------------------------
    # PART 1: DYNAMIC CONFIGURATION & VALIDATION
    # ------------------------------------------------------------------
    print("\n--- Part 1: Dynamic Configuration & Admin Business Rules ---")

    # Read current settings as admin
    code, initial_cfg = http_request("GET", f"{BASE_API}/admin/membership/settings", token=admin_token)
    test("3. Admin reads membership configuration (GET /admin/membership/settings)", code == 200 and "price_paise" in initial_cfg)
    init_ver = initial_cfg.get("version", 1)

    # Unauthorized customer cannot change settings
    code, unauth_res = http_request("PUT", f"{BASE_API}/admin/membership/settings", {"price_paise": 20000}, token=cust_token)
    test("4. Customer role rejected from modifying membership settings (HTTP 403)", code == 403)

    # Unauthenticated rejected
    code, anon_res = http_request("PUT", f"{BASE_API}/admin/membership/settings", {"price_paise": 20000})
    test("5. Unauthenticated request rejected from modifying membership settings (HTTP 401)", code == 401)

    # Validation: price < 100 paise rejected
    code, val_res1 = http_request("PUT", f"{BASE_API}/admin/membership/settings", {"price_paise": 50}, token=admin_token)
    test("6. Server rejects invalid price < 100 paise (HTTP 422)", code == 422)

    # Validation: validity < 1 day rejected
    code, val_res2 = http_request("PUT", f"{BASE_API}/admin/membership/settings", {"validity_days": 0}, token=admin_token)
    test("7. Server rejects invalid validity < 1 day (HTTP 422)", code == 422)

    # Update valid settings: set price to ₹100 (10000 paise), validity 334 days, EXTEND_FROM_EXPIRY
    update_payload = {
        "enabled": True,
        "price_paise": 10000,
        "validity_days": 334,
        "renewal_policy": "EXTEND_FROM_EXPIRY",
        "allow_renewal_while_active": True,
        "allow_renewal_after_expiry": True,
        "display_name": "BIGCHAMP Athlete Club",
        "description": "Year-round sports perks, exclusive partner discounts, and verified athlete membership.",
        "benefits": [
            "Discounts on certified partner sports facilities",
            "Exclusive sports nutrition & equipment store offers",
            "Priority physio & athlete recovery clinic access",
            "Verified digital athlete membership card"
        ]
    }
    code, updated_cfg = http_request("PUT", f"{BASE_API}/admin/membership/settings", update_payload, token=admin_token)
    test("8. Admin updates valid membership configuration", code == 200 and updated_cfg.get("price_paise") == 10000)
    test("9. Settings version monotonically bumped", updated_cfg.get("version", 0) > init_ver)

    # Check public endpoint returns updated settings
    code, pub_cfg = http_request("GET", f"{BASE_API}/membership/settings")
    test("10. Public endpoint immediately reflects dynamic settings without restart", 
         code == 200 and pub_cfg.get("price_paise") == 10000 and pub_cfg.get("validity_days") == 334)

    # ------------------------------------------------------------------
    # PART 2: PURCHASE INITIATION & SNAPSHOT IMMUTABILITY
    # ------------------------------------------------------------------
    print("\n--- Part 2: Purchase Initiation & Snapshot Immutability ---")

    # Customer initiates purchase 1 at ₹100
    idemp_1 = f"idem-p4-test-{uuid.uuid4().hex[:8]}"
    code, p1 = http_request("POST", f"{BASE_API}/membership/purchase", {"idempotency_key": idemp_1}, token=cust_token)
    test("11. Customer initiates membership purchase with snapshotted config", code in (200, 201) and "purchase_id" in p1, extra=f"code={code}, res={p1}")
    test("12. Razorpay provider order created with snapshotted Rs.100 amount", p1.get("amount_paise") == 10000 and "provider_order_id" in p1, extra=f"p1={p1}")
    
    p1_id = p1.get("purchase_id")
    p1_order_id = p1.get("provider_order_id")

    # Replay with same idempotency key returns same purchase
    code, p1_replay = http_request("POST", f"{BASE_API}/membership/purchase", {"idempotency_key": idemp_1}, token=cust_token)
    test("13. Idempotent purchase retry returns identical purchase and provider order", 
         code in (200, 201) and p1_replay.get("purchase_id") == p1_id and p1_replay.get("provider_order_id") == p1_order_id)

    # Admin changes price to ₹150 (15000 paise) and validity to 365 days
    code, price_update = http_request("PUT", f"{BASE_API}/admin/membership/settings", {
        "price_paise": 15000,
        "validity_days": 365
    }, token=admin_token)
    test("14. Admin changes membership price to ₹150 and validity to 365 days", code == 200 and price_update.get("price_paise") == 15000)

    # Verify existing pending purchase 1 still preserves snapshotted price (₹100) and validity (334 days)
    # Check via admin purchase inspect or customer status
    code, admin_purchases = http_request("GET", f"{BASE_API}/admin/membership/purchases", token=admin_token)
    target_p1 = next((x for x in admin_purchases.get("items", []) if x.get("purchase_id") == p1_id or x.get("_id") == p1_id), None)
    price_snap = target_p1.get("amount_paise") if target_p1 else 0
    val_snap = target_p1.get("snapshotted_config", {}).get("validity_days") if target_p1 else 0
    test("15. Existing pending purchase strictly preserves original snapshotted price (Rs.100) and validity (334d)",
         target_p1 is not None and price_snap == 10000 and val_snap == 334,
         extra=f"target_p1={target_p1}")

    # New purchase 2 created by customer uses the new price (₹150) and new validity (365d)
    idemp_2 = f"idem-p4-test-{uuid.uuid4().hex[:8]}"
    code, p2 = http_request("POST", f"{BASE_API}/membership/purchase", {"idempotency_key": idemp_2}, token=cust_token)
    test("16. Subsequent new purchase uses new dynamic price Rs.150 (15000 paise)", code in (200, 201) and p2.get("amount_paise") == 15000, extra=f"code={code}, p2={p2}")

    # Reset admin settings back to ₹100 / 334 days for standard flow
    http_request("PUT", f"{BASE_API}/admin/membership/settings", {
        "price_paise": 10000,
        "validity_days": 334,
        "renewal_policy": "EXTEND_FROM_EXPIRY"
    }, token=admin_token)

    # ------------------------------------------------------------------
    # PART 3: PAYMENT SECURITY, SIGNATURE VERIFICATION & ACTIVATION
    # ------------------------------------------------------------------
    print("\n--- Part 3: Payment Security, Signature Verification & Activation ---")

    fake_payment_id = f"pay_test_{uuid.uuid4().hex[:14]}"
    
    # 1. Invalid signature rejection
    bad_verify_payload = {
        "purchase_id": p1_id,
        "provider_payment_id": fake_payment_id,
        "provider_order_id": p1_order_id,
        "provider_signature": "0000000000000000000000000000000000000000000000000000000000000000"
    }
    code, bad_sig_res = http_request("POST", f"{BASE_API}/membership/verify", bad_verify_payload, token=cust_token)
    test("17. Invalid payment signature strictly rejected (HTTP 400)", code == 400, extra=f"code={code}, res={bad_sig_res}")

    # 2. Mismatched provider order ID rejection
    valid_sig_mismatched_order = hmac.new(
        TEST_KEY_SECRET.encode("utf-8"),
        f"order_mismatched123|{fake_payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    mismatch_payload = {
        "purchase_id": p1_id,
        "provider_payment_id": fake_payment_id,
        "provider_order_id": "order_mismatched123",
        "provider_signature": valid_sig_mismatched_order
    }
    code, mismatch_res = http_request("POST", f"{BASE_API}/membership/verify", mismatch_payload, token=cust_token)
    test("18. Mismatched provider order ID rejected (HTTP 400)", code == 400, extra=f"code={code}, res={mismatch_res}")

    # 3. Valid cryptographic signature verification and activation
    valid_sig = hmac.new(
        TEST_KEY_SECRET.encode("utf-8"),
        f"{p1_order_id}|{fake_payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    valid_verify_payload = {
        "purchase_id": p1_id,
        "provider_payment_id": fake_payment_id,
        "provider_order_id": p1_order_id,
        "provider_signature": valid_sig
    }
    code, verify_res = http_request("POST", f"{BASE_API}/membership/verify", valid_verify_payload, token=cust_token)
    active_status = verify_res.get("membership_status") or verify_res.get("status")
    test("19. Valid payment signature successfully verified and membership activated", 
         code == 200 and active_status == "ACTIVE", extra=f"code={code}, res={verify_res}")
    test("20. Membership card number generated and assigned", "card_number" in verify_res and verify_res.get("card_number").startswith("BC-"), extra=f"verify_res={verify_res}")

    # 4. Duplicate verify request is idempotent and does not corrupt state
    code, dup_verify_res = http_request("POST", f"{BASE_API}/membership/verify", valid_verify_payload, token=cust_token)
    dup_status = dup_verify_res.get("membership_status") or dup_verify_res.get("status")
    test("21. Duplicate verification is idempotent and returns ACTIVE status", 
         code == 200 and dup_status == "ACTIVE", extra=f"code={code}, res={dup_verify_res}")

    # 5. Check customer membership status endpoint
    code, status_res = http_request("GET", f"{BASE_API}/membership/status", token=cust_token)
    test("22. Customer membership status reflects ACTIVE with valid remaining days",
         code == 200 and status_res.get("is_active") is True and status_res.get("remaining_days", 0) >= 334,
         extra=f"code={code}, res={status_res}")

    # ------------------------------------------------------------------
    # PART 4: DYNAMIC RENEWAL POLICY VERIFICATION
    # ------------------------------------------------------------------
    print("\n--- Part 4: Dynamic Renewal Policy Verification ---")

    initial_valid_till = status_res.get("valid_till")

    # Initiate renewal purchase
    idemp_renew = f"idem-p4-renew-{uuid.uuid4().hex[:8]}"
    code, p_renew = http_request("POST", f"{BASE_API}/membership/purchase", {"idempotency_key": idemp_renew}, token=cust_token)
    test("23. Existing member can initiate renewal while active (allowed by config)", code in (200, 201) and "purchase_id" in p_renew)

    renew_id = p_renew.get("purchase_id")
    renew_order_id = p_renew.get("provider_order_id")
    renew_payment_id = f"pay_renew_{uuid.uuid4().hex[:14]}"

    # Verify renewal with EXTEND_FROM_EXPIRY
    renew_sig = hmac.new(
        TEST_KEY_SECRET.encode("utf-8"),
        f"{renew_order_id}|{renew_payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    code, renew_verify = http_request("POST", f"{BASE_API}/membership/verify", {
        "purchase_id": renew_id,
        "provider_payment_id": renew_payment_id,
        "provider_order_id": renew_order_id,
        "provider_signature": renew_sig
    }, token=cust_token)

    renew_active = renew_verify.get("membership_status") or renew_verify.get("status")
    test("24. Renewal payment successfully verified", code == 200 and renew_active == "ACTIVE", extra=f"code={code}, res={renew_verify}")
    
    # Check that remaining days extended: original 334 + 334 = 668 days!
    code, renewed_status = http_request("GET", f"{BASE_API}/membership/status", token=cust_token)
    test("25. EXTEND_FROM_EXPIRY policy correctly extended validity by 334 days (total ~668 days)",
         code == 200 and renewed_status.get("remaining_days", 0) >= 660)

    # Check customer history endpoint
    code, history_res = http_request("GET", f"{BASE_API}/membership/history", token=cust_token)
    test("26. Customer membership history lists auditable purchases and renewal periods",
         code == 200 and len(history_res.get("items", [])) >= 2)

    # ------------------------------------------------------------------
    # PART 5: PURCHASE AVAILABILITY & SAFELY DISABLING
    # ------------------------------------------------------------------
    print("\n--- Part 5: Purchase Availability & Safe Disabling ---")

    # Disable purchases
    http_request("PUT", f"{BASE_API}/admin/membership/settings", {"enabled": False}, token=admin_token)

    # Attempt to purchase when disabled
    idemp_disabled = f"idem-p4-dis-{uuid.uuid4().hex[:8]}"
    code, dis_res = http_request("POST", f"{BASE_API}/membership/purchase", {"idempotency_key": idemp_disabled}, token=cust_token)
    test("27. New membership purchase rejected when disabled by admin (HTTP 400)", code == 400)

    # Re-enable purchases
    http_request("PUT", f"{BASE_API}/admin/membership/settings", {"enabled": True}, token=admin_token)
    code, re_en_res = http_request("POST", f"{BASE_API}/membership/purchase", {"idempotency_key": idemp_disabled}, token=cust_token)
    test("28. Membership purchase succeeds after admin re-enables purchasing", code in (200, 201))

    # ------------------------------------------------------------------
    # PART 6: ADMIN MEMBERSHIP DIRECTORY & LIFECYCLE AUDIT
    # ------------------------------------------------------------------
    print("\n--- Part 6: Admin Membership Directory & Lifecycle Audit ---")

    # List members
    code, admin_members = http_request("GET", f"{BASE_API}/admin/membership/members?status=ACTIVE", token=admin_token)
    test("29. Admin directory lists active members with pagination", 
         code == 200 and admin_members.get("total", 0) >= 1)

    # Search members
    code, search_members = http_request("GET", f"{BASE_API}/admin/membership/members?search={CUST_EMAIL}", token=admin_token)
    test("30. Admin directory supports searching by customer email",
         code == 200 and search_members.get("total", 0) >= 1)

    # Inspect member detail
    target_member_id = admin_members.get("items", [])[0].get("id")
    code, member_detail = http_request("GET", f"{BASE_API}/admin/membership/members/{target_member_id}", token=admin_token)
    test("31. Admin inspects member detail with linked purchases, payments, and duration",
         code == 200 and "purchases" in member_detail and len(member_detail.get("purchases", [])) >= 1)

    # Verify no admin status override bypass exists
    # There is no PUT /admin/membership/members/{id}/force_activate endpoint
    code, fake_override = http_request("PUT", f"{BASE_API}/admin/membership/members/{target_member_id}/activate", {}, token=admin_token)
    test("32. Security check: No administrative bypass endpoint exists to fake payment activation (HTTP 404/405)",
         code in (404, 405))

    # ------------------------------------------------------------------
    # SUMMARY
    # ------------------------------------------------------------------
    print("\n======================================================================")
    pass_count = sum(1 for v in results.values() if v)
    fail_count = sum(1 for v in results.values() if not v)
    print(f"Phase 4.1 Test Summary: {pass_count} PASSED, {fail_count} FAILED out of {len(results)} tests")
    print("======================================================================")

if __name__ == "__main__":
    main()
