import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['bigchamp']
    products = await db.products.find({}, {'name': 1, 'images': 1}).to_list(100)
    print('Products in MongoDB:', len(products))
    db_images = set()
    for p in products:
        imgs = p.get('images', [])
        print(f"{p.get('name')}: {imgs}")
        for img in imgs:
            db_images.add(img)

    print(f"\nTotal unique DB image paths: {len(db_images)}")
    local_dir = 'backend/uploads/products'
    local_files = os.listdir(local_dir) if os.path.exists(local_dir) else []
    print(f"Local files count in {local_dir}: {len(local_files)}")
    print(local_files)

    missing = []
    for img in db_images:
        fname = os.path.basename(img)
        if fname not in local_files:
            missing.append(img)
    print(f"\nMissing from local directory: {len(missing)}")
    if missing:
        print("Missing files:", missing)

if __name__ == '__main__':
    asyncio.run(main())
