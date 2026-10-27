# BIGCHAMP — Phase 6.3: Dynamic Storefront Merchandising & Homepage Builder

## 1. Executive Summary

Phase 6.3 introduces a **fully backend-driven, dynamic homepage merchandising system**. The customer storefront (`frontend/src/pages/public/HomePage.jsx`) no longer hardcodes campaign media, hero titles, promotional card placements, or section ordering. Instead, all homepage components are fetched dynamically from `GET /api/v1/storefront/sections` and rendered strictly in the administrator's configured order.

### Zero-Rebuild Principle
Any administrator change—such as updating a hero headline, swapping an MP4 video, reordering sections, toggling a sale campaign, or altering product curation—reflects immediately on the live storefront **without rebuilding or redeploying the React frontend**.

---

## 2. Storefront Section Architecture

The homepage is composed of modular, validated section types stored in `db.storefront_sections`:

| Section Type | Component | Purpose & Capabilities |
|---|---|---|
| `hero_campaign` | `HeroCampaign` | Full-bleed hero banner supporting 720p/1080p MP4 video playback, poster fallback, accessibility play/pause and mute controls, dynamic headline, and primary CTA. |
| `collections_strip` | `CategoryPillsStrip` | Visual circular collection pills for quick navigation (Cricket, Fitness, Apparel, Accessories). |
| `curated_products` | `CuratedProductTabs` | Tabbed product carousel/grid showcasing real authoritative products from the catalogue. |
| `editorial_showcase` | `EditorialShowcase` | 3-card athletic lifestyle storytelling showcase with high-res editorial photography. |
| `seasonal_sale_banner` | `SeasonalSaleBanner` | Full-width seasonal campaign banner with optional MP4 video background, sale headline, and CTA. |
| `trust_pillars` | `TrustPillarsStrip` | Clean, shopping-focused trust strip (Free Insured Delivery, 100% Authentic Gear, Secure Sandbox Checkout, 7-Day Exchange). |
| `athlete_testimonials` | `AthleteTestimonials` | Verified athlete reviews, ratings, and social proof. |
| `community_feed` | `CommunityPhotoGrid` | Instagram community grid (`#BIGCHAMP`) featuring athlete photography. |

---

## 3. Storefront Section Schema (`db.storefront_sections`)

Each document in `db.storefront_sections` conforms to the following schema:

```json
{
  "section_id": "sec_hero_01",
  "title": "Gear Up Like a Champion.",
  "subtitle": "Discover match-tested sports equipment, certified athletic gear, and member privileges.",
  "section_type": "hero_campaign",
  "media_url": "/uploads/media/videos/hero_campaign_track.mp4",
  "poster_url": "/images/hero/hero_main.jpg",
  "media_type": "video",
  "cta_text": "Shop Store Catalog",
  "cta_link": "/catalogue",
  "is_active": true,
  "display_order": 1,
  "items": [],
  "created_at": "2026-10-26T10:00:00Z",
  "updated_at": "2026-10-26T10:00:00Z"
}
```

---

## 4. Homepage Builder Admin UI (`/storefront-builder`)

Located at route `/storefront-builder` (and `/storefront/homepage`) in `admin/src/pages/StorefrontBuilderPage.jsx`:

### Capabilities
1. **Interactive Section Ordering**:
   - Up and Down reorder buttons for each section.
   - Triggers `PUT /api/v1/admin/storefront/sections/reorder` with batch display orders.
2. **Draft / Published Switch**:
   - One-click toggle between `Active` (visible on storefront) and `Draft` (hidden).
   - Inactive sections are instantly filtered out of the public API response.
3. **Media Quick-Picker Integration**:
   - Seamlessly browse assets from the Media Studio.
   - One-click assignment of primary video/image and poster fallback URLs.
4. **Section Configuration Modal**:
   - Edit internal title, customer heading, and narrative subtitle.
   - Switch between Image and Video media modes.
   - Configure CTA label and destination URL.
5. **Reset to Defaults**:
   - One-click reset restoring the 8 standard Phase 6.3 sections via `POST /api/v1/admin/storefront/sections/seed-defaults`.

---

## 5. Uncluttered Homepage Strategy

Prior to Phase 6.3, the homepage was cluttered with repetitive, full-width promotional cards for Cookey token drawings and Armed Forces discounts directly interrupting the product discovery flow.

### Phase 6.3 Resolution
- **Removed from Homepage Flow**: The prominent repetitive promotional cards have been removed from the main shopping journey.
- **Dedicated Destinations Preserved**:
  - **Offers Hub**: Brand-new `/offers` page dedicated to coupons, passholder perks, Cookey tokens, and military discounts.
  - **Header Navigation**: Added "Offers (15% OFF)" pill link in header and mobile menu.
  - **Shopping Focus**: Homepage remains strictly focused on hero branding, collections, product discovery, editorial storytelling, and trust signals.
