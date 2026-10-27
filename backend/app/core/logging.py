"""Structured JSON logging and sensitive data redaction for production observability (Phase 5.3)."""
import json
import logging
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Keywords and regex patterns for sensitive field redaction
SENSITIVE_KEY_PATTERNS = re.compile(
    r"(password|secret|token|key|authorization|cookie|signature|aadhaar|otp|cvv|pin|credential|private)",
    re.IGNORECASE,
)
SAFE_EXCEPTIONS = {"public", "product_id", "order_id", "category_id", "user_id"}


def redact_sensitive_value(key: str, val: Any) -> Any:
    """Recursively redact sensitive data from dictionaries, lists, and strings."""
    if val is None:
        return None
    key_lower = str(key).lower()
    if any(safe in key_lower for safe in SAFE_EXCEPTIONS):
        if isinstance(val, dict):
            return {k: redact_sensitive_value(k, v) for k, v in val.items()}
        elif isinstance(val, list):
            return [redact_sensitive_value(key, item) for item in val]
        return val

    if SENSITIVE_KEY_PATTERNS.search(key_lower):
        return "[REDACTED]"

    if isinstance(val, dict):
        return {k: redact_sensitive_value(k, v) for k, v in val.items()}
    elif isinstance(val, list):
        return [redact_sensitive_value(key, item) for item in val]
    elif isinstance(val, str):
        # Redact JWT tokens if present in string values
        if val.startswith("eyJ") and len(val) > 30 and val.count(".") == 2:
            return "[REDACTED_JWT]"
        # Redact Bearer authorization headers
        if val.lower().startswith("bearer "):
            return "Bearer [REDACTED]"
    return val


class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as structured, machine-readable JSON documents."""

    def __init__(self, service_name: str = "bigchamp-api", env: str = "development"):
        super().__init__()
        self.service_name = service_name
        self.env = env

    def format(self, record: logging.LogRecord) -> str:
        now_utc = datetime.now(timezone.utc).isoformat()

        log_payload: Dict[str, Any] = {
            "timestamp": now_utc,
            "severity": record.levelname,
            "service": self.service_name,
            "environment": self.env,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include request context if attached to record
        if hasattr(record, "request_id") and record.request_id:
            log_payload["request_id"] = record.request_id
        if hasattr(record, "http_method") and record.http_method:
            log_payload["http_method"] = record.http_method
        if hasattr(record, "path") and record.path:
            log_payload["path"] = record.path
        if hasattr(record, "status_code") and record.status_code is not None:
            log_payload["status_code"] = record.status_code
        if hasattr(record, "latency_ms") and record.latency_ms is not None:
            log_payload["latency_ms"] = round(record.latency_ms, 2)
        if hasattr(record, "user_id") and record.user_id:
            log_payload["user_id"] = record.user_id
        if hasattr(record, "event") and record.event:
            log_payload["event"] = record.event

        # Redact any custom diagnostic data passed in extra
        if hasattr(record, "diagnostics") and isinstance(record.diagnostics, dict):
            log_payload["diagnostics"] = {
                k: redact_sensitive_value(k, v) for k, v in record.diagnostics.items()
            }

        # Attach sanitized exception info if present
        if record.exc_info:
            log_payload["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "Exception",
                "message": str(record.exc_info[1]),
            }

        return json.dumps(log_payload, default=str)


def setup_structured_logging(service_name: str = "bigchamp-api", env: str = "development", level: str = "INFO"):
    """Initialize structured logging for application root logger."""
    root_logger = logging.getLogger()
    log_level = getattr(logging, level.upper(), logging.INFO)
    root_logger.setLevel(log_level)

    # Clear existing handlers to prevent duplicate outputs
    for h in list(root_logger.handlers):
        root_logger.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    formatter = StructuredJsonFormatter(service_name=service_name, env=env)
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    return root_logger
