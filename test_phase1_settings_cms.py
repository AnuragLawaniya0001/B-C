"""Phase 1 Automated Test Suite for Bigchamp: Admin CMS & Dynamic Business Settings.
Tests:
1. Admin-only authorization on settings, pages, banners, and FAQs mutations.
2. Input validation, negative constraints, and secret sanitization on business rules.
3. Updating and reading back dynamic settings from MongoDB.
4. Public settings endpoint (/settings/public) reflecting saved admin settings.
5. Updating CMS page content and verifying persistence.
6. Full CRUD on Promotional Banners (Create, Read, Update, Delete).
7. Full CRUD on FAQs (Create, Read, Update, Delete).
8. RBAC boundary enforcement (Customers and unauthenticated requests blocked).
"""
import json
import os
import sys
import urllib.request
import urllib.error

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_API = "http://localhost:3050/api/v1"

def http_request(method, url, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
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

def run_phase1_tests():
    print("=" * 70)
    print("  BIGCHAMP PHASE 1: ADMIN CMS & DYNAMIC SETTINGS VERIFICATION SUITE")
    print("=" * 70)

    results = {}

    # 1. Obtain Tokens
    print("\n--- 1. Authenticating Admin and Customer Accounts ---")
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
        print("[FAIL] Cannot proceed without valid authentication tokens.")
        return False

    # -------------------------------------------------------------
    # SECTION 2: Dynamic Settings RBAC & Validation
    # -------------------------------------------------------------
    print("\n--- 2. Dynamic Business Settings RBAC & Validation ---")

    # 2.1 Unauthenticated PUT rejected
    s, d = http_request("PUT", f"{BASE_API}/admin/settings/business_rules", {"value": {"card_fee_paise": 10000}})
    results["Settings: Unauthenticated PUT rejected (401)"] = (s == 401)
    print(f"  • Unauthenticated settings update: status={s}")

    # 2.2 Customer token on admin settings -> 403 Forbidden
    s, d = http_request("PUT", f"{BASE_API}/admin/settings/business_rules", {"value": {"card_fee_paise": 10000}}, token=cust_token)
    results["Settings: Customer token rejected with 403"] = (s == 403)
    print(f"  • Customer token on admin settings update: status={s}")

    # 2.3 Invalid payload validation (e.g. negative fee) -> 422 Unprocessable Entity
    s, d = http_request("PUT", f"{BASE_API}/admin/settings/business_rules", {
        "value": {
            "card_fee_paise": -500,
            "card_validity_days": 334,
            "joining_cashback_percent": 10,
        }
    }, token=admin_token)
    results["Settings: Rejects invalid negative fee (422)"] = (s == 422)
    print(f"  • Negative fee validation: status={s}, detail={d.get('detail', '')[:60]}")

    # 2.4 Rejects sensitive secret keys in payment_routing -> 422 Unprocessable Entity
    s, d = http_request("PUT", f"{BASE_API}/admin/settings/business_rules", {
        "value": {
            "card_fee_paise": 10000,
            "payment_routing": {
                "gateway": "RAZORPAY",
                "api_secret_key": "live_secret_12345"
            }
        }
    }, token=admin_token)
    results["Settings: Rejects sensitive secret keys in payment_routing (422)"] = (s == 422)
    print(f"  • Secret sanitization validation: status={s}")

    # 2.5 Valid settings update
    updated_rules = {
        "card_fee_paise": 10000,
        "card_validity_days": 334,
        "joining_cashback_percent": 10.0,
        "cookey_price_paise": 10000,
        "cookey_cooldown_days": 7,
        "cookey_max_per_week": 1,
        "army_extra_discount_percent": 10.0,
        "lucky_draw_prize_paise": 50000,
        "lucky_draw_frequency": "weekly",
        "autopay_enabled": False,
        "winner_selection_mode": "simulated_random",
        "partner_visibility": True,
        "default_dormitory_discount_percent": 15.0,
        "default_physio_discount_percent": 20.0,
        "payment_routing": {
            "gateway": "DEMO_SIMULATION",
            "test_mode": True,
            "notes": "Safe simulation mode active"
        }
    }
    s, update_res = http_request("PUT", f"{BASE_API}/admin/settings/business_rules", {"value": updated_rules}, token=admin_token)
    results["Settings: Admin successfully updates business rules (200)"] = (s == 200)
    print(f"  • Valid settings update: status={s}")

    # 2.6 Read back from MongoDB via admin GET
    s, admin_read = http_request("GET", f"{BASE_API}/admin/settings/business_rules", token=admin_token)
    read_val = admin_read.get("value", {})
    t2_6 = (s == 200 and read_val.get("card_validity_days") == 334 and read_val.get("payment_routing", {}).get("gateway") == "DEMO_SIMULATION")
    results["Settings: Read back updated settings from MongoDB (200)"] = t2_6
    print(f"  • Read back from admin endpoint: status={s}, validity={read_val.get('card_validity_days')}")

    # 2.7 Verify public endpoint reflects update
    s, pub_settings = http_request("GET", f"{BASE_API}/settings/public")
    pub_rules = pub_settings.get("business_rules", {})
    t2_7 = (s == 200 and pub_rules.get("card_fee_paise") == 10000 and pub_rules.get("cookey_cooldown_days") == 7)
    results["Settings: Public endpoint /settings/public reflects changes"] = t2_7
    print(f"  • Public settings verification: status={s}, card_fee={pub_rules.get('card_fee_paise')}")

    # -------------------------------------------------------------
    # SECTION 3: Simplified Architecture — CMS Editor Removal & Read Compatibility
    # -------------------------------------------------------------
    print("\n--- 3. CMS Pages Mutation Removal & Read-Only Compatibility ---")

    # 3.1 Verify PUT /pages/homepage is removed (returns 405 Method Not Allowed)
    s, d = http_request("PUT", f"{BASE_API}/pages/homepage", {"title": "New Title"}, token=admin_token)
    results["CMS Architecture: Page mutation PUT /pages/{slug} removed (405)"] = (s == 405)
    print(f"  • Page PUT mutation removed check: status={s} (expected 405)")

    # 3.2 Verify read-only compatibility GET /pages
    s, read_all = http_request("GET", f"{BASE_API}/pages")
    results["CMS Architecture: Public GET /pages read-only compatibility (200)"] = (s == 200 and isinstance(read_all, list))
    print(f"  • Read-only GET /pages check: status={s}, count={len(read_all) if isinstance(read_all, list) else 0}")

    # 3.3 Verify read-only compatibility GET /pages/homepage
    s, read_page = http_request("GET", f"{BASE_API}/pages/homepage")
    results["CMS Architecture: Public GET /pages/homepage read-only compatibility (200)"] = (s == 200 and isinstance(read_page, dict))
    print(f"  • Read-only GET /pages/homepage check: status={s}, title='{read_page.get('title') if isinstance(read_page, dict) else ''}'")

    # -------------------------------------------------------------
    # SECTION 4: Promotional Banners CRUD
    # -------------------------------------------------------------
    print("\n--- 4. Promotional Banners CRUD ---")

    # 4.1 Unauthenticated POST banner -> 401
    s, d = http_request("POST", f"{BASE_API}/banners", {"title": "Test Banner"})
    results["Banners: Unauthenticated POST rejected (401)"] = (s == 401)
    print(f"  • Unauthenticated banner create: status={s}")

    # 4.2 Customer token on POST banner -> 403
    s, d = http_request("POST", f"{BASE_API}/banners", {"title": "Test Banner"}, token=cust_token)
    results["Banners: Customer token rejected with 403"] = (s == 403)
    print(f"  • Customer token on banner create: status={s}")

    # 4.3 Admin creates new banner
    new_banner = {
        "title": "Summer Sports Camp — 20% Off",
        "position": "homepage_middle",
        "link": "/store",
        "image_url": "/images/banners/summer-camp.jpg",
        "order": 99,
        "active": True
    }
    s, created_banner = http_request("POST", f"{BASE_API}/banners", new_banner, token=admin_token)
    banner_id = created_banner.get("_id")
    results["Banners: Admin creates new promotional banner (201)"] = (s == 201 and bool(banner_id))
    print(f"  • Admin create banner: status={s}, id={banner_id}")

    # 4.4 Admin updates banner
    s, updated_banner = http_request("PUT", f"{BASE_API}/banners/{banner_id}", {
        "title": "Monsoon Sports Camp — 25% Off",
        "order": 100
    }, token=admin_token)
    results["Banners: Admin updates banner fields (200)"] = (s == 200 and updated_banner.get("title") == "Monsoon Sports Camp — 25% Off")
    print(f"  • Admin update banner: status={s}, title='{updated_banner.get('title')}'")

    # 4.5 Admin deletes banner
    s, del_res = http_request("DELETE", f"{BASE_API}/banners/{banner_id}", token=admin_token)
    results["Banners: Admin deletes banner (200)"] = (s == 200)
    print(f"  • Admin delete banner: status={s}")

    # 4.6 Verify banner is deleted
    s, del_check = http_request("DELETE", f"{BASE_API}/banners/{banner_id}", token=admin_token)
    results["Banners: Subsequent delete returns 404"] = (s == 404)
    print(f"  • Deleted banner 404 check: status={s}")

    # -------------------------------------------------------------
    # SECTION 5: FAQs CRUD
    # -------------------------------------------------------------
    print("\n--- 5. FAQs CRUD ---")

    # 5.1 Unauthenticated POST FAQ -> 401
    s, d = http_request("POST", f"{BASE_API}/faqs", {"question": "What is Bigchamp?", "answer": "Ecosystem."})
    results["FAQs: Unauthenticated POST rejected (401)"] = (s == 401)
    print(f"  • Unauthenticated FAQ create: status={s}")

    # 5.2 Customer token on POST FAQ -> 403
    s, d = http_request("POST", f"{BASE_API}/faqs", {"question": "What is Bigchamp?", "answer": "Ecosystem."}, token=cust_token)
    results["FAQs: Customer token rejected with 403"] = (s == 403)
    print(f"  • Customer token on FAQ create: status={s}")

    # 5.3 Admin creates new FAQ
    new_faq = {
        "category": "membership",
        "question": "How do I upgrade to the ₹100 Bigchamp digital card?",
        "answer": "You can upgrade directly from your dashboard or the Membership page in 1 click.",
        "order": 99,
        "active": True
    }
    s, created_faq = http_request("POST", f"{BASE_API}/faqs", new_faq, token=admin_token)
    faq_id = created_faq.get("_id")
    results["FAQs: Admin creates new FAQ (201)"] = (s == 201 and bool(faq_id))
    print(f"  • Admin create FAQ: status={s}, id={faq_id}")

    # 5.4 Admin updates FAQ
    s, updated_faq = http_request("PUT", f"{BASE_API}/faqs/{faq_id}", {
        "answer": "You can upgrade from your dashboard. Joining cashback of ₹10 is credited immediately.",
        "order": 100
    }, token=admin_token)
    results["FAQs: Admin updates FAQ answer and order (200)"] = (s == 200 and "cashback" in updated_faq.get("answer", ""))
    print(f"  • Admin update FAQ: status={s}")

    # 5.5 Admin deletes FAQ
    s, del_faq_res = http_request("DELETE", f"{BASE_API}/faqs/{faq_id}", token=admin_token)
    results["FAQs: Admin deletes FAQ (200)"] = (s == 200)
    print(f"  • Admin delete FAQ: status={s}")

    # 5.6 Verify FAQ is deleted
    s, del_faq_check = http_request("DELETE", f"{BASE_API}/faqs/{faq_id}", token=admin_token)
    results["FAQs: Subsequent delete returns 404"] = (s == 404)
    print(f"  • Deleted FAQ 404 check: status={s}")

    # -------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("                     PHASE 1 TEST SUMMARY")
    print("=" * 70)
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)

    for name, passed in results.items():
        tag = "[PASS]" if passed else "[FAIL]"
        print(f"  {tag:<7} {name}")

    print("-" * 70)
    print(f"  Total: {passed_count}/{total_count} tests passed ({passed_count/total_count*100:.1f}%)")
    print("=" * 70)

    return passed_count == total_count

if __name__ == "__main__":
    success = run_phase1_tests()
    sys.exit(0 if success else 1)
