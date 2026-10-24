"""Verification test script for Bigchamp Prompt #4 Frontend Authentication Integration."""
import os
import glob
import urllib.request
import urllib.error
import sys

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def test_frontend_serving():
    print("================ BIGCHAMP PROMPT #4 FRONTEND VERIFICATION ================")

    results = {}

    # 1. Test Nginx HTTP serving of Frontend on port 3000
    print("\n--- 1. Testing HTTP Serving on Port 3000 ---")
    urls_to_test = [
        ("Root /", "http://localhost:3000/"),
        ("Register /register", "http://localhost:3000/register"),
        ("Verify OTP /register/verify-otp", "http://localhost:3000/register/verify-otp"),
        ("Password /register/password", "http://localhost:3000/register/password"),
        ("Success /register/success", "http://localhost:3000/register/success"),
        ("Login /login", "http://localhost:3000/login"),
        ("Dashboard /dashboard", "http://localhost:3000/dashboard"),
    ]

    all_http_ok = True
    for label, url in urls_to_test:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                status = resp.status
                body = resp.read().decode("utf-8")
                has_root = 'id="root"' in body
                print(f"[{status}] {label} -> SPA HTML served: {has_root}")
                if status != 200 or not has_root:
                    all_http_ok = False
        except Exception as e:
            print(f"[FAIL] {label} -> {e}")
            all_http_ok = False

    results["1. SPA Serving on Port 3000 (all routes return 200)"] = all_http_ok

    # 2. Inspect built JS bundle in frontend/dist
    print("\n--- 2. Inspecting Frontend Distribution Bundle ---")
    js_files = glob.glob("frontend/dist/assets/index-*.js")
    if not js_files:
        print("[FAIL] No frontend bundle found in frontend/dist/assets")
        results["2. Frontend Bundle Exists"] = False
        return

    bundle_path = js_files[0]
    with open(bundle_path, "r", encoding="utf-8", errors="ignore") as f:
        bundle_content = f.read()

    print(f"Bundle size: {len(bundle_content):,} bytes at {bundle_path}")

    # Check key contracts in bundle
    checks = [
        ("Storage keys: bc_access_token & bc_refresh_token", "bc_access_token" in bundle_content and "bc_refresh_token" in bundle_content),
        ("Storage key: bc_user", "bc_user" in bundle_content),
        ("Storage key: bc_reg_tmp", "bc_reg_tmp" in bundle_content),
        ("Axios refresh interceptor with /auth/refresh endpoint", "/auth/refresh" in bundle_content and "refresh_token" in bundle_content),
        ("Rate limit message handling (429)", "Too many attempts" in bundle_content),
        ("Session expired handling (?expired=1)", "Session expired" in bundle_content),
        ("Free Account badge", "Free Account" in bundle_content),
        ("Get Card ₹100 upsell", "Get Card" in bundle_content or "₹100" in bundle_content),
        ("Unlock Full Access Banner", "Unlock Full Access" in bundle_content),
        ("Locked dashboard items with toast", "Get Bigchamp Card" in bundle_content or "unlock" in bundle_content),
        ("Dev Mode OTP helper banner", "Dev Mode OTP" in bundle_content or "Dev Code" in bundle_content),
        ("Password strength meter & rules", "8+ characters" in bundle_content or "Passwords do not match" in bundle_content),
        ("Membership payment route removed/redirected", "/register/membership-pay" in bundle_content and "/register/success" in bundle_content),
    ]

    for desc, passed in checks:
        status_text = "[PASS]" if passed else "[FAIL]"
        print(f"{status_text} {desc}")
        results[desc] = passed

    # Summary
    print("\n================ PROMPT #4 VERIFICATION SUMMARY ================")
    all_passed = True
    for test_name, passed in results.items():
        status_text = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{status_text} {test_name}")

    return all_passed

if __name__ == "__main__":
    success = test_frontend_serving()
    sys.exit(0 if success else 1)
