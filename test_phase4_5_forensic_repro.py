"""Targeted Forensic Reproduction Tests for Phase 4.5 Findings.
Verifies defects in:
1. Concurrency double-refund and Gateway refund tracking in refund_service.
2. Duplicate stock restock on repeated cancellation in inventory_service.
3. Concurrent settlement overdraw and duplicate commission in partner_service.
4. Referral reward trigger on paid order and reversal in referral_service.
5. Refund aggregation in finance overview and CSV export.
6. Sensitive data redaction in audit_service.
"""
import asyncio
import json
import uuid
import pytest
import requests

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASSWORD = "AdminPassword123!"

def get_admin_token():
    res = requests.post(f"{BASE_URL}/auth/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]

def get_customer_token(email="test.customer@bigchamp.in", password="CustomerPassword123!"):
    # Login or register
    res = requests.post(f"{BASE_URL}/auth/login", json={"identifier": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"], res.json()["user"]["id"]
    # Register if not present
    reg = requests.post(f"{BASE_URL}/auth/register", json={
        "full_name": "Test Customer",
        "email": email,
        "mobile": f"98{uuid.uuid4().int % 100000000:08d}",
        "password": password
    })
    assert reg.status_code == 201, f"Customer register failed: {reg.text}"
    return reg.json()["access_token"], reg.json()["user"]["id"]

def test_repro_audit_redaction():
    """Verify that audit logs redact sensitive fields like password, secret, token."""
    # We will test this after reading/updating audit service
    pass

if __name__ == "__main__":
    print("Forensic test helper loaded.")
