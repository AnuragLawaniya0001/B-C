# BIGCHAMP Phase 7.0 — Storefront Builder & Dynamic Merchandising Report

**Date:** October 26, 2026  
**Auditor:** Principal Frontend Architect & CMS Integration Lead  
**Scope:** Storefront Builder administrative controls, section ordering, API dual-mount, database persistence, and zero-rebuild storefront reflection.

---

## 1. Storefront Builder Architecture & API Contracts

Storefront Builder (`/storefront-builder` in admin frontend) allows store managers to control the customer homepage layout dynamically.

### Dual-Mount API Route Resolution:
Previously, the admin frontend requested `/admin/storefront/sections`, while the backend FastAPI router was mounted only at `/storefront/admin/sections`. In Phase 6.4 and Phase 7.0, a unified dual-mount router was configured in `backend/app/api/v1/storefront.py`:
- `GET /api/v1/storefront/admin/sections` & `GET /api/v1/admin/storefront/sections`
- `PUT /api/v1/storefront/admin/sections/{section_key}` & `PUT /api/v1/admin/storefront/sections/{section_key}`
- `PUT /api/v1/storefront/admin/sections/reorder` & `PUT /api/v1/admin/storefront/sections/reorder`
- `GET /api/v1/storefront/public/sections` (Unauthenticated public endpoint consumed by customer storefront)

---

## 2. Dynamic Section Registry in MongoDB (`db.storefront_sections`)

The live database contains 8 verified sections:

| Section Key | Section Type | Order | Active Status | Content & Configuration Summary |
|---|---|---|---|---|
| `hero_campaign` | Hero Video / Image | 10 | Active | Title: "ENGINEERED FOR CHAMPIONS", Subtitle: "Match-grade sports gear and professional athletic equipment", Media: `/uploads/media/video/bigchamp_hero_campaign.mp4` |
| `collections_strip` | Category Strip | 20 | Active | 5 categories: GEARS, APPAREL, EXCLUSIVE, FITNESS, EQUIPMENT |
| `curated_products` | Product Grid | 30 | Active | Title: "Curated Match Gear", Subtitle: "Handpicked by professional coaches and athletes" |
| `editorial_showcase`| Split Banner | 40 | Active | High-performance athletic training gear showcase |
| `seasonal_sale_banner`| Campaign Banner | 50 | Active | Seasonal campaign banner with direct catalog CTA |
| `athlete_testimonials`| Reviews Rail | 60 | Active | Authentic tournament athlete equipment reviews |
| `community_feed` | Social Grid | 70 | Active | Athlete training photos and community equipment in action |
| `trust_pillars` | Value Strip | 80 | Active | 4 Pillars: Match Grade, Express Shipping, 7-Day Exchange, Secure Razorpay |

---

## 3. Dynamic Zero-Rebuild Verification

When an administrator edits section properties (e.g. changing title, toggling visibility, or updating media URL) in Storefront Builder:
1. Changes are immediately saved to MongoDB `db.storefront_sections` via `PUT /api/v1/storefront/admin/sections/{section_key}`.
2. The customer storefront queries `GET /api/v1/storefront/public/sections` on load.
3. Updated content, banners, and media immediately render in the customer browser without requiring a Vite build, Docker rebuild, or server restart.
