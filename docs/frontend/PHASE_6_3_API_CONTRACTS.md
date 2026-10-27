# BIGCHAMP — Phase 6.3: API Contracts & Integration Guide

## 1. Overview

This document specifies the exact API contracts implemented in Phase 6.3 under `/api/v1`. All endpoints enforce standard error handling, role-based access control, payload validation, and MongoDB persistence.

---

## 2. Media Studio APIs (`/media`)

### 2.1 List Media Assets
- **Method**: `GET /api/v1/media`
- **Auth**: Admin (`Bearer <token>`)
- **Query Parameters**:
  - `include_archived` (bool, default: false)
  - `media_type` (str, optional: `image` | `video`)
  - `category` (str, optional)
- **Response**: `200 OK` Array of `MediaAssetResponse` objects.

### 2.2 Upload Media Asset
- **Method**: `POST /api/v1/media/upload`
- **Auth**: Admin (`Bearer <token>`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Binary file (image <= 10MB or video <= 50MB)
  - `display_name`: String (Required)
  - `category`: String (Default: `CAMPAIGN`)
  - `tags`: String (comma-separated, optional)
  - `alt_text`: String (Required for accessibility)
  - `description`: String (Optional)
- **Response**: `201 Created` with created `MediaAssetResponse`.
- **Errors**:
  - `400 Bad Request`: File exceeds limit or signature mismatch.
  - `401 Unauthorized`: Missing or invalid admin token.

### 2.3 Inspect Media Usage
- **Method**: `GET /api/v1/media/{media_id}/usage`
- **Auth**: Admin (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "media_id": "med_vid_hero_01",
  "is_in_use": true,
  "total_references": 1,
  "storefront_sections": [
    { "section_id": "sec_hero_01", "title": "Hero Campaign", "type": "hero_campaign" }
  ],
  "products": []
}
```

### 2.4 Replace Media File
- **Method**: `POST /api/v1/media/{media_id}/replace`
- **Auth**: Admin (`Bearer <token>`)
- **Content-Type**: `multipart/form-data`
- **Response**: `200 OK` with updated asset keeping existing `media_id`.

### 2.5 Safe Delete Media Asset
- **Method**: `DELETE /api/v1/media/{media_id}`
- **Auth**: Admin (`Bearer <token>`)
- **Response**: `200 OK` `{ "deleted": true, "media_id": "..." }`
- **Errors**:
  - `409 Conflict`: Asset is currently referenced by active storefront sections or products.
  - `404 Not Found`: Media ID does not exist.

---

## 3. Storefront Merchandising APIs (`/storefront`)

### 3.1 Get Published Storefront Sections (Public)
- **Method**: `GET /api/v1/storefront/sections`
- **Auth**: None (Public)
- **Response**: `200 OK` Array of active `StorefrontSectionResponse` sorted by `display_order`.

### 3.2 List All Sections (Admin)
- **Method**: `GET /api/v1/admin/storefront/sections`
- **Auth**: Admin (`Bearer <token>`)
- **Response**: `200 OK` Array of all sections including drafts.

### 3.3 Create Section
- **Method**: `POST /api/v1/admin/storefront/sections`
- **Auth**: Admin (`Bearer <token>`)
- **Body**: `StorefrontSectionCreateRequest`
- **Response**: `201 Created`

### 3.4 Update Section
- **Method**: `PUT /api/v1/admin/storefront/sections/{section_id}`
- **Auth**: Admin (`Bearer <token>`)
- **Body**: `StorefrontSectionUpdateRequest`
- **Response**: `200 OK`

### 3.5 Batch Reorder Sections
- **Method**: `PUT /api/v1/admin/storefront/sections/reorder`
- **Auth**: Admin (`Bearer <token>`)
- **Body**: Array of `{ "section_id": "string", "display_order": integer }`
- **Response**: `200 OK` `{ "reordered": true, "count": N }`

### 3.6 Reset Default Layout
- **Method**: `POST /api/v1/admin/storefront/sections/seed-defaults`
- **Auth**: Admin (`Bearer <token>`)
- **Response**: `200 OK` Restores 8 standard Phase 6.3 sections.

---

## 4. Smart Promotions & Popups APIs (`/promotions`)

### 4.1 Get Active Smart Popup (Public)
- **Method**: `GET /api/v1/promotions/popup/active`
- **Auth**: None (Public)
- **Query Parameters**:
  - `route` (str, default: `/`)
  - `last_seen_id` (str, optional for fair rotation)
- **Response**: `200 OK` Single eligible `PromotionalPopup` or `null`.

### 4.2 Aggregated Offers Hub (Public)
- **Method**: `GET /api/v1/promotions/offers`
- **Auth**: None (Public)
- **Response**: `200 OK`
```json
{
  "coupons": [
    {
      "code": "CHAMPION15",
      "discount_percent": 15,
      "max_discount_paise": 50000,
      "min_order_value_paise": 10000,
      "description": "Festive Champion 15% Off discount on orders above ₹100"
    }
  ],
  "membership": {
    "title": "BIGCHAMP Annual Passholder Privilege",
    "fee_paise": 10000,
    "validity_days": 334,
    "cashback_percent": 10.0,
    "member_discount_percent": 15.0,
    "link": "/membership"
  },
  "cookey": {
    "title": "Cookey Weekly Draw Pass",
    "price_paise": 10000,
    "limit_per_week": 1,
    "link": "/cookey"
  },
  "defense": {
    "title": "Armed Forces & Veterans Privilege",
    "discount_percent": 10.0,
    "description": "Extra 10% discount on all certified athletic gear for verified defense personnel.",
    "link": "/army-offer"
  },
  "shipping": {
    "free_threshold_paise": 50000,
    "standard_delivery_paise": 4000
  }
}
```

### 4.3 Manage Popups (Admin)
- `GET /api/v1/admin/promotions/popups`
- `POST /api/v1/admin/promotions/popups`
- `PUT /api/v1/admin/promotions/popups/{popup_id}`
- `DELETE /api/v1/admin/promotions/popups/{popup_id}`
