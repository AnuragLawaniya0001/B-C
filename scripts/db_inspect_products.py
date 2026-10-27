import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["bigchamp"]

    # 1. Update test products to inactive so they don't pollute customer storefront
    res = await db.products.update_many(
        {
            "$or": [
                {"name": {"$regex": "^Audit Product", "$options": "i"}},
                {"name": {"$regex": "^Limited Edition Trophy", "$options": "i"}},
                {"name": {"$regex": "^Limited Stock Jersey", "$options": "i"}},
                {"name": "T1"},
                {"name": "Archived Shoe"},
            ]
        },
        {"$set": {"active": False, "is_test_artifact": True}}
    )
    print(f"Deactivated test products: {res.modified_count}")

    # 2. Update category of Yoga Mat and Dumbbells to FITNESS if not set
    await db.products.update_one({"slug": "yoga-mat-premium-eco-grip"}, {"$set": {"category": "FITNESS"}})
    await db.products.update_one({"slug": "dumbbell-set-5kg-cast-iron"}, {"$set": {"category": "FITNESS"}})
    await db.products.update_one({"slug": "skipping-rope-pro-speed-bearing"}, {"$set": {"category": "FITNESS"}})

    # 3. Ensure all genuine products have active=True
    await db.products.update_many(
        {"slug": {"$in": [
            "english-willow-cricket-bat",
            "cricket-ball-leather-pack-3",
            "football-size-5-match-ball",
            "badminton-racket-carbon-pro",
            "running-shoes-pro-velocity",
            "sports-jersey-cricket-dryfit",
            "football-jersey-training-edition",
            "yoga-mat-premium-eco-grip",
            "dumbbell-set-5kg-cast-iron",
            "sports-water-bottle-1l-insulated",
            "tracksuit-sports-all-weather",
            "skipping-rope-pro-speed-bearing",
            "cookey-members-only",
            "football-studs-traction-grip",
            "compression-t-shirt-base-layer",
        ]}},
        {"$set": {"active": True}}
    )

    # 4. Update image paths to point to /uploads/products/ for those with uploaded files
    image_mappings = {
        "english-willow-cricket-bat": ["/uploads/products/prod_bb5773fb3301.jpg"],
        "cricket-ball-leather-pack-3": ["/uploads/products/prod_a388a58ade26.jpg"],
        "football-size-5-match-ball": ["/uploads/products/prod_615e0bf0fe1b.jpg"],
        "badminton-racket-carbon-pro": ["/uploads/products/prod_5c6a0e7b3536.jpg"],
        "running-shoes-pro-velocity": ["/uploads/products/prod_04d47c2d2d11.jpg"],
        "sports-jersey-cricket-dryfit": ["/uploads/products/prod_7f6c3e643cad.jpg"],
        "football-jersey-training-edition": ["/uploads/products/prod_b7f3cf8049cd.jpg"],
        "yoga-mat-premium-eco-grip": ["/uploads/products/prod_887dc8597e67.jpg"],
        "dumbbell-set-5kg-cast-iron": ["/uploads/products/prod_143c4a82bb5c.jpg"],
        "sports-water-bottle-1l-insulated": ["/uploads/products/prod_960edf2b2f46.jpg"],
        "tracksuit-sports-all-weather": ["/uploads/products/prod_94b10d66f325.jpg"],
        "skipping-rope-pro-speed-bearing": ["/uploads/products/prod_6a0af6341702.jpg"],
        "football-studs-traction-grip": ["/uploads/products/prod_4ba0bc9216bc.jpg"],
        "compression-t-shirt-base-layer": ["/uploads/products/prod_62dd8e5ca7fd.jpg"],
        "cookey-members-only": ["/uploads/products/prod_fe5ead8e6052.jpg"],
    }
    for slug, imgs in image_mappings.items():
        await db.products.update_one({"slug": slug}, {"$set": {"images": imgs}})

    # 5. List active products
    active_prods = await db.products.find({"active": True}).to_list(100)
    print(f"\nActive Storefront Products ({len(active_prods)}):")
    for p in active_prods:
        print(f"  • [{p.get('category')}] {p.get('name')} -> {p.get('images')}")

if __name__ == "__main__":
    asyncio.run(main())
