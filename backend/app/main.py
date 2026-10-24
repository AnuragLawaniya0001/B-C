import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_db
from app.api.router import api_router
from app.utils.response import (
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("bigchamp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Bigchamp API started")
    yield
    await close_db()
    logger.info("Bigchamp API stopped and database connection closed")


app = FastAPI(
    title="Bigchamp API",
    version="1.0.0",
    description="Backend API for Bigchamp Sports, Student & Defense Ecosystem",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(UnauthorizedError)
async def unauthorized_handler(request: Request, exc: UnauthorizedError):
    return JSONResponse(status_code=401, content={"detail": str(exc)})


@app.exception_handler(ForbiddenError)
async def forbidden_handler(request: Request, exc: ForbiddenError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Basic global exception handler returning error message and request path."""
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "path": request.url.path},
    )


# Register API routes with /api prefix
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Bigchamp API", "docs": "/docs"}
