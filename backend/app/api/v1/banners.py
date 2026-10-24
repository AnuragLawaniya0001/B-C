from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Query
from app.core.database import db

router = APIRouter(prefix="/banners", tags=["banners"])


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.get("")
async def get_banners(
    position: Optional[str] = Query(None, description="Filter by banner position slot"),
    include_inactive: bool = Query(False, description="Include inactive/expired banners (admin)"),
):
    """Retrieve active promotional banners matching position and schedule."""
    query = {}
    if not include_inactive:
        now = datetime.utcnow()
        query["active"] = True
        query["$and"] = [
            {"$or": [{"start_date": None}, {"start_date": {"$lte": now}}]},
            {"$or": [{"end_date": None}, {"end_date": {"$gte": now}}]},
        ]

    if position:
        query["position"] = position

    cursor = db.banners.find(query).sort("order", 1)
    banners = []
    async for doc in cursor:
        banners.append(serialize_doc(doc))
    return banners
