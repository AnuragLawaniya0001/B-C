"""Comprehensive test script for Bigchamp Prompt #3 (Updated with 11 Verification Tests)."""
import json
import urllib.request
import urllib.error
import sys
import subprocess

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:3050/api/v1"

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
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

def run_tests():
    results = {}
    print("================ BIGCHAMP PROMPT #3 VERIFICATION SUITE ================")

    # TEST 1 — Register (free user, no membership)
    print("\n--- Test 1: Register (free user, no membership) ---")
    test_email = "free_user_p3@example.com"
    status, res = make_request("POST", "/auth/send-otp", {"identifier": test_email, "purpose": "REGISTER"})
    print(f"send-otp: status={status}, res={res}")
    dev_otp = res.get("dev_otp") or res.get("mock_otp")
    t1_otp = status == 200 and bool(dev_otp)

    status, res = make_request("POST", "/auth/verify-otp", {"identifier": test_email, "otp": dev_otp, "purpose": "REGISTER"})
    print(f"verify-otp: status={status}, res={res}")
    t1_verify = status == 200 and res.get("message") == "OTP verified"

    reg_payload = {
        "identifier": test_email,
        "email": test_email,
        "mobile": "9811223344",
        "full_name": "Free Test User",
        "password": "FreeUser@123"
    }
    status, reg_res = make_request("POST", "/auth/register", reg_payload)
    print(f"register: status={status}, has_membership={reg_res.get('has_membership')}")
    t1_reg = status == 200 and reg_res.get("has_membership") is False
    user_access_token = reg_res.get("access_token")
    user_refresh_token = reg_res.get("refresh_token")
    user_id = reg_res.get("user", {}).get("id")

    status, me_res = make_request("GET", "/auth/me", token=user_access_token)
    print(f"auth/me: status={status}, has_membership={me_res.get('has_membership')}")
    t1_me = status == 200 and me_res.get("has_membership") is False

    status, user_me_res = make_request("GET", "/users/me", token=user_access_token)
    print(f"users/me: status={status}, has_membership={user_me_res.get('has_membership')}")
    t1_user_me = status == 200 and user_me_res.get("has_membership") is False

    results["Test 1 — Register (free user, no membership)"] = (
        t1_otp and t1_verify and t1_reg and t1_me and t1_user_me
    )

    # TEST 2 — Login flow
    print("\n--- Test 2: Login flow ---")
    status, login_res = make_request("POST", "/auth/login", {"identifier": test_email, "password": "FreeUser@123"})
    print(f"login: status={status}, has_membership={login_res.get('has_membership')}")
    results["Test 2 — Login flow"] = (
        status == 200 and login_res.get("has_membership") is False and bool(login_res.get("access_token"))
    )

    # TEST 3 — Admin login
    print("\n--- Test 3: Admin login ---")
    status, admin_res = make_request("POST", "/admin/auth/login", {"email": "admin@bigchamp.in", "password": "Admin@123"})
    print(f"admin login: status={status}, role={admin_res.get('user', {}).get('role')}")
    admin_token = admin_res.get("access_token")
    results["Test 3 — Admin login"] = status == 200 and admin_res.get("user", {}).get("role") == "ADMIN"

    # TEST 4 — RBAC protection
    print("\n--- Test 4: RBAC protection ---")
    s1, r1 = make_request("GET", "/admin/auth/me", token=user_access_token)
    print(f"admin/me with user token: status={s1}")
    s2, r2 = make_request("GET", "/auth/me")
    print(f"auth/me with no token: status={s2}")
    s3, r3 = make_request("GET", "/auth/me", token="abc")
    print(f"auth/me with malformed token: status={s3}")
    results["Test 4 — RBAC protection"] = (s1 == 403 and s2 == 401 and s3 == 401)

    # TEST 5 — Rate limiting
    print("\n--- Test 5: Rate limiting ---")
    rate_id = "rate_limit_check_11@example.com"
    statuses = []
    for i in range(1, 5):
        st, rs = make_request("POST", "/auth/send-otp", {"identifier": rate_id, "purpose": "REGISTER"})
        statuses.append(st)
        print(f"Request {i}: status={st}")
    results["Test 5 — Rate limiting"] = (statuses[:3] == [200, 200, 200] and statuses[3] == 429)

    # TEST 6 — Validation
    print("\n--- Test 6: Validation ---")
    s_weak, r_weak = make_request("POST", "/auth/register", {
        "identifier": "weak_p3@example.com",
        "full_name": "Weak Pass",
        "password": "abc"
    })
    print(f"weak password status: {s_weak}")
    s_no_otp, r_no_otp = make_request("POST", "/auth/register", {
        "identifier": "no_otp_p3@example.com",
        "full_name": "No OTP",
        "password": "Password@123"
    })
    print(f"no otp register status: {s_no_otp}")
    results["Test 6 — Validation"] = (s_weak in (400, 422) and s_no_otp == 400)

    # TEST 7 — Settings membership_policy seeded
    print("\n--- Test 7: Settings membership_policy seeded ---")
    status, pub_settings = make_request("GET", "/settings/public")
    print(f"settings/public status: {status}")
    policy = pub_settings.get("membership_policy")
    print(f"membership_policy in public settings: {policy}")
    has_8_flags = (
        isinstance(policy, dict)
        and policy.get("general_shopping_requires_membership") is False
        and policy.get("cookey_requires_membership") is True
        and policy.get("dormitory_booking_requires_membership") is True
        and policy.get("physio_booking_requires_membership") is True
        and policy.get("wallet_requires_membership") is True
        and policy.get("army_discount_requires_membership") is True
        and policy.get("lucky_draw_requires_membership") is True
        and policy.get("guest_checkout_allowed") is False
    )
    results["Test 7 — Settings membership_policy seeded"] = (status == 200 and has_8_flags)

    # TEST 8 — No wallet on register
    print("\n--- Test 8: No wallet on register ---")
    try:
        from pymongo import MongoClient
        mc = MongoClient("mongodb://localhost:27017")
        u_doc = mc["bigchamp"]["users"].find_one({"_id": mc["bigchamp"]["users"].find_one({"email": test_email})["_id"]})
        w_doc = mc["bigchamp"]["wallets"].find_one({"user_id": user_id})
        print(f"User in db: {u_doc is not None}, Wallet in db for free user: {w_doc is not None}")
        results["Test 8 — No wallet on register"] = (u_doc is not None and w_doc is None)
    except Exception as e:
        print(f"MongoDB wallet check error: {e}")
        results["Test 8 — No wallet on register"] = False

    # TEST 9 — Refresh
    print("\n--- Test 9: Refresh ---")
    status, refresh_res = make_request("POST", "/auth/refresh", {"refresh_token": user_refresh_token})
    print(f"refresh status: {status}, has access_token: {'access_token' in refresh_res}")
    results["Test 9 — Refresh"] = (status == 200 and bool(refresh_res.get("access_token")))

    # TEST 10 — Duplicate registration
    print("\n--- Test 10: Duplicate registration ---")
    status, dup_res = make_request("POST", "/auth/register", {
        "identifier": test_email,
        "email": test_email,
        "full_name": "Duplicate User",
        "password": "Password@123"
    })
    print(f"duplicate register status: {status}, detail: {dup_res.get('detail')}")
    results["Test 10 — Duplicate registration"] = (status in (400, 422))

    # TEST 11 — Idempotent seed still works
    print("\n--- Test 11: Idempotent seed runner ---")
    seed_proc = subprocess.run(
        [sys.executable, "-m", "app.seed.runner"],
        cwd="backend",
        capture_output=True,
        text=True
    )
    print("Seed output summary:\n", seed_proc.stdout)
    has_skip = "[SKIP]" in seed_proc.stdout and "0 inserted" in seed_proc.stdout
    results["Test 11 — Idempotent seed still works"] = (has_skip and seed_proc.returncode == 0)

    # Print summary
    print("\n================ SUMMARY TEST RESULTS ================")
    all_passed = True
    for test_name, passed in results.items():
        status_text = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{status_text} {test_name}")
    
    return all_passed

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
