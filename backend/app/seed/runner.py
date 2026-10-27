import asyncio
import sys
from app.core.database import db, close_db
from app.seed.seed_admin import seed_admin
from app.seed.seed_settings import seed_settings
from app.seed.seed_pages import seed_pages
from app.seed.seed_banners import seed_banners
from app.seed.seed_faqs import seed_faqs
from app.seed.seed_products import seed_products
from app.seed.seed_partners import seed_partners


async def create_indexes():
    """Create all required MongoDB collection indexes for the Bigchamp platform."""
    print("\n--- [STEP 1/2] Creating MongoDB Indexes ---")
    try:
        # users
        await db.users.create_index("email", unique=True)
        await db.users.create_index("mobile", unique=True)
        await db.users.create_index("role")
        await db.users.create_index("created_at")

        # admins
        await db.admins.create_index("email", unique=True)

        # partner_users
        await db.partner_users.create_index("email", unique=True)

        # kyc_documents
        await db.kyc_documents.create_index("user_id", unique=True)
        await db.kyc_documents.create_index("status")

        # memberships
        await db.memberships.create_index("user_id", unique=True)
        await db.memberships.create_index("card_number", unique=True)
        await db.memberships.create_index("status")
        await db.memberships.create_index("valid_till")

        # membership_purchases
        await db.membership_purchases.create_index("purchase_id", unique=True)
        await db.membership_purchases.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
        )
        await db.membership_purchases.create_index("provider_order_id")
        await db.membership_purchases.create_index([("user_id", 1), ("created_at", -1)])
        await db.membership_purchases.create_index("status")

        # wallets
        await db.wallets.create_index("user_id", unique=True)

        # wallet_transactions
        await db.wallet_transactions.create_index("transaction_id", unique=True)
        await db.wallet_transactions.create_index([("user_id", 1), ("created_at", -1)])
        await db.wallet_transactions.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
        )
        await db.wallet_transactions.create_index("reason")

        # products
        await db.products.create_index("slug", unique=True)
        await db.products.create_index([("category", 1), ("sport", 1)])
        await db.products.create_index("is_cookey")
        await db.products.create_index("featured")

        # orders
        await db.orders.create_index("order_number", unique=True)
        await db.orders.create_index([("user_id", 1), ("created_at", -1)])
        await db.orders.create_index("order_status")
        await db.orders.create_index("payment_status")
        try:
            await db.orders.drop_index("user_id_1_idempotency_key_1")
        except Exception:
            pass
        await db.orders.create_index(
            [("user_id", 1), ("idempotency_key", 1)],
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
        )

        # cookey_purchases (7-day rule cooling check)
        await db.cookey_purchases.create_index([("user_id", 1), ("purchased_at", -1)])

        # coupons
        await db.coupons.create_index("code", unique=True)
        await db.coupons.create_index([("user_id", 1), ("created_at", -1)])

        # lucky_draws
        await db.lucky_draws.create_index([("cycle_start", -1), ("cycle_end", -1)])
        await db.lucky_draws.create_index("status")

        # partners
        await db.partners.create_index([("type", 1), ("city", 1)])
        await db.partners.create_index("active")

        # bookings
        await db.bookings.create_index([("user_id", 1), ("created_at", -1)])
        await db.bookings.create_index([("partner_id", 1), ("date", 1)])

        # scan_logs
        await db.scan_logs.create_index([("partner_id", 1), ("scanned_at", -1)])

        # settings (key-value)
        await db.settings.create_index("key", unique=True)

        # pages (CMS)
        await db.pages.create_index("slug", unique=True)

        # banners
        await db.banners.create_index([("position", 1), ("active", 1), ("order", 1)])

        # faqs
        await db.faqs.create_index([("category", 1), ("order", 1)])
        await db.faqs.create_index("active")

        # otp_store (with TTL for auto-cleanup)
        await db.otp_store.create_index("identifier")
        await db.otp_store.create_index("created_at", expireAfterSeconds=600)  # 10 min TTL

        # Targeted query & sort optimizations (Phase 5.2)
        await db.products.create_index([("active", 1), ("featured", -1), ("created_at", -1)])
        await db.membership_purchases.create_index("purchase_id", unique=True)
        await db.membership_purchases.create_index([("user_id", 1), ("created_at", -1)])
        await db.partner_commissions.create_index([("partner_id", 1), ("created_at", -1)])
        await db.partner_commissions.create_index("source_id")
        await db.partner_settlements.create_index("payment_reference")
        await db.partner_settlements.create_index([("partner_id", 1), ("created_at", -1)])
        await db.referrals.create_index("referrer_user_id")
        await db.referrals.create_index("referee_user_id")

        print("[SEED] Successfully verified/created all MongoDB collection indexes.")
    except Exception as e:
        print(f"[ERROR] Index creation failed: {e}")
        raise


async def run_seed():
    """Main seed entrypoint executing index creation and data population."""
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    print("==========================================================")
    print("[START] BIGCHAMP DATABASE SEED RUNNER")
    print("==========================================================")

    # Ping database connection
    try:
        await db.command("ping")
        print("[SEED] Connected to MongoDB database.")
    except Exception as e:
        print(f"[ERROR] Cannot connect to MongoDB: {e}")
        sys.exit(1)

    # 1. Create indexes
    await create_indexes()

    # 2. Seed data in specific order
    print("\n--- [STEP 2/2] Seeding Collections ---")
    summary = {}

    try:
        # Order: admin → settings → pages → banners → faqs → products → partners
        print("\n[SEED] 1. Seeding Admin Account...")
        summary["admin"] = await seed_admin(db)

        print("\n[SEED] 2. Seeding Global Settings...")
        summary["settings"] = await seed_settings(db)

        print("\n[SEED] 3. Seeding Dynamic Pages...")
        summary["pages"] = await seed_pages(db)

        print("\n[SEED] 4. Seeding Banners...")
        summary["banners"] = await seed_banners(db)

        print("\n[SEED] 5. Seeding FAQs...")
        summary["faqs"] = await seed_faqs(db)

        print("\n[SEED] 6. Seeding Products & Cookey...")
        summary["products"] = await seed_products(db)

        print("\n[SEED] 7. Seeding Partners...")
        summary["partners"] = await seed_partners(db)

    except Exception as e:
        print(f"\n[ERROR] Seeding encountered an unexpected error: {e}")
        sys.exit(1)
    finally:
        await close_db()

    print("\n==========================================================")
    print("[SUCCESS] BIGCHAMP SEED COMPLETED SUMMARY")
    print("==========================================================")
    for category, counts in summary.items():
        print(f"  • {category.capitalize():<12}: {counts['seeded']} inserted, {counts['skipped']} skipped (already existing)")
    print("==========================================================")
    print("Default admin credentials: admin@bigchamp.in / Admin@123")
    print("==========================================================\n")


def main():
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()

