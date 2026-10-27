import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

CLOUDINARY_MEDIA = {
    # Collections
    "col_gears": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031777/bigchamp/media/images/med_static_collections_gears.jpg",
    "col_apparel": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031773/bigchamp/media/images/med_static_collections_apparel.jpg",
    "col_fitness": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031776/bigchamp/media/images/med_static_collections_fitness.jpg",
    "col_exclusive": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031774/bigchamp/media/images/med_static_collections_exclusive.jpg",

    # Editorial
    "ed_match_excellence": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031783/bigchamp/media/images/med_static_editorial_story_cricket.jpg",
    "ed_wear_ambition": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031786/bigchamp/media/images/med_static_editorial_story_speed.jpg",
    "ed_athletic_wellness": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031785/bigchamp/media/images/med_static_editorial_story_recovery.jpg",

    # Community photo feed
    "feed_1": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031777/bigchamp/media/images/med_static_collections_gears.jpg",
    "feed_2": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031783/bigchamp/media/images/med_static_editorial_story_cricket.jpg",
    "feed_3": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031773/bigchamp/media/images/med_static_collections_apparel.jpg",
    "feed_4": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031786/bigchamp/media/images/med_static_editorial_story_speed.jpg",
    "feed_5": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031776/bigchamp/media/images/med_static_collections_fitness.jpg",
    "feed_6": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031785/bigchamp/media/images/med_static_editorial_story_recovery.jpg",

    # Campaign video & poster
    "hero_video": "https://res.cloudinary.com/ibq3zgu8/video/upload/v1793042294/bigchamp/media/videos/med_23bf8cda23e8.mp4",
    "hero_poster": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793035378/bigchamp/media/images/med_37b131e2b86c.jpg",
    "sale_video": "https://res.cloudinary.com/ibq3zgu8/video/upload/v1793031765/bigchamp/media/videos/bigchamp_seasonal_campaign.mp4",
    "sale_poster": "https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031771/bigchamp/media/images/med_static_campaigns_sale_banner.jpg"
}

async def sync():
    client = AsyncIOMotorClient("mongodb://mongodb:27017")
    db = client.bigchamp
    sections = await db.storefront_sections.find().to_list(20)
    print(f"Syncing {len(sections)} storefront sections...")

    for sec in sections:
        sec_type = sec.get("section_type")
        sec_id = sec.get("section_id")
        print(f"\nProcessing section: {sec_type} ({sec_id})")

        updates = {}
        if sec_type == "hero_campaign":
            updates["media_url"] = CLOUDINARY_MEDIA["hero_video"]
            updates["poster_url"] = CLOUDINARY_MEDIA["hero_poster"]
            updates["is_active"] = True

        elif sec_type == "seasonal_sale_banner":
            updates["media_url"] = CLOUDINARY_MEDIA["sale_video"]
            updates["poster_url"] = CLOUDINARY_MEDIA["sale_poster"]
            updates["is_active"] = True

        elif sec_type == "collections_strip":
            items = [
                {
                    "title": "GEARS",
                    "subtitle": "Cricket, Football, Rackets",
                    "image_url": CLOUDINARY_MEDIA["col_gears"],
                    "link": "/collections/gears",
                    "badge": "Pro Equipment"
                },
                {
                    "title": "APPAREL",
                    "subtitle": "Performance & Lifestyle",
                    "image_url": CLOUDINARY_MEDIA["col_apparel"],
                    "link": "/collections/apparel",
                    "badge": "Active Wear"
                },
                {
                    "title": "FITNESS",
                    "subtitle": "Gym, Yoga & Recovery",
                    "image_url": CLOUDINARY_MEDIA["col_fitness"],
                    "link": "/collections/fitness",
                    "badge": "Iron & Mobility"
                },
                {
                    "title": "EXCLUSIVE",
                    "subtitle": "VIP Passes & Cookey",
                    "image_url": CLOUDINARY_MEDIA["col_exclusive"],
                    "link": "/collections/exclusive",
                    "badge": "VIP Members"
                }
            ]
            updates["items"] = items

        elif sec_type == "editorial_showcase":
            items = [
                {
                    "title": "Match-Day Excellence",
                    "subtitle": "English Willow craft engineered for supreme stroke balance.",
                    "image_url": CLOUDINARY_MEDIA["ed_match_excellence"],
                    "link": "/shop/cricket",
                    "tag": "CRAFT & POWER"
                },
                {
                    "title": "Wear Your Ambition",
                    "subtitle": "High-velocity runners tuned for instant kinetic return.",
                    "image_url": CLOUDINARY_MEDIA["ed_wear_ambition"],
                    "link": "/shop/running",
                    "tag": "SPEED ESSENTIALS"
                },
                {
                    "title": "Athletic Wellness",
                    "subtitle": "Dual-density grip mats and recovery essentials for daily rigor.",
                    "image_url": CLOUDINARY_MEDIA["ed_athletic_wellness"],
                    "link": "/shop/wellness",
                    "tag": "RESTORATION"
                }
            ]
            updates["items"] = items

        elif sec_type == "community_feed":
            items = [
                {"image_url": CLOUDINARY_MEDIA["feed_1"], "handle": "@aarav_cricket", "caption": "Early morning nets with BIGCHAMP Willow"},
                {"image_url": CLOUDINARY_MEDIA["feed_2"], "handle": "@neha_fitness", "caption": "Recovery session on the eco grip mat"},
                {"image_url": CLOUDINARY_MEDIA["feed_3"], "handle": "@vikram_striker", "caption": "Match ready studs on firm ground"},
                {"image_url": CLOUDINARY_MEDIA["feed_4"], "handle": "@tanya_run", "caption": "10k PR achieved with Pro Velocity"},
                {"image_url": CLOUDINARY_MEDIA["feed_5"], "handle": "@rohit_boxer", "caption": "Strength & conditioning circuit"},
                {"image_url": CLOUDINARY_MEDIA["feed_6"], "handle": "@dev_athlete", "caption": "Never stop pushing boundaries"}
            ]
            updates["items"] = items

        if updates:
            await db.storefront_sections.update_one(
                {"_id": sec["_id"]},
                {"$set": updates}
            )
            print(f" -> Updated {sec_type} with fields: {list(updates.keys())}")

    print("\nStorefront sections synchronization completed successfully!")

if __name__ == "__main__":
    asyncio.run(sync())
