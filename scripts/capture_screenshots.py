import os
import subprocess
import time

def find_browser():
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def capture(browser, url, output_path, width=1440, height=2200):
    abs_out = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(abs_out), exist_ok=True)
    cmd = [
        browser,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        f"--window-size={width},{height}",
        f"--screenshot={abs_out}",
        url
    ]
    print(f"Capturing: {url} ({width}x{height}) -> {abs_out}")
    try:
        res = subprocess.run(cmd, timeout=30, capture_output=True, text=True)
        if os.path.exists(abs_out):
            print(f"  Success: {os.path.getsize(abs_out)} bytes")
            return True
        else:
            print(f"  File not created. Retrying with --headless...")
            cmd[1] = "--headless"
            subprocess.run(cmd, timeout=30, capture_output=True, text=True)
            if os.path.exists(abs_out):
                print(f"  Success with --headless: {os.path.getsize(abs_out)} bytes")
                return True
    except Exception as e:
        print(f"  Error: {e}")
    return False

def main():
    browser = find_browser()
    if not browser:
        print("No headless browser found.")
        return

    print(f"Using browser: {browser}")
    out_dir = os.path.abspath(os.path.join("docs", "frontend", "screenshots"))

    targets = [
        ("http://localhost:3000/", os.path.join(out_dir, "01_homepage_desktop_1440.png"), 1440, 2800),
        ("http://localhost:3000/", os.path.join(out_dir, "02_homepage_mobile_390.png"), 390, 2800),
        ("http://localhost:3000/store", os.path.join(out_dir, "03_store_catalogue_1440.png"), 1440, 2200),
        ("http://localhost:3000/store?category=APPAREL", os.path.join(out_dir, "04_store_apparel_filtered.png"), 1440, 2000),
        ("http://localhost:3000/membership", os.path.join(out_dir, "05_membership_page.png"), 1440, 1800),
        ("http://localhost:3000/cookey", os.path.join(out_dir, "06_cookey_page.png"), 1440, 1800),
        ("http://localhost:3000/army-offer", os.path.join(out_dir, "07_army_offer_page.png"), 1440, 1800),
        ("http://localhost:3001/", os.path.join(out_dir, "08_admin_panel.png"), 1440, 1600),
    ]

    for url, path, w, h in targets:
        capture(browser, url, path, w, h)
        time.sleep(1)

if __name__ == "__main__":
    main()
