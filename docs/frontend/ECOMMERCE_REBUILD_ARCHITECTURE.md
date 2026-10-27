# BIGCHAMP — Phase 6.1: E-Commerce Storefront Architecture & Migration Plan

## 1. Executive Summary & Objectives

The primary objective of Phase 6.1 is to rebuild the BIGCHAMP customer-facing web application (`frontend/`) from the ground up into a high-performance, product-first e-commerce platform.

This rebuild addresses all architectural defects, UI inconsistencies, hardcoded values, broken flows, and design regressions discovered during the Phase 6.0 audit (`docs/frontend/PUBLIC_WEBSITE_AUDIT.md`), while strictly preserving:
- Existing backend services and MongoDB schemas.
- Ledger-backed wallet and membership rules.
- HMAC-verified Razorpay payment orchestration.
- Existing Admin Panel functionality and database records.

---

## 2. Component Inventory: Retain vs. Replace

### 2.1 Components to Retain (Enhanced & Re-integrated)
| Component / Module | Path | Strategy |
| :--- | :--- | :--- |
| **Authentication Bootstrap** | `frontend/src/components/auth/AuthBootstrap.jsx` | Retain. Ensures token hydration and `/auth/me` sync on application mount. |
| **Auth Store** | `frontend/src/store/authStore.js` | Retain. Core session persistence (access/refresh tokens, user state). Add password reset actions. |
| **Cart Store** | `frontend/src/store/cartStore.js` | Retain. Zustand-persisted customer cart with coupon handling and subtotal calculations. |
| **API Client** | `frontend/src/services/api.js` | Retain. Axios instance with automated Bearer token injection and refresh interceptor. |
| **Domain Services** | `frontend/src/services/*` (`orderService`, `paymentService`, `couponService`, `membershipService`, `walletService`) | Retain. Standardized promise-based interfaces matching backend routes. |
| **UI Primitives** | `Badge.jsx`, `Input.jsx`, `Loader.jsx`, `EmptyState.jsx` | Retain & refine. Fix variant definitions and enhance accessibility. |
| **Route Guards** | `ProtectedRoute.jsx` | Retain. Protects `/dashboard/*` and authenticated customer interactions. |

### 2.2 Components to Replace / Overhaul
| Existing Component | Planned Replacement | Rationale |
| :--- | :--- | :--- |
| **`Header.jsx` & `MobileNav.jsx`** | `StorefrontHeader.jsx` + `StorefrontNavDrawer.jsx` | Old header has a broken language selector, non-functional notification icons, cluttered dashboard pills, and lacks catalog search. |
| **`Footer.jsx`** | `StorefrontFooter.jsx` | Replace dead anchor tags (`#terms`, `#privacy`, `#draw-rules`) with actual legal routes (`/terms`, `/privacy`, `/refund-policy`, `/shipping-policy`), dynamic contact info from `GET /settings/public`, and trust badges. |
| **`PublicLayout.jsx`** | `StorefrontLayout.jsx` | Replace generic layout with an e-commerce-specific layout featuring an announcement bar, header, breadcrumbs, shopping cart drawer, and footer. |
| **`DashboardLayout.jsx`** | `CustomerAccountLayout.jsx` | Decouple customer account pages completely from storefront; add missing `/dashboard/coupons` navigation link; modern account sidebar. |
| **`HomePage.jsx` + Home Sections** | `features/home/*` (Dynamic Hero, Category Carousel, Curated Product Grids, Privileges Strip, Trust Pillars) | Current home is a long marketing page where products appear far below the fold. Replace with a product-discovery-first experience driven by `GET /banners` and `GET /products?featured=true`. |
| **`StorePage.jsx`** | `features/catalogue/CataloguePage.jsx` | Replace static category pills with real-time debounced search, dynamic categories from `GET /categories`, price & recency sorting, responsive product grid, active filter chips, and pagination. |
| **`ProductDetailPage.jsx`** | `features/product-detail/ProductDetailPage.jsx` | Fix layout on mobile, add interactive image gallery, real stock availability indicator, quantity selector, specifications table, and member savings badge. |
| **`Button.jsx`** | `components/ui/Button.jsx` (Fixed) | Fix the missing `accent` variant that broke CTA buttons across the app; add clear focus and loading states. |
| **`ForgotPasswordPage.jsx`** | `features/auth/ForgotPasswordFlow.jsx` | Implement Step 2 (enter OTP + new password) connected to backend password reset endpoint. |
| **`CardPage.jsx`** | `features/customer-account/DigitalCardPage.jsx` | Replace hardcoded mock data ("Rahul Sharma", "BC-82749102") with authenticated user data, real pass status, and dynamic secure QR code. |
| **`ProfilePage.jsx`** | `features/customer-account/ProfilePage.jsx` | Bind input fields to authenticated user profile; wire up `PATCH /users/me` API; eliminate inert submit button. |
| **`OrdersPage.jsx` (Dashboard)** | `features/customer-account/CustomerOrdersPage.jsx` | Replace native `window.prompt` and `window.alert` cancellation flows with accessible modal dialogs and clear status indicators. |
| **Stub Pages** (`CookeyPage`, `ArmyOfferPage`, `DormitoryPage`, `PhysioPage`) | Structured informational & inquiry pages | Replace empty placeholder text with structured commerce/service inquiry forms and real backend configuration. |

---

## 3. Features Requiring Backend or Admin Panel Changes

1. **Password Reset Endpoint (`POST /auth/reset-password`):**
   - **Status:** Backend had `send-otp` with `RESET_PASSWORD` and `verify-otp`, but lacked a dedicated endpoint to update the password using a verified OTP.
   - **Action:** Add `POST /auth/reset-password` to `backend/app/api/v1/auth.py` and `auth_service.py` to securely verify OTP verification status and update `password_hash`.
2. **Dynamic Storefront Settings Exposure:**
   - **Status:** `GET /settings/public` already provides `business_rules`, `membership_settings`, `site_contact`, `social_links`, and `feature_flags`.
   - **Action:** Ensure the storefront initializes these settings into a global store/hook so all hardcoded strings (e.g., ₹100, 334 days, ₹10 cashback, 10% Army discount) are driven by database configuration.
3. **Admin Settings Integration:**
   - **Status:** Admin already has `SettingsPage.jsx` and `BannersPage.jsx`.
   - **Action:** Ensure any changes made in the Admin Panel immediately reflect on the public storefront without requiring a frontend rebuild.

---

## 4. Existing API Contracts (Must Remain Fully Compatible)

The new storefront adheres to existing verified contracts:
- `GET /settings/public` $\rightarrow$ Safe public settings dict.
- `GET /banners?position={pos}` $\rightarrow$ List of active banners.
- `GET /categories` $\rightarrow$ List of active categories.
- `GET /products?search=&category=&featured=&active=true&sort=&skip=&limit=` $\rightarrow$ Filtered product list.
- `GET /products/{slug_or_id}` $\rightarrow$ Single product detail.
- `POST /coupons/validate` $\rightarrow$ Authoritative coupon discount calculation.
- `POST /orders` $\rightarrow$ Backend-authoritative order creation with tax & shipping.
- `POST /payments/create-order` $\rightarrow$ Razorpay sandbox/live order creation.
- `POST /payments/verify` $\rightarrow$ Server-side HMAC-SHA256 signature verification.
- `GET /orders/my` $\rightarrow$ Authenticated customer order history.
- `GET /wallet/me` $\rightarrow$ Authoritative ledger-backed wallet balance and transactions.
- `GET /membership/status` & `GET /membership/card` $\rightarrow$ Active membership status and pass metadata.
- `PATCH /users/me` $\rightarrow$ Customer profile update.
- `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/login`, `POST /auth/register`.

---

## 5. Data Migration & Compatibility Risks

| Risk Area | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Existing Customer Sessions** | Low | Retain existing `token` and `user` keys in `localStorage` under `authStore` so logged-in users are not forcibly logged out. |
| **Cart Persistence** | Low | Retain `cart-storage` Zustand key; revalidate product existence and pricing on checkout. |
| **Legacy Product Routes** | Medium | Maintain route alias `/store/product/:slug` pointing to the canonical `/store/:slug`. |
| **Pricing Invariants** | High | Never trust frontend prices. Cart subtotal in UI is only an estimate; backend recalculates line items, shipping, coupon discounts, and taxes during `POST /orders`. |
| **Sandbox vs. Live Gateways** | Critical | Enforce Razorpay test mode indicators; never hardcode live credentials or simulate payments without backend HMAC verification. |

---

## 6. Target Frontend Directory Architecture

```text
frontend/src/
├── app/
│   ├── App.jsx
│   ├── router.jsx
│   └── route-guards/
│       └── ProtectedRoute.jsx
├── layouts/
│   ├── StorefrontLayout.jsx
│   ├── CustomerAccountLayout.jsx
│   └── AuthLayout.jsx
├── components/
│   ├── ui/
│   │   ├── Button.jsx          (Includes fixed 'accent' variant)
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx           (Replaces native window.prompt/alert)
│   │   ├── EmptyState.jsx
│   │   ├── Loader.jsx
│   │   └── SearchBar.jsx
│   ├── navigation/
│   │   ├── StorefrontHeader.jsx
│   │   ├── StorefrontNavDrawer.jsx
│   │   ├── AccountSidebar.jsx
│   │   └── StorefrontFooter.jsx
│   └── product/
│       ├── ProductCard.jsx
│       └── ProductPrice.jsx
├── features/
│   ├── home/
│   │   ├── HomePage.jsx
│   │   ├── HeroBannerCarousel.jsx
│   │   ├── CategoryPillsBar.jsx
│   │   ├── FeaturedGearGrid.jsx
│   │   ├── MemberPerksBanner.jsx
│   │   └── TrustPillars.jsx
│   ├── catalogue/
│   │   ├── StorePage.jsx
│   │   ├── FilterSidebar.jsx
│   │   └── SortDropdown.jsx
│   ├── product-detail/
│   │   ├── ProductDetailPage.jsx
│   │   ├── ImageGallery.jsx
│   │   └── QuantitySelector.jsx
│   ├── cart/
│   │   ├── CartPage.jsx
│   │   ├── CartItemRow.jsx
│   │   └── CartOrderSummary.jsx
│   ├── checkout/
│   │   ├── CheckoutPage.jsx
│   │   ├── AddressFormStep.jsx
│   │   └── CheckoutSuccessPage.jsx
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── VerifyOtpPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── RegisterSuccessPage.jsx
│   ├── customer-account/
│   │   ├── OverviewPage.jsx
│   │   ├── DigitalCardPage.jsx
│   │   ├── CustomerOrdersPage.jsx
│   │   ├── WalletPage.jsx
│   │   ├── CouponsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── SettingsPage.jsx
│   ├── verticals/
│   │   ├── CookeyPage.jsx
│   │   ├── ArmyOfferPage.jsx
│   │   ├── DormitoryPage.jsx
│   │   └── PhysioPage.jsx
│   └── content/
│       ├── AboutPage.jsx
│       ├── ContactPage.jsx
│       ├── TermsPage.jsx
│       ├── PrivacyPage.jsx
│       ├── RefundPolicyPage.jsx
│       └── ShippingPolicyPage.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── settingsService.js
│   ├── membershipService.js
│   ├── couponService.js
│   ├── orderService.js
│   ├── paymentService.js
│   └── walletService.js
├── store/
│   ├── authStore.js
│   ├── cartStore.js
│   ├── settingsStore.js
│   └── languageStore.js
└── utils/
    ├── formatters.js
    └── constants.js
```

---

## 7. Migration & Rollout Strategy

1. **Step 1: Backend Support Completion:**
   - Add `POST /auth/reset-password` endpoint with unit verification.
2. **Step 2: Design System & Shared Primitives:**
   - Update `Button.jsx` to include the `accent` variant.
   - Create `Modal.jsx`, `SearchBar.jsx`, and accessibility improvements.
3. **Step 3: Layouts & Navigation:**
   - Implement `StorefrontLayout.jsx` with announcement bar, search, dynamic category links, and clean footer with real legal routes.
   - Implement `CustomerAccountLayout.jsx` with dedicated customer sidebar (including Coupons).
4. **Step 4: Dynamic Storefront Configuration Store:**
   - Create `settingsStore.js` and `settingsService.js` to fetch and store `GET /settings/public`.
   - Replace hardcoded business values across the entire codebase.
5. **Step 5: Storefront & Catalogue Implementation:**
   - Build product-first `HomePage.jsx` and rich `StorePage.jsx` (search, sort, filter, paginate).
   - Rebuild `ProductDetailPage.jsx`.
6. **Step 6: Cart & Checkout Polish:**
   - Refactor `CartPage.jsx` and `CheckoutPage.jsx`.
   - Safeguard Razorpay sandbox flow with HMAC signature verification.
7. **Step 7: Customer Account & Authentication Polish:**
   - Complete `/forgot-password` flow end-to-end.
   - Bind `/dashboard/card` and `/dashboard/profile` to real authenticated data and APIs.
   - Replace `window.prompt` in `/dashboard/orders` with `Modal.jsx`.
8. **Step 8: Legal Pages & Verification:**
   - Implement `/terms`, `/privacy`, `/refund-policy`, `/shipping-policy`.
   - Execute production build (`npm run build`) and regression test suites.
