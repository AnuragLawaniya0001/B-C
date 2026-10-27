import os
import subprocess
import time
import json
import base64
import urllib.request
import asyncio
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

USER_DATA = os.path.abspath(r"scratch\cdp_edge_profile_phase63")
os.makedirs(USER_DATA, exist_ok=True)
OUT_DIR = os.path.abspath(r"docs\frontend\screenshots")
os.makedirs(OUT_DIR, exist_ok=True)


async def login_admin(ws):
    """Authenticate admin in browser localStorage so admin pages render immediately."""
    try:
        # Get token from API
        req_data = json.dumps(
            {"email": "admin@bigchamp.in", "password": "Admin@123"}
        ).encode("utf-8")
        req = urllib.request.Request(
            "http://localhost:3000/api/v1/admin/auth/login",
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            token = data.get("access_token")
            user = data.get("user")

        if token:
            script = f"""
            localStorage.setItem('bigchamp_admin_token', '{token}');
            localStorage.setItem('bigchamp_admin_user', JSON.stringify({json.dumps(user)}));
            """
            await ws.send(
                json.dumps(
                    {
                        "id": 100,
                        "method": "Runtime.evaluate",
                        "params": {"expression": script},
                    }
                )
            )
            await ws.recv()
            print("Injected admin authentication credentials into browser context.")
    except Exception as e:
        print(f"Admin login injection notice: {e}")


async def capture_page(
    ws_url, page_url, out_path, width=1440, height=2400, delay=3.0, is_admin=False
):
    try:
        async with websockets.connect(
            ws_url, max_size=35 * 1024 * 1024
        ) as ws:
            # Enable Page and Network with cache disabled
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({"id": 11, "method": "Network.enable"}))
            await ws.recv()
            await ws.send(
                json.dumps(
                    {
                        "id": 12,
                        "method": "Network.setCacheDisabled",
                        "params": {"cacheDisabled": True},
                    }
                )
            )
            await ws.recv()

            # Set viewport
            await ws.send(
                json.dumps(
                    {
                        "id": 2,
                        "method": "Emulation.setDeviceMetricsOverride",
                        "params": {
                            "width": width,
                            "height": height,
                            "deviceScaleFactor": 1,
                            "mobile": width < 600,
                        },
                    }
                )
            )
            await ws.recv()

            if is_admin:
                # First visit origin to set localStorage
                await ws.send(
                    json.dumps(
                        {
                            "id": 99,
                            "method": "Page.navigate",
                            "params": {"url": "http://localhost:3001/"},
                        }
                    )
                )
                await ws.recv()
                await asyncio.sleep(1.0)
                await login_admin(ws)

            # Navigate to target page
            print(f"Navigating to {page_url}...")
            await ws.send(
                json.dumps(
                    {
                        "id": 3,
                        "method": "Page.navigate",
                        "params": {"url": page_url},
                    }
                )
            )
            await ws.recv()

            # Wait for React to fetch and render
            await asyncio.sleep(delay)

            # Capture screenshot
            print(f"Capturing {out_path} ({width}x{height})...")
            await ws.send(
                json.dumps(
                    {
                        "id": 4,
                        "method": "Page.captureScreenshot",
                        "params": {
                            "format": "png",
                            "captureBeyondViewport": True,
                        },
                    }
                )
            )

            while True:
                msg = await ws.recv()
                resp = json.loads(msg)
                if resp.get("id") == 4:
                    img_data = base64.b64decode(resp["result"]["data"])
                    with open(out_path, "wb") as f:
                        f.write(img_data)
                    print(f"Saved: {out_path} ({len(img_data)} bytes)")
                    break
    except Exception as e:
        print(f"Error capturing {page_url}: {e}")


async def main():
    subprocess.run(["taskkill", "/F", "/IM", "msedge.exe"], capture_output=True)
    time.sleep(1)

    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={USER_DATA}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-gpu",
        "--no-sandbox",
        "about:blank",
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        with urllib.request.urlopen("http://localhost:9222/json") as r:
            tabs = json.loads(r.read().decode())
        ws_url = tabs[0]["webSocketDebuggerUrl"]
        print(f"Connected to Edge CDP: {ws_url}")

        targets = [
            # 1. Uncluttered Storefront Homepage Desktop
            (
                "http://localhost:3000/",
                os.path.join(
                    OUT_DIR, "01_homepage_desktop_uncluttered_1440.png"
                ),
                1440,
                2600,
                2.5,
                False,
            ),
            # 2. Uncluttered Storefront Homepage Mobile
            (
                "http://localhost:3000/",
                os.path.join(
                    OUT_DIR, "02_homepage_mobile_uncluttered_390.png"
                ),
                390,
                2600,
                2.5,
                False,
            ),
            # 3. Dedicated Offers Hub Page
            (
                "http://localhost:3000/offers",
                os.path.join(OUT_DIR, "03_dedicated_offers_page.png"),
                1440,
                1800,
                2.5,
                False,
            ),
            # 4. Smart Promotional Popup Modal (wait 4.5s for 3s trigger delay)
            (
                "http://localhost:3000/",
                os.path.join(OUT_DIR, "04_smart_promotional_popup_modal.png"),
                1440,
                1400,
                4.8,
                False,
            ),
            # 5. Admin Media Studio Desktop
            (
                "http://localhost:3001/media-library",
                os.path.join(OUT_DIR, "05_admin_media_studio.png"),
                1440,
                1600,
                3.0,
                True,
            ),
            # 6. Admin Storefront Homepage Builder
            (
                "http://localhost:3001/storefront-builder",
                os.path.join(OUT_DIR, "06_admin_homepage_builder.png"),
                1440,
                1800,
                3.0,
                True,
            ),
            # 7. Admin Smart Popups Manager
            (
                "http://localhost:3001/marketing-popups",
                os.path.join(OUT_DIR, "07_admin_smart_popups_manager.png"),
                1440,
                1600,
                3.0,
                True,
            ),
            # 8. Cart Page with Active Store Offers
            (
                "http://localhost:3000/cart",
                os.path.join(OUT_DIR, "08_cart_checkout_offers.png"),
                1440,
                1400,
                2.5,
                False,
            ),
        ]

        for page_url, out_path, w, h, delay, is_admin in targets:
            await capture_page(
                ws_url, page_url, out_path, w, h, delay, is_admin
            )

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        print("Edge CDP closed.")


if __name__ == "__main__":
    asyncio.run(main())
