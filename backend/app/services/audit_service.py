"""Admin audit logging service for immutable tracking of sensitive administrative operations."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.core.database import get_db


def redact_sensitive_data(val: Any) -> Any:
    """Recursively redact sensitive keys like passwords, secrets, and auth tokens."""
    sensitive_patterns = {"password", "secret", "token", "key", "credential", "hash", "private"}
    if isinstance(val, dict):
        cleaned = {}
        for k, v in val.items():
            k_lower = str(k).lower()
            if any(p in k_lower for p in sensitive_patterns) and not ("public" in k_lower or "product_id" in k_lower or "order_id" in k_lower):
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = redact_sensitive_data(v)
        return cleaned
    elif isinstance(val, list):
        return [redact_sensitive_data(item) for item in val]
    return val


async def ensure_audit_indexes():
    """Ensure query indexes for audit logs."""
    try:
        db = get_db()
        await db.admin_audit_logs.create_index([("created_at", -1)])
        await db.admin_audit_logs.create_index("actor_email")
        await db.admin_audit_logs.create_index("resource")
    except Exception:
        pass


async def log_admin_action(
    actor_email: str,
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """Append-only recording of administrative mutations with sensitive data redaction."""
    await ensure_audit_indexes()
    db = get_db()
    now = datetime.now(timezone.utc)

    safe_details = redact_sensitive_data(details or {})

    entry = {
        "actor_email": actor_email,
        "action": action,
        "resource": resource,
        "resource_id": str(resource_id) if resource_id else None,
        "details": safe_details,
        "ip_address": ip_address,
        "created_at": now
    }

    res = await db.admin_audit_logs.insert_one(entry)
    entry["id"] = str(res.inserted_id)
    return entry


async def get_admin_audit_logs(
    actor: Optional[str] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Dict[str, Any]:
    """Retrieve audit log entries with optional filters."""
    db = get_db()
    query: Dict[str, Any] = {}
    if actor:
        query["actor_email"] = actor
    if action:
        query["action"] = action
    if resource:
        query["resource"] = resource

    total = await db.admin_audit_logs.count_documents(query)
    cursor = db.admin_audit_logs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)

    return {
        "total": total,
        "items": [
            {
                "id": str(it["_id"]),
                "actor_email": it.get("actor_email"),
                "action": it.get("action"),
                "resource": it.get("resource"),
                "resource_id": it.get("resource_id"),
                "details": it.get("details", {}),
                "ip_address": it.get("ip_address"),
                "created_at": it.get("created_at")
            }
            for it in items
        ]
    }
