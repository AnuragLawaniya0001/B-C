# BIGCHAMP — Phase 6.3: Media Studio Architecture & Storage Infrastructure

## 1. Architectural Overview

The **Media Studio** is the centralized, admin-controlled media management subsystem in the BIGCHAMP e-commerce platform. It enables administrators to upload, inspect, tag, preview, replace, archive, and safely manage high-performance campaign imagery, product photography, and 720p/1080p MP4 videos.

### Key Objectives
1. **Centralized Asset Management**: Single source of truth for all customer-facing media (`db.media_assets`).
2. **Authoritative Media Records**: Media assets are referenced by stable IDs (`media_id`) or clean static URLs rather than fragile hardcoded JSX imports.
3. **Storage Abstraction Layer**: Pluggable storage architecture (`StorageService`) operating locally within Docker volume persistence (`backend/uploads/media/`) with clean interfaces for future S3/MinIO cloud object storage.
4. **Comprehensive Security & Integrity**: Magic-byte signature verification, file-size enforcement, path traversal defense, and admin-only authorization.
5. **Usage Tracking & Referential Integrity**: Protection against breaking customer journeys by preventing the deletion of assets in active storefront usage.

---

## 2. Media Asset Data Model

Every media asset registered through the Media Studio conforms to the following schema in MongoDB (`db.media_assets`):

| Field | Type | Description |
|---|---|---|
| `media_id` | String | Unique, stable identifier (e.g. `med_vid_hero_01`, `med_a1b2c3d4e5f6`) |
| `original_filename` | String | Sanitized original filename supplied upon upload |
| `display_name` | String | Human-readable title used by administrators in the studio |
| `media_type` | Enum (`image`, `video`) | High-level media category |
| `mime_type` | String | Validated MIME type (e.g. `video/mp4`, `image/webp`, `image/jpeg`) |
| `file_size` | Integer | Exact file size in bytes |
| `url` | String | Accessible static URL (e.g. `/uploads/media/videos/hero_campaign_track.mp4`) |
| `poster_url` | String (Optional) | Fallback poster image for video playback or lazy loading |
| `thumbnail_url` | String (Optional) | Square or 16:9 thumbnail for media grid preview |
| `width` | Integer (Optional) | Detected pixel width (e.g. 1280) |
| `height` | Integer (Optional) | Detected pixel height (e.g. 720) |
| `duration_seconds` | Float (Optional) | Exact video duration in seconds (e.g. 4.0) |
| `alt_text` | String | Required accessibility and SEO alt description |
| `caption` | String (Optional) | Editorial caption or descriptive text |
| `tags` | Array[String] | Classification tags (e.g. `["hero", "video", "running", "720p"]`) |
| `category` | String | Functional category (`CAMPAIGN`, `PRODUCT`, `COLLECTION`, `EDITORIAL`) |
| `is_archived` | Boolean | Archive flag (hides from default selection without breaking existing links) |
| `status` | String | Publication status (`published`, `draft`, `archived`) |
| `created_at` | DateTime (UTC) | Timestamp of upload |
| `updated_at` | DateTime (UTC) | Timestamp of last metadata or file replacement |

---

## 3. Storage Abstraction Layer (`StorageService`)

Located in `backend/app/services/storage_service.py`, `StorageService` encapsulates all filesystem and metadata inspection routines:

### 3.1 Directory Organization
```
backend/uploads/
└── media/
    ├── images/       # High-res WebP, PNG, JPEG campaign assets
    ├── videos/       # 720p/1080p MP4 and WebM video files
    └── thumbnails/   # Generated or uploaded thumbnail previews
```

### 3.2 File Validation Rules
- **Maximum File Sizes**:
  - Images: **10 MB** (`MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024`)
  - Videos: **50 MB** (`MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024`)
- **Allowed Image MIME Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`.
- **Allowed Video MIME Types**: `video/mp4`, `video/webm`, `video/quicktime`.

### 3.3 Server-Side Magic-Byte Signature Verification
To prevent malicious executable files disguised with fake extensions, `verify_file_signature()` verifies initial bytes:
- **JPEG**: Starts with `\xff\xd8\xff`
- **PNG**: Starts with `\x89PNG\r\n\x1a\n`
- **WEBP**: First 4 bytes `RIFF` and bytes 8-12 `WEBP`
- **GIF**: Starts with `GIF87a` or `GIF89a`
- **MP4 / MOV**: Contains `ftyp` box in first 32 bytes or `moov` atom in first 64 bytes
- **WEBM**: Starts with EBML identifier `\x1a\x45\xdf\xa3`
- **SVG**: Sample contains `<svg` markup; rejects binary executables

### 3.4 Dimension & Video Duration Extraction
- **Images**: Extracted via Pillow (`PIL.Image`) width and height properties.
- **Videos**: Extracted via OpenCV (`cv2.VideoCapture`) width, height, fps, frame count, and duration.
- **Graceful Fallback**: If either library is unavailable or processing fails, upload succeeds without dimensions rather than crashing the API.

---

## 4. Usage Inspection & Deletion Protection

To guarantee that customer-facing pages never experience broken images or missing video players:
1. **Inspection Routine (`GET /api/v1/media/{media_id}/usage`)**:
   - Queries `db.storefront_sections` to check if `media_url` or `poster_url` matches the asset.
   - Queries `db.products` to check if `image_url` or `gallery_images` contains the asset URL.
   - Queries `db.promotional_popups` to check if `media_url` references the asset.
   - Returns `{ "is_in_use": true, "total_references": N, "storefront_sections": [...], "products": [...] }`.
2. **Deletion Protection (`DELETE /api/v1/media/{media_id}`)**:
   - If `is_in_use` is `True`, returns **HTTP 409 Conflict** with an informative error message explaining where the asset is used.
   - Prevents accidental deletion of live media assets.
   - Provides safe alternatives: **Archive Asset** (`POST /api/v1/media/{media_id}/archive`) or **Replace Asset** (`POST /api/v1/media/{media_id}/replace`).

---

## 5. Admin Panel Interface (`/media-library`)

The Media Studio UI (`admin/src/pages/MediaStudioPage.jsx`) provides:
- **KPI Summary Cards**: Total assets count, total storage consumption (MB), campaign videos count, high-res images count.
- **Search & Filters**: Search across display names, original filenames, and tags; filter by media type (All / Images / Videos); switch between Grid view and Table list view.
- **Upload Modal**: File drag-and-drop with client-side preview, display title, category selector, accessibility alt text, and tags.
- **Asset Details & Preview Modal**:
  - Interactive HTML5 video player with controls or high-res zoomable image.
  - Quick "Copy URL" button and external tab launcher.
  - Technical specs panel (media_id, MIME type, dimensions, duration, file size).
  - Live Storefront Usage inspector showing active references.
  - Metadata editing for SEO and accessibility.
  - Safe replacement file uploader preserving the existing media ID and URLs.
  - Safe delete button (disabled with tooltip if currently in active usage).
