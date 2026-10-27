import asyncio
from app.core.database import db

async def main():
    oos = await db.products.count_documents({"stock": {"$lte": 0}})
    total = await db.products.count_documents({})
    low_stock = await db.products.count_documents({"stock": {"$gt": 0, "$lte": 5}})
    print(f"Total products: {total}, Out of stock: {oos}, Low stock (<=5): {low_stock}")
    
    # Check sample products with compare_at_price or discounts
    sample = await db.products.find({"stock": {"$lte": 0}}).to_list(length=3)
    for p in sample:
        print(f"OOS sample: {p.get('name')} | stock: {p.get('stock')}")

if __name__ == "__main__":
    asyncio.run(main())
