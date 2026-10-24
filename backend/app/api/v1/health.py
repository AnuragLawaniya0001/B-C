from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def get_health():
    """Health check endpoint indicating API operational status."""
    return {"status": "ok", "env": settings.ENV}


@router.get("/db")
async def get_db_health(db=Depends(get_db)):
    """Health check endpoint verifying connection to MongoDB."""
    try:
        # Command ping tests server availability
        await db.command("ping")
        return {"db": "connected"}
    except Exception:
        return {"db": "disconnected"}
