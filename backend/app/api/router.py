"""Main API router combining all versioned endpoint routers."""
from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.settings import router as settings_router
from app.api.v1.pages import router as pages_router
from app.api.v1.banners import router as banners_router
from app.api.v1.faqs import router as faqs_router
from app.api.v1.products import router as products_router
from app.api.v1.categories import router as categories_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.coupons import router as coupons_router
from app.api.v1.auth import router as auth_router
from app.api.v1.admin_auth import router as admin_auth_router
from app.api.v1.admin_settings import router as admin_settings_router
from app.api.v1.partner_auth import router as partner_auth_router
from app.api.v1.users import router as users_router
from app.api.v1.orders import router as orders_router
from app.api.v1.wallet import router as wallet_router
from app.api.v1.payments import router as payments_router
from app.api.v1.membership import router as membership_router
from app.api.v1.admin_membership import router as admin_membership_router
from app.api.v1.partners import router as partners_router
from app.api.v1.referrals import router as referrals_router
from app.api.v1.finance import router as finance_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.support import router as support_router
from app.api.v1.admin_audit import router as admin_audit_router
from app.api.v1.admin_metrics import router as admin_metrics_router
from app.api.v1.kyc import router as kyc_router
from app.api.v1.lucky_draw import router as lucky_draw_router
from app.api.v1.media import router as media_router
from app.api.v1.storefront import router as storefront_router, admin_router as storefront_admin_router
from app.api.v1.promotions import router as promotions_router

api_router = APIRouter()

# Include version 1 endpoints
api_router.include_router(health_router, prefix="/v1")
api_router.include_router(settings_router, prefix="/v1")
api_router.include_router(admin_settings_router, prefix="/v1")
api_router.include_router(admin_metrics_router, prefix="/v1")
api_router.include_router(membership_router, prefix="/v1")
api_router.include_router(admin_membership_router, prefix="/v1")
api_router.include_router(pages_router, prefix="/v1")
api_router.include_router(banners_router, prefix="/v1")
api_router.include_router(faqs_router, prefix="/v1")
api_router.include_router(products_router, prefix="/v1")
api_router.include_router(categories_router, prefix="/v1")
api_router.include_router(uploads_router, prefix="/v1")
api_router.include_router(media_router, prefix="/v1")
api_router.include_router(storefront_router, prefix="/v1")
api_router.include_router(storefront_admin_router, prefix="/v1")
api_router.include_router(promotions_router, prefix="/v1")
api_router.include_router(coupons_router, prefix="/v1")
api_router.include_router(orders_router, prefix="/v1")
api_router.include_router(wallet_router, prefix="/v1")
api_router.include_router(payments_router, prefix="/v1")
api_router.include_router(partners_router, prefix="/v1")
api_router.include_router(referrals_router, prefix="/v1")
api_router.include_router(finance_router, prefix="/v1")
api_router.include_router(notifications_router, prefix="/v1")
api_router.include_router(support_router, prefix="/v1")
api_router.include_router(admin_audit_router, prefix="/v1")
api_router.include_router(kyc_router, prefix="/v1")
api_router.include_router(lucky_draw_router, prefix="/v1")


# Authentication and user endpoints
api_router.include_router(auth_router, prefix="/v1")
api_router.include_router(admin_auth_router, prefix="/v1")
api_router.include_router(partner_auth_router, prefix="/v1")
api_router.include_router(users_router, prefix="/v1")

