import urllib.request
import json

def test():
    try:
        login_data = json.dumps({"email": "admin@bigchamp.in", "password": "Admin@123"}).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:3050/api/v1/admin/auth/login',
            data=login_data,
            headers={'Content-Type': 'application/json'}
        )
        res = urllib.request.urlopen(req)
        auth = json.loads(res.read().decode('utf-8'))
        token = auth.get('access_token')
        print(f"Admin auth success! Token acquired ({token[:15]}...)")

        req_media = urllib.request.Request(
            'http://localhost:3050/api/v1/media?limit=30',
            headers={'Authorization': f'Bearer {token}'}
        )
        media_res = urllib.request.urlopen(req_media)
        media_data = json.loads(media_res.read().decode('utf-8'))
        total = media_data.get('total', len(media_data.get('items', []))) if isinstance(media_data, dict) else len(media_data)
        items = media_data.get('items', media_data) if isinstance(media_data, dict) else media_data
        print(f"Total media items in Media Studio: {total}")
        for item in items:
            print(f" - [{item.get('media_type').upper()}] {item.get('title')} ({item.get('media_id')}) -> {item.get('url')[:65]}...")
    except Exception as e:
        print(f"Error testing admin media API: {e}")

if __name__ == '__main__':
    test()
