import asyncio
import json
import urllib.request
import websockets
import subprocess
import time

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
prof = f"scratch/edge_debug_{int(time.time())}"
proc = subprocess.Popen([
    EDGE_PATH, "--headless=new", "--disable-gpu", "--no-sandbox",
    "--remote-debugging-port=9230", f"--user-data-dir={prof}", "about:blank"
])

async def debug():
    await asyncio.sleep(2.5)
    with urllib.request.urlopen("http://localhost:9230/json") as r:
        ws_url = json.loads(r.read().decode())[0]["webSocketDebuggerUrl"]
    async with websockets.connect(ws_url) as ws:
        async def call(mid, method, params=None):
            p = {"id": mid, "method": method}
            if params: p["params"] = params
            await ws.send(json.dumps(p))
            while True:
                resp = json.loads(await ws.recv())
                if resp.get("id") == mid: return resp

        await call(1, "Page.enable")
        await call(2, "Runtime.enable")
        await call(3, "Page.navigate", {"url": "http://localhost:3000/"})
        
        t_end = time.time() + 5
        logs = []
        while time.time() < t_end:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=0.5)
                msg = json.loads(raw)
                m = msg.get("method")
                if m in ("Runtime.consoleAPICalled", "Runtime.exceptionThrown"):
                    logs.append(msg)
            except asyncio.TimeoutError:
                pass
        
        eval_script = """(() => {
            const v = document.querySelector('video');
            const sections = Array.from(document.querySelectorAll('section')).map(s => s.className);
            return {
                hasVideo: !!v,
                videoSrc: v ? (v.currentSrc || v.src) : null,
                videoPaused: v ? v.paused : true,
                sections: sections,
                text: document.body.innerText.substring(0, 300)
            };
        })()"""
        r = await call(99, "Runtime.evaluate", {"expression": eval_script, "returnByValue": True})
        val = r.get("result", {}).get("result", {}).get("value", {})
        print("DOM State:", json.dumps(val, indent=2))
        print(f"Browser Logs Count: {len(logs)}")
        for l in logs:
            print("LOG:", json.dumps(l))

if __name__ == '__main__':
    try:
        asyncio.run(debug())
    finally:
        proc.terminate()
