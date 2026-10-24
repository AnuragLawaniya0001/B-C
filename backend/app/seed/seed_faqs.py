from datetime import datetime


async def seed_faqs(db) -> dict:
    """Seed categorized FAQs for customer and help center (idempotent)."""
    now = datetime.utcnow()
    faqs_data = [
        {
            "category": "membership",
            "order": 1,
            "active": True,
            "question": "What is the Bigchamp card?",
            "answer": "A ₹100 digital membership card valid for 11 months. It unlocks dormitory stays, physio clinics, sports gear discounts, and more.",
            "created_at": now,
        },
        {
            "category": "membership",
            "order": 2,
            "active": True,
            "question": "How long is the card valid?",
            "answer": "11 months from the date of activation. AutoPay renewal keeps it active.",
            "created_at": now,
        },
        {
            "category": "membership",
            "order": 3,
            "active": True,
            "question": "Do I get cashback?",
            "answer": "Yes — 10% (₹10) instant cashback credited to your Bigchamp wallet on card activation.",
            "created_at": now,
        },
        {
            "category": "cookey",
            "order": 1,
            "active": True,
            "question": "What is Cookey?",
            "answer": "Cookey is an exclusive members-only product priced at ₹100. Each purchase enters you into a weekly lucky draw.",
            "created_at": now,
        },
        {
            "category": "cookey",
            "order": 2,
            "active": True,
            "question": "Can I buy Cookey multiple times?",
            "answer": "Yes — but only 1 per week per member ID. After purchase, there's a 7-day cooling period.",
            "created_at": now,
        },
        {
            "category": "army",
            "order": 1,
            "active": True,
            "question": "How do I get the Army extra discount?",
            "answer": "Upload your Army/Defense ID in your dashboard under 'Army Verification'. Once approved, 10% extra discount auto-applies.",
            "created_at": now,
        },
        {
            "category": "payments",
            "order": 1,
            "active": True,
            "question": "How do I renew my card?",
            "answer": "AutoPay is auto-enabled. Or renew manually from Dashboard → Settings → AutoPay.",
            "created_at": now,
        },
        {
            "category": "payments",
            "order": 2,
            "active": True,
            "question": "How do I use my wallet balance?",
            "answer": "At checkout, your available wallet balance is automatically shown. Use it to pay part or full amount.",
            "created_at": now,
        },
        {
            "category": "dormitory",
            "order": 1,
            "active": True,
            "question": "Are dormitories verified?",
            "answer": "Yes — all partner dormitories are physically verified by Bigchamp team before listing.",
            "created_at": now,
        },
        {
            "category": "general",
            "order": 1,
            "active": True,
            "question": "How do I contact support?",
            "answer": "Email support@bigchamp.in or use the Contact page. Response within 24 hours.",
            "created_at": now,
        },
    ]

    seeded = 0
    skipped = 0
    for faq in faqs_data:
        existing = await db.faqs.find_one({"question": faq["question"]})
        if existing:
            print(f"[SKIP] FAQ '{faq['question'][:30]}...' already exists.")
            skipped += 1
        else:
            await db.faqs.insert_one(faq)
            print(f"[SEED] Inserted FAQ ({faq['category']}): '{faq['question'][:30]}...'")
            seeded += 1

    return {"seeded": seeded, "skipped": skipped}
