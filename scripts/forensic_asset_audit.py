import os
import sys
import re
import pymongo

sys.stdout.reconfigure(encoding='utf-8')

def run_audit():
    client = pymongo.MongoClient('mongodb://localhost:27017')
    db = client['bigchamp']

    print("=== 1. DATABASE IMAGE REFERENCES ===")
    sample_p = db.products.find_one()
    print("Sample Product Keys:", list(sample_p.keys()) if sample_p else "None")
    print("Sample Product Document:", sample_p)
    products = list(db.products.find({}))
    print(f"Total products in db: {len(products)}")
    for p in products[:15]:
        img = p.get('image_url') or p.get('image') or p.get('images') or p.get('media_url') or p.get('thumbnail')
        print(f"Product: {p.get('name')} | Cat: {p.get('category')} | Image: {img}")

    banners = list(db.banners.find({}))
    print(f"\nTotal banners in db: {len(banners)}")
    for b in banners:
        print(f"Banner: {b.get('title')} | Pos: {b.get('position')} | Image: {b.get('image_url')}")

    sections = list(db.storefront_sections.find({}))
    print(f"\nTotal storefront sections in db: {len(sections)}")
    for s in sections:
        print(f"Section: {s.get('section_id')} | Type: {s.get('section_type')} | Media: {s.get('media_url')} | Poster: {s.get('poster_url')}")

    popups = list(db.promotional_popups.find({}))
    print(f"\nTotal promotional popups in db: {len(popups)}")
    for pop in popups:
        print(f"Popup: {pop.get('popup_id')} | Name: {pop.get('name')} | Media: {pop.get('media_url')}")

    media = list(db.media_assets.find({}))
    print(f"\nTotal registered media assets in db: {len(media)}")
    for m in media:
        print(f"Media: {m.get('media_id')} | Name: {m.get('display_name')} | Type: {m.get('media_type')} | URL: {m.get('url')}")

    print("\n=== 2. LOCAL FRONTEND/PUBLIC FILES ===")
    pub_dir = os.path.abspath('frontend/public')
    if os.path.exists(pub_dir):
        for root, dirs, files in os.walk(pub_dir):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.svg', '.mp4', '.webm')):
                    rel = os.path.relpath(os.path.join(root, f), pub_dir).replace('\\', '/')
                    sz = os.path.getsize(os.path.join(root, f))
                    print(f"Public file: /{rel} ({sz} bytes)")

    print("\n=== 3. BACKEND UPLOAD FILES ===")
    up_dir = os.path.abspath('backend/uploads')
    if os.path.exists(up_dir):
        for root, dirs, files in os.walk(up_dir):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.svg', '.mp4', '.webm')):
                    rel = os.path.relpath(os.path.join(root, f), up_dir).replace('\\', '/')
                    sz = os.path.getsize(os.path.join(root, f))
                    print(f"Upload file: /uploads/{rel} ({sz} bytes)")

    print("\n=== 4. HARDCODED REFERENCES IN FRONTEND SRC ===")
    src_dir = os.path.abspath('frontend/src')
    img_pattern = re.compile(r'["\'](/images/[^"\']+|/uploads/[^"\']+|\.\.?/[^"\']+\.(?:png|jpg|jpeg|webp|svg|mp4))["\']')
    found_refs = set()
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            if f.endswith(('.jsx', '.js', '.css')):
                fpath = os.path.join(root, f)
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    matches = img_pattern.findall(content)
                    for m in matches:
                        rel_file = os.path.relpath(fpath, src_dir).replace('\\', '/')
                        found_refs.add((rel_file, m))

    for component, ref in sorted(found_refs):
        print(f"Component: {component} -> Ref: {ref}")

if __name__ == '__main__':
    run_audit()
