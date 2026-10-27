import json
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.storefront_schema import (
    StorefrontSectionCreateRequest,
    StorefrontSectionUpdateRequest,
    StorefrontReorderRequest,
)

router = APIRouter(prefix="/storefront", tags=["storefront"])


def serialize_section_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc_id = str(doc.get("_id", ""))
    doc["id"] = doc_id
    doc["section_id"] = doc_id
    # Normalize cta_label and cta_text
    if "cta_label" in doc and "cta_text" not in doc:
        doc["cta_text"] = doc["cta_label"]
    elif "cta_text" in doc and "cta_label" not in doc:
        doc["cta_label"] = doc["cta_text"]
    # Normalize order and display_order
    if "order" in doc and "display_order" not in doc:
        doc["display_order"] = doc["order"]
    elif "display_order" in doc and "order" not in doc:
        doc["order"] = doc["display_order"]
    if "_id" in doc:
        del doc["_id"]
    return doc


def to_object_id(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str


@router.get("/sections", summary="Get published homepage sections (Public)")
async def get_published_sections():
    """Retrieve all active published homepage sections sorted by display order."""
    cursor = db.storefront_sections.find({"is_active": True}).sort("order", 1)
    sections = []
    async for doc in cursor:
        sections.append(serialize_section_doc(doc))
    return sections


@router.get("/admin/sections", summary="List all homepage sections (Admin)")
async def admin_list_sections(current_admin: dict = Depends(get_current_admin)):
    """Retrieve all homepage sections including inactive drafts for Homepage Builder."""
    cursor = db.storefront_sections.find({}).sort("order", 1)
    sections = []
    async for doc in cursor:
        sections.append(serialize_section_doc(doc))
    return sections


@router.post("/admin/sections", summary="Create homepage section (Admin)", status_code=status.HTTP_201_CREATED)
async def create_section(
    payload: StorefrontSectionCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)
    doc_data = payload.model_dump()
    doc_data["created_at"] = now
    doc_data["updated_at"] = now
    doc_data["updated_by"] = current_admin.get("email", "admin")

    # If order is 0, assign next highest order
    if doc_data.get("order", 0) == 0:
        highest = await db.storefront_sections.find_one({}, sort=[("order", -1)])
        doc_data["order"] = (highest.get("order", 0) + 10) if highest else 10

    res = await db.storefront_sections.insert_one(doc_data)
    doc_data["id"] = str(res.inserted_id)
    doc_data["section_id"] = doc_data["id"]
    if "_id" in doc_data:
        del doc_data["_id"]
    return doc_data


@router.put("/admin/sections/reorder", summary="Batch reorder homepage sections (Admin)")
async def reorder_sections(
    payload: StorefrontReorderRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Update order of sections based on supplied ordered list of section IDs."""
    now = datetime.now(timezone.utc)
    for idx, sid in enumerate(payload.section_ids):
        obj_id = to_object_id(sid)
        await db.storefront_sections.update_one(
            {"$or": [{"_id": obj_id}, {"id": sid}, {"section_key": sid}]},
            {"$set": {"order": (idx + 1) * 10, "updated_at": now}},
        )
    return {"reordered": True, "count": len(payload.section_ids)}


@router.put("/admin/sections/{section_id}", summary="Update homepage section (Admin)")
async def update_section(
    section_id: str,
    payload: StorefrontSectionUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    obj_id = to_object_id(section_id)
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    # Sync cta_label and cta_text
    if "cta_text" in update_data and "cta_label" not in update_data:
        update_data["cta_label"] = update_data["cta_text"]
    elif "cta_label" in update_data and "cta_text" not in update_data:
        update_data["cta_text"] = update_data["cta_label"]

    # Sync display_order and order
    if "display_order" in update_data and "order" not in update_data:
        update_data["order"] = update_data["display_order"]
    elif "order" in update_data and "display_order" not in update_data:
        update_data["display_order"] = update_data["order"]

    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_admin.get("email", "admin")

    query = {"$or": [{"_id": obj_id}, {"section_key": section_id}]}
    if isinstance(obj_id, str):
        query["$or"].append({"id": section_id})

    doc = await db.storefront_sections.find_one_and_update(
        query,
        {"$set": update_data},
        return_document=True,
    )
    if not doc and payload.title:
        doc = await db.storefront_sections.find_one_and_update(
            {"title": payload.title},
            {"$set": update_data},
            return_document=True,
        )
    if not doc:
        raise HTTPException(status_code=404, detail="Storefront section not found")

    return serialize_section_doc(doc)


@router.delete("/admin/sections/{section_id}", summary="Delete homepage section (Admin)")
async def delete_section(
    section_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    obj_id = to_object_id(section_id)
    res = await db.storefront_sections.delete_one({"$or": [{"_id": obj_id}, {"section_key": section_id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"deleted": True, "section_id": section_id}


@router.post("/admin/sections/seed-defaults", summary="Initialize default sections (Admin)")
async def seed_default_sections(current_admin: dict = Depends(get_current_admin)):
    """Seed or reset standard storefront sections for BIGCHAMP."""
    now = datetime.now(timezone.utc)
    defaults = [
        {
            "section_key": "hero_campaign",
            "section_type": "hero_campaign",
            "title": "Gear Up Like a Champion.",
            "subtitle": "Discover match-tested sports equipment, certified athletic gear, and member-only privilege pricing with backend-verified secure checkout.",
            "badge_text": "Premier Indian Sports & Athletic Storefront",
            "media_type": "video",
            "media_url": "/uploads/media/videos/hero_campaign_track.mp4",
            "poster_url": "/images/hero/hero_main.jpg",
            "cta_label": "Shop Store Catalog",
            "cta_link": "/store",
            "secondary_cta_label": "Get Digital Pass",
            "secondary_cta_link": "/membership",
            "order": 10,
            "is_active": True,
            "config": {"autoplay": True, "loop": True, "muted": True},
        },
        {
            "section_key": "collections_strip",
            "section_type": "collections_strip",
            "title": "Shop by Collection",
            "subtitle": "CURATED DISCIPLINES",
            "order": 20,
            "is_active": True,
            "items": [
                {
                    "title": "GEARS",
                    "subtitle": "Cricket, Football & Match Gear",
                    "image": "/images/collections/gears.jpg",
                    "link": "/store?category=GEARS",
                    "badge": "5+ Items",
                },
                {
                    "title": "APPAREL",
                    "subtitle": "Shoes, Tracksuits & Compression",
                    "image": "/images/collections/apparel.jpg",
                    "link": "/store?category=APPAREL",
                    "badge": "6+ Items",
                },
                {
                    "title": "FITNESS",
                    "subtitle": "Mats, Weights & Speed Ropes",
                    "image": "/images/collections/fitness.jpg",
                    "link": "/store?category=FITNESS",
                    "badge": "3+ Items",
                },
                {
                    "title": "EXCLUSIVE",
                    "subtitle": "Digital Passes & Cookey Tokens",
                    "image": "/images/collections/exclusive.jpg",
                    "link": "/store?category=EXCLUSIVE",
                    "badge": "VIP Only",
                },
            ],
        },
        {
            "section_key": "curated_products",
            "section_type": "curated_products",
            "title": "See What's New Today",
            "subtitle": "ELEVATE YOUR PERFORMANCE",
            "order": 30,
            "is_active": True,
            "config": {
                "show_tabs": True,
                "tabs": ["ALL", "GEARS", "APPAREL", "FITNESS", "EXCLUSIVE"],
            },
        },
        {
            "section_key": "editorial_showcase",
            "section_type": "editorial_showcase",
            "title": "Crafted For Sport",
            "subtitle": "EDITORIAL SHOWCASE",
            "order": 40,
            "is_active": True,
            "items": [
                {
                    "title": "Match-Day Excellence.",
                    "tag": "CRAFTED FOR PLAY",
                    "subtitle": "English willow bats, certified leather balls, and tournament equipment.",
                    "link_text": "Shop Best Sellers",
                    "link": "/store?category=GEARS",
                    "image": "/images/editorial/story_cricket.jpg",
                },
                {
                    "title": "Wear Your Ambition.",
                    "tag": "PRO RECOVERY & SPEED",
                    "subtitle": "Technical dry-fit jerseys, moisture-wicking compression, and velocity footwear.",
                    "link_text": "Wear Your Story",
                    "link": "/store?category=APPAREL",
                    "image": "/images/editorial/story_speed.jpg",
                },
                {
                    "title": "Athletic Wellness.",
                    "tag": "PURE CONDITIONING",
                    "subtitle": "Premium eco grip yoga mats, cast iron dumbbells, and high-speed bearing ropes.",
                    "link_text": "Complete Athletic Care",
                    "link": "/store?category=FITNESS",
                    "image": "/images/editorial/story_fitness.jpg",
                },
            ],
        },
        {
            "section_key": "seasonal_sale_banner",
            "section_type": "seasonal_sale_banner",
            "title": "The Champion Festival Sale.",
            "subtitle": "UP TO 30% OFF SELECT TOURNAMENT GEAR",
            "badge_text": "End of Season Special • Limited Stock",
            "media_type": "image",
            "media_url": "/images/campaigns/sale_banner.jpg",
            "cta_label": "Shop Sale Collection",
            "cta_link": "/store",
            "secondary_cta_label": "View All Offers",
            "secondary_cta_link": "/offers",
            "order": 50,
            "is_active": True,
        },
        {
            "section_key": "athlete_testimonials",
            "section_type": "athlete_testimonials",
            "title": "Love From Our Athletes",
            "subtitle": "COMMUNITY PROOF",
            "order": 60,
            "is_active": True,
        },
        {
            "section_key": "community_feed",
            "section_type": "community_feed",
            "title": "Shop Our Athlete Feed",
            "subtitle": "TAGGED #BIGCHAMP",
            "order": 70,
            "is_active": True,
        },
    ]

    count = 0
    for s in defaults:
        existing = await db.storefront_sections.find_one({"section_key": s["section_key"]})
        if not existing:
            s["created_at"] = now
            s["updated_at"] = now
            s["updated_by"] = current_admin.get("email", "admin")
            await db.storefront_sections.insert_one(s)
            count += 1

    return {"seeded": True, "newly_created": count}


admin_router = APIRouter(prefix="/admin/storefront", tags=["storefront-admin"])
admin_router.add_api_route("/sections", admin_list_sections, methods=["GET"], summary="List sections")
admin_router.add_api_route("/sections", create_section, methods=["POST"], status_code=status.HTTP_201_CREATED, summary="Create section")
admin_router.add_api_route("/sections/reorder", reorder_sections, methods=["PUT"], summary="Reorder sections")
admin_router.add_api_route("/sections/{section_id}", update_section, methods=["PUT"], summary="Update section")
admin_router.add_api_route("/sections/{section_id}", delete_section, methods=["DELETE"], summary="Delete section")
admin_router.add_api_route("/reset-defaults", seed_default_sections, methods=["POST"], summary="Reset default sections")
