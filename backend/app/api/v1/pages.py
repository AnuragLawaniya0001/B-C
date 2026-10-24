from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.cms_schema import PageUpdateRequest

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


@router.put("/{slug}", summary="Update CMS page by slug (Admin)")
async def update_page_by_slug(
    slug: str,
    payload: PageUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Update title, meta tags, and dynamic section content of a CMS page in MongoDB."""
    now = datetime.now(timezone.utc)
    update_data = {
        "title": payload.title,
        "meta": payload.meta,
        "sections": [s.model_dump() for s in payload.sections],
        "active": payload.active,
        "updated_at": now,
        "updated_by": current_admin.get("email", "admin"),
    }

    doc = await db.pages.find_one_and_update(
        {"slug": slug},
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page with slug '{slug}' not found",
        )
    return serialize_doc(doc)
