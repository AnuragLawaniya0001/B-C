import os
from datetime import datetime, timezone
import pymongo

def main():
    client = pymongo.MongoClient('mongodb://localhost:27017')
    db = client['bigchamp']
    now = datetime.now(timezone.utc)

    # 1. SEED MEDIA ASSETS
    print("--- Seeding Media Assets ---")
    media_items = [
        {
            "media_id": "med_vid_hero_01",
            "original_filename": "hero_campaign_track.mp4",
            "display_name": "Hero Sprinter Track Video (720p)",
            "media_type": "video",
            "mime_type": "video/mp4",
            "file_size": 3063390,
            "url": "/uploads/media/videos/hero_campaign_track.mp4",
            "poster_url": "/images/hero/hero_main.jpg",
            "width": 1280,
            "height": 720,
            "duration_seconds": 4.0,
            "alt_text": "Cinematic video of sprinter on track",
            "tags": ["hero", "campaign", "sprint", "video"],
            "category": "hero",
            "status": "published",
        },
        {
            "media_id": "med_vid_sale_01",
            "original_filename": "sale_campaign_team.mp4",
            "display_name": "Champion Festival Sale Video",
            "media_type": "video",
            "mime_type": "video/mp4",
            "file_size": 4493146,
            "url": "/uploads/media/videos/sale_campaign_team.mp4",
            "poster_url": "/images/campaigns/sale_banner.jpg",
            "width": 1280,
            "height": 720,
            "duration_seconds": 4.0,
            "alt_text": "Athletic champions team victory celebration",
            "tags": ["sale", "campaign", "team", "video"],
            "category": "campaigns",
            "status": "published",
        },
        {
            "media_id": "med_img_hero_poster",
            "original_filename": "hero_main.jpg",
            "display_name": "Hero Sprinter High-Res Poster",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "file_size": 892098,
            "url": "/images/hero/hero_main.jpg",
            "thumbnail_url": "/images/hero/hero_main.jpg",
            "width": 1920,
            "height": 1080,
            "alt_text": "Indian athlete sprinting on illuminated stadium track",
            "tags": ["hero", "poster", "track", "sprinter"],
            "category": "hero",
            "status": "published",
        },
        {
            "media_id": "med_img_sale_poster",
            "original_filename": "sale_banner.jpg",
            "display_name": "Festival Sale Team Banner",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "file_size": 973154,
            "url": "/images/campaigns/sale_banner.jpg",
            "thumbnail_url": "/images/campaigns/sale_banner.jpg",
            "width": 1920,
            "height": 1080,
            "alt_text": "Athletes holding trophy in sunlit stadium flare",
            "tags": ["sale", "festival", "banner"],
            "category": "campaigns",
            "status": "published",
        },
        {
            "media_id": "med_img_story_cricket",
            "original_filename": "story_cricket.jpg",
            "display_name": "Match-Day Gear Editorial Story",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "file_size": 700377,
            "url": "/images/editorial/story_cricket.jpg",
            "thumbnail_url": "/images/editorial/story_cricket.jpg",
            "width": 1024,
            "height": 1365,
            "alt_text": "Locker room sports equipment with willow cricket bat",
            "tags": ["editorial", "cricket", "gears"],
            "category": "editorial",
            "status": "published",
        },
        {
            "media_id": "med_img_story_speed",
            "original_filename": "story_speed.jpg",
            "display_name": "Speed & Ambition Apparel Editorial",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "file_size": 804368,
            "url": "/images/editorial/story_speed.jpg",
            "thumbnail_url": "/images/editorial/story_speed.jpg",
            "width": 1024,
            "height": 1365,
            "alt_text": "Athletic fashion model in performance navy tracksuit",
            "tags": ["editorial", "apparel", "speed"],
            "category": "editorial",
            "status": "published",
        },
        {
            "media_id": "med_img_story_fitness",
            "original_filename": "story_fitness.jpg",
            "display_name": "Complete Athletic Wellness Editorial",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "file_size": 786091,
            "url": "/images/editorial/story_fitness.jpg",
            "thumbnail_url": "/images/editorial/story_fitness.jpg",
            "width": 1024,
            "height": 1365,
            "alt_text": "Minimalist gym setting with yoga mat and dumbbells",
            "tags": ["editorial", "fitness", "wellness"],
            "category": "editorial",
            "status": "published",
        },
    ]

    for m in media_items:
        m["updated_at"] = now
        m["created_at"] = now
        m["created_by"] = "system_admin"
        db.media_assets.update_one({"media_id": m["media_id"]}, {"$set": m}, upsert=True)
    print(f"Upserted {len(media_items)} media assets into db.media_assets")

    # 2. SEED STOREFRONT SECTIONS
    print("--- Seeding Storefront Sections ---")
    sections = [
        {
            "section_key": "hero_campaign",
            "section_type": "hero_campaign",
            "title": "Gear Up Like a Champion.",
            "subtitle": "Discover match-tested sports equipment, certified athletic gear, and member-only privilege pricing with backend-verified secure checkout.",
            "badge_text": "Premier Indian Sports & Athletic Storefront",
            "media_type": "video",
            "media_url": "/uploads/media/videos/hero_campaign_track.mp4",
            "poster_url": "/images/hero/hero_main.jpg",
            "cta_label": "Shop Store Catalog",
            "cta_link": "/store",
            "secondary_cta_label": "Get Digital Pass",
            "secondary_cta_link": "/membership",
            "order": 10,
            "is_active": True,
            "config": {"autoplay": True, "loop": True, "muted": True},
        },
        {
            "section_key": "collections_strip",
            "section_type": "collections_strip",
            "title": "Shop by Collection",
            "subtitle": "CURATED DISCIPLINES",
            "order": 20,
            "is_active": True,
            "items": [
                {
                    "title": "GEARS",
                    "subtitle": "Cricket, Football & Match Gear",
                    "image": "/images/collections/gears.jpg",
                    "link": "/store?category=GEARS",
                    "badge": "5+ Items",
                },
                {
                    "title": "APPAREL",
                    "subtitle": "Shoes, Tracksuits & Compression",
                    "image": "/images/collections/apparel.jpg",
                    "link": "/store?category=APPAREL",
                    "badge": "6+ Items",
                },
                {
                    "title": "FITNESS",
                    "subtitle": "Mats, Weights & Speed Ropes",
                    "image": "/images/collections/fitness.jpg",
                    "link": "/store?category=FITNESS",
                    "badge": "3+ Items",
                },
                {
                    "title": "EXCLUSIVE",
                    "subtitle": "Digital Passes & Cookey Tokens",
                    "image": "/images/collections/exclusive.jpg",
                    "link": "/store?category=EXCLUSIVE",
                    "badge": "VIP Only",
                },
            ],
        },
        {
            "section_key": "curated_products",
            "section_type": "curated_products",
            "title": "See What's New Today",
            "subtitle": "ELEVATE YOUR PERFORMANCE",
            "order": 30,
            "is_active": True,
            "config": {
                "show_tabs": True,
                "tabs": ["ALL", "GEARS", "APPAREL", "FITNESS", "EXCLUSIVE"],
            },
        },
        {
            "section_key": "editorial_showcase",
            "section_type": "editorial_showcase",
            "title": "Crafted For Sport",
            "subtitle": "EDITORIAL SHOWCASE",
            "order": 40,
            "is_active": True,
            "items": [
                {
                    "title": "Match-Day Excellence.",
                    "tag": "CRAFTED FOR PLAY",
                    "subtitle": "English willow bats, certified leather balls, and tournament equipment.",
                    "link_text": "Shop Best Sellers",
                    "link": "/store?category=GEARS",
                    "image": "/images/editorial/story_cricket.jpg",
                },
                {
                    "title": "Wear Your Ambition.",
                    "tag": "PRO RECOVERY & SPEED",
                    "subtitle": "Technical dry-fit jerseys, moisture-wicking compression, and velocity footwear.",
                    "link_text": "Wear Your Story",
                    "link": "/store?category=APPAREL",
                    "image": "/images/editorial/story_speed.jpg",
                },
                {
                    "title": "Athletic Wellness.",
                    "tag": "PURE CONDITIONING",
                    "subtitle": "Premium eco grip yoga mats, cast iron dumbbells, and high-speed bearing ropes.",
                    "link_text": "Complete Athletic Care",
                    "link": "/store?category=FITNESS",
                    "image": "/images/editorial/story_fitness.jpg",
                },
            ],
        },
        {
            "section_key": "seasonal_sale_banner",
            "section_type": "seasonal_sale_banner",
            "title": "The Champion Festival Sale.",
            "subtitle": "UP TO 30% OFF SELECT TOURNAMENT GEAR",
            "badge_text": "End of Season Special • Limited Stock",
            "media_type": "video",
            "media_url": "/uploads/media/videos/sale_campaign_team.mp4",
            "poster_url": "/images/campaigns/sale_banner.jpg",
            "cta_label": "Shop Sale Collection",
            "cta_link": "/store",
            "secondary_cta_label": "View All Offers",
            "secondary_cta_link": "/offers",
            "order": 50,
            "is_active": True,
            "config": {"autoplay": True, "loop": True, "muted": True},
        },
        {
            "section_key": "athlete_testimonials",
            "section_type": "athlete_testimonials",
            "title": "Love From Our Athletes",
            "subtitle": "COMMUNITY PROOF",
            "order": 60,
            "is_active": True,
        },
        {
            "section_key": "community_feed",
            "section_type": "community_feed",
            "title": "Shop Our Athlete Feed",
            "subtitle": "TAGGED #BIGCHAMP",
            "order": 70,
            "is_active": True,
        },
        {
            "section_key": "trust_pillars",
            "section_type": "trust_pillars",
            "title": "The BIGCHAMP Assurance",
            "order": 80,
            "is_active": True,
        },
    ]

    for s in sections:
        s["updated_at"] = now
        s["created_at"] = now
        s["updated_by"] = "system_admin"
        db.storefront_sections.update_one({"section_key": s["section_key"]}, {"$set": s}, upsert=True)
    print(f"Upserted {len(sections)} sections into db.storefront_sections")

    # 3. SEED SMART PROMOTIONAL POPUPS
    print("--- Seeding Promotional Popups ---")
    popups = [
        {
            "popup_id": "pop_festive_15",
            "name": "Champion Festive Season 15% Off",
            "headline": "Unlock 15% Off Your Next Match Gear",
            "subheadline": "Equip your tournament season with certified sports gear, bats, and performance activewear. Use code at checkout.",
            "discount_code": "CHAMPION15",
            "discount_badge": "FLAT 15% OFF",
            "cta_text": "Claim Offer & Shop Now",
            "cta_link": "/store",
            "media_url": "/images/editorial/story_cricket.jpg",
            "poster_url": "/images/editorial/story_cricket.jpg",
            "is_active": True,
            "priority": 10,
            "frequency_delay_seconds": 3,
            "suppression_days": 1,
            "target_routes": ["/", "/store", "/offers"],
            "layout_variant": "standard",
            "created_at": now,
            "updated_at": now,
            "created_by": "system_admin",
        },
        {
            "popup_id": "pop_pass_cashback",
            "name": "Member Digital Pass ₹100 Cashback",
            "headline": "Join BIGCHAMP Club & Earn Instant ₹100",
            "subheadline": "Activate your Annual Digital Pass for ₹100 and receive immediate 10% wallet cashback plus 15% member savings on all gear.",
            "discount_code": "PASS100",
            "discount_badge": "MEMBER PASS PRIVILEGE",
            "cta_text": "Explore Digital Pass",
            "cta_link": "/membership",
            "media_url": "/images/collections/exclusive.jpg",
            "poster_url": "/images/collections/exclusive.jpg",
            "is_active": True,
            "priority": 5,
            "frequency_delay_seconds": 4,
            "suppression_days": 1,
            "target_routes": ["/", "/store"],
            "layout_variant": "standard",
            "created_at": now,
            "updated_at": now,
            "created_by": "system_admin",
        },
    ]

    for p in popups:
        db.promotional_popups.update_one({"popup_id": p["popup_id"]}, {"$set": p}, upsert=True)
    print(f"Upserted {len(popups)} popups into db.promotional_popups")

    # 4. ENSURE COUPON CHAMPION15 EXISTS IN db.coupons
    db.coupons.update_one(
        {"code": "CHAMPION15"},
        {
            "$set": {
                "code": "CHAMPION15",
                "discount_percent": 15,
                "max_discount_paise": 50000,
                "min_order_value_paise": 10000,
                "description": "Festive Champion 15% Off discount on orders above ₹100",
                "active": True,
                "valid_until": "2027-12-31T23:59:59Z",
            }
        },
        upsert=True
    )
    print("Ensured coupon CHAMPION15 is active in db.coupons")

if __name__ == '__main__':
    main()
