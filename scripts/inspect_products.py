import asyncio
from app.core.database import db

async def main():
    docs = await db.products.find().limit(5).to_list(length=5)
    for p in docs:
        print(f"Product: {p.get('name')} | price_paise: {p.get('price_paise')} | member: {p.get('member_price_paise')} | compare_at: {p.get('compare_at_price_paise')} | stock: {p.get('stock')}")
        print(f"  images: {p.get('images')}")

if __name__ == "__main__":
    asyncio.run(main())
