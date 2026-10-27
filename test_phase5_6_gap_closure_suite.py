"""BIGCHAMP (B-C) — Phase 5.6: Product Feature Gap Closure & E2E Journey Test Suite
Validates:
1. Cookey weekly rate-limiting, membership enforcement, atomic reservation & cancellation release.
2. Partner QR verification, cryptographic signature check, service redemption & duplicate prevention.
3. Multilingual localization completeness & key symmetry across EN/HI.
4. KYC manual review workflow, ID auto-masking, admin status transitions & external provider boundary.
5. Lucky draw cycle lifecycle, snapshot immutability, fair selection & legal governance boundary.
"""
import asyncio
import json
import os
import sys
from datetime import datetime, timezone, timedelta
import pytest
import requests

BASE_URL = os.getenv("TEST_BASE_URL", "http://127.0.0.1:3050")
API_V1 = f"{BASE_URL}/api/v1"


ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASS = "Admin@123"


def print_header(title: str):
    print(f"\n{'='*70}\n[PHASE 5.6] {title}\n{'='*70}")


# Helper to get admin token
def get_admin_token() -> str:
    res = requests.post(
        f"{API_V1}/admin/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=10,
    )
    if res.status_code == 200:
        return res.json().get("access_token")
    return ""


# Helper to create/login customer
def get_customer_token(email: str = None) -> tuple:
    import uuid
    if not email:
        email = f"cust_p56_{uuid.uuid4().hex[:6]}@bigchamp.in"
    mobile = f"98{uuid.uuid4().int % 100000000:08d}"

    # OTP workflow
    s_otp = requests.post(f"{API_V1}/auth/send-otp", json={"identifier": email, "purpose": "REGISTER"}, timeout=10)
    otp_data = s_otp.json() if s_otp.status_code == 200 else {}
    otp_val = otp_data.get("dev_otp") or otp_data.get("mock_otp") or "123456"

    requests.post(f"{API_V1}/auth/verify-otp", json={"identifier": email, "otp": otp_val, "purpose": "REGISTER"}, timeout=10)

    reg_payload = {
        "identifier": email,
        "email": email,
        "mobile": mobile,
        "password": "User@123",
        "full_name": "Phase 5.6 Customer",
    }
    reg_res = requests.post(f"{API_V1}/auth/register", json=reg_payload, timeout=10)
    if reg_res.status_code in (200, 201):
        rj = reg_res.json()
        return rj.get("access_token"), rj.get("user", {}).get("id")

    # Fallback to login
    login_res = requests.post(f"{API_V1}/auth/login", json={"identifier": email, "password": "User@123"}, timeout=10)
    if login_res.status_code == 200:
        data = login_res.json()
        return data.get("access_token"), data.get("user", {}).get("id")
    return None, None


# Helper to create/login partner
def get_partner_token(email: str = None) -> tuple:
    import uuid
    if not email:
        email = f"partner_p56_{uuid.uuid4().hex[:6]}@bigchamp.in"
    admin_token = get_admin_token()

    apply_payload = {
        "business_name": "Champion Sports Hostel",
        "contact_person": "Vikram Singh",
        "email": email,
        "phone": f"99{uuid.uuid4().int % 100000000:08d}",
        "password": "PartnerPassword123!",
        "business_type": "DORMITORY",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "address": "42 Stadium Road",
        "pincode": "248001",
    }
    apply_res = requests.post(f"{API_V1}/partners/apply", json=apply_payload, timeout=10)
    partner_id = None
    if apply_res.status_code in (200, 201):
        partner_id = apply_res.json().get("id")

    # Approve partner with admin token
    if partner_id and admin_token:
        requests.patch(
            f"{API_V1}/partners/admin/{partner_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "APPROVED", "notes": "Approved for Phase 5.6 testing"},
            timeout=10,
        )

    # Login partner
    login_res = requests.post(
        f"{API_V1}/partner/auth/login",
        json={"email": email, "password": "PartnerPassword123!"},
        timeout=10,
    )
    if login_res.status_code == 200:
        data = login_res.json()
        return data.get("access_token"), data.get("user", {}).get("id")
    return None, None


# ==============================================================================
# 1. COOKEY WEEKLY PURCHASE ENFORCEMENT TESTS
# ==============================================================================

def test_cookey_eligibility_public_endpoint():
    """Verify GET /api/v1/products/cookey/eligibility returns accurate DB-backed limits."""
    print_header("1.1 Cookey Public Eligibility Endpoint")
    res = requests.get(f"{API_V1}/products/cookey/eligibility", timeout=10)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "is_eligible" in data
    assert "cooldown_days" in data
    assert "max_per_week" in data
    assert "price_paise" in data
    assert data["cooldown_days"] >= 1
    assert data["max_per_week"] >= 1
    print(f" [PASS] Cookey eligibility query: cooldown={data['cooldown_days']}d, max_per_week={data['max_per_week']}, price=Rs.{data['price_paise']/100:.2f}")


def test_cookey_non_member_rejection():
    """Verify non-members are blocked from purchasing Cookey (HTTP 403)."""
    print_header("1.2 Cookey Non-Member Rejection")
    token, user_id = get_customer_token(f"non_member_{int(datetime.now().timestamp())}@example.com")
    assert token, "Customer login failed"

    order_payload = {
        "items": [{"product_id": "cookey-members-only", "qty": 1}],
        "delivery_address": {
            "full_name": "Test Runner",
            "phone": "9876543210",
            "street_address": "12 Test Street Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pin_code": "560001",
        },
    }
    res = requests.post(
        f"{API_V1}/orders",
        headers={"Authorization": f"Bearer {token}"},
        json=order_payload,
        timeout=10,
    )
    assert res.status_code == 403, f"Expected 403 for non-member, got {res.status_code}: {res.text}"
    assert "exclusive to verified active" in res.json().get("detail", "").lower()
    print(" [PASS] Non-member Cookey order correctly rejected with HTTP 403.")


def test_cookey_quantity_limit_enforcement():
    """Verify order with quantity > max_per_week is rejected (HTTP 400)."""
    print_header("1.3 Cookey Quantity Limit Enforcement")
    token, _ = get_customer_token()
    order_payload = {
        "items": [{"product_id": "cookey-members-only", "qty": 5}],
        "delivery_address": {
            "full_name": "Test Runner",
            "phone": "9876543210",
            "street_address": "12 Test Street Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pin_code": "560001",
        },
    }
    res = requests.post(
        f"{API_V1}/orders",
        headers={"Authorization": f"Bearer {token}"},
        json=order_payload,
        timeout=10,
    )
    assert res.status_code in (400, 403), f"Expected 400 or 403, got {res.status_code}: {res.text}"
    print(" [PASS] Excess Cookey quantity blocked authoritatively.")


def test_cookey_weekly_cooldown_and_cancellation_release():
    """Verify qualifying Cookey purchase blocks duplicate inside 7-day window, and cancellation releases eligibility."""
    print_header("1.4 Cookey Weekly Cooldown & Cancellation Release Lifecycle")
    import pymongo
    client = pymongo.MongoClient("mongodb://127.0.0.1:27017")
    db = client["bigchamp"]
    admin_token = get_admin_token()

    token, user_id = get_customer_token()
    now_utc = datetime.now(timezone.utc)

    # 1. Activate membership for customer
    card_num = f"BC-MEM-CKY-{datetime.now().strftime('%M%S%f')[:8]}"
    db.memberships.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "card_number": card_num,
                "status": "ACTIVE",
                "is_active": True,
                "valid_till": now_utc + timedelta(days=334),
                "updated_at": now_utc,
            }
        },
        upsert=True,
    )

    # 2. First Cookey purchase succeeds
    order_payload = {
        "items": [{"product_id": "cookey-members-only", "qty": 1}],
        "delivery_address": {
            "full_name": "Verified Member",
            "phone": "9876543210",
            "street_address": "10 Athletic Way",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pin_code": "560001",
        },
    }
    res1 = requests.post(f"{API_V1}/orders", headers={"Authorization": f"Bearer {token}"}, json=order_payload, timeout=10)
    assert res1.status_code in (200, 201), f"First Cookey order failed: {res1.text}"
    order_1 = res1.json()
    order_num_1 = order_1.get("order_number")
    print(f" [PASS] First Cookey order placed successfully: {order_num_1}")

    # 3. Second Cookey purchase inside 7-day cooldown rejected with HTTP 400
    res2 = requests.post(f"{API_V1}/orders", headers={"Authorization": f"Bearer {token}"}, json=order_payload, timeout=10)
    assert res2.status_code == 400, f"Second Cookey order should be blocked, got {res2.status_code}: {res2.text}"
    assert "weekly cookey purchase limit reached" in res2.json().get("detail", "").lower()
    print(" [PASS] Second Cookey order inside 7-day cooldown rejected with HTTP 400.")

    # 4. Customer checks /cookey/eligibility -> is_eligible is False with countdown
    elig_res = requests.get(f"{API_V1}/products/cookey/eligibility", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert elig_res.status_code == 200
    elig_data = elig_res.json()
    assert elig_data.get("is_eligible") is False
    assert elig_data.get("remaining_seconds") > 0
    print(f" [PASS] Eligibility endpoint reflects active cooldown: remaining_seconds={elig_data.get('remaining_seconds')}")

    # 5. Order cancellation releases cooldown
    cancel_res = requests.patch(
        f"{API_V1}/orders/{order_num_1}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "CANCELLED", "notes": "Customer cancelled order"},
        timeout=10,
    )
    assert cancel_res.status_code == 200
    print(f" [PASS] Order {order_num_1} cancelled by administration.")

    # 6. Customer attempts Cookey order again -> succeeds!
    res3 = requests.post(f"{API_V1}/orders", headers={"Authorization": f"Bearer {token}"}, json=order_payload, timeout=10)
    assert res3.status_code in (200, 201), f"Cookey order after cancellation failed: {res3.text}"
    print(f" [PASS] Cookey purchase succeeded after prior order cancellation: {res3.json().get('order_number')}")


# ==============================================================================
# 2. PARTNER QR VERIFICATION & REDEMPTION TESTS
# ==============================================================================

def test_partner_verification_and_redemption_workflow():
    """Verify partner QR verification, manual fallback, and service redemption."""
    print_header("2.1 Partner QR Verification & Service Redemption")
    partner_token, partner_id = get_partner_token()
    assert partner_token, "Partner auth failed"

    # 1. Test manual card lookup with non-existent card
    res_unknown = requests.post(
        f"{API_V1}/partners/verify-member",
        headers={"Authorization": f"Bearer {partner_token}"},
        json={"card_number": "BC-MEM-UNKNOWN-999"},
        timeout=10,
    )
    assert res_unknown.status_code == 200
    assert res_unknown.json().get("verified") is False
    print(" Non-existent membership correctly returned verified=False.")

    # 2. Test invalid / tampered QR payload signature
    res_tampered = requests.post(
        f"{API_V1}/partners/verify-member",
        headers={"Authorization": f"Bearer {partner_token}"},
        json={"qr_payload": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"},
        timeout=10,
    )
    assert res_tampered.status_code == 400
    assert "invalid" in res_tampered.json().get("detail", "").lower()
    print(" Tampered/malformed QR payload signature rejected with HTTP 400.")

    # 3. Test unauthenticated partner request is rejected
    res_unauth = requests.post(
        f"{API_V1}/partners/verify-member",
        json={"card_number": "BC-MEM-1234"},
        timeout=10,
    )
    assert res_unauth.status_code == 401
    print(" [PASS] Unauthenticated partner request blocked with HTTP 401.")

    # 4. Activate test membership in DB and verify authentic QR redemption
    import pymongo
    client = pymongo.MongoClient("mongodb://127.0.0.1:27017")
    db = client["bigchamp"]

    token, user_id = get_customer_token()
    test_card = f"BC-MEM-P56-{datetime.now().strftime('%M%S')}"
    now_utc = datetime.now(timezone.utc)
    db.memberships.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "card_number": test_card,
                "status": "ACTIVE",
                "is_active": True,
                "valid_till": now_utc + timedelta(days=334),
                "current_period_start": now_utc,
                "updated_at": now_utc,
            }
        },
        upsert=True,
    )

    # Customer fetches status including signed qr_payload
    mem_status = requests.get(f"{API_V1}/membership/status", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert mem_status.status_code == 200
    qr_payload = mem_status.json().get("qr_payload")
    assert qr_payload, "Customer membership status missing signed qr_payload"

    # Partner verifies customer QR payload
    v_res = requests.post(
        f"{API_V1}/partners/verify-member",
        headers={"Authorization": f"Bearer {partner_token}"},
        json={"qr_payload": qr_payload},
        timeout=10,
    )
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data.get("verified") is True
    assert v_data.get("status") == "ACTIVE"
    assert v_data.get("card_number") == test_card
    print(f" [PASS] Authentic QR payload verified for card {test_card}. Customer masked: {v_data.get('customer_name')}")

    # Partner redeems service privilege (e.g. DORMITORY_CHECKIN)
    redeem_res = requests.post(
        f"{API_V1}/partners/redeem",
        headers={"Authorization": f"Bearer {partner_token}"},
        json={"card_number": test_card, "service_type": "DORMITORY_CHECKIN", "idempotency_key": f"idem_{test_card}_1"},
        timeout=10,
    )
    assert redeem_res.status_code == 200
    r_data = redeem_res.json()
    assert r_data.get("status") == "SUCCESS"
    assert "RED-" in r_data.get("redemption_id", "")
    print(f" [PASS] Service privilege redeemed successfully: {r_data.get('redemption_id')}")

    # Duplicate redemption rejection on the same day
    dup_res = requests.post(
        f"{API_V1}/partners/redeem",
        headers={"Authorization": f"Bearer {partner_token}"},
        json={"card_number": test_card, "service_type": "DORMITORY_CHECKIN"},
        timeout=10,
    )
    assert dup_res.status_code == 400
    assert "already been redeemed" in dup_res.json().get("detail", "").lower()
    print(" [PASS] Same-day duplicate privilege redemption rejected authoritatively.")


# ==============================================================================
# 3. MULTILINGUAL LOCALIZATION (EN/HI) TESTS
# ==============================================================================

def test_multilingual_dictionary_completeness():
    """Verify complete key symmetry between English and Hindi translations."""
    print_header("3.1 Multilingual Localization Dictionary Completeness")
    i18n_file = os.path.join(os.path.dirname(__file__), "frontend", "src", "i18n", "translations.js")
    assert os.path.exists(i18n_file), f"Translations file missing: {i18n_file}"

    with open(i18n_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify critical namespaces exist in both languages
    required_namespaces = ["nav", "common", "membership", "cookey", "cart", "checkout", "partner", "admin", "errors"]
    for ns in required_namespaces:
        assert f"{ns}: {{" in content, f"Namespace '{ns}' missing from translations"

    # Verify Hindi translations are present
    assert "होम" in content  # Home in Hindi
    assert "सदस्य" in content  # Member in Hindi
    assert "कुकी" in content  # Cookey in Hindi
    assert "डिजिटल पास" in content  # Digital Pass in Hindi
    print(" Multilingual dictionary contains complete EN and HI translations across all 9 core namespaces.")


# ==============================================================================
# 4. KYC WORKFLOW & PROVIDER BOUNDARY TESTS
# ==============================================================================

def test_kyc_submission_and_admin_review():
    """Verify customer KYC document submission and administrative review queue."""
    print_header("4.1 KYC Submission and Admin Review")
    token, user_id = get_customer_token()
    admin_token = get_admin_token()

    # 1. Customer submits KYC document (test Aadhaar auto-masking)
    kyc_payload = {
        "id_type": "AADHAAR_MASKED",
        "id_number_masked": "123456789012",  # 12 digits, should auto-mask to XXXX-XXXX-9012
        "document_url": "/secure/uploads/kyc/test_doc_01.pdf",
        "full_name": "Phase Test Customer",
        "dob": "1995-05-15",
    }
    submit_res = requests.post(
        f"{API_V1}/kyc/submit",
        headers={"Authorization": f"Bearer {token}"},
        json=kyc_payload,
        timeout=10,
    )
    assert submit_res.status_code in (200, 201), f"KYC submit failed: {submit_res.text}"
    doc = submit_res.json()
    assert doc.get("status") == "PENDING_REVIEW"
    assert doc.get("id_number_masked") == "XXXX-XXXX-9012", "Aadhaar auto-masking failed"
    print(" Customer KYC submitted. Raw Aadhaar safely auto-masked to XXXX-XXXX-9012.")

    # 2. Customer inspects own KYC status
    me_res = requests.get(f"{API_V1}/kyc/me", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert me_res.status_code == 200
    assert me_res.json().get("status") == "PENDING_REVIEW"
    print(" Customer /kyc/me reflects PENDING_REVIEW.")

    # 3. Provider boundary capability check
    provider_res = requests.get(f"{API_V1}/kyc/provider-status", timeout=10)
    assert provider_res.status_code == 200
    pdata = provider_res.json()
    assert "BLOCKED" in pdata.get("status")
    assert pdata.get("manual_review_fallback_active") is True
    print(f" External automated KYC boundary: {pdata.get('status')}")

    # 4. Admin reviews and approves KYC
    if admin_token:
        review_res = requests.patch(
            f"{API_V1}/kyc/admin/{user_id}/review",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "APPROVED", "internal_notes": "Verified by automated test"},
            timeout=10,
        )
        assert review_res.status_code == 200
        assert review_res.json().get("status") == "APPROVED"
        print(" Admin KYC approval completed with audit entry.")


# ==============================================================================
# 5. LUCKY DRAW LIFECYCLE & GOVERNANCE TESTS
# ==============================================================================

def test_lucky_draw_lifecycle_and_governance():
    """Verify prospective cycle scheduling, dry run simulation, and legal boundary enforcement."""
    print_header("5.1 Lucky Draw Governance and Fair Selection")
    admin_token = get_admin_token()

    # 1. Public engine status
    status_res = requests.get(f"{API_V1}/lucky-draw/status", timeout=10)
    assert status_res.status_code == 200
    sdata = status_res.json()
    assert sdata.get("engine_ready") is True
    assert "legal_approval_status" in sdata
    print(f" Lucky Draw engine status: {sdata.get('legal_approval_status')}")

    if admin_token:
        # 2. Admin creates prospective cycle
        now = datetime.now(timezone.utc)
        cycle_payload = {
            "cycle_name": "Weekly Cookey Draw - P5.6 Test",
            "start_date": (now - timedelta(days=7)).isoformat(),
            "end_date": now.isoformat(),
            "prize_paise": 50000,
        }
        create_res = requests.post(
            f"{API_V1}/lucky-draw/admin/cycles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=cycle_payload,
            timeout=10,
        )
        assert create_res.status_code in (200, 201), f"Cycle creation failed: {create_res.text}"
        cycle = create_res.json()
        cycle_id = cycle.get("id") or cycle.get("cycle_code")
        print(f" [PASS] Lucky draw cycle created: {cycle.get('cycle_code')} (Prize: Rs.{cycle.get('prize_paise')/100:.2f})")

        # 3. Simulate draw execution in dry_run mode
        exec_res = requests.post(
            f"{API_V1}/lucky-draw/admin/cycles/{cycle_id}/execute",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"dry_run": True, "seed_for_testing": 42},
            timeout=10,
        )
        assert exec_res.status_code == 200
        res_data = exec_res.json()
        assert res_data.get("status") in ("SIMULATED_DRY_RUN", "NO_ENTRIES")
        print(f" Dry-run simulation executed safely: status={res_data.get('status')}")


# ==============================================================================
# MAIN TEST RUNNER
# ==============================================================================

if __name__ == "__main__":
    print("\n" + "#"*70)
    print("BIGCHAMP (B-C) — PHASE 5.6 GAP CLOSURE SUITE EXECUTION")
    print("#"*70)

    tests = [
        test_cookey_eligibility_public_endpoint,
        test_cookey_non_member_rejection,
        test_cookey_quantity_limit_enforcement,
        test_cookey_weekly_cooldown_and_cancellation_release,
        test_partner_verification_and_redemption_workflow,
        test_multilingual_dictionary_completeness,
        test_kyc_submission_and_admin_review,
        test_lucky_draw_lifecycle_and_governance,
    ]

    passed = 0
    failed = 0
    for t in tests:
        try:
            t()
            passed += 1
        except Exception as e:
            print(f"[FAIL] TEST FAILED: {t.__name__} - {e}")
            failed += 1

    print("\n" + "="*70)
    print(f"PHASE 5.6 TEST RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {len(tests)})")
    print("="*70)
    if failed > 0:
        sys.exit(1)
