"""Inventory movement and stock management service."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import db


def _to_object_id(val: Any) -> Optional[ObjectId]:
    if isinstance(val, ObjectId):
        return val
    if isinstance(val, str) and ObjectId.is_valid(val):
        return ObjectId(val)
    return None


async def ensure_inventory_indexes():
    """Ensure indexes for inventory tracking."""
    try:
        await db.inventory_logs.create_index([("product_id", 1), ("created_at", -1)])
        await db.inventory_logs.create_index("related_order_number")
        await db.inventory_logs.create_index(
            "idempotency_key",
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
        )
    except Exception:
        pass


async def record_stock_change(
    product_id_or_slug: str,
    change_qty: int,
    reason: str,
    actor: str,
    related_order_number: Optional[str] = None,
    notes: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Atomically adjust stock and persist an immutable movement history log.
    If change_qty is negative, strictly guarantees stock does not drop below zero.
    Supports idempotent replay via idempotency_key.
    """
    await ensure_inventory_indexes()

    # Idempotent replay check: If operation with this key already completed, return existing log
    if idempotency_key:
        existing_log = await db.inventory_logs.find_one({"idempotency_key": idempotency_key})
        if existing_log:
            existing_log["id"] = str(existing_log.pop("_id", ""))
            return existing_log

    oid = _to_object_id(product_id_or_slug)
    query = {"$or": [{"slug": product_id_or_slug}]}
    if oid:
        query["$or"].append({"_id": oid})

    product = await db.products.find_one(query)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id_or_slug}' not found")

    current_stock = int(product.get("stock", 0))

    if change_qty < 0 and current_stock + change_qty < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reduce stock by {abs(change_qty)}. Available stock is only {current_stock}.",
        )

    now = datetime.now(timezone.utc)
    target_id = product["_id"]

    # Atomic condition to prevent race conditions dropping stock below 0
    update_filter = {"_id": target_id}
    if change_qty < 0:
        update_filter["stock"] = {"$gte": abs(change_qty)}

    updated_product = await db.products.find_one_and_update(
        update_filter,
        {
            "$inc": {"stock": change_qty},
            "$set": {"updated_at": now},
        },
        return_document=True,
    )

    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Concurrent stock modification detected for '{product.get('name')}'. Insufficient stock.",
        )

    new_stock = int(updated_product.get("stock", 0))

    log_entry = {
        "product_id": str(target_id),
        "product_name": product.get("name", ""),
        "change_qty": change_qty,
        "previous_stock": current_stock,
        "new_stock": new_stock,
        "reason": reason,
        "actor": actor,
        "related_order_number": related_order_number,
        "idempotency_key": idempotency_key,
        "notes": notes,
        "created_at": now,
    }

    try:
        insert_res = await db.inventory_logs.insert_one(log_entry)
        log_entry["id"] = str(insert_res.inserted_id)
        if "_id" in log_entry:
            del log_entry["_id"]
        return log_entry
    except Exception as log_err:
        from pymongo.errors import DuplicateKeyError
        # Compensate: rollback stock modification to prevent untraceable stock divergence
        await db.products.update_one(
            {"_id": target_id},
            {"$inc": {"stock": -change_qty}, "$set": {"updated_at": datetime.now(timezone.utc)}},
        )
        if isinstance(log_err, DuplicateKeyError) and idempotency_key:
            # Concurrent race caught by unique index: return the existing log
            existing = await db.inventory_logs.find_one({"idempotency_key": idempotency_key})
            if existing:
                existing["id"] = str(existing.pop("_id", ""))
                return existing
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inventory logging failed. Stock mutation safely compensated: {log_err}",
        )


async def get_inventory_logs(product_id: str, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    """Retrieve audit history of stock adjustments for a product."""
    oid = _to_object_id(product_id)
    filter_q = {"$or": [{"product_id": product_id}]}
    if oid:
        filter_q["$or"].append({"product_id": str(oid)})

    total = await db.inventory_logs.count_documents(filter_q)
    cursor = db.inventory_logs.find(filter_q).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id", ""))
        items.append(doc)

    return {"items": items, "total": total, "skip": skip, "limit": limit}


async def get_low_stock_products(threshold: int = 5) -> List[Dict[str, Any]]:
    """Retrieve active catalog items with inventory below threshold."""
    cursor = db.products.find({"active": True, "stock": {"$lte": threshold}}).sort("stock", 1)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id", ""))
        items.append(doc)
    return items
