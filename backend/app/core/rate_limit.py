"""In-memory rate limiting utility."""
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import HTTPException

# Simple in-memory store — replace with Redis in production
_store: dict[str, list[datetime]] = defaultdict(list)


from app.core.config import settings

def check_rate_limit(key: str, max_requests: int, window_seconds: int):
    """Check rate limit for a given key.
    Raises HTTPException(429) if key exceeded max_requests in window_seconds.
    """
    if settings.ENV == "development":
        max_requests = max(max_requests, 60)

    now = datetime.now()
    window_start = now - timedelta(seconds=window_seconds)
    _store[key] = [t for t in _store[key] if t > window_start]
    if len(_store[key]) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Try again after {window_seconds}s.",
        )
    _store[key].append(now)


def reset_rate_limits():
    """Helper for testing: reset in-memory rate limit store."""
    _store.clear()
