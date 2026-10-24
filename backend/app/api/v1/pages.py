from fastapi import APIRouter, HTTPException
from app.core.database import db

router = APIRouter(prefix="/pages", tags=["pages"])


def serialize_doc(doc: dict) -> dict:
    """Format MongoDB document for JSON serialization."""
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.get("")
async def get_all_pages():
    """Retrieve all CMS pages (for admin pages list)."""
    cursor = db.pages.find({}).sort("slug", 1)
    pages = []
    async for doc in cursor:
        pages.append(serialize_doc(doc))
    return pages


@router.get("/{slug}")
async def get_page_by_slug(slug: str):
    """Retrieve full dynamic CMS layout and sections by slug."""
    doc = await db.pages.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    return serialize_doc(doc)
