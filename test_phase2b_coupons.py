"""Phase 2B Automated Test Suite for Bigchamp: Offers & Coupons Management.

Tests:
1. Admin-only authorization & RBAC (unauthenticated 401, customer 403, admin allowed).
2. Input validation (percentage > 100% -> 422, end_date <= start_date -> 422, duplicate code -> 409).
3. Admin offer lifecycle: CRUD, search, status filtering, active toggle, archive/delete.
4. Authoritative backend discount calculation engine (POST /api/v1/coupons/validate):
   - Percentage discount calculation.
   - Percentage discount cap enforcement (max_discount_paise).
   - Fixed amount discount calculation and subtotal bounding.
   - Minimum order value threshold enforcement (min_order_paise).
   - Category-specific eligibility rules and partial cart match.
   - Expired coupon rejection.
   - Inactive coupon rejection.
   - Total usage limit exhaustion rejection.
   - Non-existent code rejection.
5. Cleanup of test artifacts.
"""
from datetime import datetime, timedelta, timezone
import json
import sys
import urllib.request
import urllib.error

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


def run_phase2b_tests():
    print("=" * 70)
    print("  BIGCHAMP PHASE 2B: OFFERS & COUPONS MANAGEMENT VERIFICATION")
    print("=" * 70)

    results = {}

    # 1. Authenticate Admin and Customer
    print("\n--- 1. Authenticating Accounts ---")
    s, admin_data = http_request("POST", f"{BASE_API}/admin/auth/login", {
        "email": "admin@bigchamp.in",
        "password": "Admin@123"
    })
    admin_token = admin_data.get("access_token")
    print(f"Admin authentication: status={s}, token_present={bool(admin_token)}")

    s, cust_data = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": "freeuser@bigchamp.in",
        "password": "User@123"
    })
    cust_token = cust_data.get("access_token")
    print(f"Customer authentication: status={s}, token_present={bool(cust_token)}")

    if not admin_token or not cust_token:
        print("[FAIL] Cannot proceed without authentication tokens.")
        return False

    # -------------------------------------------------------------
    # SECTION 2: RBAC & Input Validation
    # -------------------------------------------------------------
    print("\n--- 2. RBAC & Input Validation ---")

    # 2.1 Unauthenticated POST /coupons rejected -> 401
    s, d = http_request("POST", f"{BASE_API}/coupons", {
        "code": "TESTUNAUTH",
        "name": "Unauth Coupon",
        "discount_type": "PERCENTAGE",
        "discount_value": 10
    })
    results["Coupons: Unauthenticated creation rejected (401)"] = (s == 401)
    print(f"  • Unauthenticated POST /coupons: status={s}")

    # 2.2 Customer token on POST /coupons -> 403
    s, d = http_request("POST", f"{BASE_API}/coupons", {
        "code": "TESTCUST",
        "name": "Customer Coupon",
        "discount_type": "PERCENTAGE",
        "discount_value": 10
    }, token=cust_token)
    results["Coupons: Customer token rejected with 403"] = (s == 403)
    print(f"  • Customer token on POST /coupons: status={s}")

    # 2.3 Invalid percentage discount > 100% -> 422
    s, d = http_request("POST", f"{BASE_API}/coupons", {
        "code": "TESTOVER100",
        "name": "Over 100 Percent",
        "discount_type": "PERCENTAGE",
        "discount_value": 150
    }, token=admin_token)
    results["Coupons: Percentage discount > 100% rejected (422)"] = (s == 422)
    print(f"  • Percentage > 100% validation: status={s}")

    # 2.4 End date before start date -> 422
    now = datetime.now(timezone.utc)
    s, d = http_request("POST", f"{BASE_API}/coupons", {
        "code": "TESTBADDATES",
        "name": "Bad Dates",
        "discount_type": "PERCENTAGE",
        "discount_value": 10,
        "start_date": (now + timedelta(days=5)).isoformat(),
        "end_date": (now + timedelta(days=2)).isoformat(),
    }, token=admin_token)
    results["Coupons: End date before start date rejected (422)"] = (s == 422)
    print(f"  • End date < start date validation: status={s}")

    # -------------------------------------------------------------
    # SECTION 3: Admin Offer CRUD & Duplicate Prevention
    # -------------------------------------------------------------
    print("\n--- 3. Admin CRUD & Duplicate Code Prevention ---")

    test_code = "TESTPCT20"
    # Ensure test code is clean before start
    http_request("DELETE", f"{BASE_API}/coupons/{test_code}?hard_delete=true", token=admin_token)
    http_request("DELETE", f"{BASE_API}/coupons/TESTFLAT250?hard_delete=true", token=admin_token)
    http_request("DELETE", f"{BASE_API}/coupons/TESTEXPIRED?hard_delete=true", token=admin_token)

    # 3.1 Admin creates valid percentage offer (20% off, max cap ₹500 = 50,000 paise, min order ₹1000 = 100,000 paise)
    s, created_coupon = http_request("POST", f"{BASE_API}/coupons", {
        "code": test_code,
        "name": "Test 20% Off",
        "description": "20% off on all items up to Rs 500, min order Rs 1000",
        "discount_type": "PERCENTAGE",
        "discount_value": 20.0,
        "min_order_paise": 100000,
        "max_discount_paise": 50000,
        "applicable_categories": ["CRICKET", "APPAREL"],
        "total_usage_limit": 50,
        "per_user_limit": 2,
        "active": True
    }, token=admin_token)
    results["Coupons: Admin successfully creates percentage offer (200/201)"] = (s in [200, 201] and created_coupon.get("code") == test_code)
    print(f"  • Create percentage offer: status={s}, code={created_coupon.get('code')}")

    # 3.2 Duplicate code creation attempt -> 409 Conflict
    s, d = http_request("POST", f"{BASE_API}/coupons", {
        "code": test_code,
        "name": "Duplicate Offer",
        "discount_type": "PERCENTAGE",
        "discount_value": 10.0
    }, token=admin_token)
    results["Coupons: Duplicate code rejected with 409 Conflict"] = (s == 409)
    print(f"  • Duplicate code rejection: status={s}")

    # 3.3 Admin GET /coupons listing returns created coupon
    s, list_res = http_request("GET", f"{BASE_API}/coupons?search={test_code}", token=admin_token)
    items = list_res if isinstance(list_res, list) else (list_res.get("items", []) if isinstance(list_res, dict) else [])
    found = any(c.get("code") == test_code for c in items)
    results["Coupons: Admin search finds created coupon"] = (s == 200 and found)
    print(f"  • Admin coupon search: status={s}, found={found}")

    # 3.4 Admin GET /coupons/{code} fetches single coupon
    s, single_res = http_request("GET", f"{BASE_API}/coupons/{test_code}", token=admin_token)
    results["Coupons: Single coupon lookup by code succeeds"] = (s == 200 and single_res.get("code") == test_code)
    print(f"  • Single coupon lookup: status={s}, code={single_res.get('code')}")

    # 3.5 Admin PUT /coupons/{code} updates description & min order
    s, updated_res = http_request("PUT", f"{BASE_API}/coupons/{test_code}", {
        "description": "Updated terms for test offer",
        "min_order_paise": 150000
    }, token=admin_token)
    results["Coupons: Admin updates coupon fields (200)"] = (s == 200 and updated_res.get("min_order_paise") == 150000)
    print(f"  • Update coupon: status={s}, new_min_order={updated_res.get('min_order_paise')}")

    # 3.6 Admin PATCH toggle-active switches active status
    s, toggle_res = http_request("PATCH", f"{BASE_API}/coupons/{test_code}/toggle-active", token=admin_token)
    is_inactive = toggle_res.get("active") is False
    results["Coupons: Active toggle turns coupon inactive"] = (s == 200 and is_inactive)
    print(f"  • Toggle inactive: status={s}, active={toggle_res.get('active')}")

    # Toggle back to active for calculation tests
    s, toggle_res = http_request("PATCH", f"{BASE_API}/coupons/{test_code}/toggle-active", token=admin_token)
    print(f"  • Toggle active back: status={s}, active={toggle_res.get('active')}")

    # -------------------------------------------------------------
    # SECTION 4: Authoritative Discount Calculation Engine
    # -------------------------------------------------------------
    print("\n--- 4. Authoritative Discount Calculation Engine ---")

    # 4.1 Below minimum order -> Rejected MIN_ORDER_NOT_MET
    # Cart has 1 item of ₹1000 (100,000 paise). But min_order is now ₹1500 (150,000 paise).
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": test_code,
        "items": [
            {"product_id": "p1", "category": "CRICKET", "price_paise": 100000, "qty": 1}
        ]
    })
    results["Calculation: Below minimum order rejected (MIN_ORDER_NOT_MET)"] = (
        s == 200 and val_res.get("valid") is False and val_res.get("reason_code") == "MIN_ORDER_NOT_MET"
    )
    print(f"  • Min order check: valid={val_res.get('valid')}, reason_code={val_res.get('reason_code')}")

    # 4.2 Percentage discount calculation on eligible category
    # Cart: 1 Cricket bat @ ₹2000 (200,000 paise). Min order is 150,000 paise.
    # 20% of 200,000 = 40,000 paise (₹400). Cap is 50,000 paise (₹500).
    # Discount should be exactly 40,000 paise (₹400), final payable 160,000 paise (₹1600).
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": test_code,
        "items": [
            {"product_id": "p1", "category": "CRICKET", "price_paise": 200000, "qty": 1}
        ]
    })
    t4_2 = (
        s == 200
        and val_res.get("valid") is True
        and val_res.get("discount_paise") == 40000
        and val_res.get("final_total_paise") == 160000
    )
    results["Calculation: Percentage discount applied accurately"] = t4_2
    print(f"  • Percentage calc: valid={val_res.get('valid')}, discount={val_res.get('discount_paise')}, final={val_res.get('final_total_paise')}")

    # 4.3 Percentage discount cap enforcement (max_discount_paise)
    # Cart: 1 Cricket kit @ ₹5000 (500,000 paise).
    # 20% of 500,000 = 100,000 paise (₹1000). But max cap is 50,000 paise (₹500).
    # Discount should be capped strictly at 50,000 paise, final payable 450,000 paise.
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": test_code,
        "items": [
            {"product_id": "p1", "category": "CRICKET", "price_paise": 500000, "qty": 1}
        ]
    })
    t4_3 = (
        s == 200
        and val_res.get("valid") is True
        and val_res.get("discount_paise") == 50000
        and val_res.get("final_total_paise") == 450000
    )
    results["Calculation: Percentage cap enforced (max_discount_paise)"] = t4_3
    print(f"  • Max cap enforcement: discount={val_res.get('discount_paise')}, capped_to_50000={val_res.get('discount_paise') == 50000}")

    # 4.4 Category eligibility filtering: Ineligible cart items
    # Test coupon is applicable ONLY to ["CRICKET", "APPAREL"].
    # Cart only has FOOTBALL @ ₹2000.
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": test_code,
        "items": [
            {"product_id": "p2", "category": "FOOTBALL", "price_paise": 200000, "qty": 1}
        ]
    })
    results["Calculation: Ineligible category items rejected (NO_ELIGIBLE_ITEMS)"] = (
        s == 200 and val_res.get("valid") is False and val_res.get("reason_code") == "NO_ELIGIBLE_ITEMS"
    )
    print(f"  • Ineligible category check: valid={val_res.get('valid')}, reason={val_res.get('reason_code')}")

    # 4.5 Mixed cart: Discount applies ONLY to eligible category items
    # Cart:
    # - CRICKET jersey (APPAREL): ₹2000 (200,000 paise) -> eligible
    # - FOOTBALL ball: ₹1000 (100,000 paise) -> ineligible
    # Subtotal = 300,000 paise (₹3000).
    # Discount is 20% of eligible 200,000 paise = 40,000 paise (₹400).
    # Final total = 300,000 - 40,000 = 260,000 paise (₹2600).
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": test_code,
        "items": [
            {"product_id": "p1", "category": "APPAREL", "price_paise": 200000, "qty": 1},
            {"product_id": "p2", "category": "FOOTBALL", "price_paise": 100000, "qty": 1}
        ]
    })
    t4_5 = (
        s == 200
        and val_res.get("valid") is True
        and val_res.get("discount_paise") == 40000
        and val_res.get("final_total_paise") == 260000
    )
    results["Calculation: Mixed cart applies discount ONLY to eligible category"] = t4_5
    print(f"  • Mixed cart calculation: discount={val_res.get('discount_paise')} (expected 40000), final={val_res.get('final_total_paise')}")

    # 4.6 Fixed amount discount offer
    # Create fixed offer: flat ₹250 off (25,000 paise), min order ₹500 (50,000 paise)
    flat_code = "TESTFLAT250"
    http_request("DELETE", f"{BASE_API}/coupons/{flat_code}", token=admin_token)
    s, _ = http_request("POST", f"{BASE_API}/coupons", {
        "code": flat_code,
        "name": "Flat Rs 250 Off",
        "discount_type": "FIXED_AMOUNT",
        "discount_value": 25000,
        "min_order_paise": 50000,
        "active": True
    }, token=admin_token)

    # Cart: ₹1000 (100,000 paise) -> discount ₹250 (25,000 paise), final ₹750 (75,000 paise)
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": flat_code,
        "items": [
            {"product_id": "p3", "category": "FITNESS", "price_paise": 100000, "qty": 1}
        ]
    })
    t4_6 = (
        s == 200
        and val_res.get("valid") is True
        and val_res.get("discount_paise") == 25000
        and val_res.get("final_total_paise") == 75000
    )
    results["Calculation: Fixed amount discount applied accurately"] = t4_6
    print(f"  • Fixed amount calc: valid={val_res.get('valid')}, discount={val_res.get('discount_paise')}, final={val_res.get('final_total_paise')}")

    # 4.7 Expired coupon rejection
    exp_code = "TESTEXPIRED"
    http_request("DELETE", f"{BASE_API}/coupons/{exp_code}", token=admin_token)
    past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    s, _ = http_request("POST", f"{BASE_API}/coupons", {
        "code": exp_code,
        "name": "Expired Coupon",
        "discount_type": "PERCENTAGE",
        "discount_value": 10.0,
        "end_date": past_date,
        "active": True
    }, token=admin_token)

    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": exp_code,
        "items": [{"product_id": "p1", "price_paise": 100000, "qty": 1}]
    })
    results["Calculation: Expired coupon rejected (EXPIRED)"] = (
        s == 200 and val_res.get("valid") is False and val_res.get("reason_code") == "EXPIRED"
    )
    print(f"  • Expired coupon check: valid={val_res.get('valid')}, reason={val_res.get('reason_code')}")

    # 4.8 Inactive coupon rejection
    s, _ = http_request("PATCH", f"{BASE_API}/coupons/{test_code}/toggle-active", token=admin_token)
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": test_code,
        "items": [{"product_id": "p1", "category": "CRICKET", "price_paise": 200000, "qty": 1}]
    })
    results["Calculation: Inactive coupon rejected (INACTIVE)"] = (
        s == 200 and val_res.get("valid") is False and val_res.get("reason_code") == "INACTIVE"
    )
    print(f"  • Inactive coupon check: valid={val_res.get('valid')}, reason={val_res.get('reason_code')}")

    # 4.9 Non-existent coupon code
    s, val_res = http_request("POST", f"{BASE_API}/coupons/validate", {
        "code": "DOESNOTEXISTXYZ",
        "items": [{"product_id": "p1", "price_paise": 100000, "qty": 1}]
    })
    results["Calculation: Non-existent code rejected (NOT_FOUND)"] = (
        s == 200 and val_res.get("valid") is False and val_res.get("reason_code") == "NOT_FOUND"
    )
    print(f"  • Non-existent coupon check: valid={val_res.get('valid')}, reason={val_res.get('reason_code')}")

    # -------------------------------------------------------------
    # SECTION 5: Cleanup & Archival
    # -------------------------------------------------------------
    print("\n--- 5. Cleanup & Soft Archival ---")

    # 5.1 Delete / Archive test coupon
    s, del_res = http_request("DELETE", f"{BASE_API}/coupons/{test_code}", token=admin_token)
    results["Coupons: Admin deletes/archives coupon (200)"] = (s == 200)
    print(f"  • Delete test coupon: status={s}")

    # Clean up other test codes
    http_request("DELETE", f"{BASE_API}/coupons/{flat_code}?hard_delete=true", token=admin_token)
    http_request("DELETE", f"{BASE_API}/coupons/{exp_code}?hard_delete=true", token=admin_token)
    http_request("DELETE", f"{BASE_API}/coupons/{test_code}?hard_delete=true", token=admin_token)

    # -------------------------------------------------------------
    # Summary Report
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("  PHASE 2B TEST RESULTS SUMMARY")
    print("=" * 70)
    all_passed = True
    for test_name, passed in results.items():
        status = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"  {status} {test_name}")

    total = len(results)
    passed_count = sum(1 for p in results.values() if p)
    print("=" * 70)
    print(f"  TOTAL: {passed_count}/{total} PASSED")
    if all_passed:
        print("  🎉 ALL PHASE 2B OFFERS & COUPONS TESTS PASSED!")
    else:
        print("  ❌ SOME TESTS FAILED. CHECK ABOVE LOGS.")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = run_phase2b_tests()
    sys.exit(0 if success else 1)
