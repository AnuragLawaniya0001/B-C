import urllib.request
import json

def check():
    res = urllib.request.urlopen("http://localhost:3050/api/v1/storefront/sections")
    sections = json.loads(res.read().decode('utf-8'))
    print(f"Total active storefront sections: {len(sections)}")
    for s in sections:
        print(f"[{s.get('section_type')}] media_url={s.get('media_url')} | poster_url={s.get('poster_url')} | items={len(s.get('items', []))}")

if __name__ == "__main__":
    check()
