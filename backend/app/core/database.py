from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Create Motor client with a 3-second selection timeout to prevent hanging on ping if DB is down
client = AsyncIOMotorClient(
    settings.MONGO_URI,
    serverSelectionTimeoutMS=3000,
)

db = client[settings.MONGO_DB_NAME]


def get_db():
    """Return the MongoDB database instance."""
    return db


async def close_db():
    """Gracefully close the Motor client connection on shutdown."""
    client.close()
