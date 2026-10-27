# BIGCHAMP Phase 7.0 — Homepage Merchandising Cleanup & Route Integrity Report

**Date:** October 26, 2026  
**Auditor:** Principal UX Architect & Full-Stack QA Lead  
**Scope:** Elimination of default promotional clutter from homepage narrative while preserving dedicated feature routes and checkout incentives.

---

## 1. Problem Statement & Root Cause

In prior versions, the customer homepage suffered from excessive promotional cards:
1. **Passholder / Membership Promotion Injections:** Unconditional digital card upsell banners ("Cookey Pass", "Armed Forces Discount", "Digital Member Card ₹100") were injected directly beneath the hero or within promotional strips.
2. **Repetitive Discount Blocks:** Multiple discount widgets repeated identical percentage claims, distracting shoppers from sports equipment discovery.
3. **Seed Script Re-Pollution:** Default seed scripts in `backend/app/seed/seed_storefront.py` re-inserted promotional sections into `db.storefront_sections` on application bootstrap.

---

## 2. Durable Architectural Resolution

### 2.1 Database & Seed Sanitization:
- `backend/app/seed/seed_storefront.py` was refactored to seed only the 8 core merchandising sections (`hero_campaign`, `collections_strip`, `curated_products`, `editorial_showcase`, `seasonal_sale_banner`, `athlete_testimonials`, `community_feed`, `trust_pillars`).
- All unwanted promotional sections (`membership_upsell`, `passholder_banner`, `cookie_deal`) were purged from `db.storefront_sections` and omitted from default seed arrays.

### 2.2 Dedicated Route Preservation:
To ensure no business features were destroyed:
- **Dedicated Membership Hub:** Completely intact at `/membership` with full Digital Card onboarding, QR code issuance, and benefits explanation.
- **Cookey Exclusive Portal:** Fully operational at `/cookey` with real weekly countdown cooldown verification from `db.orders`.
- **Special Armed Forces Offer Page:** Active at `/offers/armed-forces` with verified eligibility rules.
- **Dedicated Offers Hub:** Active at `/offers` displaying active store coupons and volume discounts.
- **Checkout Contextual Promotions:** When a registered user or passholder reaches checkout (`/checkout`), eligible member discounts and coupon codes are applied seamlessly by backend calculation.

---

## 3. Real Browser Verification of Absence

Headless Edge browser inspection of `http://localhost/` confirmed:
- `hasPassholderClutter: false`
- No promotional popups or forced membership overlays appear on homepage load.
- Customer shopping journey remains 100% focused on product discovery, category exploration, and match gear.
