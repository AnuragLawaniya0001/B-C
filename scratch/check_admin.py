import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.bigchamp
    admins = await db.admins.find().to_list(10)
    print("Found admins:", len(admins))
    for a in admins:
        print(f" - Email: {a.get('email')}, Role: {a.get('role')}, Active: {a.get('is_active')}")

if __name__ == "__main__":
    asyncio.run(main())
