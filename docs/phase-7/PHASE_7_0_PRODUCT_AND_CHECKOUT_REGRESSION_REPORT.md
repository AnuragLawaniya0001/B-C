# BIGCHAMP Phase 7.0 — Product Discovery, PDP & Checkout Regression Report

**Date:** October 26, 2026  
**Auditor:** Principal Backend Engineer & Quality Assurance Lead  
**Scope:** Verification of product catalog integrity, out-of-stock validation, PDP gallery, cart state management, checkout calculations, and payment workflow security.

---

## 1. Product Catalog & Inventory Truth

### 1.1 Out-of-Stock Protection:
- MongoDB schema stores available inventory in the `stock` attribute (integer).
- Fixed frontend discrepancy where `ProductCard.jsx` and `ProductDetailPage.jsx` previously checked `stock_quantity`.
- **Verified Behavior:**
  - When `stock <= 0` (13 catalog products verified):
    - Product card displays high-contrast `Out of Stock` badge.
    - Product image renders in muted grayscale.
    - Quick-add button is disabled with `cursor-not-allowed`.
    - On Product Detail Page, purchase button displays `Item Currently Unavailable` and quantity controls are locked.
  - When `stock > 0 and stock <= 5` (7 catalog products verified):
    - Amber badge warns `Only {stock} left`.
    - Quantity selector cannot exceed available stock.

### 1.2 Compare-at & MRP Pricing:
- Card displays regular selling price in bold font.
- Where compare-at / original price exists or is calculated, it renders with strike-through styling alongside a crimson percentage off badge (e.g. `-15% OFF`).
- Member price is clearly highlighted with dedicated savings callout.

---

## 2. Product Detail Page (PDP) Verification

- **Multi-Image Gallery:**
  - Primary product image rendered in high resolution with responsive aspect ratio.
  - Interactive thumbnail strip enables instantaneous switching across alternate angles without page reload.
- **Pincode Delivery Estimator:**
  - Live 6-digit Indian PIN code validator tested with valid PINs (e.g. `110001`, `400001`) and invalid inputs.
  - Displays instant delivery confirmation: `"Standard Express Delivery to [PIN]: Expected within 3-4 business days. Free shipping on orders above ₹500."`
- **Authentic Athletic Guarantees:**
  - Free delivery threshold dynamically pulled from `db.settings`.
  - 7-Day return and size exchange policy clearly displayed.
  - 100% Match-grade genuine certification badge.

---

## 3. Cart & Checkout Calculation Security

### 3.1 Authoritative Backend Totals:
- The customer frontend submits cart items (`product_id`, `quantity`) to `/api/v1/orders/checkout/calculate`.
- All prices, sub-totals, discounts, delivery fees, and tax calculations are strictly re-evaluated on the backend server against `db.products` and `db.settings`.
- Client-supplied prices or forged discount amounts are ignored.

### 3.2 Payment Flow & Webhook Verification:
- Order initialization via `/api/v1/orders` creates a pending order document in `db.orders` and a Razorpay order ID in test mode.
- Payment status is updated only upon cryptographic signature verification of `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` using the HMAC-SHA256 server secret.
- No orders are marked as paid solely based on frontend redirection.
