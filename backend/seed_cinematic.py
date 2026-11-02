import asyncio
from app.core.database import db

async def seed_cinematic():
    existing = await db.storefront_sections.find_one({'section_key': 'cinematic_story'})
    scenes_data = [
        {
            'title': 'THE BEGINNING',
            'subtitle': 'From the undisturbed forests of England, selected master willow wood arrives.',
            'tag': 'EVERY LEGEND HAS A BEGINNING.',
            'image': '/images/cinematic/scene1_beginning.jpg',
            'video_url': '/images/cinematic/scene1_beginning_mobile.jpg',
            'badge': 'Mystery, anticipation and craftsmanship',
        },
        {
            'title': 'THE CRAFT',
            'subtitle': 'Hand-carved with traditional drawknives by master artisans with decades of touch.',
            'tag': 'CRAFTED WITH PRECISION.',
            'image': '/images/cinematic/scene2_craft.jpg',
            'video_url': '',
            'badge': 'Raw craftsmanship, dedication and strength',
        },
        {
            'title': 'THE TRANSFORMATION',
            'subtitle': 'Hand-pressed and finely contoured to reveal 8–10 straight, unblemished willow grains.',
            'tag': 'PERFECTION IN EVERY GRAIN.',
            'image': '/images/cinematic/scene3_transformation.jpg',
            'video_url': '',
            'badge': 'Luxury, craftsmanship and premium quality',
        },
        {
            'title': 'IDENTITY',
            'subtitle': 'Fitted with multiple-piece cane handle and wrapped with high-tension chevron grip.',
            'tag': 'MADE FOR YOUR GAME.',
            'image': '/images/cinematic/scene4_identity.jpg',
            'video_url': '',
            'badge': 'Identity, attention to detail and brand connection',
        },
        {
            'title': 'THE IMPACT',
            'subtitle': 'Climax: explosive kinetic velocity at 10,000 frames per second.',
            'tag': '',
            'image': '/images/cinematic/scene5_impact.jpg',
            'video_url': '/images/cinematic/scene5_impact_mobile.jpg',
            'badge': 'The Climax',
        },
        {
            'title': 'THE STADIUM',
            'subtitle': 'Under blinding arena floodlights, ready for the moments that define generations.',
            'tag': 'NOW THE GAME BEGINS.',
            'image': '/images/cinematic/scene6_stadium.jpg',
            'video_url': '',
            'badge': 'Epic, ambition and tournament glory',
        },
        {
            'title': 'THE HERO',
            'subtitle': 'BUILT FOR THE NEXT LEGEND.',
            'tag': 'ENGLISH WILLOW.',
            'image': '/images/cinematic/scene7_hero.jpg',
            'video_url': '/images/cinematic/scene7_hero_mobile.jpg',
            'badge': 'Commercial luxury trophy',
        },
        {
            'title': 'PURCHASE MOMENT',
            'subtitle': 'Own the official match-certified bat crafted for professional tournament performance.',
            'tag': 'YOUR GAME. YOUR LEGACY.',
            'image': '/images/cinematic/scene8_purchase.jpg',
            'video_url': '/images/cinematic/scene8_purchase_mobile.jpg',
            'badge': 'Live Purchase Experience',
        },
    ]

    doc = {
        'section_key': 'cinematic_story',
        'section_type': 'cinematic_story',
        'title': 'Birth of a Legend — English Willow Cricket Bat',
        'subtitle': '8-Scene Scroll-Controlled Cinematic Story',
        'badge_text': 'Cinematic Experience',
        'media_type': 'image',
        'media_url': '/images/cinematic/scene7_hero.jpg',
        'poster_url': '/images/cinematic/scene1_beginning.jpg',
        'cta_label': 'Explore Catalog',
        'cta_link': '/store',
        'secondary_cta_label': 'Buy English Willow',
        'secondary_cta_link': '/store/english-willow-cricket-bat',
        'items': scenes_data,
        'product_ids': ['english-willow-cricket-bat'],
        'order': 0,
        'is_active': True,
        'config': {
            'autoplay_sound': False,
            'duration_scroll_vh': 750,
            'show_story': True,
        }
    }

    if existing:
        await db.storefront_sections.update_one({'_id': existing['_id']}, {'$set': doc})
        print('Updated cinematic_story in storefront_sections')
    else:
        # Move order of others down if needed, put cinematic_story first
        await db.storefront_sections.insert_one(doc)
        print('Inserted cinematic_story into storefront_sections')

if __name__ == '__main__':
    asyncio.run(seed_cinematic())

