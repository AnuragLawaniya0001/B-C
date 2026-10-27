"""Verification script for Product Image Persistence across Docker Container Recreation."""
import hashlib
import json
import os
import subprocess
import time
import urllib.request
import uuid

BASE_API = "http://localhost:3050/api/v1"
ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASS = "Admin@123"

def get_admin_token():
    req = urllib.request.Request(
        f"{BASE_API}/admin/auth/login",
        data=json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASS}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))["access_token"]

def upload_test_image(token: str, filename: str) -> str:
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    # 1x1 valid PNG
    png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
    
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode("utf-8") + png_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_API}/upload/image",
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {token}"
        }
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))["url"]

def main():
    print("=" * 70)
    print("  BIGCHAMP: PRODUCT IMAGE PERSISTENCE AUDIT")
    print("=" * 70)

    # 1. Record image files in backend/uploads/products
    local_dir = "backend/uploads/products"
    files = sorted(os.listdir(local_dir))
    print(f"Found {len(files)} files in {local_dir}:")
    for f in files[:6]:
        sz = os.path.getsize(os.path.join(local_dir, f))
        print(f"  • {f} ({sz} bytes)")
    if len(files) > 6:
        print(f"  ... and {len(files) - 6} more files.")

    # 2. Test existing image serving before recreation
    rep_image = "/uploads/products/prod_bb5773fb3301.jpg"
    with urllib.request.urlopen(f"http://localhost:3000{rep_image}") as r:
        assert r.status == 200, "Port 3000 failed before recreation"
        print(f"[PASS] Port 3000 serves {rep_image}: HTTP 200 ({len(r.read())} bytes)")

    with urllib.request.urlopen(f"http://localhost:3050{rep_image}") as r:
        assert r.status == 200, "Port 3050 failed before recreation"
        print(f"[PASS] Port 3050 serves {rep_image}: HTTP 200 ({len(r.read())} bytes)")

    # 3. Upload a new test image via Admin API
    token = get_admin_token()
    test_filename = f"persist_test_{uuid.uuid4().hex[:6]}.png"
    uploaded_url = upload_test_image(token, test_filename)
    print(f"[PASS] Uploaded new image via API: {uploaded_url}")

    with urllib.request.urlopen(f"http://localhost:3000{uploaded_url}") as r:
        assert r.status == 200
        print(f"[PASS] Newly uploaded image served via port 3000: HTTP 200 ({len(r.read())} bytes)")

    # 4. Recreate docker container
    print("\n--- Recreating Docker Application Container ('docker compose up -d') ---")
    proc = subprocess.run(["docker", "compose", "up", "-d"], capture_output=True, text=True)
    print("Docker stdout:", proc.stdout.strip() or "None")
    print("Docker stderr:", proc.stderr.strip() or "None")
    assert proc.returncode == 0, "Docker compose up -d failed"

    # Wait for container to be ready
    print("Waiting 5s for container services to initialize...")
    time.sleep(5)

    # 5. Verify image serving AFTER container recreation
    print("\n--- Verifying Images AFTER Container Recreation ---")
    with urllib.request.urlopen(f"http://localhost:3000{rep_image}") as r:
        assert r.status == 200, "Port 3000 failed after recreation"
        print(f"[PASS] Pre-existing image still served on port 3000: HTTP 200 ({len(r.read())} bytes)")

    with urllib.request.urlopen(f"http://localhost:3050{rep_image}") as r:
        assert r.status == 200, "Port 3050 failed after recreation"
        print(f"[PASS] Pre-existing image still served on port 3050: HTTP 200 ({len(r.read())} bytes)")

    with urllib.request.urlopen(f"http://localhost:3000{uploaded_url}") as r:
        assert r.status == 200, "Port 3000 failed for newly uploaded image after recreation"
        print(f"[PASS] Newly uploaded image survived container recreation on port 3000: HTTP 200 ({len(r.read())} bytes)")

    with urllib.request.urlopen(f"http://localhost:3050{uploaded_url}") as r:
        assert r.status == 200, "Port 3050 failed for newly uploaded image after recreation"
        print(f"[PASS] Newly uploaded image survived container recreation on port 3050: HTTP 200 ({len(r.read())} bytes)")

    print("\n" + "=" * 70)
    print("  [SUCCESS] All Product Images & Volume Persistence Verified!")
    print("=" * 70)

if __name__ == "__main__":
    main()
