import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=== Reconciling Phase 6.4 Media Records and Storefront Sections ===")
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['bigchamp']
    
    # 1. Check/Register H.264 video assets in media_assets
    video_assets = [
        {
            "media_id": "vid_hero_campaign_h264",
            "title": "BIGCHAMP Hero Campaign Film (H.264 720p)",
            "file_name": "bigchamp_hero_campaign.mp4",
            "media_type": "video",
            "url": "/uploads/media/videos/bigchamp_hero_campaign.mp4",
            "thumbnail_url": "/images/hero/hero_main.jpg",
            "poster_url": "/images/hero/hero_main.jpg",
            "storage_path": "backend/uploads/media/videos/bigchamp_hero_campaign.mp4",
            "mime_type": "video/mp4",
            "file_size": 691025,
            "dimensions": {"width": 1280, "height": 720},
            "duration": 4.0,
            "category": "campaign",
            "usage": ["homepage_hero_campaign", "brand_campaign"],
            "is_active": True
        },
        {
            "media_id": "vid_seasonal_sale_h264",
            "title": "BIGCHAMP Seasonal Sale Film (H.264 720p)",
            "file_name": "bigchamp_seasonal_campaign.mp4",
            "media_type": "video",
            "url": "/uploads/media/videos/bigchamp_seasonal_campaign.mp4",
            "thumbnail_url": "/images/campaigns/sale_poster.jpg",
            "poster_url": "/images/campaigns/sale_poster.jpg",
            "storage_path": "backend/uploads/media/videos/bigchamp_seasonal_campaign.mp4",
            "mime_type": "video/mp4",
            "file_size": 866087,
            "dimensions": {"width": 1280, "height": 720},
            "duration": 4.0,
            "category": "campaign",
            "usage": ["seasonal_sale_banner", "sale_campaign"],
            "is_active": True
        }
    ]
    
    for v in video_assets:
        await db['media_assets'].update_one(
            {"media_id": v["media_id"]},
            {"$set": v},
            upsert=True
        )
        print(f"Registered/Updated video asset: {v['media_id']} -> {v['url']}")

    # 2. Update storefront_sections
    # Update hero_campaign
    await db['storefront_sections'].update_one(
        {"section_id": "sec_hero_campaign"},
        {"$set": {
            "title": "Hero Video Campaign",
            "section_type": "hero_campaign",
            "sort_order": 1,
            "is_enabled": True,
            "config": {
                "headline": "ELEVATE YOUR GAME",
                "subheadline": "Engineered for athletes who refuse to compromise. Explore championship-grade sportswear and pro equipment.",
                "media_type": "video",
                "media_url": "/uploads/media/videos/bigchamp_hero_campaign.mp4",
                "poster_url": "/images/hero/hero_main.jpg",
                "primary_cta_label": "EXPLORE COLLECTION",
                "primary_cta_link": "/store",
                "secondary_cta_label": "MATCH GEAR",
                "secondary_cta_link": "/store?category=gear",
                "overlay_opacity": 40
            }
        }},
        upsert=True
    )
    print("Configured sec_hero_campaign with H.264 video playback.")

    # Update seasonal_sale_banner
    await db['storefront_sections'].update_one(
        {"section_id": "sec_seasonal_sale"},
        {"$set": {
            "title": "Seasonal Sale Banner",
            "section_type": "seasonal_sale_banner",
            "sort_order": 5,
            "is_enabled": True,
            "config": {
                "tag": "LIMITED TIME DROP",
                "headline": "MID-SEASON ATHLETIC SALE",
                "description": "Unlock up to 40% savings on tournament-ready rackets, shoes, and performance technical wear.",
                "media_type": "video",
                "media_url": "/uploads/media/videos/bigchamp_seasonal_campaign.mp4",
                "poster_url": "/images/campaigns/sale_poster.jpg",
                "cta_label": "SHOP SALE",
                "cta_link": "/store?collection=sale"
            }
        }},
        upsert=True
    )
    print("Configured sec_seasonal_sale with H.264 video playback.")

    # 3. Ensure NO promotional clutter sections exist or are enabled
    # Unwanted promotional section IDs or types (like membership cards, cookey banners, army offer cards on homepage)
    unwanted = await db['storefront_sections'].find({
        "$or": [
            {"section_type": {"$in": ["privilege_strip", "membership_promo", "cookey_banner", "army_offer_card"]}},
            {"section_id": {"$in": ["sec_privilege_strip", "sec_membership_cards", "sec_cookey_promo", "sec_army_offer"]}}
        ]
    }).to_list(100)
    
    if unwanted:
        for u in unwanted:
            await db['storefront_sections'].update_one(
                {"_id": u["_id"]},
                {"$set": {"is_enabled": False, "archived": True}}
            )
            print(f"Disabled legacy promotional clutter section: {u.get('section_id')}")
    else:
        print("No legacy promotional clutter sections found enabled in storefront_sections.")

    # 4. Print current active sections
    active = await db['storefront_sections'].find({"is_enabled": True}).sort("sort_order", 1).to_list(100)
    print("\nCurrent Published Storefront Sections:")
    for a in active:
        cfg = a.get('config', {})
        print(f"  [{a.get('sort_order')}] {a.get('section_id')} ({a.get('section_type')}): media={cfg.get('media_url', 'N/A')} ({cfg.get('media_type', 'none')})")

    # 5. Total media asset count
    total_media = await db['media_assets'].count_documents({})
    print(f"\nTotal Media Studio Assets Registered: {total_media}")

if __name__ == '__main__':
    asyncio.run(main())
