import sys
import io
import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

BASE_URL = "http://localhost:3000/api/v1"
ADMIN_TOKEN = None

# Track test results
results = []


def record_result(name: str, passed: bool, message: str = ""):
    status = "PASS" if passed else "FAIL"
    results.append({"name": name, "status": status, "message": message})
    print(f"[{status}] {name} - {message}")


def make_request(
    path: str,
    method: str = "GET",
    data: dict = None,
    headers: dict = None,
    files: dict = None,
):
    url = f"{BASE_URL}{path}"
    headers = headers or {}

    if files:
        # Multipart upload boundary
        boundary = "----WebKitFormBoundaryBigchampPhase63"
        body = bytearray()
        for field, (filename, file_bytes, mime) in files.items():
            body.extend(f"--{boundary}\r\n".encode())
            body.extend(
                f'Content-Disposition: form-data; name="{field}"; filename="{filename}"\r\n'.encode()
            )
            body.extend(f"Content-Type: {mime}\r\n\r\n".encode())
            body.extend(file_bytes)
            body.extend(b"\r\n")

        if data:
            for k, v in data.items():
                body.extend(f"--{boundary}\r\n".encode())
                body.extend(
                    f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode()
                )
                body.extend(str(v).encode())
                body.extend(b"\r\n")

        body.extend(f"--{boundary}--\r\n".encode())
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        req = urllib.request.Request(
            url, data=bytes(body), headers=headers, method=method
        )
    else:
        req_data = None
        if data is not None:
            req_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(
            url, data=req_data, headers=headers, method=method
        )

    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}
    except Exception as e:
        return 500, {"detail": str(e)}


def test_admin_login():
    global ADMIN_TOKEN
    status, body = make_request(
        "/admin/auth/login",
        method="POST",
        data={"email": "admin@bigchamp.in", "password": "Admin@123"},
    )
    if status == 200 and "access_token" in body:
        ADMIN_TOKEN = body["access_token"]
        record_result(
            "Admin Login", True, "Successfully authenticated as superadmin"
        )
    else:
        ADMIN_TOKEN = body.get("token") or "mock_admin_token"
        record_result(
            "Admin Login",
            status == 200,
            f"Response status {status}: {body}",
        )


def test_public_storefront_sections():
    status, body = make_request("/storefront/sections")
    if status == 200 and isinstance(body, list) and len(body) >= 5:
        # Verify ordering is sorted ascending
        orders = [s.get("display_order", 0) for s in body]
        is_sorted = orders == sorted(orders)
        record_result(
            "Public Storefront Sections",
            is_sorted,
            f"Returned {len(body)} sections in sorted display order: {orders[:5]}...",
        )
    else:
        record_result(
            "Public Storefront Sections",
            False,
            f"Unexpected response status {status}",
        )


def test_smart_promotional_popup_active():
    status, body = make_request("/promotions/popup/active")
    if status == 200 and "popup_id" in body and body.get("is_active"):
        record_result(
            "Smart Popup Active Endpoint",
            True,
            f"Returned active popup '{body.get('name')}' with code '{body.get('discount_code')}'",
        )
    else:
        record_result(
            "Smart Popup Active Endpoint", False, f"Status {status}: {body}"
        )


def test_smart_promotional_popup_rotation():
    # Pass last_seen_id to test rotation
    status, body = make_request(
        "/promotions/popup/active?last_seen_id=pop_festive_15"
    )
    if status == 200 and "popup_id" in body:
        record_result(
            "Smart Popup Fair Rotation",
            True,
            f"Rotated candidate campaign '{body.get('popup_id')}'",
        )
    else:
        record_result(
            "Smart Popup Fair Rotation", False, f"Status {status}: {body}"
        )


def test_promotions_offers_hub():
    status, body = make_request("/promotions/offers")
    has_keys = all(
        k in body
        for k in ["coupons", "membership", "cookey", "defense", "shipping"]
    )
    if status == 200 and has_keys:
        record_result(
            "Aggregated Offers Hub",
            True,
            f"Returned {len(body.get('coupons', []))} coupons, membership perks, cookey, defense, shipping",
        )
    else:
        record_result("Aggregated Offers Hub", False, f"Status {status}: {body}")


def test_campaign_video_http_serving():
    video_url = "http://localhost:3000/uploads/media/videos/hero_campaign_track.mp4"
    try:
        req = urllib.request.Request(video_url, method="HEAD")
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            is_video = "video" in content_type or "octet-stream" in content_type
            record_result(
                "Campaign Video HTTP Serving",
                resp.status == 200 and is_video,
                f"HTTP status {resp.status}, Content-Type: {content_type}",
            )
    except Exception as e:
        record_result(
            "Campaign Video HTTP Serving",
            False,
            f"Failed to fetch video: {str(e)}",
        )


def test_campaign_poster_http_serving():
    poster_url = "http://localhost:3000/uploads/media/images/hero_campaign_banner_1793006420241.jpg"
    try:
        req = urllib.request.Request(poster_url, method="HEAD")
        with urllib.request.urlopen(req) as resp:
            record_result(
                "Campaign Poster HTTP Serving",
                resp.status == 200,
                f"HTTP status {resp.status}, Content-Type: {resp.headers.get('Content-Type')}",
            )
    except Exception as e:
        record_result(
            "Campaign Poster HTTP Serving",
            False,
            f"Failed to fetch poster: {str(e)}",
        )


def test_media_upload_validation():
    # 1. Invalid file extension / signature test
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00This is an executable payload"
    status, body = make_request(
        "/media/upload",
        method="POST",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
        files={
            "file": (
                "malicious.exe",
                fake_exe,
                "application/x-msdownload",
            )
        },
        data={"display_name": "Bad File"},
    )
    # Server must reject unsupported MIME or bad signature with 400 or 401
    rejected = status in (400, 415, 422)
    record_result(
        "Media Upload Security Validation",
        rejected,
        f"Server correctly rejected executable MIME (Status {status})",
    )


def test_media_usage_inspection():
    # Inspect usage of hero video asset
    status, body = make_request(
        "/media/med_vid_hero_01/usage",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    if status == 200 and "is_in_use" in body:
        record_result(
            "Media Usage Inspection",
            body.get("is_in_use") is True,
            f"Detected in_use={body.get('is_in_use')}, {body.get('total_references')} active reference(s)",
        )
    else:
        record_result(
            "Media Usage Inspection",
            False,
            f"Status {status}: {body}",
        )


def test_media_delete_protection():
    # Deleting an asset in active usage should return 409 Conflict
    status, body = make_request(
        "/media/med_vid_hero_01",
        method="DELETE",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    is_protected = status == 409
    record_result(
        "Media Delete Protection",
        is_protected,
        f"Server protected active media from deletion (Status {status})",
    )


def main():
    print("=" * 70)
    print("BIGCHAMP Phase 6.3 - End-to-End Verification Test Suite")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 70)

    test_admin_login()
    test_public_storefront_sections()
    test_smart_promotional_popup_active()
    test_smart_promotional_popup_rotation()
    test_promotions_offers_hub()
    test_campaign_video_http_serving()
    test_campaign_poster_http_serving()
    test_media_upload_validation()
    test_media_usage_inspection()
    test_media_delete_protection()

    print("=" * 70)
    passed_count = sum(1 for r in results if r["status"] == "PASS")
    total_count = len(results)
    print(f"SUMMARY: {passed_count}/{total_count} tests PASSED")
    print("=" * 70)

    if passed_count == total_count:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
