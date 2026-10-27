import urllib.request
import json

def run_audit():
    print("=== 1. STOREFRONT SECTIONS ===")
    try:
        req = urllib.request.urlopen('http://localhost:3050/api/v1/storefront/sections')
        sections = json.loads(req.read().decode('utf-8'))
        print(f"Total sections: {len(sections)}")
        for s in sections:
            print(f"\n[SECTION] Key: {s.get('section_key')} | Type: {s.get('section_type')} | Title: {s.get('title')}")
            print(f"  Order: {s.get('order')} | Active: {s.get('is_active')}")
            print(f"  Media Type: {s.get('media_type')}")
            print(f"  Media URL:  {s.get('media_url')}")
            print(f"  Poster URL: {s.get('poster_url')}")
            items = s.get('items') or []
            print(f"  Items: {len(items)}")
            for idx, item in enumerate(items):
                print(f"    Item {idx+1}: {item.get('title')} | image: {item.get('image')} | link: {item.get('link')}")
            if s.get('product_ids'):
                print(f"  Curated Product IDs: {s.get('product_ids')}")
    except Exception as e:
        print(f"Error fetching sections: {e}")

    print("\n=== 2. CATEGORIES ===")
    try:
        req = urllib.request.urlopen('http://localhost:3050/api/v1/categories')
        cats = json.loads(req.read().decode('utf-8'))
        print(f"Total categories: {len(cats)}")
        for c in cats:
            print(f"  Category: {c.get('name')} | Slug: {c.get('slug')} | Order: {c.get('order')} | Product Count: {c.get('product_count')}")
    except Exception as e:
        print(f"Error fetching categories: {e}")

    print("\n=== 3. PRODUCTS ===")
    try:
        req = urllib.request.urlopen('http://localhost:3050/api/v1/products?limit=100')
        prods = json.loads(req.read().decode('utf-8'))
        print(f"Total products: {len(prods)}")
        for p in prods:
            imgs = p.get('images') or []
            print(f"  [{p.get('category')}] {p.get('name')} (Price: Rs. {(p.get('price_paise') or 0)/100}) - {len(imgs)} images: {imgs}")
    except Exception as e:
        print(f"Error fetching products: {e}")

    print("\n=== 4. MEDIA DOCUMENTS IN DB ===")
    try:
        import sys, os, asyncio
        sys.path.insert(0, os.path.abspath('backend'))
        from app.core.database import db
        async def check_media():
            count = await db.media.count_documents({})
            print(f"Total media documents in db.media: {count}")
            cursor = db.media.find({}).sort('created_at', -1)
            async for m in cursor:
                print(f"  [{m.get('media_type')}] {m.get('title') or m.get('filename')} | ID: {m.get('_id')} | URL: {m.get('url')}")
        asyncio.run(check_media())
    except Exception as e:
        print(f"Error checking db.media: {e}")

if __name__ == '__main__':
    run_audit()
