# BIGCHAMP — Phase 6.3: Smart Offers, Popups & Checkout System

## 1. Executive Summary

Phase 6.3 delivers a comprehensive **smart promotional ecosystem** consisting of:
1. An admin-controlled **Smart Promotional Popup Manager** with fair multi-campaign rotation, configurable trigger delays, suppression periods, and mobile-safe modals.
2. A dedicated **Offers Hub** (`/offers`) aggregating active discount codes, membership savings, Cookey tokens, and military honors.
3. Contextual **Checkout Offers** in `CartPage.jsx` providing 1-click coupon application with backend-authoritative calculation.

---

## 2. Smart Promotional Popup System

Located in `frontend/src/components/promotions/PromotionalPopupModal.jsx` and backed by `db.promotional_popups`:

### 2.1 Campaign Rotation Strategy
When multiple campaigns are active and within their scheduling window (`start_date` <= now <= `end_date`), `GET /api/v1/promotions/popup/active` implements a fair rotation algorithm:
- Accepts `last_seen_id` query parameter representing the previous campaign shown to the visitor.
- Filters out `last_seen_id` from candidates if alternatives exist.
- Weights eligible campaigns by their configured `priority`.
- Falls back deterministically if only one campaign is active.

### 2.2 Visitor Suppression & Frequency Controls
Popups must never harass customers or repeatedly reopen on dismissal:
- **Delay Trigger**: Configurable delay (default: 3 seconds) before modal appears, allowing visitor to absorb the hero campaign first.
- **Visitor Suppression**: On dismissal (via Close button, backdrop click, or ESC key), the modal sets `bigchamp_popup_suppressed_until` in `localStorage` based on `suppression_days` (default: 3 days).
- **Session Protection**: If the suppression timestamp has not passed, no popup is triggered.
- **Route Eligibility**: Optional route targeting (e.g. `/` vs `/store`).

### 2.3 Accessibility & UX Standards
- **Focus Management**: Close button receives focus immediately upon modal mount.
- **Escape Key**: Keydown listener closes the modal and sets suppression.
- **Reduced-Motion Support**: Respects OS motion preference.
- **1-Click Copy Code**: Customers can copy the promo code (`CHAMPION15`) with a single click and receive immediate feedback.

---

## 3. Dedicated Offers Hub (`/offers`)

Customer route `/offers` (`frontend/src/pages/public/OffersPage.jsx`):
- Fetches active promotions from `GET /api/v1/promotions/offers`.
- Displays:
  1. **Featured Discount Codes**: Active coupons with discount percent, min order value, max savings, and 1-click "Copy Code" button.
  2. **Membership Perks**: Dynamic card fee (₹100), validity (334 days), joining cashback (10%), and storewide member discount.
  3. **Cookey Sports Token Pass**: Weekly pass pricing (₹100) and prize drawing details.
  4. **Armed Forces & Veterans Program**: 10% extra discount honoring military, veterans, and police personnel.
  5. **Free Express Delivery**: Free insured delivery banner for orders exceeding threshold (₹500).

---

## 4. Contextual Checkout Offers & Authoritative Pricing

Integrated directly into `CartPage.jsx`:
- **Active Store Offers Strip**: An accordion drawer in the Order Summary showing eligible coupons (e.g. `CHAMPION15: 15% off`).
- **1-Click Apply**: Clicking "Apply" immediately validates the code against `couponService.validateCoupon()`.
- **Backend-Authoritative Pricing**: All discounts, tax amounts, shipping fees, and final payable totals are strictly computed by FastAPI on the server.
- **Zero Client Price Manipulation**: Manipulating coupon codes or frontend state has no effect on payment total verification.
