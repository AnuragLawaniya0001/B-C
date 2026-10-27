import os
import sys
import json
import time
import base64
import urllib.request
import subprocess
import asyncio
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

USER_DATA = os.path.abspath(r"scratch\cdp_shot_verify")
os.makedirs(USER_DATA, exist_ok=True)
OUT_IMG = os.path.abspath(r"scratch\hero_updated_screenshot.png")

async def capture():
    cdp_port = 9235
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--no-first-run",
        "--no-default-browser-check",
        "--autoplay-policy=no-user-gesture-required",
        f"--remote-debugging-port={cdp_port}",
        f"--user-data-dir={USER_DATA}",
        "about:blank",
    ]
    proc = subprocess.Popen(cmd)
    await asyncio.sleep(3.0)

    try:
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
                    data = json.loads(raw)
                    if data.get("id") == req_id:
                        return data

            await call_cdp(1, "Emulation.setDeviceMetricsOverride", {
                "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })
            await call_cdp(2, "Page.enable")
            await call_cdp(3, "Page.navigate", {"url": "http://localhost:3000"})
            await asyncio.sleep(4.0)

            # Close popup if visible
            dismiss_script = """
            (() => {
                const closeBtn = document.querySelector('button[aria-label="Close modal"]') || 
                                 document.querySelector('.fixed button') || 
                                 document.querySelector('button:has(svg.lucide-x)');
                if (closeBtn) closeBtn.click();
            })()
            """
            await call_cdp(4, "Runtime.evaluate", {"expression": dismiss_script})
            await asyncio.sleep(1.0)

            # Check video state
            eval_script = """
            (() => {
                const video = document.querySelector('video');
                return {
                    hasVideo: !!video,
                    videoSrc: video ? (video.currentSrc || video.src) : null,
                    isPaused: video ? video.paused : true,
                    currentTime: video ? video.currentTime : 0,
                    style: video ? video.className : null
                };
            })()
            """
            v_info = await call_cdp(4, "Runtime.evaluate", {"expression": eval_script, "returnByValue": True})
            print("Video Info:", v_info.get("result", {}).get("result", {}).get("value"))

            # Scroll to seasonal banner
            await call_cdp(6, "Runtime.evaluate", {
                "expression": "window.scrollTo(0, 1400);"
            })
            await asyncio.sleep(1.5)

            OUT_SEASONAL = os.path.abspath(r"scratch\seasonal_updated_screenshot.png")
            shot_resp2 = await call_cdp(7, "Page.captureScreenshot", {"format": "png"})
            png_bytes2 = base64.b64decode(shot_resp2["result"]["data"])
            with open(OUT_SEASONAL, "wb") as f:
                f.write(png_bytes2)
            print(f"Seasonal screenshot saved to: {OUT_SEASONAL}")
    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(capture())
