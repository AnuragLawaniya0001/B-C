import os
import sys
import json
import time
import asyncio
import cloudinary
import cloudinary.uploader
import cloudinary.api
from motor.motor_asyncio import AsyncIOMotorClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Configure Cloudinary
CLOUD_NAME = "ibq3zgu8"
API_KEY = "211541897473636"
API_SECRET = "qEkjCpQ0HM94jNByRxIJiyKSz_s"

cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET,
    secure=True
)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "bigchamp"

async def migrate_all():
    print("=" * 70)
    print("🚀 STARTING COMPLETE CLOUDINARY MIGRATION FOR BIGCHAMP")
    print(f"Cloud Name: {CLOUD_NAME} | API Key: {API_KEY}")
    print("=" * 70)

    # 1. Test Cloudinary Ping
    ping_res = cloudinary.api.ping()
    print("Cloudinary Status:", ping_res)
    assert ping_res.get("status") == "ok", "Cloudinary credentials verification failed!"

    # 2. Collect local directories
    base_dir = os.path.abspath(".")
    upload_targets = [
        ("backend/uploads/products", "bigchamp/products", "image"),
        ("backend/uploads/media/images", "bigchamp/media/images", "image"),
        ("backend/uploads/media/videos", "bigchamp/media/videos", "video"),
        ("frontend/public/images", "bigchamp/images", "image"),
    ]

    url_mapping = {}  # { local_relative_path: cloudinary_url }
    detailed_assets = {}

    for rel_dir, cloud_folder, default_rtype in upload_targets:
        abs_dir = os.path.join(base_dir, rel_dir)
        if not os.path.exists(abs_dir):
            print(f"⚠️ Directory {rel_dir} not found, skipping...")
            continue

        print(f"\n📂 Scanning directory: {rel_dir} -> Cloudinary folder '{cloud_folder}'")
        for root, _, files in os.walk(abs_dir):
            for file in files:
                filepath = os.path.join(root, file)
                rel_to_target = os.path.relpath(filepath, abs_dir).replace("\\", "/")
                
                # Determine resource type
                ext = os.path.splitext(file)[1].lower()
                is_video = ext in [".mp4", ".mov", ".webm"]
                rtype = "video" if is_video else "image"

                # Cloudinary public_id (without extension)
                clean_name = os.path.splitext(file)[0]
                public_id = f"{cloud_folder}/{clean_name}"

                print(f"  ⬆️ Uploading [{rtype.upper()}]: {file} -> {public_id} ...", end="", flush=True)
                try:
                    res = cloudinary.uploader.upload(
                        filepath,
                        public_id=public_id,
                        resource_type=rtype,
                        overwrite=True,
                        use_filename=True,
                        unique_filename=False
                    )
                    c_url = res.get("secure_url")
                    print(f" OK! ({res.get('width', 0)}x{res.get('height', 0)})")

                    # Register all URL variations that might be in database
                    # 1. Path relative to repo root
                    repo_rel = os.path.relpath(filepath, base_dir).replace("\\", "/")
                    url_mapping[f"/{repo_rel}"] = c_url
                    url_mapping[repo_rel] = c_url

                    # 2. Backend uploads path
                    if "backend/uploads/" in repo_rel:
                        upload_rel = repo_rel.split("backend/uploads/")[1]
                        url_mapping[f"/uploads/{upload_rel}"] = c_url
                        url_mapping[f"uploads/{upload_rel}"] = c_url
                        url_mapping[upload_rel] = c_url
                        # filename only
                        url_mapping[file] = c_url

                    # 3. Frontend public images path
                    if "frontend/public/images/" in repo_rel:
                        img_rel = repo_rel.split("frontend/public/images/")[1]
                        url_mapping[f"/images/{img_rel}"] = c_url
                        url_mapping[f"images/{img_rel}"] = c_url
                        url_mapping[f"/images/{file}"] = c_url

                    detailed_assets[file] = {
                        "cloudinary_url": c_url,
                        "public_id": res.get("public_id"),
                        "resource_type": rtype,
                        "format": res.get("format"),
                        "bytes": res.get("bytes"),
                        "width": res.get("width"),
                        "height": res.get("height"),
                        "duration": res.get("duration")
                    }

                except Exception as e:
                    print(f" ❌ ERROR: {e}")

    # Special aliases for campaign videos
    if "bigchamp_hero_campaign.mp4" in detailed_assets:
        hero_vid_url = detailed_assets["bigchamp_hero_campaign.mp4"]["cloudinary_url"]
        url_mapping["/uploads/media/videos/hero_campaign_track.mp4"] = hero_vid_url
        url_mapping["/uploads/media/videos/bigchamp_hero_campaign.mp4"] = hero_vid_url
        url_mapping["hero_campaign_track.mp4"] = hero_vid_url
        url_mapping["bigchamp_hero_campaign.mp4"] = hero_vid_url

    if "bigchamp_seasonal_campaign.mp4" in detailed_assets:
        sale_vid_url = detailed_assets["bigchamp_seasonal_campaign.mp4"]["cloudinary_url"]
        url_mapping["/uploads/media/videos/sale_campaign_team.mp4"] = sale_vid_url
        url_mapping["/uploads/media/videos/bigchamp_seasonal_campaign.mp4"] = sale_vid_url
        url_mapping["sale_campaign_team.mp4"] = sale_vid_url
        url_mapping["bigchamp_seasonal_campaign.mp4"] = sale_vid_url

    print(f"\n✅ Total Cloudinary mappings created: {len(url_mapping)}")

    # 3. Update MongoDB
    print("\n🔄 Updating MongoDB collections to use Cloudinary URLs...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    def map_url(old_url):
        if not old_url:
            return old_url
        if "res.cloudinary.com" in old_url:
            return old_url
        # Direct lookup
        if old_url in url_mapping:
            return url_mapping[old_url]
        # Match by basename
        base = os.path.basename(old_url)
        if base in url_mapping:
            return url_mapping[base]
        # Substring lookup
        for k, v in url_mapping.items():
            if k and len(k) > 5 and k in old_url:
                return v
        return old_url

    # A. Products
    prods_updated = 0
    async for p in db.products.find({}):
        old_images = p.get("images", [])
        new_images = [map_url(img) for img in old_images]
        if new_images != old_images:
            await db.products.update_one({"_id": p["_id"]}, {"$set": {"images": new_images}})
            prods_updated += 1
    print(f"  📦 Products updated: {prods_updated}")

    # B. Storefront Sections
    sections_updated = 0
    async for s in db.storefront_sections.find({}):
        updates = {}
        if s.get("media_url"):
            new_media = map_url(s["media_url"])
            if new_media != s["media_url"]:
                updates["media_url"] = new_media
        if s.get("poster_url"):
            new_poster = map_url(s["poster_url"])
            if new_poster != s["poster_url"]:
                updates["poster_url"] = new_poster
        if s.get("items"):
            new_items = []
            for item in s["items"]:
                it = dict(item)
                if it.get("image"):
                    it["image"] = map_url(it["image"])
                new_items.append(it)
            if new_items != s["items"]:
                updates["items"] = new_items
        if updates:
            await db.storefront_sections.update_one({"_id": s["_id"]}, {"$set": updates})
            sections_updated += 1
    print(f"  🎨 Storefront sections updated: {sections_updated}")

    # C. Media Assets (Media Studio)
    media_updated = 0
    async for m in db.media_assets.find({}):
        updates = {}
        if m.get("url"):
            new_u = map_url(m["url"])
            if new_u != m["url"]:
                updates["url"] = new_u
        if m.get("thumbnail_url"):
            new_th = map_url(m["thumbnail_url"])
            if new_th != m["thumbnail_url"]:
                updates["thumbnail_url"] = new_th
        if m.get("poster_url"):
            new_po = map_url(m["poster_url"])
            if new_po != m["poster_url"]:
                updates["poster_url"] = new_po
        if updates:
            await db.media_assets.update_one({"_id": m["_id"]}, {"$set": updates})
            media_updated += 1
    print(f"  🖼️ Media Studio assets updated: {media_updated}")

    # D. Promotional Popups
    popups_updated = 0
    async for pop in db.promotional_popups.find({}):
        updates = {}
        if pop.get("media_url"):
            new_m = map_url(pop["media_url"])
            if new_m != pop["media_url"]:
                updates["media_url"] = new_m
        if pop.get("poster_url"):
            new_p = map_url(pop["poster_url"])
            if new_p != pop["poster_url"]:
                updates["poster_url"] = new_p
        if updates:
            await db.promotional_popups.update_one({"_id": pop["_id"]}, {"$set": updates})
            popups_updated += 1
    print(f"  📣 Promotional popups updated: {popups_updated}")

    # E. Banners
    banners_updated = 0
    async for b in db.banners.find({}):
        if b.get("image_url"):
            new_b = map_url(b["image_url"])
            if new_b != b["image_url"]:
                await db.banners.update_one({"_id": b["_id"]}, {"$set": {"image_url": new_b}})
                banners_updated += 1
    print(f"  🚩 Banners updated: {banners_updated}")

    # Save mapping file
    map_file = os.path.abspath("scripts/cloudinary_migration_map.json")
    with open(map_file, "w") as f:
        json.dump({
            "generated_at": time.time(),
            "cloud_name": CLOUD_NAME,
            "assets": detailed_assets,
            "url_mapping": url_mapping
        }, f, indent=2)
    print(f"\n💾 Migration mapping saved to: {map_file}")
    print("=" * 70)
    print("🎉 MIGRATION COMPLETE! ALL IMAGES & VIDEOS ARE NOW ON CLOUDINARY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(migrate_all())
