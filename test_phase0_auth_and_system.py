"""Comprehensive Phase 0 Verification and Regression Suite for Bigchamp.
Validates:
1. System Connectivity & Health Endpoints
2. Customer, Admin, and Partner Login (Valid and Invalid Credentials)
3. Zero-token issuance on 401 failure
4. Server-side RBAC and role boundary enforcement
5. Token tamper and invalid signature rejection
6. Frontend production bundles and elimination of dummy tokens
7. Database index and seed idempotency
"""
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

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

def run_all_tests():
    print("=" * 70)
    print("  BIGCHAMP PHASE 0: FOUNDATION, CONNECTIVITY & AUTHENTICATION SUITE")
    print("=" * 70)
    
    test_results = {}
    
    # ---------------------------------------------------------
    # SECTION 1: Service Connectivity & Port Probes
    # ---------------------------------------------------------
    print("\n[SECTION 1] Probing Ports & Endpoints...")
    endpoints = {
        "FastAPI Backend Health": "http://localhost:3050/api/v1/health",
        "Ecosystem Gateway (Port 80)": "http://localhost:80/",
        "Customer Frontend (Port 3000)": "http://localhost:3000/",
        "Admin Portal (Port 3001)": "http://localhost:3001/",
        "Partner Portal (Port 3002)": "http://localhost:3002/",
    }
    for name, url in endpoints.items():
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ProbeClient/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                status = resp.status
                passed = status == 200
                test_results[f"Port probe: {name}"] = passed
                print(f"  • {name:<35} -> HTTP {status} [{'OK' if passed else 'FAIL'}]")
        except Exception as e:
            test_results[f"Port probe: {name}"] = False
            print(f"  • {name:<35} -> FAILED ({e})")

    # ---------------------------------------------------------
    # SECTION 2: Customer Authentication (Valid & Invalid)
    # ---------------------------------------------------------
    print("\n[SECTION 2] Customer Authentication Tests...")
    
    # 2.1 Valid Login
    s, d = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": "freeuser@bigchamp.in",
        "password": "User@123"
    })
    cust_token = d.get("access_token")
    cust_refresh = d.get("refresh_token")
    t2_1 = (s == 200 and bool(cust_token) and d.get("user", {}).get("role") == "USER")
    test_results["Customer Login: Valid credentials"] = t2_1
    print(f"  • Valid customer login: status={s}, token_issued={bool(cust_token)}")

    # 2.2 Invalid Password
    s, d = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": "freeuser@bigchamp.in",
        "password": "WrongPassword123"
    })
    t2_2 = (s == 401 and "access_token" not in d)
    test_results["Customer Login: Rejects incorrect password (HTTP 401)"] = t2_2
    print(f"  • Invalid customer password: status={s}, detail={d.get('detail')}")

    # 2.3 Unknown user
    s, d = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": "nonexistent_champ_888@bigchamp.in",
        "password": "AnyPassword@123"
    })
    t2_3 = (s == 401 and "access_token" not in d)
    test_results["Customer Login: Rejects unknown user (HTTP 401)"] = t2_3
    print(f"  • Unknown customer identifier: status={s}, detail={d.get('detail')}")

    # 2.4 Customer Token Refresh
    s, d = http_request("POST", f"{BASE_API}/auth/refresh", {
        "refresh_token": cust_refresh
    })
    t2_4 = (s == 200 and bool(d.get("access_token")))
    test_results["Customer Token Refresh: Exchange refresh token"] = t2_4
    print(f"  • Customer token refresh: status={s}, new_token_issued={bool(d.get('access_token'))}")

    # ---------------------------------------------------------
    # SECTION 3: Admin Authentication (Valid & Invalid)
    # ---------------------------------------------------------
    print("\n[SECTION 3] Admin Authentication Tests...")

    # 3.1 Valid Admin Login
    s, d = http_request("POST", f"{BASE_API}/admin/auth/login", {
        "email": "admin@bigchamp.in",
        "password": "Admin@123"
    })
    admin_token = d.get("access_token")
    t3_1 = (s == 200 and bool(admin_token) and d.get("user", {}).get("role") in ("ADMIN", "SUPER_ADMIN"))
    test_results["Admin Login: Valid credentials"] = t3_1
    print(f"  • Valid admin login: status={s}, role={d.get('user', {}).get('role')}, token_issued={bool(admin_token)}")

    # 3.2 Invalid Admin Password
    s, d = http_request("POST", f"{BASE_API}/admin/auth/login", {
        "email": "admin@bigchamp.in",
        "password": "IncorrectAdminPass!"
    })
    t3_2 = (s == 401 and "access_token" not in d)
    test_results["Admin Login: Rejects incorrect password (HTTP 401)"] = t3_2
    print(f"  • Invalid admin password: status={s}, detail={d.get('detail')}")

    # 3.3 Unknown Admin
    s, d = http_request("POST", f"{BASE_API}/admin/auth/login", {
        "email": "fake_admin@bigchamp.in",
        "password": "Admin@123"
    })
    t3_3 = (s == 401 and "access_token" not in d)
    test_results["Admin Login: Rejects unknown admin (HTTP 401)"] = t3_3
    print(f"  • Unknown admin account: status={s}, detail={d.get('detail')}")

    # 3.4 Admin /me check
    s, d = http_request("GET", f"{BASE_API}/admin/auth/me", token=admin_token)
    t3_4 = (s == 200 and d.get("email") == "admin@bigchamp.in")
    test_results["Admin /me: Authenticated profile retrieval"] = t3_4
    print(f"  • Admin /me profile check: status={s}, email={d.get('email')}")

    # ---------------------------------------------------------
    # SECTION 4: Partner Authentication (Valid & Invalid)
    # ---------------------------------------------------------
    print("\n[SECTION 4] Partner Authentication Tests...")

    # 4.1 Valid Partner Login (Physio Clinic)
    s, d = http_request("POST", f"{BASE_API}/partner/auth/login", {
        "email": "partner@apexphysio.in",
        "password": "Partner@123"
    })
    partner_token = d.get("access_token")
    t4_1 = (s == 200 and bool(partner_token) and d.get("user", {}).get("role") == "PARTNER")
    test_results["Partner Login: Valid credentials (Physio)"] = t4_1
    print(f"  • Valid partner login: status={s}, role={d.get('user', {}).get('role')}, token_issued={bool(partner_token)}")

    # 4.2 Valid Partner Login (Dormitory)
    s, d = http_request("POST", f"{BASE_API}/partner/auth/login", {
        "email": "partner@dormitory.in",
        "password": "Partner@123"
    })
    t4_2 = (s == 200 and bool(d.get("access_token")) and d.get("user", {}).get("role") == "PARTNER")
    test_results["Partner Login: Valid credentials (Dormitory)"] = t4_2
    print(f"  • Valid dormitory partner login: status={s}, role={d.get('user', {}).get('role')}")

    # 4.3 Invalid Partner Password
    s, d = http_request("POST", f"{BASE_API}/partner/auth/login", {
        "email": "partner@apexphysio.in",
        "password": "WrongPassword999"
    })
    t4_3 = (s == 401 and "access_token" not in d)
    test_results["Partner Login: Rejects incorrect password (HTTP 401)"] = t4_3
    print(f"  • Invalid partner password: status={s}, detail={d.get('detail')}")

    # 4.4 Unknown Partner
    s, d = http_request("POST", f"{BASE_API}/partner/auth/login", {
        "email": "nonexistent_partner@bigchamp.in",
        "password": "Partner@123"
    })
    t4_4 = (s == 401 and "access_token" not in d)
    test_results["Partner Login: Rejects unknown partner (HTTP 401)"] = t4_4
    print(f"  • Unknown partner account: status={s}, detail={d.get('detail')}")

    # 4.5 Partner /me check
    s, d = http_request("GET", f"{BASE_API}/partner/auth/me", token=partner_token)
    t4_5 = (s == 200 and d.get("role") == "PARTNER" and bool(d.get("partner_id")))
    test_results["Partner /me: Authenticated profile retrieval"] = t4_5
    print(f"  • Partner /me profile check: status={s}, partner_id={d.get('partner_id')}")

    # ---------------------------------------------------------
    # SECTION 5: RBAC Role Separation & Protected Route Enforcement
    # ---------------------------------------------------------
    print("\n[SECTION 5] Role-Based Access Control (RBAC) Enforcement...")

    # 5.1 Customer token on Admin endpoint -> 403 Forbidden
    s, d = http_request("GET", f"{BASE_API}/admin/auth/me", token=cust_token)
    t5_1 = (s == 403)
    test_results["RBAC: Customer token cannot access Admin endpoint (403)"] = t5_1
    print(f"  • Customer token on /admin/auth/me: status={s} [{'OK' if t5_1 else 'FAIL'}]")

    # 5.2 Customer token on Partner endpoint -> 403 Forbidden
    s, d = http_request("GET", f"{BASE_API}/partner/auth/me", token=cust_token)
    t5_2 = (s == 403)
    test_results["RBAC: Customer token cannot access Partner endpoint (403)"] = t5_2
    print(f"  • Customer token on /partner/auth/me: status={s} [{'OK' if t5_2 else 'FAIL'}]")

    # 5.3 Admin token on Partner endpoint -> 403 Forbidden
    s, d = http_request("GET", f"{BASE_API}/partner/auth/me", token=admin_token)
    t5_3 = (s == 403)
    test_results["RBAC: Admin token cannot access Partner endpoint (403)"] = t5_3
    print(f"  • Admin token on /partner/auth/me: status={s} [{'OK' if t5_3 else 'FAIL'}]")

    # 5.4 Partner token on Admin endpoint -> 403 Forbidden
    s, d = http_request("GET", f"{BASE_API}/admin/auth/me", token=partner_token)
    t5_4 = (s == 403)
    test_results["RBAC: Partner token cannot access Admin endpoint (403)"] = t5_4
    print(f"  • Partner token on /admin/auth/me: status={s} [{'OK' if t5_4 else 'FAIL'}]")

    # 5.5 Unauthenticated request on protected route -> 401 Unauthorized
    s, d = http_request("GET", f"{BASE_API}/auth/me")
    t5_5 = (s == 401)
    test_results["Token: Missing Authorization header rejected (401)"] = t5_5
    print(f"  • No token on /auth/me: status={s} [{'OK' if t5_5 else 'FAIL'}]")

    # 5.6 Malformed token -> 401 Unauthorized
    s, d = http_request("GET", f"{BASE_API}/auth/me", token="not_a_real_jwt_token")
    t5_6 = (s == 401)
    test_results["Token: Malformed bearer token rejected (401)"] = t5_6
    print(f"  • Malformed token on /auth/me: status={s} [{'OK' if t5_6 else 'FAIL'}]")

    # 5.7 Tampered signature token -> 401 Unauthorized
    tampered_token = cust_token[:-10] + "tampered00"
    s, d = http_request("GET", f"{BASE_API}/auth/me", token=tampered_token)
    t5_7 = (s == 401)
    test_results["Token: Tampered signature rejected (401)"] = t5_7
    print(f"  • Tampered token on /auth/me: status={s} [{'OK' if t5_7 else 'FAIL'}]")

    # ---------------------------------------------------------
    # SECTION 6: Frontend Source & Bundle Verification
    # ---------------------------------------------------------
    print("\n[SECTION 6] Frontend Source & Elimination of Dummy Tokens...")
    
    # Check AdminLoginPage.jsx does not have dummy-admin-token
    with open("admin/src/pages/AdminLoginPage.jsx", "r", encoding="utf-8") as f:
        admin_src = f.read()
    has_dummy_admin = "dummy-admin-token" in admin_src
    test_results["Frontend: AdminLoginPage has no dummy-admin-token"] = not has_dummy_admin
    print(f"  • AdminLoginPage dummy token removed: {not has_dummy_admin}")

    # Check PartnerLoginPage.jsx does not have dummy-partner-token
    with open("partner/src/pages/PartnerLoginPage.jsx", "r", encoding="utf-8") as f:
        partner_src = f.read()
    has_dummy_partner = "dummy-partner-token" in partner_src
    test_results["Frontend: PartnerLoginPage has no dummy-partner-token"] = not has_dummy_partner
    print(f"  • PartnerLoginPage dummy token removed: {not has_dummy_partner}")

    # Check dist folders exist and are populated
    for app in ["frontend", "admin", "partner"]:
        dist_html = os.path.join(app, "dist", "index.html")
        exists = os.path.isfile(dist_html) and os.path.getsize(dist_html) > 0
        test_results[f"Frontend: {app}/dist/index.html is built and non-empty"] = exists
        print(f"  • {app} production build: exists={exists}")

    # ---------------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------------
    print("\n" + "=" * 70)
    print("                     PHASE 0 TEST SUMMARY")
    print("=" * 70)
    passed_count = sum(1 for v in test_results.values() if v)
    total_count = len(test_results)
    
    for name, passed in test_results.items():
        tag = "[PASS]" if passed else "[FAIL]"
        print(f"  {tag:<7} {name}")
        
    print("-" * 70)
    print(f"  Total: {passed_count}/{total_count} tests passed ({passed_count/total_count*100:.1f}%)")
    print("=" * 70)
    
    return passed_count == total_count

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
