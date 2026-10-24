"""Security utility functions for password hashing, JWT tokens, and QR signing."""
from datetime import datetime, timedelta, timezone
import re
import bcrypt
from jose import JWTError, jwt
from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain text password against an existing bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength according to business rules:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    Returns (is_valid, error_message).
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"


def create_access_token(data: dict) -> str:
    """Generate a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Generate a signed JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a signed JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Invalid or expired token")
    except Exception:
        raise ValueError("Invalid or expired token")


def create_qr_payload(data: dict) -> str:
    """Generate a signed secure QR payload for member validation."""
    to_encode = data.copy()
    to_encode.update({
        "exp": datetime.now(timezone.utc) + timedelta(days=365),
        "type": "qr"
    })
    return jwt.encode(to_encode, settings.QR_SIGNING_SECRET, algorithm="HS256")


def verify_qr_payload(token: str) -> dict:
    """Verify and decode a signed QR payload from a partner scan."""
    try:
        return jwt.decode(token, settings.QR_SIGNING_SECRET, algorithms=["HS256"])
    except JWTError:
        raise ValueError("Invalid QR payload")
    except Exception:
        raise ValueError("Invalid QR payload")
