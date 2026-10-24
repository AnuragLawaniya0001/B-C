from datetime import datetime


async def seed_pages(db) -> dict:
    """Seed dynamic CMS pages and section layouts (idempotent)."""
    now = datetime.utcnow()
    pages_data = [
        # Page 1: Homepage
        {
            "slug": "homepage",
            "title": "Home",
            "meta": {
                "title": "Bigchamp — Sports, Student & Defense Ecosystem",
                "description": "₹100 card. Unlock everything.",
                "og_image": "/images/og-home.jpg",
            },
            "sections": [
                {
                    "id": "hero",
                    "type": "hero",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "title": "India ka Pehla Sports, Student & Defense Ecosystem",
                        "subtitle": "₹100 Digital Card → Unlock Dormitory Stays, Physio Clinics, Sports Gears & More",
                        "primary_cta_text": "Join Now — ₹100",
                        "primary_cta_link": "/register",
                        "secondary_cta_text": "Learn More",
                        "secondary_cta_link": "/membership",
                        "bg_image_url": "/images/hero-bg.jpg",
                    },
                },
                {
                    "id": "benefits",
                    "type": "benefits",
                    "order": 2,
                    "enabled": True,
                    "content": {
                        "heading": "One Card. Three Superpowers.",
                        "items": [
                            {
                                "icon": "home",
                                "title": "Dormitory Stays",
                                "desc": "Affordable, verified stay in every city you travel to.",
                            },
                            {
                                "icon": "activity",
                                "title": "Sports Physio",
                                "desc": "Priority access to partner physio clinics for injury recovery.",
                            },
                            {
                                "icon": "shopping-bag",
                                "title": "Sports Store",
                                "desc": "Gears, apparel & exclusive products at member prices.",
                            },
                        ],
                    },
                },
                {
                    "id": "card_showcase",
                    "type": "card_showcase",
                    "order": 3,
                    "enabled": True,
                    "content": {
                        "heading": "Your Bigchamp Digital Card",
                        "subheading": "Membership that pays for itself",
                        "features": [
                            "₹100 only • 11 months validity",
                            "10% instant cashback (₹10 in wallet)",
                            "AutoPay for worry-free renewal",
                            "Digital QR card — works everywhere",
                            "10% extra off for Army/Defense",
                        ],
                        "cta_text": "Get Your Card",
                        "cta_link": "/register",
                    },
                },
                {
                    "id": "featured_products",
                    "type": "featured_products",
                    "order": 4,
                    "enabled": True,
                    "content": {
                        "heading": "Featured Sports Gear",
                        "cta_text": "View All Products",
                        "cta_link": "/store",
                    },
                },
                {
                    "id": "cookey_banner",
                    "type": "cookey_banner",
                    "order": 5,
                    "enabled": True,
                    "content": {
                        "heading": "Cookey — Members Only",
                        "subheading": "₹100 • 1 per week per member",
                        "desc": "Buy Cookey and enter the weekly lucky draw. Winner gets wallet reward!",
                        "cta_text": "Buy Cookey →",
                        "cta_link": "/cookey",
                    },
                },
                {
                    "id": "army_banner",
                    "type": "army_banner",
                    "order": 6,
                    "enabled": True,
                    "content": {
                        "heading": "Defense Personnel — Extra 10% Off",
                        "desc": "Verified Army & Defense personnel get an additional 10% discount on everything.",
                        "cta_text": "Learn More",
                        "cta_link": "/army-offer",
                    },
                },
                {
                    "id": "how_it_works",
                    "type": "how_it_works",
                    "order": 7,
                    "enabled": True,
                    "content": {
                        "heading": "How It Works",
                        "steps": [
                            {
                                "number": 1,
                                "title": "Register & Verify",
                                "desc": "Sign up with email + mobile. Quick KYC.",
                            },
                            {
                                "number": 2,
                                "title": "Pay ₹100",
                                "desc": "Get your digital card in seconds.",
                            },
                            {
                                "number": 3,
                                "title": "Get ₹10 Cashback",
                                "desc": "Instant credit in your Bigchamp wallet.",
                            },
                            {
                                "number": 4,
                                "title": "Enjoy Everywhere",
                                "desc": "Shop, stay, physio — all member-priced.",
                            },
                        ],
                    },
                },
            ],
            "updated_at": now,
        },
        # Page 2: About
        {
            "slug": "about",
            "title": "About Us",
            "meta": {
                "title": "About Bigchamp",
                "description": "Our story & mission",
            },
            "sections": [
                {
                    "id": "main",
                    "type": "rich_text",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "html": "<h2>Our Mission</h2><p>Bigchamp ek aisa ecosystem hai jo sports, students aur defense personnel ki life ko asaan banata hai. Humara mission hai — ek single digital card se sab facilities unlock karna, affordable prices pe.</p><h2>Why Bigchamp?</h2><p>Every athlete, student and army aspirant deserves access to quality gear, safe stays, and recovery support. Bigchamp delivers all three in one membership.</p>",
                    },
                }
            ],
            "updated_at": now,
        },
        # Page 3: Contact
        {
            "slug": "contact",
            "title": "Contact Us",
            "meta": {
                "title": "Contact Bigchamp",
                "description": "Get in touch",
            },
            "sections": [
                {
                    "id": "main",
                    "type": "contact",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "heading": "We're here to help",
                        "show_form": True,
                    },
                }
            ],
            "updated_at": now,
        },
        # Page 4: Membership
        {
            "slug": "membership",
            "title": "Membership",
            "meta": {
                "title": "Bigchamp Membership — ₹100",
                "description": "11 months of benefits",
            },
            "sections": [
                {
                    "id": "hero",
                    "type": "hero",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "title": "The Bigchamp Card",
                        "subtitle": "₹100 | 11 Months | 10% Cashback",
                        "primary_cta_text": "Get Card",
                        "primary_cta_link": "/register",
                    },
                }
            ],
            "updated_at": now,
        },
        # Page 5: Army Offer
        {
            "slug": "army-offer",
            "title": "Army & Defense Special",
            "meta": {
                "title": "Bigchamp Army Offer",
                "description": "Extra 10% off",
            },
            "sections": [
                {
                    "id": "hero",
                    "type": "hero",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "title": "Defense Personnel — Extra 10% Off",
                        "subtitle": "Verified Army/Defense IDs unlock additional 10% discount on all services.",
                        "primary_cta_text": "Verify Now",
                        "primary_cta_link": "/dashboard/army-verify",
                    },
                }
            ],
            "updated_at": now,
        },
        # Page 6: FAQ
        {
            "slug": "faq",
            "title": "FAQ",
            "meta": {
                "title": "Bigchamp FAQ",
                "description": "Answers to common questions",
            },
            "sections": [
                {
                    "id": "list",
                    "type": "faq_list",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "heading": "Frequently Asked Questions",
                    },
                }
            ],
            "updated_at": now,
        },
        # Page 7: Privacy Policy
        {
            "slug": "privacy-policy",
            "title": "Privacy Policy",
            "meta": {
                "title": "Privacy Policy — Bigchamp",
                "description": "Privacy policy and data protection terms",
            },
            "sections": [
                {
                    "id": "legal",
                    "type": "rich_text",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "html": "<h2>Privacy Policy</h2><p>Bigchamp is committed to protecting your personal data and privacy. We collect only required information like contact numbers and proof of identification for verified defense benefits.</p><p>We do not sell your personal data to third parties. All financial transactions are securely processed through regulated payment gateways.</p>",
                    },
                }
            ],
            "updated_at": now,
        },
        # Page 8: Terms & Conditions
        {
            "slug": "terms",
            "title": "Terms & Conditions",
            "meta": {
                "title": "Terms of Service — Bigchamp",
                "description": "Platform user agreement and conditions",
            },
            "sections": [
                {
                    "id": "legal",
                    "type": "rich_text",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "html": "<h2>Terms of Service</h2><p>By registering on the Bigchamp platform or acquiring the ₹100 digital membership card, you agree to comply with all membership guidelines and code of conduct at partner facilities.</p><p>Membership cards are non-transferable and valid for an 11-month active duration from issue date.</p>",
                    },
                }
            ],
            "updated_at": now,
        },
        # Page 9: Refund Policy
        {
            "slug": "refund-policy",
            "title": "Refund Policy",
            "meta": {
                "title": "Refund & Cancellation Policy — Bigchamp",
                "description": "Cancellation and refund policies",
            },
            "sections": [
                {
                    "id": "legal",
                    "type": "rich_text",
                    "order": 1,
                    "enabled": True,
                    "content": {
                        "html": "<h2>Refund & Cancellation Policy</h2><p>Digital membership activation fees are refundable within 48 hours of purchase if no partner discounts or wallet cashback have been redeemed.</p><p>Store product returns are accepted within 7 days of delivery for defective items in original packaging.</p>",
                    },
                }
            ],
            "updated_at": now,
        },
    ]

    seeded = 0
    skipped = 0
    for page in pages_data:
        slug = page["slug"]
        existing = await db.pages.find_one({"slug": slug})
        if existing:
            print(f"[SKIP] Page '{slug}' already exists.")
            skipped += 1
        else:
            await db.pages.insert_one(page)
            print(f"[SEED] Inserted page '{slug}' ({page['title']})")
            seeded += 1

    return {"seeded": seeded, "skipped": skipped}
