from datetime import datetime, timezone
import re
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.product_schema import CategoryCreateRequest, CategoryUpdateRequest

router = APIRouter(prefix="/categories", tags=["categories"])

DEFAULT_CATEGORIES = [
    {"name": "GEARS", "slug": "gears", "description": "Sports equipment, bats, balls, and athletic gear", "order": 1, "active": True},
    {"name": "APPAREL", "slug": "apparel", "description": "Performance wear, jerseys, tracksuits, and athletic shoes", "order": 2, "active": True},
    {"name": "EXCLUSIVE", "slug": "exclusive", "description": "Members-only Cookey and ecosystem exclusives", "order": 3, "active": True},
    {"name": "FITNESS", "slug": "fitness", "description": "Training accessories, mats, weights, and recovery tools", "order": 4, "active": True},
]


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")


async def ensure_default_categories():
    count = await db.categories.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc)
        for cat in DEFAULT_CATEGORIES:
            doc = {**cat, "created_at": now, "updated_at": now}
            await db.categories.update_one({"slug": cat["slug"]}, {"$setOnInsert": doc}, upsert=True)


@router.get("", summary="List product categories")
async def get_categories(
    active: Optional[bool] = Query(None, description="Filter by active status. If omitted, returns active categories for public."),
):
    await ensure_default_categories()
    query = {}
    if active is not None:
        query["active"] = active
    else:
        query["active"] = True

    cursor = db.categories.find(query).sort("order", 1)
    categories = []
    async for doc in cursor:
        serialized = serialize_doc(doc)
        # Count products belonging to this category
        cat_name = serialized.get("name", "").upper()
        prod_count = await db.products.count_documents({"category": cat_name, "active": True})
        serialized["product_count"] = prod_count
        categories.append(serialized)
    return categories


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create category (Admin)")
async def create_category(
    payload: CategoryCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    name_upper = payload.name.strip().upper()
    slug = payload.slug.strip().lower() if payload.slug else slugify(payload.name)

    existing = await db.categories.find_one({
        "$or": [{"slug": slug}, {"name": name_upper}]
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with name '{name_upper}' or slug '{slug}' already exists",
        )

    now = datetime.now(timezone.utc)
    new_doc = {
        "name": name_upper,
        "slug": slug,
        "description": payload.description or "",
        "order": payload.order,
        "active": payload.active,
        "created_at": now,
        "updated_at": now,
        "created_by": current_admin.get("email", "admin"),
    }
    result = await db.categories.insert_one(new_doc)
    created = await db.categories.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.put("/{cat_id}", summary="Update category (Admin)")
async def update_category(
    cat_id: str,
    payload: CategoryUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    query = {"_id": ObjectId(cat_id)} if ObjectId.is_valid(cat_id) else {"slug": cat_id}
    existing = await db.categories.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")

    update_fields = {}
    if payload.name is not None:
        new_name_upper = payload.name.strip().upper()
        # If renamed, check collision
        if new_name_upper != existing.get("name"):
            collision = await db.categories.find_one({"name": new_name_upper, "_id": {"$ne": existing["_id"]}})
            if collision:
                raise HTTPException(status_code=409, detail=f"Category '{new_name_upper}' already exists")
            update_fields["name"] = new_name_upper
            # Also update products with old category name to maintain relationship
            old_name = existing.get("name")
            if old_name:
                await db.products.update_many({"category": old_name}, {"$set": {"category": new_name_upper}})

    if payload.slug is not None:
        new_slug = payload.slug.strip().lower()
        if new_slug != existing.get("slug"):
            collision = await db.categories.find_one({"slug": new_slug, "_id": {"$ne": existing["_id"]}})
            if collision:
                raise HTTPException(status_code=409, detail=f"Category slug '{new_slug}' already exists")
            update_fields["slug"] = new_slug

    if payload.description is not None:
        update_fields["description"] = payload.description
    if payload.order is not None:
        update_fields["order"] = payload.order
    if payload.active is not None:
        update_fields["active"] = payload.active

    update_fields["updated_at"] = datetime.now(timezone.utc)
    update_fields["updated_by"] = current_admin.get("email", "admin")

    updated = await db.categories.find_one_and_update(
        {"_id": existing["_id"]},
        {"$set": update_fields},
        return_document=True,
    )
    return serialize_doc(updated)


@router.delete("/{cat_id}", summary="Delete or archive category (Admin)")
async def delete_category(
    cat_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    query = {"_id": ObjectId(cat_id)} if ObjectId.is_valid(cat_id) else {"slug": cat_id}
    existing = await db.categories.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")

    cat_name = existing.get("name", "")
    prod_count = await db.products.count_documents({"category": cat_name, "active": True})
    if prod_count > 0:
        # Prevent destructive delete of in-use category; soft-archive instead
        await db.categories.update_one({"_id": existing["_id"]}, {"$set": {"active": False, "updated_at": datetime.now(timezone.utc)}})
        return {
            "message": f"Category '{cat_name}' has {prod_count} active product(s) and was archived rather than deleted.",
            "archived": True,
            "product_count": prod_count,
        }

    await db.categories.delete_one({"_id": existing["_id"]})
    return {"message": f"Category '{cat_name}' successfully deleted", "deleted": True}
