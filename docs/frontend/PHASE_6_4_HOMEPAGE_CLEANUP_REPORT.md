# BIGCHAMP — Phase 6.4 Homepage Merchandising & Clutter Removal Report

## 1. Forensic Root Cause Analysis: Why Promotional Clutter Persisted

Despite Phase 6.3 attempting to remove promotional clutter from the main homepage, inspection revealed two persistent sources:

1. **Embedded Card Grid Inside `HeroCampaign.jsx`:**
   - Lines 193–235 of `frontend/src/components/home/HeroCampaign.jsx` contained hardcoded promotional cards:
     - "Annual Passholder Privilege"
     - "BIGCHAMP Club Access"
     - "Extra 10% discount for Armed Forces"
     - "Weekly ₹100 Cookey token redemptions"
   - Although `PrivilegeStrip.jsx` was unmounted, this right-hand column in `HeroCampaign.jsx` continued to inject distracting cards directly into the hero section!
2. **Database Section Seeding Duplicates:**
   - Previous seeding runs had created orphaned test records with null keys that occasionally re-enabled promotional banners.

---

## 2. Engineering Remediation

### 2.1 Clean Athletic Merchandising Hero
Refactored `frontend/src/components/home/HeroCampaign.jsx`:
- Removed all hardcoded Passholder, Cookey, and Armed Forces promotional cards.
- Replaced with a **Certified Match Gear Showcase** spotlighting tournament-grade equipment:
  - Precision-balanced English willow bats & tested leather balls.
  - Insured shipping on orders above ₹500.
  - 7-day easy size exchange guarantee.
  - Primary CTA directly routing users to `/store` (Explore Pro Catalogue).

### 2.2 Preserved Functional Entry Points
Removing clutter from the homepage did not remove business features. All programs remain accessible through authoritative dedicated routes:
- **Offers Hub:** `/offers` (featured coupons, member cashbacks, defense honors)
- **Digital Pass & Membership:** `/membership`
- **Cookey Tokens:** `/cookey`
- **Armed Forces Privilege:** `/army-offer`
- **Header & Mobile Navigation:** Clean navigation links pointing to respective hubs.
- **Contextual Cart & Checkout:** Legitimate backend coupons (`CHAMPION15`) verified and applied during checkout.

### 2.3 Database Section Cleanup & Safe Seeding
- Executed `scripts/reconcile_phase6_4_sections.py` to ensure legacy section types (`privilege_strip`, `membership_promo`, `cookey_banner`, `army_offer_card`) are archived and disabled.
- Standardized default seeding in `backend/app/api/v1/storefront.py` to seed only the 8 shopping-focused sections.

---

## 3. Evidence of Uncluttered Homepage

CDP browser inspection (`test_phase6_4_media_audit_video.py`) evaluated `document.body.innerText` across the entire homepage:
- `hasPassholderClutter: false`
- `hasCookeyClutter: false`
- `hasArmyClutter: false`

The live homepage desktop and mobile screenshots confirm an art-directed athletic shopping experience focused entirely on merchandise, sports disciplines, tournament equipment, athlete stories, and customer trust.
