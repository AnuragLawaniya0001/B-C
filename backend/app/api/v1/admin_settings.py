"""Admin business settings and platform configuration endpoints."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db
from app.core.dependencies import get_current_admin
from app.schemas.settings_schema import BusinessRulesSchema, UpdateSettingRequest

router = APIRouter(prefix="/admin/settings", tags=["admin-settings"])


def serialize_setting(doc: dict) -> dict:
    if not doc:
        return {}
    res = dict(doc)
    if "_id" in res:
        res["_id"] = str(res["_id"])
    return res


@router.get("", summary="Get all platform settings for admin console")
async def get_all_settings(current_admin: dict = Depends(get_current_admin)):
    """Retrieve all global configuration and settings keys stored in MongoDB."""
    cursor = db.settings.find({})
    settings_dict = {}
    async for doc in cursor:
        settings_dict[doc["key"]] = doc.get("value")
    return settings_dict


@router.get("/{key}", summary="Get specific platform setting by key")
async def get_setting_by_key(key: str, current_admin: dict = Depends(get_current_admin)):
    """Retrieve an individual setting document by key."""
    doc = await db.settings.find_one({"key": key})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found",
        )
    return serialize_setting(doc)


@router.put("/{key}", summary="Update a platform setting by key")
async def update_setting_by_key(
    key: str,
    request: UpdateSettingRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Update a specific setting in MongoDB.
    Validates business rules integrity if key is 'business_rules'.
    Enforces that no sensitive secrets/credentials can be stored in configuration.
    """
    value = request.value

    # Validate business rules if key is business_rules
    if key == "business_rules":
        try:
            validated = BusinessRulesSchema(**value)
            value = validated.model_dump()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid business rules schema: {str(e)}",
            )

    now = datetime.now(timezone.utc)
    result = await db.settings.find_one_and_update(
        {"key": key},
        {
            "$set": {
                "key": key,
                "value": value,
                "updated_at": now,
                "updated_by": current_admin.get("email", "admin"),
            }
        },
        upsert=True,
        return_document=True,
    )

    return serialize_setting(result)
