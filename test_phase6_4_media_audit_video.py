import os
import sys
import json
import time
import base64
import urllib.request
import subprocess
import asyncio
import requests
import websockets
from motor.motor_asyncio import AsyncIOMotorClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

USER_DATA = os.path.abspath(r"scratch\cdp_edge_profile_phase64")
os.makedirs(USER_DATA, exist_ok=True)
OUT_DIR = os.path.abspath(r"docs\frontend\screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

class Phase64TestSuite:
    def __init__(self):
        self.results = {}
        self.client = AsyncIOMotorClient("mongodb://localhost:27017")
        self.db = self.client["bigchamp"]

    def log(self, section, msg):
        print(f"[{section}] {msg}")

    # =========================================================================
    # Test 1: Asset Discovery and Media Studio Registration
    # =========================================================================
    async def test_asset_registration_and_idempotency(self):
        self.log("TEST 1", "Auditing db.media_assets registration and idempotency...")
        
        # Count current assets
        total_media = await self.db["media_assets"].count_documents({})
        self.log("TEST 1", f"Found {total_media} registered assets in Media Studio.")
        assert total_media >= 29, f"Expected at least 29 registered assets, got {total_media}"

        # Verify category distribution
        categories = await self.db["media_assets"].aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]).to_list(100)
        cat_map = {}
        for c in categories:
            k = str(c["_id"]).lower()
            cat_map[k] = cat_map.get(k, 0) + c["count"]
        self.log("TEST 1", f"Asset categories (normalized): {cat_map}")
        assert "product" in cat_map and cat_map["product"] >= 16, "Expected >=16 product images"
        assert "collection" in cat_map and cat_map["collection"] >= 4, "Expected >=4 collection images"
        assert "editorial" in cat_map and cat_map["editorial"] >= 3, "Expected >=3 editorial images"
        assert "campaign" in cat_map and cat_map["campaign"] >= 2, "Expected >=2 campaign assets"

        # Verify product references
        products = await self.db["products"].find({}, {"_id": 0, "id": 1, "images": 1, "name": 1}).to_list(100)
        matched_products = 0
        for p in products:
            img = p.get("images", [""])[0] if p.get("images") else ""
            if img:
                match = await self.db["media_assets"].find_one({"url": img})
                if match:
                    matched_products += 1
        self.log("TEST 1", f"Verified {matched_products}/{len(products)} products mapped to Media Studio records.")
        assert matched_products >= 15, "Catalog products must link to registered Media Studio assets"

        # Run migration script again to test idempotency
        res = subprocess.run([sys.executable, "scripts/migrate_register_storefront_assets.py"], capture_output=True, text=True)
        assert res.returncode == 0, f"Migration rerun failed: {res.stderr}"
        assert "0 newly registered" in res.stdout, f"Migration rerun was not idempotent! Output:\n{res.stdout}"
        self.log("TEST 1", "PASS: Migration is 100% idempotent with 0 duplicate assets created.")
        self.results["asset_registration"] = "PASS"

    # =========================================================================
    # Test 2: Video Encoding and Streaming Integrity
    # =========================================================================
    async def test_video_encoding_and_streaming(self):
        self.log("TEST 2", "Verifying H.264 video encoding & HTTP 206 byte-range streaming...")
        
        # 1. Probe hero video inside docker container
        cmd = [
            "docker", "exec", "bigchamp-app",
            "ffprobe", "-v", "error",
            "-show_entries", "stream=codec_name,width,height,pix_fmt",
            "-of", "default=noprint_wrappers=1",
            "/app/backend/uploads/media/videos/bigchamp_hero_campaign.mp4"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        assert res.returncode == 0, f"ffprobe error: {res.stderr}"
        out = res.stdout.strip()
        self.log("TEST 2", f"ffprobe stream metadata:\n{out}")
        assert "codec_name=h264" in out, "Video codec MUST be H.264"
        assert "width=1280" in out and "height=720" in out, "Resolution MUST be 1280x720"
        assert "pix_fmt=yuv" in out, "Pixel format MUST be YUV (web-standard)"

        # 2. HTTP Byte Range Request test
        video_url = "http://localhost:3000/uploads/media/videos/bigchamp_hero_campaign.mp4"
        r = requests.get(video_url, headers={"Range": "bytes=0-1024"}, timeout=5)
        self.log("TEST 2", f"HTTP Range Request -> Status: {r.status_code}, Content-Range: {r.headers.get('Content-Range')}")
        assert r.status_code == 206, f"Expected HTTP 206 Partial Content, got {r.status_code}"
        assert "bytes 0-1024/" in r.headers.get("Content-Range", ""), "Missing or invalid Content-Range header"
        assert len(r.content) == 1025, f"Expected 1025 bytes, got {len(r.content)}"
        
        self.log("TEST 2", "PASS: Video is authentic H.264 web standard and supports native byte-range seeking.")
        self.results["video_encoding_streaming"] = "PASS"

    # =========================================================================
    # Test 3: Homepage Merchandising & Clutter Removal
    # =========================================================================
    async def test_homepage_merchandising_and_routes(self):
        self.log("TEST 3", "Verifying storefront sections and dedicated offer routes...")

        # 1. Check sections API
        r = requests.get("http://localhost:3000/api/v1/storefront/sections", timeout=5)
        assert r.status_code == 200
        sections = r.json()
        section_types = [s.get("section_type") for s in sections]
        self.log("TEST 3", f"Published homepage section types: {section_types}")
        
        # Assert shopping-focused sections exist
        assert "hero_campaign" in section_types, "Hero campaign must be published"
        assert "collections_strip" in section_types, "Collections strip must be published"
        assert "curated_products" in section_types, "Curated products must be published"
        
        # Assert NO promotional clutter sections exist
        forbidden_sections = ["privilege_strip", "membership_promo", "cookey_banner", "army_offer_card"]
        for f in forbidden_sections:
            assert f not in section_types, f"Forbidden promotional clutter '{f}' found in published sections!"

        # 2. Verify dedicated routes still return 200
        dedicated_routes = ["/offers", "/membership", "/cookey", "/army-offer", "/store"]
        for route in dedicated_routes:
            res = requests.get(f"http://localhost:3000{route}", timeout=5)
            assert res.status_code == 200, f"Dedicated route {route} returned status {res.status_code}"
        self.log("TEST 3", "Verified all dedicated routes (/offers, /membership, /cookey, /army-offer, /store) return 200.")

        self.log("TEST 3", "PASS: Homepage sections are shopping-focused and dedicated routes are preserved.")
        self.results["homepage_merchandising"] = "PASS"

    # =========================================================================
    # Test 4: End-to-End Headless Edge Playback & Clutter Assertion via CDP
    # =========================================================================
    async def test_browser_cdp_verification(self):
        self.log("TEST 4", "Starting Edge headless with CDP for video playback and UI verification...")
        
        fresh_profile = os.path.abspath(f"scratch/cdp_prof_{int(time.time()*1000)}")
        os.makedirs(fresh_profile, exist_ok=True)
        cdp_port = 9228

        cmd = [
            EDGE_PATH,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--autoplay-policy=no-user-gesture-required",
            f"--remote-debugging-port={cdp_port}",
            f"--user-data-dir={fresh_profile}",
            "about:blank",
        ]
        proc = subprocess.Popen(cmd)
        await asyncio.sleep(2.5)

        try:
            # Query CDP target
            with urllib.request.urlopen(f"http://localhost:{cdp_port}/json", timeout=5) as r:
                tabs = json.loads(r.read().decode())
                ws_url = tabs[0]["webSocketDebuggerUrl"]

            async with websockets.connect(ws_url, max_size=35 * 1024 * 1024) as ws:
                async def call_cdp(req_id, method, params=None):
                    payload = {"id": req_id, "method": method}
                    if params:
                        payload["params"] = params
                    await ws.send(json.dumps(payload))
                    while True:
                        raw = await ws.recv()
                        resp = json.loads(raw)
                        if resp.get("id") == req_id:
                            return resp

                # 1. Enable Page and Network with cache disabled
                await call_cdp(1, "Page.enable")
                await call_cdp(2, "Network.enable")
                await call_cdp(3, "Network.setCacheDisabled", {"cacheDisabled": True})

                # Viewport: Desktop 1440x2200
                await call_cdp(4, "Emulation.setDeviceMetricsOverride", {
                    "width": 1440, "height": 2200, "deviceScaleFactor": 1, "mobile": False
                })

                # Navigate to Homepage
                self.log("TEST 4", "Navigating to http://localhost:3000/...")
                await call_cdp(5, "Page.navigate", {"url": "http://localhost:3000/"})

                # Polling loop: Wait for video element and metadata to load
                eval_script = """
                (() => {
                    const video = document.querySelector('video');
                    const allText = document.body.innerText;
                    return {
                        hasVideo: !!video,
                        videoSrc: video ? (video.currentSrc || video.src) : null,
                        videoWidth: video ? video.videoWidth : 0,
                        videoHeight: video ? video.videoHeight : 0,
                        isPaused: video ? video.paused : true,
                        currentTime: video ? video.currentTime : 0,
                        hasPassholderClutter: allText.includes('Annual Passholder Privilege'),
                        hasCookeyClutter: allText.includes('Weekly ₹100 Cookey token'),
                        hasArmyClutter: allText.includes('Extra 10% discount for Armed Forces')
                    };
                })()
                """
                res_data = {}
                for attempt in range(16):
                    await asyncio.sleep(0.5)
                    resp6 = await call_cdp(600 + attempt, "Runtime.evaluate", {"expression": eval_script, "returnByValue": True})
                    res_data = resp6.get("result", {}).get("result", {}).get("value", {})
                    if res_data.get("hasVideo") and res_data.get("videoWidth", 0) > 0:
                        break

                self.log("TEST 4", f"DOM Video & Clutter Evaluation: {json.dumps(res_data, indent=2)}")

                # Assertions
                assert res_data.get("hasVideo") == True, "Video element must be present in DOM"
                assert "bigchamp_hero_campaign.mp4" in res_data.get("videoSrc", "") or "hero_campaign_track.mp4" in res_data.get("videoSrc", ""), "Video src must point to campaign video"
                assert res_data.get("videoHeight") == 720 and res_data.get("videoWidth") >= 1280, f"Expected 720p video dimensions, got {res_data.get('videoWidth')}x{res_data.get('videoHeight')}"
                assert res_data.get("isPaused") == False, "Video should be actively playing (not paused)"
                assert res_data.get("currentTime") > 0, "Video playback time should be progressing"
                
                # Check clutter
                assert res_data.get("hasPassholderClutter") == False, "Passholder clutter found on homepage!"
                assert res_data.get("hasCookeyClutter") == False, "Cookey token clutter found on homepage!"
                assert res_data.get("hasArmyClutter") == False, "Armed Forces clutter found on homepage!"

                # Capture Desktop Screenshot
                shot_desktop = os.path.join(OUT_DIR, "01_homepage_desktop_uncluttered_video_playing.png")
                resp7 = await call_cdp(7, "Page.captureScreenshot", {"format": "png"})
                png_bytes = base64.b64decode(resp7["result"]["data"])
                with open(shot_desktop, "wb") as f:
                    f.write(png_bytes)
                self.log("TEST 4", f"Saved desktop screenshot: {shot_desktop}")

                # Viewport: Mobile 390x844
                await call_cdp(8, "Emulation.setDeviceMetricsOverride", {
                    "width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True
                })
                await asyncio.sleep(1.0)
                shot_mobile = os.path.join(OUT_DIR, "02_homepage_mobile_uncluttered.png")
                resp9 = await call_cdp(9, "Page.captureScreenshot", {"format": "png"})
                png_bytes = base64.b64decode(resp9["result"]["data"])
                with open(shot_mobile, "wb") as f:
                    f.write(png_bytes)
                self.log("TEST 4", f"Saved mobile screenshot: {shot_mobile}")

                # Reset to Desktop for Admin Media Studio & Offers Page
                await call_cdp(10, "Emulation.setDeviceMetricsOverride", {
                    "width": 1440, "height": 1000, "deviceScaleFactor": 1, "mobile": False
                })

                # Capture Dedicated Offers Page
                self.log("TEST 4", "Navigating to dedicated /offers page...")
                await call_cdp(11, "Page.navigate", {"url": "http://localhost:3000/offers"})
                await asyncio.sleep(3.0)
                shot_offers = os.path.join(OUT_DIR, "04_dedicated_offers_page.png")
                resp12 = await call_cdp(12, "Page.captureScreenshot", {"format": "png"})
                png_bytes = base64.b64decode(resp12["result"]["data"])
                with open(shot_offers, "wb") as f:
                    f.write(png_bytes)
                self.log("TEST 4", f"Saved dedicated offers page screenshot: {shot_offers}")

                # Inject Admin Auth and Capture Media Studio
                self.log("TEST 4", "Authenticating admin and navigating to /admin/media-library...")
                # Login API
                req_data = json.dumps({"email": "admin@bigchamp.in", "password": "Admin@123"}).encode("utf-8")
                req = urllib.request.Request("http://localhost:3000/api/v1/admin/auth/login", data=req_data, headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req) as resp:
                    tok_data = json.loads(resp.read().decode())
                    token = tok_data.get("access_token")
                    user = tok_data.get("user")
                
                await call_cdp(13, "Page.navigate", {"url": "http://localhost:3001/"})
                await asyncio.sleep(1.0)
                
                auth_script = f"""
                localStorage.setItem('bigchamp_admin_token', '{token}');
                localStorage.setItem('bigchamp_admin_user', JSON.stringify({json.dumps(user)}));
                """
                await call_cdp(14, "Runtime.evaluate", {"expression": auth_script})

                await call_cdp(15, "Page.navigate", {"url": "http://localhost:3001/media-library"})
                await asyncio.sleep(3.0)

                shot_admin = os.path.join(OUT_DIR, "03_admin_media_studio_all_migrated_assets.png")
                resp16 = await call_cdp(16, "Page.captureScreenshot", {"format": "png"})
                png_bytes = base64.b64decode(resp16["result"]["data"])
                with open(shot_admin, "wb") as f:
                    f.write(png_bytes)
                self.log("TEST 4", f"Saved Admin Media Studio screenshot: {shot_admin}")

            self.log("TEST 4", "PASS: Video playback confirmed, homepage uncluttered, and screenshots captured.")
            self.results["browser_cdp_verification"] = "PASS"

        finally:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except Exception:
                proc.kill()

    async def run_all(self):
        print("=======================================================================")
        print("          BIGCHAMP PHASE 6.4 COMPREHENSIVE VERIFICATION SUITE          ")
        print("=======================================================================")
        await self.test_asset_registration_and_idempotency()
        await self.test_video_encoding_and_streaming()
        await self.test_homepage_merchandising_and_routes()
        await self.test_browser_cdp_verification()
        print("=======================================================================")
        print("                          ALL TESTS PASSED!                            ")
        print(f"Results: {json.dumps(self.results, indent=2)}")
        print("=======================================================================")

if __name__ == "__main__":
    asyncio.run(Phase64TestSuite().run_all())
