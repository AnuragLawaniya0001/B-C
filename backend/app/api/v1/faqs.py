from typing import Optional
from fastapi import APIRouter, Query
from app.core.database import db

router = APIRouter(prefix="/faqs", tags=["faqs"])


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.get("")
async def get_faqs(category: Optional[str] = Query(None, description="Filter by FAQ category")):
    """Retrieve active FAQs sorted by category and display order."""
    query = {"active": True}
    if category:
        query["category"] = category

    cursor = db.faqs.find(query).sort([("category", 1), ("order", 1)])
    faqs = []
    async for doc in cursor:
        faqs.append(serialize_doc(doc))
    return faqs
