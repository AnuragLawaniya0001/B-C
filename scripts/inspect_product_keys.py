import asyncio
from app.core.database import db

async def main():
    keys = set()
    async for p in db.products.find():
        keys.update(p.keys())
    print("All keys across all products:", sorted(list(keys)))

if __name__ == "__main__":
    asyncio.run(main())
