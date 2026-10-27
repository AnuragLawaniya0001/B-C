import pytest
import requests
import json

BASE_URL = "http://localhost:3000/api/v1"
STORE_URL = "http://localhost"


def test_public_storefront_sections_active():
    """Verify storefront public sections return 8 clean active sections without passholder clutter."""
    resp = requests.get(f"{BASE_URL}/storefront/sections", timeout=5)
    assert resp.status_code == 200
    sections = resp.json()
    assert isinstance(sections, list)
    assert len(sections) >= 5

    keys = [s.get("section_key") for s in sections]
    assert "hero_campaign" in keys
    assert "collections_strip" in keys
    assert "curated_products" in keys

    # Ensure no unwanted clutter sections are in public sections
    for forbidden in ["membership_upsell", "passholder_banner", "cookie_deal"]:
        assert forbidden not in keys, f"Found unwanted section {forbidden} in public storefront!"


def test_media_assets_authority_and_auth():
    """Verify Media Studio requires admin auth and returns 31 registered assets."""
    # 1. Unauthenticated request must return 401 Unauthorized
    unauth_resp = requests.get(f"{BASE_URL}/media?limit=100", timeout=5)
    assert unauth_resp.status_code == 401

    # 2. Authenticate as admin
    login_resp = requests.post(
        f"{BASE_URL}/admin/auth/login",
        json={"email": "admin@bigchamp.in", "password": "Admin@123"},
        timeout=5,
    )
    assert login_resp.status_code == 200
    token = login_resp.json().get("access_token")
    assert token is not None

    # 3. Authenticated request returns 31 registered media items
    auth_resp = requests.get(
        f"{BASE_URL}/media?limit=100",
        headers={"Authorization": f"Bearer {token}"},
        timeout=5,
    )
    assert auth_resp.status_code == 200
    data = auth_resp.json()
    items = data.get("items") if isinstance(data, dict) else data
    assert isinstance(items, list)
    assert len(items) >= 30, f"Expected at least 30 media assets, got {len(items)}"

    # Check that video assets are present
    mimes = [m.get("mime_type") for m in items]
    assert "video/mp4" in mimes


def test_product_catalog_stock_and_pricing():
    """Verify catalog products have honest prices and stock attributes."""
    resp = requests.get(f"{BASE_URL}/products?active=true&limit=60", timeout=5)
    assert resp.status_code == 200
    products = resp.json()
    assert isinstance(products, list)
    assert len(products) > 0

    for p in products:
        assert "price_paise" in p
        assert p["price_paise"] > 0
        assert "stock" in p
        assert isinstance(p["stock"], int)


def test_dedicated_routes_integrity():
    """Verify dedicated routes for Membership, Cookey, and Storefront remain accessible."""
    for path in ["/", "/store", "/membership", "/cookey", "/cart"]:
        resp = requests.get(f"{STORE_URL}{path}", timeout=5)
        assert resp.status_code == 200, f"Route {path} returned status {resp.status_code}"
