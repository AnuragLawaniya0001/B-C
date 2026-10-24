from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.cms_schema import BannerCreateRequest, BannerUpdateRequest

router = APIRouter(prefix="/banners", tags=["banners"])


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
async def get_banners(
    position: Optional[str] = Query(None, description="Filter by banner position slot"),
    include_inactive: bool = Query(False, description="Include inactive/expired banners (admin)"),
):
    """Retrieve active promotional banners matching position and schedule."""
    query = {}
    if not include_inactive:
        now = datetime.now(timezone.utc)
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


@router.post("", summary="Create a new promotional banner (Admin)", status_code=status.HTTP_201_CREATED)
async def create_banner(
    payload: BannerCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Create a new promotional banner in MongoDB."""
    now = datetime.now(timezone.utc)
    doc_data = payload.model_dump()
    doc_data["created_at"] = now
    doc_data["updated_at"] = now
    doc_data["created_by"] = current_admin.get("email", "admin")

    res = await db.banners.insert_one(doc_data)
    doc_data["_id"] = str(res.inserted_id)
    return doc_data


@router.put("/{banner_id}", summary="Update promotional banner (Admin)")
async def update_banner(
    banner_id: str,
    payload: BannerUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Update fields of an existing banner in MongoDB."""
    obj_id = to_object_id(banner_id)
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_admin.get("email", "admin")

    doc = await db.banners.find_one_and_update(
        {"$or": [{"_id": obj_id}, {"_id": banner_id}]},
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Banner not found")
    return serialize_doc(doc)


@router.delete("/{banner_id}", summary="Delete promotional banner (Admin)")
async def delete_banner(
    banner_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Remove a banner from MongoDB."""
    obj_id = to_object_id(banner_id)
    res = await db.banners.delete_one({"$or": [{"_id": obj_id}, {"_id": banner_id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted successfully", "banner_id": banner_id}
