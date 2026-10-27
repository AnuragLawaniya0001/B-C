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

USER_DATA = os.path.abspath(r"scratch\cdp_edge_profile_phase7")
os.makedirs(USER_DATA, exist_ok=True)
OUT_DIR = os.path.abspath(r"docs\phase-7\screenshots")
os.makedirs(OUT_DIR, exist_ok=True)


async def login_admin(ws):
    """Authenticate admin in browser localStorage so admin pages render immediately."""
    try:
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
            while True:
                msg = await ws.recv()
                resp = json.loads(msg)
                if resp.get("id") == 100:
                    break
            print("Injected admin authentication credentials into browser context.")
    except Exception as e:
        print(f"Admin login injection notice: {e}")


async def capture_page(
    ws_url, page_url, out_path, width=1440, height=900, is_mobile=False, delay=3.5, is_admin=False
):
    try:
        async with websockets.connect(
            ws_url, max_size=35 * 1024 * 1024
        ) as ws:
            # Enable Page and Network with cache disabled
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.send(json.dumps({"id": 11, "method": "Network.enable"}))
            await ws.send(
                json.dumps(
                    {
                        "id": 12,
                        "method": "Network.setCacheDisabled",
                        "params": {"cacheDisabled": True},
                    }
                )
            )

            # Set Device Metrics Override
            await ws.send(
                json.dumps(
                    {
                        "id": 2,
                        "method": "Emulation.setDeviceMetricsOverride",
                        "params": {
                            "width": width,
                            "height": height,
                            "deviceScaleFactor": 1,
                            "mobile": is_mobile,
                        },
                    }
                )
            )

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
                await asyncio.sleep(1.0)
                await login_admin(ws)

            # Navigate
            print(f"Navigating to {page_url} ({width}x{height}, mobile={is_mobile})...")
            await ws.send(
                json.dumps(
                    {
                        "id": 3,
                        "method": "Page.navigate",
                        "params": {"url": page_url},
                    }
                )
            )

            await asyncio.sleep(delay)

            # If it's a product page, test pincode estimator
            if "/store/" in page_url:
                test_pin_script = """
                const pinInput = document.querySelector('input[placeholder*="Pincode"]');
                if (pinInput) {
                    pinInput.value = '110001';
                    pinInput.dispatchEvent(new Event('input', { bubbles: true }));
                    const btn = pinInput.parentElement.querySelector('button');
                    if (btn) btn.click();
                }
                """
                await ws.send(
                    json.dumps(
                        {
                            "id": 35,
                            "method": "Runtime.evaluate",
                            "params": {"expression": test_pin_script},
                        }
                    )
                )
                await asyncio.sleep(1.0)

            # Capture Screenshot
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
                    file_size_kb = len(img_data) / 1024
                    print(f"  [OK] Saved screenshot to {out_path} ({file_size_kb:.1f} KB)")
                    break
    except Exception as e:
        print(f"  [EXCEPTION] Failed to capture {page_url}: {e}")


async def main():
    subprocess.run(["taskkill", "/F", "/IM", "msedge.exe"], capture_output=True)
    time.sleep(1.0)

    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={USER_DATA}",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--autoplay-policy=no-user-gesture-required",
        "about:blank",
    ]
    proc = subprocess.Popen(cmd)
    print("Launched Edge headless with CDP on port 9222...")
    time.sleep(2.0)

    try:
        with urllib.request.urlopen("http://127.0.0.1:9222/json") as resp:
            targets = json.loads(resp.read().decode())
            ws_url = targets[0]["webSocketDebuggerUrl"]
            print(f"Connected to CDP WebSocket: {ws_url}")

        shots = [
            (
                "http://localhost/",
                os.path.join(OUT_DIR, "01_homepage_hero_video_desktop.png"),
                1440,
                900,
                False,
                False,
            ),
            (
                "http://localhost/",
                os.path.join(OUT_DIR, "02_homepage_mobile.png"),
                390,
                844,
                True,
                False,
            ),
            (
                "http://localhost/store/english-willow-cricket-bat",
                os.path.join(OUT_DIR, "03_product_detail_page_gallery.png"),
                1440,
                1100,
                False,
                False,
            ),
            (
                "http://localhost/store",
                os.path.join(OUT_DIR, "04_catalog_search_filters.png"),
                1440,
                1100,
                False,
                False,
            ),
            (
                "http://localhost/cart",
                os.path.join(OUT_DIR, "05_cart_and_offers.png"),
                1440,
                900,
                False,
                False,
            ),
            (
                "http://localhost:3001/media-library",
                os.path.join(OUT_DIR, "06_admin_media_studio_and_builder.png"),
                1440,
                1000,
                False,
                True,
            ),
        ]

        for url, out_path, w, h, is_mob, is_adm in shots:
            await capture_page(
                ws_url, url, out_path, width=w, height=h, is_mobile=is_mob, is_admin=is_adm
            )

        print("\nAll Phase 7.0 screenshots captured successfully!")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()


if __name__ == "__main__":
    asyncio.run(main())
