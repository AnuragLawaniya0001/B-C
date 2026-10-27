import logging
import os
import re
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import close_db
from app.core.logging import setup_structured_logging
from app.core.metrics import metrics
from app.api.router import api_router
from app.utils.response import (
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
)

# Initialize production-grade structured JSON logging
setup_structured_logging(service_name="bigchamp-api", env=settings.ENV)
logger = logging.getLogger("bigchamp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Bigchamp API operational lifecycle started")
    yield
    await close_db()
    logger.info("Bigchamp API stopped and database connection closed cleanly")


app = FastAPI(
    title="Bigchamp API",
    version="1.0.0",
    description="Backend API for Bigchamp Sports, Student & Defense Ecosystem",
    lifespan=lifespan,
)

# CORS middleware — supports localhost, 127.0.0.1, any VPS IP address, and custom domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Correlation ID and Request Metrics Middleware (Phase 5.3)
@app.middleware("http")
async def correlation_id_and_metrics_middleware(request: Request, call_next):
    # 1. Sanitize or generate correlation ID
    incoming_req_id = request.headers.get("X-Request-ID")
    if incoming_req_id:
        # Sanitize: allow only alphanumeric, hyphen, and underscore up to 64 chars
        clean_req_id = re.sub(r"[^a-zA-Z0-9_-]", "", incoming_req_id)[:64]
        request_id = clean_req_id if clean_req_id else str(uuid.uuid4())
    else:
        request_id = str(uuid.uuid4())

    request.state.request_id = request_id
    metrics.record_request_start()
    t0 = time.perf_counter()

    try:
        response: Response = await call_next(request)
        latency_ms = (time.perf_counter() - t0) * 1000.0

        # Record route metrics
        route_template = request.url.path
        if request.scope.get("endpoint"):
            route_template = getattr(request.scope["endpoint"], "__name__", request.url.path)
        metrics.record_request_end(
            method=request.method,
            path_template=request.url.path,
            status_code=response.status_code,
            latency_ms=latency_ms,
        )

        # Emit structured log
        extra_info = {
            "request_id": request_id,
            "http_method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
        }
        if response.status_code >= 400:
            logger.warning(
                f"HTTP {request.method} {request.url.path} responded with status {response.status_code}",
                extra=extra_info,
            )
        else:
            logger.info(
                f"HTTP {request.method} {request.url.path} completed successfully",
                extra=extra_info,
            )

        response.headers["X-Request-ID"] = request_id
        return response

    except Exception as exc:
        latency_ms = (time.perf_counter() - t0) * 1000.0
        metrics.record_request_end(
            method=request.method,
            path_template=request.url.path,
            status_code=500,
            latency_ms=latency_ms,
        )
        logger.error(
            f"Unhandled exception at {request.url.path}: {exc}",
            exc_info=True,
            extra={
                "request_id": request_id,
                "http_method": request.method,
                "path": request.url.path,
                "status_code": 500,
                "latency_ms": latency_ms,
            },
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id},
            headers={"X-Request-ID": request_id},
        )


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    req_id = getattr(request.state, "request_id", None)
    headers = {"X-Request-ID": req_id} if req_id else {}
    return JSONResponse(status_code=404, content={"detail": str(exc)}, headers=headers)


@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError):
    req_id = getattr(request.state, "request_id", None)
    headers = {"X-Request-ID": req_id} if req_id else {}
    return JSONResponse(status_code=400, content={"detail": str(exc)}, headers=headers)


@app.exception_handler(UnauthorizedError)
async def unauthorized_handler(request: Request, exc: UnauthorizedError):
    req_id = getattr(request.state, "request_id", None)
    headers = {"X-Request-ID": req_id} if req_id else {}
    return JSONResponse(status_code=401, content={"detail": str(exc)}, headers=headers)


@app.exception_handler(ForbiddenError)
async def forbidden_handler(request: Request, exc: ForbiddenError):
    req_id = getattr(request.state, "request_id", None)
    headers = {"X-Request-ID": req_id} if req_id else {}
    return JSONResponse(status_code=403, content={"detail": str(exc)}, headers=headers)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Sanitized global exception handler preventing stack trace leakage to clients."""
    req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error(f"Global unhandled exception at {request.url.path}: {exc}", exc_info=True, extra={"request_id": req_id})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": req_id},
        headers={"X-Request-ID": req_id},
    )


# Register API routes with /api prefix
app.include_router(api_router, prefix="/api")

# Mount static uploads directory for product images
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(os.path.join(uploads_dir, "products"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# Top-level health endpoints for Docker and Kubernetes liveness/readiness probes
@app.get("/health/live")
async def top_level_liveness():
    from app.api.v1.health import liveness_probe
    return await liveness_probe()


@app.get("/health/ready")
async def top_level_readiness():
    from app.api.v1.health import readiness_probe
    return await readiness_probe()


@app.get("/")
async def root():
    return {"message": "Bigchamp API", "docs": "/docs", "health": "/health/ready"}
