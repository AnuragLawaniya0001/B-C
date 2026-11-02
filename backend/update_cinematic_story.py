import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client.bigchamp_db

cinematic_doc = {
    'section_key': 'cinematic_story',
    'section_type': 'cinematic_story',
    'title': 'Birth of a Legend: English Willow Cricket Bat',
    'subtitle': 'SCROLL TO CONTROL THE BIRTH OF A LEGEND.',
    'badge_text': '4D Scroll-Controlled Cinematic Commerce',
    'media_type': 'video',
    'media_url': '/media/cinematic/master.mp4',
    'mobile_media_url': '/media/cinematic/master.mp4',
    'poster_url': '/media/cinematic/keyframes/scene_8.jpg',
    'cta_label': 'Explore Cricket Bats',
    'cta_link': '/store?category=GEARS',
    'order': 0,
    'display_order': 0,
    'is_active': True,
    'config': {
        'total_frames': 240,
        'fps': 24,
        'allow_skip': True,
        'skip_button_text': 'Skip to Store',
        'product_slug': 'english-willow-cricket-bat',
        'enable_sound': True,
        'intro': {
            'badge': 'Cinematic Interactive Experience',
            'title': 'Birth of a Legend',
            'subtitle': 'Every champion has a beginning. Scroll to take control of time and witness the craft.',
            'scroll_cue': 'Scroll to Control'
        },
        'scenes': [
            {
                'id': 1,
                'title': 'THE ORIGIN',
                'headline': 'EVERY LEGEND HAS A BEGINNING.',
                'subtitle': 'Raw, hand-selected cleft of English Willow bathed in single golden light.',
                'overlay_enabled': True,
                'start_frame': 0,
                'end_frame': 22
            },
            {
                'id': 2,
                'title': 'THE CRAFTSMANSHIP',
                'headline': 'CRAFTED WITH PRECISION.',
                'subtitle': 'Drawknives and chisels carve razor-thin willow ribbons in slow-motion artisan dedication.',
                'overlay_enabled': True,
                'start_frame': 23,
                'end_frame': 46
            },
            {
                'id': 3,
                'title': 'THE TRANSFORMATION',
                'headline': 'PERFECTION IN EVERY GRAIN.',
                'subtitle': 'Polished blade face reveals straight, flawless natural willow growth grains.',
                'overlay_enabled': True,
                'start_frame': 47,
                'end_frame': 70
            },
            {
                'id': 4,
                'title': 'THE IDENTITY',
                'headline': 'MADE FOR YOUR GAME.',
                'subtitle': 'Multi-piece cane handle with premium chevron grip and metallic gold BIGCHAMP branding.',
                'overlay_enabled': True,
                'start_frame': 71,
                'end_frame': 95
            },
            {
                'id': 5,
                'title': 'THE IMPACT',
                'headline': '',
                'subtitle': '',
                'is_climax': True,
                'overlay_enabled': False,
                'start_frame': 96,
                'end_frame': 122
            },
            {
                'id': 6,
                'title': 'THE STADIUM',
                'headline': 'NOW THE GAME BEGINS.',
                'subtitle': 'Blinding arena floodlights power up as the green championship pitch awaits.',
                'overlay_enabled': True,
                'start_frame': 123,
                'end_frame': 151
            },
            {
                'id': 7,
                'title': 'THE HERO',
                'headline': 'ENGLISH WILLOW.',
                'subtitle': 'BUILT FOR THE NEXT LEGEND.',
                'overlay_enabled': True,
                'start_frame': 152,
                'end_frame': 200
            },
            {
                'id': 8,
                'title': 'PURCHASE MOMENT',
                'headline': 'YOUR GAME. YOUR LEGACY.',
                'subtitle': 'Own the official match-certified bat crafted for professional tournament performance.',
                'overlay_enabled': True,
                'start_frame': 201,
                'end_frame': 239,
                'is_purchase': True
            }
        ]
    }
}

res = db.storefront_sections.update_one(
    {'$or': [{'section_key': 'cinematic_story'}, {'section_type': 'cinematic_story'}]},
    {'$set': cinematic_doc},
    upsert=True
)
print('Updated cinematic_story in MongoDB! Matched:', res.matched_count, 'Upserted:', res.upserted_id)

