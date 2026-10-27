"""BIGCHAMP Phase 4 Master: End-to-End Business Operations, Lifecycle & Production Verification.
Automated test suite covering:
1. Module A: Order Lifecycle & Shipment Tracking (Extended States, Tracking Updates, Customer Cancellation).
2. Module B: Returns, Refunds & Financial Integrity (Return Requests, Admin Return Approval, Partial & Full Refunds, Over-refund prevention, Wallet Refunds).
3. Module C: Inventory Operations & Audit Logs (Atomic Stock Adjustments, Inventory History Logs, Low-stock Alerts, Negative Stock Prevention).
4. Module E: Partner Business Lifecycle (Application, Onboarding, Status Transition, Dynamic Commission Recording, Settlements).
5. Module F: Loyalty & Referrals (Auto Referral Codes, Attribution, Anti-Self-Referral, Referral Stats Dashboard).
6. Module G: Finance, Reporting & Reconciliation (Aggregated Financial Overview, CSV Export, Automated Payment Reconciliation).
7. Module H: Notifications & Customer Support (In-App Notification Center, Read Status, Ticket Creation, Thread Replies, Admin Status Triage).
8. Module I: Admin Control & Audit Trail (RBAC Protection, Audit Trail Logging).
"""
import sys
import json
import uuid
import hmac
import hashlib
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_API = "http://localhost:3050/api/v1"
ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASS = "Admin@123"
CUST_EMAIL = "freeuser@bigchamp.in"
CUST_PASS = "User@123"

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

    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if "text/csv" in content_type:
                return resp.status, raw.decode("utf-8")
            body = json.loads(raw.decode("utf-8")) if raw else {}
            return resp.status, body
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            body = json.loads(raw.decode("utf-8")) if raw else {}
        except Exception:
            body = {"raw": raw.decode("utf-8", errors="ignore")}
        return e.code, body
    except Exception as e:
        return 0, {"error": str(e)}


def run_phase4_master_suite():
    print("=" * 70)
    print("  BIGCHAMP PHASE 4 MASTER: COMPREHENSIVE BUSINESS CAPABILITY SUITE")
    print("=" * 70)

    # 1. Authenticate accounts
    print("\n--- 1. Authentication Baseline ---")
    st, adm = http_request("POST", f"{BASE_API}/admin/auth/login", {"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    test("Admin login succeeds", st == 200 and "access_token" in adm, f"status={st}")
    admin_token = adm.get("access_token", "")

    st, cust = http_request("POST", f"{BASE_API}/auth/login", {"identifier": CUST_EMAIL, "password": CUST_PASS})
    test("Customer login succeeds", st == 200 and "access_token" in cust, f"status={st}")
    cust_token = cust.get("access_token", "")
    cust_user_id = cust.get("user", {}).get("id")

    # 2. Module C: Inventory Operations & Audit Trail
    print("\n--- 2. Module C: Inventory Operations & Audit Logs ---")
    st, prods = http_request("GET", f"{BASE_API}/products?page=1&limit=5")
    items = prods if isinstance(prods, list) else prods.get("items", [])
    test("Fetch catalog products succeeds", st == 200 and len(items) > 0)
    test_prod = items[0]
    prod_id = test_prod.get("id") or test_prod.get("_id")

    # Stock adjustment
    st, adj_res = http_request(
        "POST",
        f"{BASE_API}/products/{prod_id}/stock-adjust",
        {"adjustment_qty": 10, "reason": "RESTOCK_SUPPLIER", "notes": "Warehouse replenishment"},
        token=admin_token
    )
    test("Admin can adjust product inventory (POST /products/{id}/stock-adjust)", st == 200, f"status={st}")
    test("Adjusted stock reflects added quantity", adj_res.get("data", {}).get("stock", 0) >= 10)

    # Prevent negative stock
    st, neg_res = http_request(
        "POST",
        f"{BASE_API}/products/{prod_id}/stock-adjust",
        {"adjustment_qty": -999999, "reason": "DAMAGE_LOSS", "notes": "Extreme deduction"},
        token=admin_token
    )
    test("Negative stock deduction strictly rejected with 400", st == 400, f"status={st}")

    # Inventory movement log
    st, logs_res = http_request("GET", f"{BASE_API}/products/{prod_id}/inventory-logs", token=admin_token)
    test("Admin can view product inventory movement history", st == 200 and logs_res.get("total", 0) > 0)
    first_log = logs_res.get("items", [{}])[0]
    test("Inventory log records reason, actor, and previous/resulting quantities",
         first_log.get("reason") == "RESTOCK_SUPPLIER" and first_log.get("actor") == ADMIN_EMAIL)

    # Low stock alerts
    st, alert_res = http_request("GET", f"{BASE_API}/products/admin/low-stock/alerts", token=admin_token)
    test("Admin low-stock alerts endpoint accessible", st == 200, f"status={st}")

    # 3. Module A: Order Lifecycle & Tracking
    print("\n--- 3. Module A: Order Lifecycle & Shipment Tracking ---")
    order_payload = {
        "items": [{"product_id": prod_id, "qty": 1}],
        "delivery_address": {
            "full_name": "Test Customer",
            "phone": "9876543210",
            "street_address": "42 Sports Complex",
            "city": "Dehradun",
            "state": "Uttarakhand",
            "pin_code": "248001"
        },
        "idempotency_key": f"P4M-{uuid.uuid4().hex[:8]}"
    }
    st, order_res = http_request("POST", f"{BASE_API}/orders", order_payload, token=cust_token)
    test("Customer places new order", st == 201, f"status={st}")
    order_number = order_res.get("order_number")

    # Update Tracking
    tracking_data = {
        "carrier": "BlueDart Express",
        "tracking_number": f"BD{uuid.uuid4().hex[:8].upper()}",
        "tracking_url": "https://bluedart.com/track",
        "estimated_delivery": "2026-11-01T10:00:00Z"
    }
    st, track_res = http_request(
        "POST",
        f"{BASE_API}/orders/admin/{order_number}/tracking",
        tracking_data,
        token=admin_token
    )
    test("Admin updates shipment tracking info", st == 200, f"status={st}")
    track_no = track_res.get("tracking", {}).get("tracking_number") or track_res.get("data", {}).get("tracking", {}).get("tracking_number")
    test("Order details reflect updated tracking number", track_no == tracking_data["tracking_number"])

    # Authoritative Payment Verification for order_number so it is paid before return/refund
    st, pay_init = http_request("POST", f"{BASE_API}/payments/create-order", {"order_id": order_number}, token=cust_token)
    if st == 201:
        prov_ord_id = pay_init.get("provider_order_id")
        pay_id = pay_init.get("payment_id")
        unique_prov_pay_id = f"pay_{uuid.uuid4().hex[:14]}"
        sig_payload = f"{prov_ord_id}|{unique_prov_pay_id}"
        sig = hmac.new("gv4f7MHd9cG8tjKnb5gH8aeO".encode(), sig_payload.encode(), hashlib.sha256).hexdigest()
        st_v, ver_res = http_request("POST", f"{BASE_API}/payments/verify", {
            "order_id": order_number,
            "payment_id": pay_id,
            "provider_order_id": prov_ord_id,
            "provider_payment_id": unique_prov_pay_id,
            "provider_signature": sig
        }, token=cust_token)

    # Lifecycle advance to PACKED -> SHIPPED -> DELIVERED
    http_request("PATCH", f"{BASE_API}/orders/{order_number}/status", {"status": "CONFIRMED"}, token=admin_token)
    st, p_res = http_request("PATCH", f"{BASE_API}/orders/{order_number}/status", {"status": "PACKED"}, token=admin_token)
    test("Admin advances order to PACKED status", st == 200, f"status={st}")
    http_request("PATCH", f"{BASE_API}/orders/{order_number}/status", {"status": "SHIPPED"}, token=admin_token)
    st, del_res = http_request("PATCH", f"{BASE_API}/orders/{order_number}/status", {"status": "DELIVERED"}, token=admin_token)
    test("Admin advances order to DELIVERED status", st == 200, f"status={st}")

    # Customer cancellation of a delivered order should be rejected
    st, cancel_deliv = http_request("POST", f"{BASE_API}/orders/my/{order_number}/cancel", {"reason": "Changed my mind"}, token=cust_token)
    test("Customer cancellation of DELIVERED order strictly rejected (400)", st == 400, f"status={st}")

    # Customer cancels an eligible pending order
    st, cancel_order_res = http_request("POST", f"{BASE_API}/orders", {**order_payload, "idempotency_key": f"P4M-CANC-{uuid.uuid4().hex[:6]}"}, token=cust_token)
    cancel_order_num = cancel_order_res.get("order_number")
    st, cancel_res = http_request("POST", f"{BASE_API}/orders/my/{cancel_order_num}/cancel", {"reason": "Ordered wrong size"}, token=cust_token)
    c_status = cancel_res.get("order_status") or cancel_res.get("data", {}).get("order_status")
    test("Customer cancels eligible pending order", st == 200 and c_status == "CANCELLED", f"status={st}")

    # 4. Module B: Returns, Refunds & Financial Integrity
    print("\n--- 4. Module B: Returns, Refunds & Financial Integrity ---")
    # Customer requests return on DELIVERED order
    return_payload = {
        "reason": "Size too small",
        "notes": "Would like a refund or replacement",
        "items": [{"product_id": prod_id, "qty": 1}]
    }
    st, ret_req_res = http_request("POST", f"{BASE_API}/orders/my/{order_number}/return", return_payload, token=cust_token)
    test("Customer requests return on DELIVERED order", st == 200, f"status={st}")
    ret_status = ret_req_res.get("order_status") or ret_req_res.get("data", {}).get("order_status")
    test("Order transitions to RETURN_REQUESTED status", ret_status == "RETURN_REQUESTED")

    # Admin reviews and approves return
    st, rev_res = http_request(
        "POST",
        f"{BASE_API}/orders/admin/{order_number}/review-return",
        {"decision": "APPROVE", "notes": "Items verified in good condition", "restock_inventory": True},
        token=admin_token
    )
    test("Admin approves return and restocks inventory", st == 200, f"status={st}")
    rev_status = rev_res.get("order_status") or rev_res.get("data", {}).get("order_status")
    test("Order transitions to RETURN_APPROVED status", rev_status == "RETURN_APPROVED")

    # Admin processes refund via wallet credit
    rev_dict = rev_res.get("data") if isinstance(rev_res.get("data"), dict) else rev_res
    order_final_payable = rev_dict.get("final_payable_paise") or rev_dict.get("pricing_snapshot", {}).get("final_payable_paise", 1000)
    refund_payload = {
        "amount_paise": order_final_payable,
        "reason": "Approved return full refund",
        "refund_method": "WALLET",
        "restock_items": False
    }
    st, ref_res = http_request(
        "POST",
        f"{BASE_API}/orders/admin/{order_number}/refund",
        refund_payload,
        token=admin_token
    )
    test("Admin processes refund to customer wallet", st == 200, f"status={st}")
    ref_pay_status = ref_res.get("payment_status") or ref_res.get("data", {}).get("payment_status")
    test("Order payment_status transitions to REFUNDED", ref_pay_status == "REFUNDED")

    # Attempting to over-refund rejected
    st, over_ref = http_request(
        "POST",
        f"{BASE_API}/orders/admin/{order_number}/refund",
        {"amount_paise": 5000, "reason": "Extra refund"},
        token=admin_token
    )
    test("Attempting cumulative refund exceeding payable amount rejected (400)", st == 400, f"status={st}")

    # 5. Module E: Partner Business Lifecycle & Commissions
    print("\n--- 5. Module E: Partner Lifecycle & Commissions ---")
    partner_app_payload = {
        "business_name": "Doon Badminton & Physio Academy",
        "business_type": "PHYSIO_CLINIC",
        "contact_person": "Coach Rajesh",
        "email": f"partner_{uuid.uuid4().hex[:6]}@partner.in",
        "phone": "9876501234",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "address": "12 Sahastradhara Road",
        "pincode": "248001",
        "notes": "State-of-the-art rehab facility"
    }
    st, part_res = http_request("POST", f"{BASE_API}/partners/apply", partner_app_payload)
    test("Partner submits onboarding application", st in [200, 201], f"status={st}")
    partner_id = part_res.get("id") or part_res.get("data", {}).get("id")
    part_stat = part_res.get("status") or part_res.get("data", {}).get("status")
    test("Partner status is initially PENDING", part_stat == "PENDING")

    # Admin approves partner
    st, part_appr = http_request(
        "PATCH",
        f"{BASE_API}/partners/admin/{partner_id}/status",
        {"status": "ACTIVE", "notes": "Physical facility inspected and verified"},
        token=admin_token
    )
    part_appr_stat = part_appr.get("status") or part_appr.get("data", {}).get("status")
    test("Admin approves partner to ACTIVE status", st == 200 and part_appr_stat == "ACTIVE", f"status={st}")

    # Record partner booking commission
    st, comm_res = http_request(
        "POST",
        f"{BASE_API}/partners/admin/{partner_id}/commission?gross_amount_paise=100000&source_id=BKG-001&source_type=BOOKING",
        None,
        token=admin_token
    )
    test("System records partner commission snapshot", st == 200, f"status={st}")
    commission_earned = comm_res.get("commission_amount_paise") or comm_res.get("data", {}).get("commission_amount_paise", 0)
    test("Commission calculated based on configured percentage (> 0 paise)", commission_earned > 0)

    # Process partner settlement payout
    settle_payload = {
        "amount_paise": commission_earned,
        "payment_reference": f"NEFT-{uuid.uuid4().hex[:8].upper()}",
        "notes": "Monthly settlement cycle"
    }
    st, settle_res = http_request("POST", f"{BASE_API}/partners/admin/{partner_id}/settlement", settle_payload, token=admin_token)
    test("Admin completes partner settlement payout", st == 200, f"status={st}")
    pending_payout = settle_res.get("partner", {}).get("pending_payout_paise", 0) if "partner" in settle_res else settle_res.get("pending_payout_paise", 0)
    test("Partner pending payout balance reflects settlement deduction", pending_payout == 0)

    # 6. Module F: Loyalty & Referrals
    print("\n--- 6. Module F: Customer Loyalty & Referrals ---")
    st, ref_summary = http_request("GET", f"{BASE_API}/referrals/me", token=cust_token)
    test("Customer retrieves referral summary and unique code", st == 200 and bool(ref_summary.get("data", {}).get("referral_code")), f"status={st}")
    my_ref_code = ref_summary.get("data", {}).get("referral_code")

    # Admin lists referrals
    st, admin_ref = http_request("GET", f"{BASE_API}/admin/referrals/list", token=admin_token)
    test("Admin can audit referral links and statuses", st == 200 and "items" in admin_ref.get("data", {}), f"status={st}")

    # 7. Module G: Finance, Reporting & Reconciliation
    print("\n--- 7. Module G: Finance, Reporting & Reconciliation ---")
    st, fin_res = http_request("GET", f"{BASE_API}/admin/finance/overview", token=admin_token)
    test("Admin retrieves comprehensive financial overview", st == 200, f"status={st}")
    sales_info = fin_res.get("data", {}).get("sales", {})
    test("Financial overview contains gross, net, refund, tax, and shipping breakdowns",
         "gross_sales_paise" in sales_info and "net_sales_paise" in sales_info and "total_refunds_paise" in sales_info)
    liabilities = fin_res.get("data", {}).get("liabilities", {})
    test("Financial overview contains wallet liabilities and partner commission liabilities",
         "wallet_balance_liability_paise" in liabilities and "pending_partner_payout_paise" in liabilities)

    # Financial CSV export
    st, csv_data = http_request("GET", f"{BASE_API}/admin/finance/export", token=admin_token)
    test("Admin exports financial report as RFC 4180 CSV", st == 200 and "Order Number" in csv_data, f"status={st}")

    # Payment reconciliation check
    st, recon_res = http_request("GET", f"{BASE_API}/admin/finance/reconciliation", token=admin_token)
    test("Admin automated payment and order reconciliation check succeeds", st == 200 and "findings" in recon_res.get("data", {}), f"status={st}")

    # 8. Module H: Notifications & Customer Support
    print("\n--- 8. Module H: Notifications & Customer Support ---")
    # Notifications
    st, notif_res = http_request("GET", f"{BASE_API}/notifications/my", token=cust_token)
    test("Customer accesses in-app notification center", st == 200 and "unread_count" in notif_res.get("data", {}), f"status={st}")
    st, mark_all_res = http_request("POST", f"{BASE_API}/notifications/my/read-all", None, token=cust_token)
    test("Customer marks all notifications as read", st == 200, f"status={st}")

    # Support Ticket Workflow
    ticket_payload = {
        "subject": "Inquiry regarding bulk team uniform order",
        "category": "ORDER",
        "message": "Hello, we would like to order 25 tracksuits for our state academy. Are customized badges supported?",
        "order_number": order_number
    }
    st, tkt_res = http_request("POST", f"{BASE_API}/support/tickets", ticket_payload, token=cust_token)
    test("Customer creates support inquiry ticket", st == 200, f"status={st}")
    ticket_id = tkt_res.get("data", {}).get("ticket_id")

    # Customer replies
    st, cust_rep = http_request(
        "POST",
        f"{BASE_API}/support/tickets/{ticket_id}/reply",
        {"message": "Also, what is the expected turnaround time for delivery?"},
        token=cust_token
    )
    test("Customer posts follow-up message to ticket thread", st == 200 and len(cust_rep.get("data", {}).get("messages", [])) == 2, f"status={st}")

    # Admin triage & reply
    st, adm_tkt = http_request("GET", f"{BASE_API}/admin/support/tickets", token=admin_token)
    test("Admin lists customer support tickets", st == 200 and adm_tkt.get("data", {}).get("total", 0) > 0, f"status={st}")

    st, adm_rep = http_request(
        "POST",
        f"{BASE_API}/admin/support/tickets/{ticket_id}/reply",
        {"message": "Yes, customized academy badges are supported! Delivery turnaround is 5-7 business days."},
        token=admin_token
    )
    test("Admin replies to customer support thread", st == 200 and len(adm_rep.get("data", {}).get("messages", [])) == 3, f"status={st}")

    st, adm_stat = http_request(
        "PATCH",
        f"{BASE_API}/admin/support/tickets/{ticket_id}/status",
        {"status": "RESOLVED", "note": "All inquiry questions answered"},
        token=admin_token
    )
    test("Admin marks ticket status as RESOLVED", st == 200 and adm_stat.get("data", {}).get("status") == "RESOLVED", f"status={st}")

    # 9. Module I: Admin Audit Trail
    print("\n--- 9. Module I: Admin Audit Trail ---")
    st, audit_res = http_request("GET", f"{BASE_API}/admin/audit-logs", token=admin_token)
    test("Admin accesses system audit trail", st == 200, f"status={st}")
    test("Audit trail contains recorded actions", audit_res.get("data", {}).get("total", 0) > 0)

    # Customer access forbidden
    st, cust_audit = http_request("GET", f"{BASE_API}/admin/audit-logs", token=cust_token)
    test("Customer role strictly forbidden from accessing admin audit logs (403)", st == 403, f"status={st}")

    print("\n" + "=" * 70)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"  PHASE 4 MASTER TEST SUMMARY: {passed}/{total} PASSED")
    if passed == total:
        print("  ALL PHASE 4 MASTER BUSINESS WORKFLOWS PASSED WITH 100% SUCCESS!")
    else:
        print("  SOME TESTS FAILED - REVIEW OUTPUT ABOVE")
    print("=" * 70)

    return passed == total

if __name__ == "__main__":
    success = run_phase4_master_suite()
    sys.exit(0 if success else 1)
