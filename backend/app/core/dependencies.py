from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_db
from app.core.security import decode_token
from app.services.auth_service import (
    get_user_by_id,
    get_admin_by_id,
    get_partner_user_by_id,
    _to_object_id,
)

security = HTTPBearer(auto_error=False)


async def get_token_payload(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Validate bearer token existence and decode payload."""
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(creds.credentials)
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(payload: dict = Depends(get_token_payload)) -> dict:
    """Extract current authenticated customer user from access token.
    Verifies token type is 'access' and role is 'USER'.
    Checks user exists and is active.
    """
    token_type = payload.get("type")
    role = payload.get("role")
    user_id = payload.get("sub")

    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    if role != "USER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )

    user_dict = dict(user)
    user_dict["id"] = str(user_dict.get("_id", user_id))
    user_dict.pop("password_hash", None)
    return user_dict


async def get_optional_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Extract current user if valid bearer token is provided, otherwise return None."""
    if not creds or not creds.credentials:
        return None
    try:
        payload = decode_token(creds.credentials)
        if payload.get("type") != "access" or payload.get("role") != "USER":
            return None
        user_id = payload.get("sub")
        user = await get_user_by_id(user_id)
        if not user or not user.get("is_active", True):
            return None
        user_dict = dict(user)
        user_dict["id"] = str(user_dict.get("_id", user_id))
        user_dict.pop("password_hash", None)
        return user_dict
    except Exception:
        return None


async def get_current_member(current_user: dict = Depends(get_current_user)) -> dict:
    """FUTURE USE (Prompt #9, #13): Ensures user has ACTIVE membership.
    Checks memberships collection. Raises 403 with 'Active Bigchamp card required' if missing or expired.
    DO NOT use this in auth endpoints. It's for cookey/booking endpoints.
    """
    db = get_db()
    user_id = current_user.get("id") or str(current_user.get("_id", ""))
    membership = await db.memberships.find_one({
        "$or": [{"user_id": user_id}, {"user_id": _to_object_id(user_id)}],
        "is_active": True,
    })
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active Bigchamp card required",
        )
    current_user["membership"] = membership
    return current_user


async def get_current_admin(payload: dict = Depends(get_token_payload)) -> dict:
    """Extract current authenticated administrator from access token.
    Verifies role is 'ADMIN' or 'SUPER_ADMIN'.
    """
    token_type = payload.get("type")
    role = payload.get("role")
    admin_id = payload.get("sub")

    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    if role not in ("ADMIN", "SUPER_ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    admin = await get_admin_by_id(admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin user not found",
        )

    is_active = admin.get("active", admin.get("is_active", True))
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )

    admin_dict = dict(admin)
    admin_dict["id"] = str(admin_dict.get("_id", admin_id))
    admin_dict["full_name"] = admin_dict.get("name") or admin_dict.get("full_name", "Admin")
    admin_dict["is_active"] = is_active
    admin_dict.pop("password_hash", None)
    return admin_dict


async def get_current_partner(payload: dict = Depends(get_token_payload)) -> dict:
    """Extract current authenticated partner from access token.
    Verifies role is 'PARTNER'.
    """
    token_type = payload.get("type")
    role = payload.get("role")
    partner_id = payload.get("sub")

    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    if role != "PARTNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    partner_user = await get_partner_user_by_id(partner_id)
    if not partner_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Partner user not found",
        )

    is_active = partner_user.get("is_active", partner_user.get("active", True))
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )

    pu_dict = dict(partner_user)
    pu_dict["id"] = str(pu_dict.get("_id", partner_id))
    pu_dict["full_name"] = pu_dict.get("full_name") or pu_dict.get("name", "Partner")
    pu_dict["is_active"] = is_active
    pu_dict.pop("password_hash", None)
    return pu_dict


def require_roles(*allowed_roles):
    """Factory dependency returning a checker that enforces allowed roles."""
    async def checker(payload: dict = Depends(get_token_payload)) -> dict:
        role = payload.get("role")
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return payload

    return checker
