import os
import json
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.services.storage_service import StorageService
from app.schemas.media_schema import MediaAssetUpdateRequest

router = APIRouter(prefix="/media", tags=["media"])


def serialize_media_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", ""))
    if "_id" in doc:
        del doc["_id"]
    return doc


async def check_media_usage(media_url: str, media_id: str) -> List[dict]:
    """Scan products, storefront sections, banners, and popups to track references."""
    references = []

    # 1. Products
    prod_cursor = db.products.find(
        {"$or": [{"images": media_url}, {"images": {"$regex": media_id}}]},
        {"name": 1, "slug": 1},
    )
    async for p in prod_cursor:
        references.append({
            "source_type": "product",
            "source_id": str(p.get("_id", "")),
            "source_name": p.get("name", "Product"),
            "field_name": "images",
        })

    # 2. Storefront Sections
    section_cursor = db.storefront_sections.find(
        {
            "$or": [
                {"media_url": media_url},
                {"poster_url": media_url},
                {"media_url": {"$regex": media_id}},
                {"items.image": media_url},
            ]
        },
        {"title": 1, "section_type": 1},
    )
    async for s in section_cursor:
        references.append({
            "source_type": "storefront_section",
            "source_id": str(s.get("_id", "")),
            "source_name": f"{s.get('section_type')}: {s.get('title')}",
            "field_name": "media_url",
        })

    # 3. Banners
    banner_cursor = db.banners.find(
        {"$or": [{"image_url": media_url}, {"image_url": {"$regex": media_id}}]},
        {"title": 1},
    )
    async for b in banner_cursor:
        references.append({
            "source_type": "banner",
            "source_id": str(b.get("_id", "")),
            "source_name": b.get("title", "Banner"),
            "field_name": "image_url",
        })

    # 4. Promotional Popups
    popup_cursor = db.promotional_popups.find(
        {
            "$or": [
                {"media_url": media_url},
                {"poster_url": media_url},
                {"media_url": {"$regex": media_id}},
            ]
        },
        {"name": 1, "headline": 1},
    )
    async for pop in popup_cursor:
        references.append({
            "source_type": "popup",
            "source_id": str(pop.get("_id", "")),
            "source_name": pop.get("name") or pop.get("headline", "Popup"),
            "field_name": "media_url",
        })

    return references


@router.get("", summary="List Media Studio assets (Admin)")
async def list_media(
    media_type: Optional[str] = Query(None, description="Filter: 'image' or 'video'"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter: 'published' or 'archived'"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. hero, products, editorial)"),
    search: Optional[str] = Query(None, description="Search by name, alt_text, or tags"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_admin: dict = Depends(get_current_admin),
):
    query = {}
    if media_type:
        query["media_type"] = media_type.lower()
    if status_filter:
        query["status"] = status_filter.lower()
    if category and category.lower() != "all":
        query["category"] = category.lower()
    if search:
        rgx = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"display_name": rgx},
            {"original_filename": rgx},
            {"alt_text": rgx},
            {"tags": rgx},
        ]

    total = await db.media_assets.count_documents(query)
    cursor = db.media_assets.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_media_doc(doc))

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", summary="Upload media asset (Admin)")
@router.post("/upload", summary="Upload media asset (Admin)")
async def upload_media(
    file: UploadFile = File(...),
    display_name: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(""),
    caption: Optional[str] = Form(""),
    category: Optional[str] = Form("general"),
    tags: Optional[str] = Form(""),
    poster_url: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin),
):
    content_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()

    try:
        saved_meta = StorageService.save_media(
            file_bytes=file_bytes,
            original_filename=file.filename or "uploaded_media",
            declared_mime=content_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    now = datetime.now(timezone.utc)
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    doc = {
        "media_id": saved_meta["media_id"],
        "original_filename": saved_meta["original_filename"],
        "display_name": display_name or os.path.splitext(saved_meta["original_filename"])[0],
        "media_type": saved_meta["media_type"],
        "mime_type": saved_meta["mime_type"],
        "file_size": saved_meta["file_size"],
        "url": saved_meta["url"],
        "thumbnail_url": saved_meta["url"] if saved_meta["media_type"] == "image" else poster_url,
        "poster_url": poster_url,
        "width": saved_meta["width"],
        "height": saved_meta["height"],
        "duration_seconds": saved_meta["duration_seconds"],
        "alt_text": alt_text,
        "caption": caption,
        "tags": tag_list,
        "category": (category or "general").lower(),
        "status": "published",
        "usage_count": 0,
        "created_at": now,
        "updated_at": now,
        "created_by": current_admin.get("email", "admin"),
    }

    res = await db.media_assets.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    if "_id" in doc:
        del doc["_id"]

    return doc


@router.get("/{media_id}/usage", summary="Check media references (Admin)")
async def get_media_usage(
    media_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    doc = await db.media_assets.find_one({"$or": [{"media_id": media_id}, {"_id": media_id}]})
    if not doc:
        try:
            doc = await db.media_assets.find_one({"_id": ObjectId(media_id)})
        except Exception:
            pass
    if not doc:
        raise HTTPException(status_code=404, detail="Media asset not found")

    media_url = doc.get("url", "")
    refs = await check_media_usage(media_url, doc.get("media_id", media_id))

    return {
        "media_id": doc.get("media_id"),
        "is_in_use": len(refs) > 0,
        "usage_count": len(refs),
        "references": refs,
    }


@router.put("/{media_id}", summary="Update media metadata (Admin)")
async def update_media_metadata(
    media_id: str,
    payload: MediaAssetUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_data["updated_at"] = datetime.now(timezone.utc)

    filter_q = {"$or": [{"media_id": media_id}]}
    try:
        filter_q["$or"].append({"_id": ObjectId(media_id)})
    except Exception:
        pass

    doc = await db.media_assets.find_one_and_update(
        filter_q,
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Media asset not found")

    return serialize_media_doc(doc)


@router.post("/{media_id}/replace", summary="Replace media file (Admin)")
async def replace_media_file(
    media_id: str,
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin),
):
    filter_q = {"$or": [{"media_id": media_id}]}
    try:
        filter_q["$or"].append({"_id": ObjectId(media_id)})
    except Exception:
        pass

    doc = await db.media_assets.find_one(filter_q)
    if not doc:
        raise HTTPException(status_code=404, detail="Media asset not found")

    content_type = file.content_type or doc.get("mime_type")
    file_bytes = await file.read()

    try:
        repl_meta = StorageService.replace_media_file(
            existing_url=doc["url"],
            new_file_bytes=file_bytes,
            declared_mime=content_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.now(timezone.utc)
    updated_doc = await db.media_assets.find_one_and_update(
        filter_q,
        {
            "$set": {
                "file_size": repl_meta["file_size"],
                "width": repl_meta["width"],
                "height": repl_meta["height"],
                "duration_seconds": repl_meta["duration_seconds"],
                "updated_at": now,
            }
        },
        return_document=True,
    )

    return serialize_media_doc(updated_doc)


@router.delete("/{media_id}", summary="Safe delete media asset (Admin)")
async def delete_media(
    media_id: str,
    force: bool = Query(False, description="Force delete even if in use"),
    current_admin: dict = Depends(get_current_admin),
):
    filter_q = {"$or": [{"media_id": media_id}]}
    try:
        filter_q["$or"].append({"_id": ObjectId(media_id)})
    except Exception:
        pass

    doc = await db.media_assets.find_one(filter_q)
    if not doc:
        raise HTTPException(status_code=404, detail="Media asset not found")

    media_url = doc.get("url", "")
    refs = await check_media_usage(media_url, doc.get("media_id", media_id))

    if refs and not force:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": f"Asset '{doc.get('display_name')}' cannot be deleted because it is referenced by {len(refs)} live resources.",
                "references": refs,
            },
        )

    # Clean file from storage
    StorageService.delete_media(media_url)

    # Delete record
    await db.media_assets.delete_one(filter_q)

    return {
        "deleted": True,
        "media_id": media_id,
        "filename": doc.get("original_filename"),
    }
