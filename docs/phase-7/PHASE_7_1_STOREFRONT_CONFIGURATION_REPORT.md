# BIGCHAMP — Phase 7.1 Storefront Builder Admin Configuration Report

## 1. Overview
The Storefront Builder backend (`/api/v1/storefront/sections` and `/api/v1/storefront/sections/{section_id}`) manages dynamic layout rendering, media assignment, and section toggling for the public customer-facing frontend.
In accordance with Rule 7 ("Do not hardcode generated asset paths... in React components when the existing backend and admin configuration can manage them"), all storefront sections now dynamically query their respective database configurations.

---

## 2. Active Section Configuration Breakdown

### 1. `hero_campaign`
- **Section Type:** `hero_campaign`
- **Status:** Active (`is_active: true`)
- **Configured Media URL:** `https://res.cloudinary.com/ibq3zgu8/video/upload/v1793042294/bigchamp/media/videos/med_23bf8cda23e8.mp4`
- **Configured Poster URL:** `https://res.cloudinary.com/ibq3zgu8/image/upload/v1793035378/bigchamp/media/images/med_37b131e2b86c.jpg`
- **Frontend Component:** `HeroCampaign.jsx`
- **Dynamic Data Binding:** Reads `sectionConfig.media_url` for `<video src="...">` and `sectionConfig.poster_url` for poster fallback.

### 2. `collections_strip`
- **Section Type:** `collections_strip`
- **Status:** Active (`is_active: true`)
- **Items Configured (4):**
  - Item 0: GEARS -> `image_url: .../med_static_collections_gears.jpg`, badge: "Pro Equipment"
  - Item 1: APPAREL -> `image_url: .../med_static_collections_apparel.jpg`, badge: "Active Wear"
  - Item 2: FITNESS -> `image_url: .../med_static_collections_fitness.jpg`, badge: "Iron & Mobility"
  - Item 3: EXCLUSIVE -> `image_url: .../med_static_collections_exclusive.jpg`, badge: "VIP Members"
- **Frontend Component:** `CategoryPillsStrip.jsx`
- **Dynamic Data Binding:** Maps over `sectionConfig.items` and displays category badges, titles, and links.

### 3. `curated_products`
- **Section Type:** `curated_products`
- **Status:** Active (`is_active: true`)
- **Configured Banner URL:** `https://res.cloudinary.com/ibq3zgu8/image/upload/v1793035378/bigchamp/media/images/med_37b131e2b86c.jpg`
- **Frontend Component:** `CuratedProducts.jsx`
- **Dynamic Data Binding:** Renders curated product cards filtered by category tabs (All, Gears, Apparel, Fitness, Exclusive).

### 4. `editorial_showcase`
- **Section Type:** `editorial_showcase`
- **Status:** Active (`is_active: true`)
- **Items Configured (3):**
  - Story 1: "Match-Day Excellence" -> `image_url: .../med_static_editorial_story_cricket.jpg`
  - Story 2: "Wear Your Ambition" -> `image_url: .../med_static_editorial_story_speed.jpg`
  - Story 3: "Athletic Wellness" -> `image_url: .../med_static_editorial_story_recovery.jpg`
- **Frontend Component:** `EditorialShowcase.jsx`
- **Dynamic Data Binding:** Maps over `sectionConfig.items` directly from the admin configuration.

### 5. `seasonal_sale_banner`
- **Section Type:** `seasonal_sale_banner`
- **Status:** Active (`is_active: true`)
- **Configured Media URL:** `https://res.cloudinary.com/ibq3zgu8/video/upload/v1793031765/bigchamp/media/videos/bigchamp_seasonal_campaign.mp4`
- **Configured Poster URL:** `https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031771/bigchamp/media/images/med_static_campaigns_sale_banner.jpg`
- **Frontend Component:** `SeasonalSaleBanner.jsx`

### 6. `community_feed`
- **Section Type:** `community_feed`
- **Status:** Active (`is_active: true`)
- **Configured Media URL:** `https://res.cloudinary.com/ibq3zgu8/video/upload/v1793042519/bigchamp/media/videos/med_36ac8fc5be6b.mp4`
- **Configured Items:** 6 athlete community photo posts with social handles and gear captions.
- **Frontend Component:** `CommunityPhotoGrid.jsx`

---

## 3. Production Build & Deployment
- Rebuilt frontend with `npm run build` (0 errors, 0 lint warnings).
- Deployed built assets into Nginx static webroot at `/var/www/frontend`.
- Tested and verified live configuration updates via `/api/v1/storefront/sections`.
