from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.core.database import db

router = APIRouter(prefix="/products", tags=["products"])


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.get("")
async def get_products(
    category: Optional[str] = Query(None, description="Filter by product category (e.g. GEARS, APPAREL, EXCLUSIVE)"),
    sport: Optional[str] = Query(None, description="Filter by sport (e.g. cricket, football, running, fitness)"),
    is_cookey: Optional[bool] = Query(None, description="Filter Cookey exclusive products"),
    featured: Optional[bool] = Query(None, description="Filter featured products for homepage"),
    active: bool = Query(True, description="Filter active products"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(50, ge=1, le=100, description="Pagination limit per request"),
    sort: Optional[str] = Query(None, description="Sort order: 'price_asc', 'price_desc', 'newest'"),
):
    """Retrieve catalog products matching filters, active state, and pagination."""
    query = {"active": active}

    if category:
        query["category"] = category.upper()
    if sport:
        query["sport"] = sport.lower()
    if is_cookey is not None:
        query["is_cookey"] = is_cookey
    if featured is not None:
        query["featured"] = featured

    # Determine sort criteria
    sort_criteria = [("featured", -1), ("created_at", -1)]
    if sort == "price_asc":
        sort_criteria = [("price_paise", 1)]
    elif sort == "price_desc":
        sort_criteria = [("price_paise", -1)]
    elif sort == "newest":
        sort_criteria = [("created_at", -1)]

    cursor = db.products.find(query).sort(sort_criteria).skip(skip).limit(limit)
    products = []
    async for doc in cursor:
        products.append(serialize_doc(doc))
    return products


@router.get("/{slug}")
async def get_product_by_slug(slug: str):
    """Retrieve single product details by slug."""
    doc = await db.products.find_one({"slug": slug, "active": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_doc(doc)
