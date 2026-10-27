# BIGCHAMP — E-Commerce Rebuild API Contracts

## 1. Overview & Architectural Principles

The BIGCHAMP rebuilt storefront adheres to strict contract-first API integration. The customer client (`frontend/`) interacts with the backend services through verified endpoints defined in `backend/app/api/v1/`.

### Core Contract Invariants:
1. **Financial Rule Authority:** The backend is the sole authority for order totals, tax amounts, shipping fees, and coupon discounts. Frontend totals serve as estimates only.
2. **Payment Verification:** Razorpay payment captures are verified server-side using cryptographic HMAC-SHA256 signatures (`POST /payments/verify`). Orders are never marked paid based on client callbacks.
3. **Authentication:** JWT Bearer tokens with stateless session verification and automated token refreshing.

---

## 2. API Contract Inventory

### 2.1 Public Platform Settings
- **Path:** `GET /api/v1/settings/public`
- **Auth:** Public (Unauthenticated)
- **Response:**
```json
{
  "business_rules": {
    "card_fee_paise": 10000,
    "card_validity_days": 334,
    "joining_cashback_percent": 10,
    "cookey_price_paise": 10000,
    "cookey_cooldown_days": 7,
    "cookey_max_per_week": 1,
    "army_extra_discount_percent": 10,
    "lucky_draw_prize_paise": 50000,
    "free_delivery_threshold_paise": 50000,
    "standard_delivery_charge_paise": 0,
    "default_member_discount_percent": 10.0,
    "tax_percent": 0.0
  },
  "site_contact": {
    "phone": "+91 98765 43210",
    "email": "support@bigchamp.in",
    "address": "BIGCHAMP Sports Arena, Bengaluru, India"
  },
  "social_links": {
    "instagram": "https://instagram.com/bigchampsports",
    "facebook": "https://facebook.com/bigchampsports"
  },
  "feature_flags": {
    "guest_checkout": false,
    "reviews_enabled": false
  }
}
```

---

### 2.2 Marketing Banners
- **Path:** `GET /api/v1/banners?position={position}`
- **Auth:** Public
- **Query Parameters:** `position` (e.g. `homepage_top`, `homepage_middle`)
- **Response:**
```json
[
  {
    "_id": "6adc780c0070e2739bfdd152",
    "title": "Cookey — Members Only ₹100",
    "image_url": "/images/banners/cookey.jpg",
    "link": "/cookey",
    "position": "homepage_top",
    "active": true,
    "order": 1
  }
]
```

---

### 2.3 Product Catalog & Search
- **Path:** `GET /api/v1/products`
- **Auth:** Public
- **Query Parameters:**
  - `search`: String (searches name, SKU, and description)
  - `category`: String (e.g. `GEARS`, `APPAREL`, `EXCLUSIVE`, `FITNESS`)
  - `featured`: Boolean (filter homepage featured items)
  - `active`: Boolean (`true` for customer catalog)
  - `sort`: String (`price_asc`, `price_desc`, `newest`)
  - `skip`: Integer (offset pagination)
  - `limit`: Integer (items per page, default 50, max 100)
- **Response:**
```json
[
  {
    "_id": "6adc780c0070e2739bfdd101",
    "slug": "pro-cricket-bat-english-willow",
    "name": "Pro English Willow Cricket Bat",
    "sku": "BC-BAT-001",
    "category": "GEARS",
    "sport": "cricket",
    "price_paise": 499900,
    "member_price_paise": 449900,
    "stock_quantity": 25,
    "featured": true,
    "images": [
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0"
    ],
    "description": "Grade 1 English willow hand-crafted for power and balance."
  }
]
```

---

### 2.4 Product Detail by Slug
- **Path:** `GET /api/v1/products/{id_or_slug}`
- **Auth:** Public
- **Response (200):** Product document
- **Response (404):** `{"detail": "Product 'unknown-slug' not found"}`

---

### 2.5 Customer Authentication & Password Reset
#### Send OTP
- **Path:** `POST /api/v1/auth/send-otp`
- **Body:** `{"identifier": "user@example.com", "purpose": "RESET_PASSWORD"}`
- **Response:** `{"message": "OTP sent successfully to ...", "expires_in_seconds": 300, "dev_otp": "123456"}`

#### Reset Password (New Endpoint)
- **Path:** `POST /api/v1/auth/reset-password`
- **Auth:** Public (Rate-limited to 5 requests per 5 minutes per identifier)
- **Body:**
```json
{
  "identifier": "user@example.com",
  "otp": "123456",
  "new_password": "NewSecurePassword123"
}
```
- **Response (200):** `{"message": "Password reset successfully. Please login with your new password."}`
- **Response (400):** `{"detail": "Invalid or expired OTP code"}`
- **Response (404):** `{"detail": "No account found with this identifier"}`

---

### 2.6 Customer Profile Update
- **Path:** `PATCH /api/v1/users/me`
- **Auth:** Customer Bearer Token
- **Body:**
```json
{
  "full_name": "Vikram Singh",
  "email": "vikram.singh@example.com"
}
```
- **Response (200):** Updated user profile object

---

### 2.7 Coupon Validation
- **Path:** `POST /api/v1/coupons/validate`
- **Auth:** Customer Bearer Token or Public
- **Body:**
```json
{
  "code": "CHAMP10",
  "items": [
    {
      "product_id": "6adc780c0070e2739bfdd101",
      "category": "GEARS",
      "price_paise": 499900,
      "qty": 1
    }
  ],
  "subtotal_paise": 499900
}
```
- **Response (200):**
```json
{
  "valid": true,
  "code": "CHAMP10",
  "discount_paise": 49990,
  "discount_type": "PERCENTAGE",
  "savings_text": "10% off entire order"
}
```

---

### 2.8 Order Creation & Razorpay Verification
#### Order Creation
- **Path:** `POST /api/v1/orders`
- **Auth:** Customer Bearer Token
- **Headers:** `X-Idempotency-Key: idem_12345`
- **Body:**
```json
{
  "items": [
    {
      "product_id": "6adc780c0070e2739bfdd101",
      "qty": 1
    }
  ],
  "delivery_address": {
    "full_name": "Vikram Singh",
    "phone": "9876543210",
    "street_address": "Flat 202, Sports City",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pin_code": "560001"
  },
  "coupon_code": "CHAMP10"
}
```
- **Response (201):**
```json
{
  "order_number": "ORD-20261026-9281",
  "subtotal_paise": 499900,
  "discount_paise": 49990,
  "delivery_charge_paise": 0,
  "tax_paise": 0,
  "final_payable_paise": 449910,
  "status": "PENDING_PAYMENT",
  "created_at": "2026-10-26T07:15:00Z"
}
```

#### Razorpay Payment Order Creation
- **Path:** `POST /api/v1/payments/create-order`
- **Auth:** Customer Bearer Token
- **Body:** `{"order_number": "ORD-20261026-9281"}`
- **Response:**
```json
{
  "razorpay_order_id": "order_Rp10294819",
  "amount_paise": 449910,
  "currency": "INR",
  "key_id": "rzp_test_mock_key"
}
```

#### Razorpay Signature Verification
- **Path:** `POST /api/v1/payments/verify`
- **Auth:** Customer Bearer Token
- **Body:**
```json
{
  "order_number": "ORD-20261026-9281",
  "razorpay_order_id": "order_Rp10294819",
  "razorpay_payment_id": "pay_Rp10294819_mock",
  "razorpay_signature": "hmac_sha256_hex_digest"
}
```
- **Response (200):**
```json
{
  "status": "PAID",
  "order_number": "ORD-20261026-9281",
  "message": "Payment verified and order confirmed successfully"
}
```

---

### 2.9 Order Cancellation & Returns
- **Path:** `POST /api/v1/orders/{order_number}/cancel`
  - **Body:** `{"reason": "Changed my mind"}`
  - **Response (200):** `{"status": "CANCELLED", "refund_status": "CREDITED_TO_WALLET"}`
- **Path:** `POST /api/v1/orders/{order_number}/return`
  - **Body:** `{"reason": "Size fit issue", "items": [{"product_id": "...", "qty": 1}]}`
  - **Response (200):** `{"status": "RETURN_REQUESTED"}`
