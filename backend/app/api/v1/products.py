from datetime import datetime, timezone
import re
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db
from app.core.dependencies import get_current_admin, get_optional_current_user
from app.schemas.product_schema import ProductCreateRequest, ProductUpdateRequest, StockAdjustRequest
from app.services.inventory_service import record_stock_change, get_inventory_logs, get_low_stock_products
from app.services.order_service import check_cookey_eligibility

router = APIRouter(prefix="/products", tags=["products"])


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


def get_id_or_slug_query(identifier: str) -> dict:
    if ObjectId.is_valid(identifier):
        return {"$or": [{"_id": ObjectId(identifier)}, {"slug": identifier}]}
    return {"slug": identifier}


@router.get("", summary="List products (Public & Admin)")
async def get_products(
    search: Optional[str] = Query(None, description="Search keyword in title, SKU, or description"),
    category: Optional[str] = Query(None, description="Filter by product category (e.g. GEARS, APPAREL, EXCLUSIVE)"),
    sport: Optional[str] = Query(None, description="Filter by sport (e.g. cricket, football, running, fitness)"),
    is_cookey: Optional[bool] = Query(None, description="Filter Cookey exclusive products"),
    featured: Optional[bool] = Query(None, description="Filter featured products for homepage"),
    active: Optional[bool] = Query(True, description="Filter active status. True by default for customer store."),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(50, ge=1, le=100, description="Pagination limit per request"),
    sort: Optional[str] = Query(None, description="Sort order: 'price_asc', 'price_desc', 'newest'"),
    ids: Optional[str] = Query(None, description="Comma-separated product IDs or slugs to filter"),
):
    """Retrieve catalog products matching filters, active state, and pagination."""
    query = {}
    if active is not None:
        query["active"] = active
    else:
        query["active"] = True

    if ids:
        raw_ids = [i.strip() for i in ids.split(",") if i.strip()]
        obj_ids = []
        slugs = []
        for i in raw_ids:
            if ObjectId.is_valid(i):
                obj_ids.append(ObjectId(i))
            else:
                slugs.append(i)
        query["$or"] = [{"_id": {"$in": obj_ids}}, {"slug": {"$in": slugs}}]

    if search:
        search_regex = {"$regex": re.escape(search.strip()), "$options": "i"}
        search_clause = [
            {"name": search_regex},
            {"sku": search_regex},
            {"description": search_regex},
        ]
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": search_clause}]
        else:
            query["$or"] = search_clause

    if category and category.upper() != "ALL":
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


@router.get("/cookey/eligibility", summary="Check customer Cookey weekly purchase eligibility and cooldown countdown")
async def get_cookey_eligibility(current_user: Optional[dict] = Depends(get_optional_current_user)):
    """Evaluate whether customer has active membership and can purchase Cookey under DB weekly cooldown."""
    user_id = current_user.get("id") if current_user else None
    return await check_cookey_eligibility(user_id)


@router.get("/{id_or_slug}", summary="Get product details by slug or ID")
async def get_product_by_id_or_slug(id_or_slug: str):
    """Retrieve single product details by slug or MongoDB ID."""
    query = get_id_or_slug_query(id_or_slug)
    doc = await db.products.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Product '{id_or_slug}' not found")
    return serialize_doc(doc)


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create product (Admin)")
async def create_product(
    payload: ProductCreateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Create a new product in the catalog with validation and slug assignment."""
    category_upper = payload.category.strip().upper()

    # Validate category exists in categories collection
    cat_exists = await db.categories.find_one({"name": category_upper})
    if not cat_exists:
        # Also check case-insensitive or slug
        cat_exists = await db.categories.find_one({"$or": [{"slug": payload.category.lower()}, {"name": category_upper}]})
        if not cat_exists:
            # Auto-register category or check default categories
            now_cat = datetime.now(timezone.utc)
            await db.categories.insert_one({
                "name": category_upper,
                "slug": slugify(category_upper),
                "description": f"{category_upper} category",
                "order": 10,
                "active": True,
                "created_at": now_cat,
                "updated_at": now_cat,
                "created_by": current_admin.get("email", "admin"),
            })

    # Slug resolution
    slug = payload.slug.strip().lower() if payload.slug else slugify(payload.name)
    existing_slug = await db.products.find_one({"slug": slug})
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with slug '{slug}' already exists",
        )

    # SKU uniqueness check
    sku_val = payload.sku.strip() if payload.sku else None
    if sku_val:
        existing_sku = await db.products.find_one({"sku": sku_val})
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{sku_val}' already exists",
            )

    # Default member price if omitted
    member_price = (
        payload.member_price_paise
        if payload.member_price_paise is not None
        else int(payload.price_paise * 0.9)
    )

    now = datetime.now(timezone.utc)
    new_doc = {
        "name": payload.name.strip(),
        "slug": slug,
        "description": payload.description.strip() if payload.description else "",
        "category": category_upper,
        "sport": payload.sport.strip().lower() if payload.sport else "general",
        "sku": sku_val,
        "price_paise": payload.price_paise,
        "member_price_paise": member_price,
        "stock": payload.stock,
        "images": payload.images or [],
        "is_cookey": payload.is_cookey,
        "featured": payload.featured,
        "active": payload.active,
        "created_at": now,
        "updated_at": now,
        "created_by": current_admin.get("email", "admin"),
    }

    result = await db.products.insert_one(new_doc)
    created = await db.products.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.put("/{prod_id}", summary="Update product (Admin)")
async def update_product(
    prod_id: str,
    payload: ProductUpdateRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Update product attributes, prices, inventory stock, and media assets."""
    query = get_id_or_slug_query(prod_id)
    existing = await db.products.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    update_fields = {}
    if payload.name is not None:
        update_fields["name"] = payload.name.strip()

    if payload.slug is not None:
        new_slug = payload.slug.strip().lower()
        if new_slug != existing.get("slug"):
            collision = await db.products.find_one({"slug": new_slug, "_id": {"$ne": existing["_id"]}})
            if collision:
                raise HTTPException(status_code=409, detail=f"Product slug '{new_slug}' already exists")
            update_fields["slug"] = new_slug

    if payload.description is not None:
        update_fields["description"] = payload.description.strip()

    if payload.category is not None:
        update_fields["category"] = payload.category.strip().upper()

    if payload.sport is not None:
        update_fields["sport"] = payload.sport.strip().lower()

    if payload.sku is not None:
        new_sku = payload.sku.strip() if payload.sku else None
        if new_sku and new_sku != existing.get("sku"):
            collision = await db.products.find_one({"sku": new_sku, "_id": {"$ne": existing["_id"]}})
            if collision:
                raise HTTPException(status_code=409, detail=f"Product SKU '{new_sku}' already exists")
        update_fields["sku"] = new_sku

    if payload.price_paise is not None:
        update_fields["price_paise"] = payload.price_paise
    if payload.member_price_paise is not None:
        update_fields["member_price_paise"] = payload.member_price_paise
    if payload.stock is not None:
        update_fields["stock"] = payload.stock
    if payload.images is not None:
        update_fields["images"] = payload.images
    if payload.is_cookey is not None:
        update_fields["is_cookey"] = payload.is_cookey
    if payload.featured is not None:
        update_fields["featured"] = payload.featured
    if payload.active is not None:
        update_fields["active"] = payload.active

    update_fields["updated_at"] = datetime.now(timezone.utc)
    update_fields["updated_by"] = current_admin.get("email", "admin")

    updated = await db.products.find_one_and_update(
        {"_id": existing["_id"]},
        {"$set": update_fields},
        return_document=True,
    )
    return serialize_doc(updated)


@router.patch("/{prod_id}/archive", summary="Archive / Unarchive product (Admin)")
async def toggle_product_archive(
    prod_id: str,
    active: Optional[bool] = Query(None, description="Explicit active flag. If omitted, toggles current state."),
    current_admin: dict = Depends(get_current_admin),
):
    """Toggle active/archived status of a product."""
    query = get_id_or_slug_query(prod_id)
    existing = await db.products.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    new_active = active if active is not None else not existing.get("active", True)
    now = datetime.now(timezone.utc)

    updated = await db.products.find_one_and_update(
        {"_id": existing["_id"]},
        {"$set": {"active": new_active, "updated_at": now, "updated_by": current_admin.get("email", "admin")}},
        return_document=True,
    )
    return serialize_doc(updated)


@router.delete("/{prod_id}", summary="Delete or archive product (Admin)")
async def delete_product(
    prod_id: str,
    hard_delete: bool = Query(False, description="If true, permanently delete from DB; otherwise soft archive"),
    current_admin: dict = Depends(get_current_admin),
):
    """Archive or remove a product from the database."""
    query = get_id_or_slug_query(prod_id)
    existing = await db.products.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    if hard_delete:
        await db.products.delete_one({"_id": existing["_id"]})
        return {"message": f"Product '{existing.get('name')}' permanently deleted", "deleted": True}

    now = datetime.now(timezone.utc)
    await db.products.update_one(
        {"_id": existing["_id"]},
        {"$set": {"active": False, "updated_at": now, "updated_by": current_admin.get("email", "admin")}},
    )
    return {"message": f"Product '{existing.get('name')}' archived", "archived": True}


@router.post("/{prod_id}/stock-adjust", summary="Admin adjust product stock with audit trail")
async def adjust_stock_admin(
    prod_id: str,
    payload: StockAdjustRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin increases or decreases product stock with an authoritative reason and audit trail."""
    admin_email = current_admin.get("email", "admin")
    log_entry = await record_stock_change(
        product_id_or_slug=prod_id,
        change_qty=payload.adjustment_qty,
        reason=payload.reason,
        actor=admin_email,
        notes=payload.notes,
    )
    from app.services.audit_service import log_admin_action
    await log_admin_action(
        actor_email=admin_email,
        action="STOCK_ADJUST",
        resource="PRODUCT",
        resource_id=prod_id,
        details=log_entry,
    )
    return {
        "message": f"Stock adjusted by {payload.adjustment_qty}",
        "log": log_entry,
        "data": {"stock": log_entry["new_stock"], "log": log_entry},
    }


@router.get("/{prod_id}/inventory-logs", summary="Get inventory movement audit logs (Admin)")
async def get_product_logs_admin(
    prod_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve full chronological movement history of inventory adjustments for a product."""
    return await get_inventory_logs(prod_id, skip=skip, limit=limit)


@router.get("/admin/low-stock/alerts", summary="Get low stock catalog alerts (Admin)")
async def get_low_stock_admin(
    threshold: int = Query(5, ge=0, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """Retrieve products where available stock is below or equal to threshold."""
    return await get_low_stock_products(threshold=threshold)
