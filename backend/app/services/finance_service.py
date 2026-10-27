"""Financial reporting, aggregation, CSV export, and reconciliation service."""
import csv
import io
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from bson import ObjectId

from app.core.database import get_db


async def get_financial_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """Calculate platform-wide authoritative financial metrics and ledger liabilities."""
    db = get_db()
    
    # Build date query filter
    date_filter = {}
    if start_date:
        try:
            s_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            date_filter["$gte"] = s_dt
        except Exception:
            pass
    if end_date:
        try:
            e_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            date_filter["$lte"] = e_dt
        except Exception:
            pass

    order_query = {}
    if date_filter:
        order_query["created_at"] = date_filter

    # 1. Order and Sales Aggregation
    all_orders = await db.orders.find(order_query).to_list(length=10000)

    total_orders = len(all_orders)
    paid_orders = 0
    cancelled_orders = 0
    refunded_orders = 0

    gross_sales_paise = 0
    total_refunds_paise = 0
    total_delivery_charges_paise = 0
    total_tax_paise = 0
    total_discounts_paise = 0

    for o in all_orders:
        status = o.get("order_status", "")
        p_status = o.get("payment_status", "")
        pricing = o.get("pricing_snapshot", {}) or {}

        payable = pricing.get("final_payable_paise", 0) or o.get("final_payable_paise", 0)
        shipping = pricing.get("delivery_charge_paise", 0) or o.get("delivery_charge_paise", 0)
        tax = pricing.get("tax_paise", 0) or o.get("tax_paise", 0)
        discount = pricing.get("total_discount_paise", 0) or o.get("discount_paise", 0) or (pricing.get("coupon_discount_paise", 0) + pricing.get("member_discount_paise", 0))
        refunded = int(o.get("refund_summary", {}).get("total_refunded_paise") or o.get("refund_summary", {}).get("amount_paise") or o.get("refunded_amount_paise") or 0)

        if status == "CANCELLED":
            cancelled_orders += 1
        if p_status in ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] or status in ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"]:
            paid_orders += 1
            gross_sales_paise += payable
            total_delivery_charges_paise += shipping
            total_tax_paise += tax
            total_discounts_paise += discount

        if refunded > 0 or p_status in ["REFUNDED", "PARTIALLY_REFUNDED"]:
            refunded_orders += 1
            total_refunds_paise += refunded

    net_sales_paise = max(0, gross_sales_paise - total_refunds_paise)

    # 2. Membership Revenue
    membership_query = {}
    if date_filter:
        membership_query["created_at"] = date_filter
    membership_cursor = db.memberships.find(membership_query)
    memberships = await membership_cursor.to_list(length=10000)
    total_memberships_count = len(memberships)
    membership_revenue_paise = sum(m.get("pricing_snapshot", {}).get("price_paise", 10000) for m in memberships)

    # 3. Wallet Liabilities (total current user balances)
    wallets = await db.wallets.find({}).to_list(length=10000)
    total_active_wallets = len(wallets)
    total_wallet_liability_paise = sum(w.get("current_balance", 0) for w in wallets)

    # 4. Partner Commissions & Settlement Liabilities
    commissions = await db.partner_commissions.find({}).to_list(length=10000)
    total_partner_commissions_paise = sum(c.get("commission_amount_paise", 0) for c in commissions if c.get("status") in ["PENDING", "APPROVED", "SETTLED"])

    settlements = await db.partner_settlements.find({}).to_list(length=10000)
    settled_partner_commissions_paise = sum(s.get("amount_paise", 0) for s in settlements if s.get("status") == "COMPLETED")

    partners = await db.partners.find({}).to_list(length=1000)
    pending_partner_payout_paise = sum(max(0, p.get("pending_payout_paise", 0)) for p in partners)

    # 5. Inventory & Log Summary
    inventory_logs_count = await db.inventory_logs.count_documents({})
    low_stock_count = await db.products.count_documents({"stock": {"$lte": 5}})

    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "sales": {
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "cancelled_orders": cancelled_orders,
            "refunded_orders": refunded_orders,
            "gross_sales_paise": gross_sales_paise,
            "total_refunds_paise": total_refunds_paise,
            "net_sales_paise": net_sales_paise,
            "total_delivery_charges_paise": total_delivery_charges_paise,
            "total_tax_paise": total_tax_paise,
            "total_discounts_paise": total_discounts_paise,
        },
        "membership": {
            "total_memberships": total_memberships_count,
            "membership_revenue_paise": membership_revenue_paise
        },
        "liabilities": {
            "total_active_wallets": total_active_wallets,
            "wallet_balance_liability_paise": total_wallet_liability_paise,
            "pending_partner_payout_paise": pending_partner_payout_paise,
            "settled_partner_payout_paise": settled_partner_commissions_paise,
            "total_partner_commissions_paise": total_partner_commissions_paise
        },
        "inventory": {
            "total_movements_logged": inventory_logs_count,
            "low_stock_products_count": low_stock_count
        }
    }


async def export_financial_report_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> str:
    """Generate RFC 4180 compliant CSV string of financial order records."""
    db = get_db()
    date_filter = {}
    if start_date:
        try:
            date_filter["$gte"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        except Exception:
            pass
    if end_date:
        try:
            date_filter["$lte"] = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except Exception:
            pass

    query = {}
    if date_filter:
        query["created_at"] = date_filter

    orders = await db.orders.find(query).sort("created_at", -1).to_list(length=10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number",
        "Created At",
        "Order Status",
        "Payment Status",
        "Subtotal (₹)",
        "Discount (₹)",
        "Delivery (₹)",
        "Tax (₹)",
        "Total Payable (₹)",
        "Refunded (₹)",
        "Net Collected (₹)",
        "Payment Gateway ID"
    ])

    for o in orders:
        pricing = o.get("pricing_snapshot", {}) or {}
        subtotal = pricing.get("subtotal_paise", 0) / 100.0
        discount = (pricing.get("total_discount_paise", 0) or 0) / 100.0
        delivery = pricing.get("delivery_charge_paise", 0) / 100.0
        tax = pricing.get("tax_paise", 0) / 100.0
        payable = pricing.get("final_payable_paise", 0) / 100.0
        refunded = float(o.get("refund_summary", {}).get("total_refunded_paise") or o.get("refund_summary", {}).get("amount_paise") or o.get("refunded_amount_paise") or 0) / 100.0
        net = max(0.0, payable - refunded)

        created_str = o.get("created_at").isoformat() if isinstance(o.get("created_at"), datetime) else str(o.get("created_at"))

        writer.writerow([
            o.get("order_number", ""),
            created_str,
            o.get("order_status", ""),
            o.get("payment_status", ""),
            f"{subtotal:.2f}",
            f"{discount:.2f}",
            f"{delivery:.2f}",
            f"{tax:.2f}",
            f"{payable:.2f}",
            f"{refunded:.2f}",
            f"{net:.2f}",
            o.get("razorpay_payment_id", o.get("payment_id", ""))
        ])

    return output.getvalue()


async def run_payment_reconciliation() -> Dict[str, Any]:
    """Scan payment records, order states, and operation journals for financial anomalies."""
    db = get_db()
    now = datetime.now(timezone.utc)
    stale_threshold = now - timedelta(minutes=30)

    findings: List[Dict[str, Any]] = []

    # 1. Stale pending payments (> 30 minutes without resolution)
    stale_pending = await db.payments.find({
        "status": "PENDING",
        "created_at": {"$lt": stale_threshold}
    }).to_list(length=100)

    for p in stale_pending:
        findings.append({
            "type": "STALE_PENDING_PAYMENT",
            "severity": "WARNING",
            "payment_id": p.get("payment_id"),
            "order_id": p.get("order_id"),
            "amount_paise": p.get("amount"),
            "created_at": p.get("created_at"),
            "description": f"Payment {p.get('payment_id')} remained in PENDING state for >30 minutes.",
            "recommended_action": "Mark EXPIRED or poll payment provider verification endpoint."
        })

    # 2. Payments requiring reconciliation
    recon_ops = await db.payment_operations.find({
        "state": "REQUIRES_RECONCILIATION"
    }).to_list(length=100)

    for op in recon_ops:
        findings.append({
            "type": "PAYMENT_DISCREPANCY",
            "severity": "CRITICAL",
            "operation_id": op.get("operation_id"),
            "order_id": op.get("order_id"),
            "discrepancy": op.get("discrepancy"),
            "details": op.get("discrepancy_details"),
            "description": f"Payment captured but flagged discrepancy: {op.get('discrepancy')}",
            "recommended_action": "Inspect inventory/amount mismatch and manually approve or issue refund."
        })

    # 3. Orders marked CONFIRMED without matching PAID payment record
    confirmed_orders = await db.orders.find({
        "order_status": "CONFIRMED",
        "payment_status": {"$ne": "PAID"}
    }).to_list(length=50)

    for o in confirmed_orders:
        findings.append({
            "type": "ORDER_PAYMENT_STATUS_MISMATCH",
            "severity": "HIGH",
            "order_number": o.get("order_number"),
            "order_status": o.get("order_status"),
            "payment_status": o.get("payment_status"),
            "description": f"Order {o.get('order_number')} is CONFIRMED but payment_status is '{o.get('payment_status')}'.",
            "recommended_action": "Synchronize order payment status with payment journal."
        })

    # 4. In-flight or unresolved refunds requiring reconciliation
    recon_refunds = await db.refunds.find({"status": "RECONCILIATION_REQUIRED"}).to_list(length=50)
    for rf in recon_refunds:
        findings.append({
            "type": "REFUND_RECONCILIATION_REQUIRED",
            "severity": "HIGH",
            "refund_id": rf.get("refund_id"),
            "order_number": rf.get("order_number"),
            "amount_paise": rf.get("amount_paise"),
            "description": f"Refund {rf.get('refund_id')} timed out or needs provider verification.",
            "recommended_action": "Check provider refund status or process webhook reconciliation.",
        })

    # 5. Unrecovered referral debts (referee cancelled order but referrer wallet had insufficient funds)
    unrecovered_refs = await db.referrals.find({
        "status": "REVERSED",
        "requires_admin_review": True,
    }).to_list(length=50)
    for ur in unrecovered_refs:
        findings.append({
            "type": "UNRECOVERED_REFERRAL_REVERSAL",
            "severity": "MEDIUM",
            "referral_id": str(ur["_id"]),
            "referrer_user_id": ur.get("referrer_user_id"),
            "unrecovered_amount_paise": ur.get("unrecovered_amount_paise", 0),
            "description": f"Referral {ur.get('referral_code')} reversed with {ur.get('unrecovered_amount_paise', 0)} paise unrecovered.",
            "recommended_action": "Review referrer user balance or offset against future earnings.",
        })

    # 6. Partner settlement balance audit
    partners = await db.partners.find({}).to_list(length=100)
    for pt in partners:
        p_id_str = str(pt["_id"])
        completed_settles = await db.partner_settlements.find({
            "partner_id": p_id_str,
            "status": "COMPLETED",
        }).to_list(length=1000)
        actual_settled_paise = sum(s.get("amount_paise", 0) for s in completed_settles)
        doc_settled_paise = int(pt.get("total_settled_paise", 0))
        if actual_settled_paise != doc_settled_paise:
            findings.append({
                "type": "PARTNER_SETTLEMENT_MISMATCH",
                "severity": "CRITICAL",
                "partner_id": p_id_str,
                "partner_name": pt.get("business_name"),
                "expected_settled_paise": actual_settled_paise,
                "recorded_settled_paise": doc_settled_paise,
                "description": f"Partner {pt.get('business_name')} has recorded settlements ({doc_settled_paise} paise) diverging from settlement ledger ({actual_settled_paise} paise).",
                "recommended_action": "Reconcile partner settlement ledger.",
            })

    return {
        "timestamp": now,
        "total_anomalies_found": len(findings),
        "status": "CLEAN" if not findings else "ATTENTION_REQUIRED",
        "findings": findings,
    }
