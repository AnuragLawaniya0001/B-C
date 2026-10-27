import asyncio
import os
import sys
import json
from motor.motor_asyncio import AsyncIOMotorClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=== Phase 7.0 Baseline Inspection ===")
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['bigchamp']
    
    # 1. Categories
    cats = await db['categories'].find({}, {'_id': 0}).to_list(100)
    print(f"\n[Categories] Total: {len(cats)}")
    for c in cats:
        print(f"  - {c.get('name')} (slug: {c.get('slug')}, active: {c.get('active')})")
        
    # 2. Products
    prods = await db['products'].find({}, {'_id': 0}).to_list(100)
    print(f"\n[Products] Total: {len(prods)}")
    for p in prods[:10]:
        imgs = p.get('images', [])
        first_img = imgs[0] if imgs else 'None'
        print(f"  - {p.get('name')}: Price=Rs.{p.get('price')} (orig={p.get('original_price')}), Stock={p.get('stock')}, Cat={p.get('category')}, Img={first_img}")
        
    # 3. Storefront Sections
    sections = await db['storefront_sections'].find({}, {'_id': 0}).sort("order", 1).to_list(100)
    print(f"\n[Storefront Sections] Total: {len(sections)}")
    for s in sections:
        cfg = s.get('config', {})
        print(f"  - Order {s.get('order')}: [{s.get('section_key')}] '{s.get('title')}' (active: {s.get('is_active')}, media: {s.get('media_url') or cfg.get('media_url')})")
        
    # 4. Media Assets
    total_media = await db['media_assets'].count_documents({})
    print(f"\n[Media Studio Assets] Total: {total_media}")
    
    # 5. Business Settings
    settings = await db['settings'].find_one({"key": "business_rules"})
    if settings:
        print(f"\n[Business Rules Settings] Free delivery threshold: Rs.{settings.get('free_delivery_threshold_paise', 0)//100}, Member discount: {settings.get('default_member_discount_percent')}%")
    else:
        print("\n[Business Rules Settings] No explicit business_rules document found.")

if __name__ == '__main__':
    asyncio.run(main())
