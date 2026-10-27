import os
import sys
from datetime import datetime, timezone
import pymongo
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

def get_image_info(filepath):
    try:
        sz = os.path.getsize(filepath)
        with Image.open(filepath) as img:
            return img.width, img.height, sz, f"image/{img.format.lower() if img.format else 'jpeg'}"
    except Exception:
        sz = os.path.getsize(filepath) if os.path.exists(filepath) else 0
        return None, None, sz, "image/jpeg"

def run_migration():
    client = pymongo.MongoClient('mongodb://localhost:27017')
    db = client['bigchamp']
    now = datetime.now(timezone.utc)

    print("==================================================================")
    print("BIGCHAMP Phase 6.4: Storefront Asset Discovery & Media Registration")
    print("==================================================================")

    registered_count = 0
    updated_count = 0
    skipped_count = 0

    # 1. CATALOG PRODUCTS IMAGES (backend/uploads/products)
    print("\n--- 1. Migrating Product Catalog Images ---")
    products = list(db.products.find({}))
    prod_img_map = {}
    for p in products:
        imgs = p.get('images') or []
        for img in imgs:
            fname = os.path.basename(img)
            prod_img_map[fname] = p

    prod_dir = os.path.abspath('backend/uploads/products')
    if os.path.exists(prod_dir):
        for f in os.listdir(prod_dir):
            if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                continue
            filepath = os.path.join(prod_dir, f)
            w, h, sz, mime = get_image_info(filepath)
            
            p_ref = prod_img_map.get(f)
            p_name = p_ref.get('name') if p_ref else f"Catalog Gear ({f})"
            p_cat = p_ref.get('category') if p_ref else "PRODUCT"
            p_id = str(p_ref.get('_id')) if p_ref else None

            media_id = f"med_prod_{f.split('.')[0].replace('prod_', '')}"
            media_url = f"/uploads/products/{f}"

            doc = {
                "media_id": media_id,
                "original_filename": f,
                "display_name": p_name,
                "media_type": "image",
                "mime_type": mime,
                "file_size": sz,
                "url": media_url,
                "thumbnail_url": media_url,
                "width": w,
                "height": h,
                "alt_text": f"Authentic match-grade {p_name} for sports training",
                "category": "PRODUCT",
                "tags": ["product", p_cat.lower(), "catalog"],
                "status": "published",
                "is_archived": False,
                "created_at": now,
                "updated_at": now,
            }

            existing = db.media_assets.find_one({"$or": [{"media_id": media_id}, {"url": media_url}]})
            if existing:
                db.media_assets.update_one({"_id": existing["_id"]}, {"$set": doc})
                updated_count += 1
                print(f"Updated media: {media_id} -> {p_name}")
            else:
                db.media_assets.insert_one(doc)
                registered_count += 1
                print(f"Registered media: {media_id} -> {p_name}")

    # 2. COLLECTIONS, EDITORIAL & HERO IMAGES (frontend/public/images)
    print("\n--- 2. Migrating Brand Collections & Editorial Imagery ---")
    static_categories = [
        ("collections", "COLLECTION", ["collection", "category", "store"]),
        ("editorial", "EDITORIAL", ["editorial", "story", "athletes"]),
        ("community", "COMMUNITY", ["community", "athletes", "feed"]),
        ("hero", "CAMPAIGN", ["hero", "brand", "campaign"]),
        ("campaigns", "CAMPAIGN", ["sale", "festival", "campaign"]),
    ]

    for subfolder, cat_label, tags in static_categories:
        dir_path = os.path.abspath(f"frontend/public/images/{subfolder}")
        if not os.path.exists(dir_path):
            continue
        for f in os.listdir(dir_path):
            if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                continue
            filepath = os.path.join(dir_path, f)
            w, h, sz, mime = get_image_info(filepath)
            
            base_clean = f.split('.')[0].replace('_', ' ').replace('-', ' ').title()
            media_id = f"med_static_{subfolder}_{f.split('.')[0]}"
            media_url = f"/images/{subfolder}/{f}"

            doc = {
                "media_id": media_id,
                "original_filename": f,
                "display_name": f"{base_clean} ({cat_label})",
                "media_type": "image",
                "mime_type": mime,
                "file_size": sz,
                "url": media_url,
                "thumbnail_url": media_url,
                "width": w,
                "height": h,
                "alt_text": f"BIGCHAMP {base_clean} - Premier athletic performance photography",
                "category": cat_label,
                "tags": tags + [subfolder],
                "status": "published",
                "is_archived": False,
                "created_at": now,
                "updated_at": now,
            }

            existing = db.media_assets.find_one({"$or": [{"media_id": media_id}, {"url": media_url}]})
            if existing:
                db.media_assets.update_one({"_id": existing["_id"]}, {"$set": doc})
                updated_count += 1
                print(f"Updated static media: {media_id} -> {doc['display_name']}")
            else:
                db.media_assets.insert_one(doc)
                registered_count += 1
                print(f"Registered static media: {media_id} -> {doc['display_name']}")

    # 3. CAMPAIGN VIDEOS (backend/uploads/media/videos)
    print("\n--- 3. Migrating Video Campaign Assets ---")
    vid_dir = os.path.abspath("backend/uploads/media/videos")
    if os.path.exists(vid_dir):
        for f in os.listdir(vid_dir):
            if not f.lower().endswith(('.mp4', '.webm')):
                continue
            filepath = os.path.join(vid_dir, f)
            sz = os.path.getsize(filepath)
            clean_name = f.split('.')[0].replace('_', ' ').title()
            media_id = f"med_vid_{f.split('.')[0]}"
            media_url = f"/uploads/media/videos/{f}"
            poster_url = "/images/hero/hero_main.jpg" if "hero" in f else "/images/campaigns/sale_banner.jpg"

            doc = {
                "media_id": media_id,
                "original_filename": f,
                "display_name": f"{clean_name} (H.264 HD Video)",
                "media_type": "video",
                "mime_type": "video/mp4",
                "file_size": sz,
                "url": media_url,
                "poster_url": poster_url,
                "thumbnail_url": poster_url,
                "width": 1280,
                "height": 720,
                "duration_seconds": 4.0,
                "alt_text": f"Cinematic video campaign: {clean_name}",
                "category": "CAMPAIGN",
                "tags": ["video", "campaign", "720p", "h264"],
                "status": "published",
                "is_archived": False,
                "created_at": now,
                "updated_at": now,
            }

            existing = db.media_assets.find_one({"$or": [{"media_id": media_id}, {"url": media_url}]})
            if existing:
                db.media_assets.update_one({"_id": existing["_id"]}, {"$set": doc})
                updated_count += 1
                print(f"Updated video media: {media_id} -> {doc['display_name']}")
            else:
                db.media_assets.insert_one(doc)
                registered_count += 1
                print(f"Registered video media: {media_id} -> {doc['display_name']}")

    total_media = db.media_assets.count_documents({})
    print("\n==================================================================")
    print(f"MIGRATION SUMMARY: {registered_count} newly registered, {updated_count} updated.")
    print(f"TOTAL REGISTERED ASSETS IN MEDIA STUDIO: {total_media}")
    print("==================================================================")

if __name__ == '__main__':
    run_migration()
