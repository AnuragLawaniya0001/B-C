from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.cms_schema import FaqCreateRequest, FaqUpdateRequest

router = APIRouter(prefix="/faqs", tags=["faqs"])


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def to_object_id(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str


@router.get("")
async def get_faqs(
    category: Optional[str] = Query(None, description="Filter by FAQ category"),
    include_inactive: bool = Query(False, description="Include inactive FAQs (admin)"),
):
    """Retrieve FAQs sorted by category and display order."""
    query = {}
    if not include_inactive:
        query["active"] = True
    if category:
        query["category"] = category

    cursor = db.faqs.find(query).sort([("category", 1), ("order", 1)])
    faqs = []
    async for doc in cursor:
        faqs.append(serialize_doc(doc))
    return faqs


@router.post("", summary="Create a new FAQ (Admin)", status_code=status.HTTP_201_CREATED)
async def create_faq(
    payload: FaqCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Create a new FAQ in MongoDB."""
    now = datetime.now(timezone.utc)
    doc_data = payload.model_dump()
    doc_data["created_at"] = now
    doc_data["updated_at"] = now
    doc_data["created_by"] = current_admin.get("email", "admin")

    res = await db.faqs.insert_one(doc_data)
    doc_data["_id"] = str(res.inserted_id)
    return doc_data


@router.put("/{faq_id}", summary="Update FAQ (Admin)")
async def update_faq(
    faq_id: str,
    payload: FaqUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Update fields of an existing FAQ in MongoDB."""
    obj_id = to_object_id(faq_id)
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_admin.get("email", "admin")

    doc = await db.faqs.find_one_and_update(
        {"$or": [{"_id": obj_id}, {"_id": faq_id}]},
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return serialize_doc(doc)


@router.delete("/{faq_id}", summary="Delete FAQ (Admin)")
async def delete_faq(
    faq_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Remove a FAQ from MongoDB."""
    obj_id = to_object_id(faq_id)
    res = await db.faqs.delete_one({"$or": [{"_id": obj_id}, {"_id": faq_id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully", "faq_id": faq_id}
