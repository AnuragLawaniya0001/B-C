"""Main API router combining all versioned endpoint routers."""
from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.settings import router as settings_router
from app.api.v1.pages import router as pages_router
from app.api.v1.banners import router as banners_router
from app.api.v1.faqs import router as faqs_router
from app.api.v1.products import router as products_router
from app.api.v1.auth import router as auth_router
from app.api.v1.admin_auth import router as admin_auth_router
from app.api.v1.partner_auth import router as partner_auth_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

# Include version 1 endpoints
api_router.include_router(health_router, prefix="/v1")
api_router.include_router(settings_router, prefix="/v1")
api_router.include_router(pages_router, prefix="/v1")
api_router.include_router(banners_router, prefix="/v1")
api_router.include_router(faqs_router, prefix="/v1")
api_router.include_router(products_router, prefix="/v1")

# Authentication and user endpoints
api_router.include_router(auth_router, prefix="/v1")
api_router.include_router(admin_auth_router, prefix="/v1")
api_router.include_router(partner_auth_router, prefix="/v1")
api_router.include_router(users_router, prefix="/v1")
