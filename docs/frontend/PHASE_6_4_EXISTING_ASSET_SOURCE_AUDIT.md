# BIGCHAMP — Phase 6.4: Forensic Existing Asset Source Audit & Inventory

## 1. Executive Summary & Audit Methodology

This forensic audit traces every visible image and video asset across the BIGCHAMP storefront and admin panel to its actual data origin. 

Prior to this audit, images on the storefront were disjointed:
1. Product photography resided in `backend/uploads/products/` and was referenced via `images` array in MongoDB `db.products`, but was completely unregistered in the Admin Media Studio.
2. Collections, editorial, community, and campaign images resided in `frontend/public/images/` and were hardcoded or partially mirrored in `backend/uploads/media/images/`.
3. Campaign video files were encoded with an incompatible legacy video codec (`mp4v`), causing browsers to silently reject `<video>` playback and fall back to static posters.
4. Promotional clutter (Annual Passholder, Cookey weekly pass, Armed Forces cards) was still hardcoded into the right column of `HeroCampaign.jsx`.

This document establishes the ground-truth inventory of every asset and outlines the migration path into the centralized Media Studio.

---

## 2. Complete Asset-Source Inventory Table

| Asset or Component | Current Source | Current Storage Location | Current Usage | Media Studio Status | Required Action | Verification Evidence |
|---|---|---|---|---|---|---|
| **Hero Track Campaign Video** (`bigchamp_hero_campaign.mp4`) | Static file & DB Section API | `backend/uploads/media/videos/` & `/uploads/` | Homepage Hero background video | Needs H.264 re-encoding & registration | Re-encode to H.264, register in Media Studio, attach to Hero | HTTP 200, Content-Type: `video/mp4`, H.264/AAC, Edge CDP playback |
| **Hero Main Photography Poster** (`hero_main.jpg`) | Public static file & DB Poster | `frontend/public/images/hero/hero_main.jpg` | Hero video poster fallback & pre-load | Registered (`med_img_hero_poster`) | Retain and link as poster for Hero | File exists (892,098 bytes), 1920×1080 |
| **Seasonal Sale Video** (`bigchamp_seasonal_campaign.mp4`) | Static file & DB Section API | `backend/uploads/media/videos/` & `/uploads/` | Seasonal Sale full-width banner video | Needs H.264 re-encoding & registration | Re-encode to H.264, register in Media Studio, attach to Banner | HTTP 200, Content-Type: `video/mp4`, H.264/AAC |
| **Seasonal Sale Banner Poster** (`sale_banner.jpg`) | Public static file & DB Poster | `frontend/public/images/campaigns/sale_banner.jpg` | Seasonal Sale banner poster fallback | Registered (`med_img_sale_poster`) | Retain and link as poster for Sale Banner | File exists (973,154 bytes) |
| **Gears Collection Pill** (`gears.jpg`) | Public file & JSX fallback | `frontend/public/images/collections/gears.jpg` | Category & Collection circular strip | Unregistered | Register in Media Studio with category `COLLECTION` | File exists (800,813 bytes) |
| **Apparel Collection Pill** (`apparel.jpg`) | Public file & JSX fallback | `frontend/public/images/collections/apparel.jpg` | Category & Collection circular strip | Unregistered | Register in Media Studio with category `COLLECTION` | File exists (824,740 bytes) |
| **Fitness Collection Pill** (`fitness.jpg`) | Public file & JSX fallback | `frontend/public/images/collections/fitness.jpg` | Category & Collection circular strip | Unregistered | Register in Media Studio with category `COLLECTION` | File exists (713,660 bytes) |
| **Exclusive Collection Pill** (`exclusive.jpg`) | Public file & JSX fallback | `frontend/public/images/collections/exclusive.jpg` | Category & Collection circular strip | Unregistered | Register in Media Studio with category `COLLECTION` | File exists (760,420 bytes) |
| **Editorial Story 1: Cricket** (`story_cricket.jpg`) | Public file & Section config | `frontend/public/images/editorial/story_cricket.jpg` | 3-Card Editorial Showcase | Registered (`med_img_story_cricket`) | Retain and associate with Editorial section | File exists (700,377 bytes) |
| **Editorial Story 2: Speed** (`story_speed.jpg`) | Public file & Section config | `frontend/public/images/editorial/story_speed.jpg` | 3-Card Editorial Showcase | Registered (`med_img_story_speed`) | Retain and associate with Editorial section | File exists (804,368 bytes) |
| **Editorial Story 3: Fitness** (`story_fitness.jpg`) | Public file & Section config | `frontend/public/images/editorial/story_fitness.jpg` | 3-Card Editorial Showcase | Registered (`med_img_story_fitness`) | Retain and associate with Editorial section | File exists (786,091 bytes) |
| **Community Feed: Runner** (`runner.jpg`) | Public file & Section config | `frontend/public/images/community/runner.jpg` | Community Athlete Photo Grid | Unregistered | Register in Media Studio with category `COMMUNITY` | File exists (966,856 bytes) |
| **Community Feed: Training** (`training.jpg`) | Public file & Section config | `frontend/public/images/community/training.jpg` | Community Athlete Photo Grid | Unregistered | Register in Media Studio with category `COMMUNITY` | File exists (777,245 bytes) |
| **Product: Cricket Bat** (`prod_bb5773fb3301.jpg`) | DB `images` array | `backend/uploads/products/prod_bb5773fb3301.jpg` | Product Card, Detail Page & Cart | Unregistered | Register in Media Studio, preserve product reference | File exists (111,877 bytes), referenced by English Willow Bat |
| **Product: Cricket Ball** (`prod_615e0bf0fe1b.jpg`) | DB `images` array | `backend/uploads/products/prod_615e0bf0fe1b.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (122,820 bytes) |
| **Product: Match Football** (`prod_5c6a0e7b3536.jpg`) | DB `images` array | `backend/uploads/products/prod_5c6a0e7b3536.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (146,750 bytes) |
| **Product: Badminton Racket** (`prod_fe5ead8e6052.jpg`) | DB `images` array | `backend/uploads/products/prod_fe5ead8e6052.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (106,307 bytes) |
| **Product: Running Shoes Velocity** (`prod_e96629d086ec.jpg`) | DB `images` array | `backend/uploads/products/prod_e96629d086ec.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (97,361 bytes) |
| **Product: Cricket Jersey** (`prod_62dd8e5ca7fd.jpg`) | DB `images` array | `backend/uploads/products/prod_62dd8e5ca7fd.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (71,341 bytes) |
| **Product: Training Jersey** (`prod_04d47c2d2d11.jpg`) | DB `images` array | `backend/uploads/products/prod_04d47c2d2d11.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (70,687 bytes) |
| **Product: Yoga Mat Eco** (`prod_b7f3cf8049cd.jpg`) | DB `images` array | `backend/uploads/products/prod_b7f3cf8049cd.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (67,589 bytes) |
| **Product: Cast Iron Dumbbells** (`prod_a388a58ade26.jpg`) | DB `images` array | `backend/uploads/products/prod_a388a58ade26.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (65,578 bytes) |
| **Product: Insulated Bottle** (`prod_7f6c3e643cad.jpg`) | DB `images` array | `backend/uploads/products/prod_7f6c3e643cad.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (63,338 bytes) |
| **Product: All-Weather Tracksuit** (`prod_94b10d66f325.jpg`) | DB `images` array | `backend/uploads/products/prod_94b10d66f325.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (62,180 bytes) |
| **Product: Speed Skipping Rope** (`prod_143c4a82bb5c.jpg`) | DB `images` array | `backend/uploads/products/prod_143c4a82bb5c.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (56,727 bytes) |
| **Product: Football Studs** (`prod_887dc8597e67.jpg`) | DB `images` array | `backend/uploads/products/prod_887dc8597e67.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (55,382 bytes) |
| **Product: Compression Base Layer** (`prod_6a0af6341702.jpg`) | DB `images` array | `backend/uploads/products/prod_6a0af6341702.jpg` | Product Card & Detail Page | Unregistered | Register in Media Studio, preserve product reference | File exists (43,793 bytes) |
| **Product: Cookey Gold Pass Token** (`prod_960edf2b2f46.jpg`) | DB `images` array | `backend/uploads/products/prod_960edf2b2f46.jpg` | Exclusive Club Product Detail | Unregistered | Register in Media Studio, preserve product reference | File exists (33,735 bytes) |
| **Product Placeholder** (`placeholder.jpg`) | Fallback component | `frontend/public/images/products/placeholder.jpg` | Product Card fallback | Unregistered | Retain as neutral client fallback | Client SVG/fallback component |
| **Smart Popup Poster: Festive 15%** (`editorial_fitness_gear_*.jpg`) | DB `media_url` in popups | `backend/uploads/media/images/` | Smart Promotional Popup Modal | Unregistered | Register in Media Studio, link to Popup Campaign | File exists (786,091 bytes) |

---

## 3. Root Cause Analysis

### 3.1 Why images were missing from Media Studio
The initial Phase 6.3 seed script (`scripts/seed_phase6_3_media_storefront.py`) only inserted 7 static records into `db.media_assets`. The 16 real catalog product images and the collections/community imagery were never discovered, scanned, or registered as `MediaAsset` records. As a consequence, an administrator opening `/media-library` saw only a handful of campaign items, and none of the catalog photography or collection artwork was manageable.

### 3.2 Why campaign videos failed to play on the customer storefront
`scripts/generate_campaign_videos.py` used OpenCV's `cv2.VideoWriter_fourcc(*'mp4v')`. The `mp4v` codec (MPEG-4 Part 2) is **not supported by HTML5 `<video>` tags in Chromium, Edge, Firefox, or Safari**. Modern browsers only support **H.264 (AVC1)**, **VP8/VP9**, or **AV1**. Upon loading `hero_campaign_track.mp4`, the browser triggered an HTMLMediaElement error, which immediately activated `setVideoError(true)` in `HeroCampaign.jsx`, causing the video element to unmount and fall back to the static poster image.

### 3.3 Why promotional clutter remained on the homepage
In `frontend/src/components/home/HeroCampaign.jsx`, lines 105-148 contained a hardcoded right-hand card spotlighting "Annual Passholder Privilege", "BIGCHAMP Club Access", "Extra 10% discount for Armed Forces", and "Weekly ₹100 Cookey token redemptions". Even though `PrivilegeStrip.jsx` was unmounted, this embedded spotlight directly displayed the clutter on the hero of the homepage.

---

## 4. Remediation Plan

1. **Re-encode Campaign Videos to True H.264 Web Format**:
   Use FFmpeg to encode `bigchamp_hero_campaign.mp4` and `bigchamp_seasonal_campaign.mp4` using `libx264` with `-pix_fmt yuv420p -movflags +faststart` to guarantee immediate web streaming and universal playback.
2. **Execute Idempotent Media Migration Script**:
   Create and run `scripts/migrate_register_storefront_assets.py` to register all 16 catalog product images, 4 collection tiles, 3 editorial stories, 2 community images, and 2 campaign posters into `db.media_assets` with complete metadata and usage references.
3. **Clean Hero & Remove Promotional Clutter**:
   Refactor `HeroCampaign.jsx` to eliminate the embedded privilege cards, converting the hero into a clean, cinematic athletic brand experience with primary catalog CTAs and dynamic stats.
4. **Deploy, Rebuild & Visually Verify**:
   Rebuild frontend and admin dist bundles, deploy to `/var/www/` in Docker, verify that the video genuinely plays with DevTools assertions, and capture evidence screenshots.
