"""Phase 2A Automated Test Suite for Bigchamp: Product & Category Management.
Tests:
1. Admin-only authorization on product and category mutations.
2. Category CRUD, slug generation, duplicate prevention, and product count tracking.
3. Product input validation (server-side price >= 0, stock >= 0, required fields).
4. Product creation and persistence in MongoDB.
5. Public product listing and single product detail data flow.
6. Updating product prices, stock, and images, and verifying immediate reflection.
7. Product archive/unarchive handling.
8. Product image upload endpoint with MIME and extension verification.
9. Data integrity protection (in-use category soft-archival vs destructive deletion).
"""
import json
import os
import sys
import urllib.request
import urllib.error

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_API = "http://localhost:3050/api/v1"


def http_request(method, url, data=None, token=None, headers_extra=None):
    headers = {"Content-Type": "application/json"}
    if headers_extra:
        headers.update(headers_extra)
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        if isinstance(data, (bytes, bytearray)):
            body = data
        else:
            body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_content)
        except Exception:
            return e.code, {"detail": err_content}
    except Exception as e:
        return 0, {"error": str(e)}


def run_phase2a_tests():
    print("=" * 70)
    print("  BIGCHAMP PHASE 2A: PRODUCT & CATEGORY MANAGEMENT VERIFICATION")
    print("=" * 70)

    results = {}

    # 1. Authenticate Admin and Customer
    print("\n--- 1. Authenticating Accounts ---")
    s, admin_data = http_request("POST", f"{BASE_API}/admin/auth/login", {
        "email": "admin@bigchamp.in",
        "password": "Admin@123"
    })
    admin_token = admin_data.get("access_token")
    print(f"Admin authentication: status={s}, token_present={bool(admin_token)}")

    s, cust_data = http_request("POST", f"{BASE_API}/auth/login", {
        "identifier": "freeuser@bigchamp.in",
        "password": "User@123"
    })
    cust_token = cust_data.get("access_token")
    print(f"Customer authentication: status={s}, token_present={bool(cust_token)}")

    if not admin_token or not cust_token:
        print("[FAIL] Cannot proceed without authentication tokens.")
        return False

    # -------------------------------------------------------------
    # SECTION 2: Category Management & Authorization
    # -------------------------------------------------------------
    print("\n--- 2. Category Management & RBAC ---")

    # 2.1 Public GET /categories returns active categories
    s, cats = http_request("GET", f"{BASE_API}/categories")
    t2_1 = (s == 200 and isinstance(cats, list) and len(cats) >= 3)
    results["Categories: Public listing returns seeded categories (200)"] = t2_1
    print(f"  • Public categories listing: status={s}, count={len(cats) if isinstance(cats, list) else 0}")

    # 2.2 Unauthenticated POST /categories rejected -> 401
    s, d = http_request("POST", f"{BASE_API}/categories", {"name": "TESTCAT"})
    results["Categories: Unauthenticated POST rejected (401)"] = (s == 401)
    print(f"  • Unauthenticated category create: status={s}")

    # 2.3 Customer token on POST /categories -> 403
    s, d = http_request("POST", f"{BASE_API}/categories", {"name": "TESTCAT"}, token=cust_token)
    results["Categories: Customer token rejected with 403"] = (s == 403)
    print(f"  • Customer token on category create: status={s}")

    # 2.4 Admin creates new category
    test_cat_name = "TESTFOOTWEAR"
    s, created_cat = http_request("POST", f"{BASE_API}/categories", {
        "name": test_cat_name,
        "description": "Athletic running shoes, football studs, and training footwear",
        "order": 5,
        "active": True
    }, token=admin_token)
    cat_id = created_cat.get("_id")
    t2_4 = (s == 201 and created_cat.get("name") == test_cat_name and bool(cat_id))
    results["Categories: Admin creates new category (201)"] = t2_4
    print(f"  • Admin create category: status={s}, id={cat_id}, slug={created_cat.get('slug')}")

    # 2.5 Duplicate category name/slug rejected -> 409
    s, d = http_request("POST", f"{BASE_API}/categories", {
        "name": test_cat_name
    }, token=admin_token)
    results["Categories: Duplicate category creation rejected (409)"] = (s == 409)
    print(f"  • Duplicate category collision: status={s}")

    # 2.6 Admin updates category
    s, updated_cat = http_request("PUT", f"{BASE_API}/categories/{cat_id}", {
        "description": "Updated description for athletic footwear"
    }, token=admin_token)
    t2_6 = (s == 200 and "Updated description" in updated_cat.get("description", ""))
    results["Categories: Admin updates category metadata (200)"] = t2_6
    print(f"  • Admin update category: status={s}")

    # -------------------------------------------------------------
    # SECTION 3: Product Input Validation & Authorization
    # -------------------------------------------------------------
    print("\n--- 3. Product RBAC & Server Validation ---")

    # 3.1 Unauthenticated POST /products rejected -> 401
    s, d = http_request("POST", f"{BASE_API}/products", {"name": "Test Product", "category": "GEARS", "price_paise": 10000})
    results["Products: Unauthenticated POST rejected (401)"] = (s == 401)
    print(f"  • Unauthenticated product create: status={s}")

    # 3.2 Customer token on POST /products -> 403
    s, d = http_request("POST", f"{BASE_API}/products", {"name": "Test Product", "category": "GEARS", "price_paise": 10000}, token=cust_token)
    results["Products: Customer token rejected with 403"] = (s == 403)
    print(f"  • Customer token on product create: status={s}")

    # 3.3 Negative price rejected by server -> 422
    s, d = http_request("POST", f"{BASE_API}/products", {
        "name": "Invalid Price Shoe",
        "category": test_cat_name,
        "price_paise": -500,
        "stock": 10
    }, token=admin_token)
    results["Products: Rejects negative price with 422"] = (s == 422)
    print(f"  • Negative price validation: status={s}")

    # 3.4 Negative stock rejected by server -> 422
    s, d = http_request("POST", f"{BASE_API}/products", {
        "name": "Invalid Stock Shoe",
        "category": test_cat_name,
        "price_paise": 10000,
        "stock": -5
    }, token=admin_token)
    results["Products: Rejects negative stock with 422"] = (s == 422)
    print(f"  • Negative stock validation: status={s}")

    # -------------------------------------------------------------
    # SECTION 4: Product Creation & Persistence
    # -------------------------------------------------------------
    print("\n--- 4. Product Creation & MongoDB Persistence ---")

    test_product_payload = {
        "name": "Pro Marathon Running Shoes V2",
        "category": test_cat_name,
        "sport": "running",
        "sku": "BC-TEST-RUN-002",
        "price_paise": 299900,         # ₹2,999.00
        "member_price_paise": 269900,  # ₹2,699.00
        "stock": 45,
        "description": "Engineered breathable mesh with carbon-fiber propulsion plate.",
        "images": ["/uploads/products/sample-shoe.jpg"],
        "is_cookey": False,
        "featured": True,
        "active": True
    }
    s, created_prod = http_request("POST", f"{BASE_API}/products", test_product_payload, token=admin_token)
    prod_id = created_prod.get("_id")
    prod_slug = created_prod.get("slug")
    t4 = (s == 201 and bool(prod_id) and prod_slug == "pro-marathon-running-shoes-v2" and created_prod.get("stock") == 45)
    results["Products: Admin creates product with full specs (201)"] = t4
    print(f"  • Admin create product: status={s}, id={prod_id}, slug={prod_slug}")

    # 4.2 Duplicate slug rejected -> 409
    s, d = http_request("POST", f"{BASE_API}/products", {
        "name": "Pro Marathon Running Shoes V2",
        "slug": prod_slug,
        "category": test_cat_name,
        "price_paise": 150000
    }, token=admin_token)
    results["Products: Duplicate slug rejected with 409"] = (s == 409)
    print(f"  • Duplicate slug check: status={s}")

    # -------------------------------------------------------------
    # SECTION 5: Public Website Data Flow & Detail Integration
    # -------------------------------------------------------------
    print("\n--- 5. Public Website Integration & Detail API ---")

    # 5.1 Public GET /products includes newly created product
    s, public_prods = http_request("GET", f"{BASE_API}/products")
    matching = [p for p in public_prods if p.get("slug") == prod_slug]
    t5_1 = (s == 200 and len(matching) == 1 and matching[0].get("price_paise") == 299900)
    results["Products: Public store listing reflects new product (200)"] = t5_1
    print(f"  • Public store listing verification: status={s}, found={len(matching) == 1}")

    # 5.2 Public GET /products?category=TESTFOOTWEAR filters correctly
    s, cat_prods = http_request("GET", f"{BASE_API}/products?category={test_cat_name}")
    t5_2 = (s == 200 and len(cat_prods) >= 1 and all(p.get("category") == test_cat_name for p in cat_prods))
    results["Products: Category filter returns matching items (200)"] = t5_2
    print(f"  • Category filter verification: status={s}, items_count={len(cat_prods)}")

    # 5.3 Public GET /products/{slug} returns authoritative details and member discount
    s, single_prod = http_request("GET", f"{BASE_API}/products/{prod_slug}")
    t5_3 = (
        s == 200
        and single_prod.get("slug") == prod_slug
        and single_prod.get("price_paise") == 299900
        and single_prod.get("member_price_paise") == 269900
        and single_prod.get("stock") == 45
    )
    results["Products: Detail endpoint returns authoritative prices & stock (200)"] = t5_3
    print(f"  • Single product detail: status={s}, name='{single_prod.get('name')}', price={single_prod.get('price_paise')}")

    # -------------------------------------------------------------
    # SECTION 6: Admin Product Updates & Price Sync
    # -------------------------------------------------------------
    print("\n--- 6. Admin Product Update & Price Sync ---")

    # 6.1 Update price and stock
    update_payload = {
        "price_paise": 329900,         # Updated to ₹3,299.00
        "member_price_paise": 289900,  # Updated to ₹2,899.00
        "stock": 38
    }
    s, updated_prod = http_request("PUT", f"{BASE_API}/products/{prod_id}", update_payload, token=admin_token)
    t6_1 = (s == 200 and updated_prod.get("price_paise") == 329900 and updated_prod.get("stock") == 38)
    results["Products: Admin updates price and stock (200)"] = t6_1
    print(f"  • Admin update product: status={s}, new_price={updated_prod.get('price_paise')}")

    # 6.2 Public detail reflects updated authoritative price immediately
    s, read_updated = http_request("GET", f"{BASE_API}/products/{prod_slug}")
    t6_2 = (s == 200 and read_updated.get("price_paise") == 329900 and read_updated.get("stock") == 38)
    results["Products: Public detail reflects updated price without stale cache"] = t6_2
    print(f"  • Public readback of updated price: status={s}, price={read_updated.get('price_paise')}")

    # -------------------------------------------------------------
    # SECTION 7: Product Archive & Soft Delete Handling
    # -------------------------------------------------------------
    print("\n--- 7. Product Archive & Soft Delete Handling ---")

    # 7.1 Admin archives product
    s, archived_prod = http_request("PATCH", f"{BASE_API}/products/{prod_id}/archive", token=admin_token)
    results["Products: Admin archives product (200)"] = (s == 200 and archived_prod.get("active") is False)
    print(f"  • Product archive: status={s}, active={archived_prod.get('active')}")

    # 7.2 Public active-only catalog excludes archived product
    s, active_list = http_request("GET", f"{BASE_API}/products?active=true")
    found_in_active = any(p.get("slug") == prod_slug for p in active_list)
    results["Products: Archived product excluded from public store listing"] = (s == 200 and not found_in_active)
    print(f"  • Public store exclusion check: found_in_active={found_in_active}")

    # 7.3 Admin unarchives product
    s, restored_prod = http_request("PATCH", f"{BASE_API}/products/{prod_id}/archive?active=true", token=admin_token)
    results["Products: Admin restores archived product (200)"] = (s == 200 and restored_prod.get("active") is True)
    print(f"  • Product restored: status={s}, active={restored_prod.get('active')}")

    # -------------------------------------------------------------
    # SECTION 8: Image Upload & Type Validation
    # -------------------------------------------------------------
    print("\n--- 8. Image Upload Handling & Type Validation ---")

    # 8.1 Invalid non-image format rejected -> 400
    boundary = "----WebKitFormBoundaryBigchampTest"
    bad_body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="malicious.txt"\r\n'
        f"Content-Type: text/plain\r\n\r\n"
        f"This is not an image file.\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    s, d = http_request("POST", f"{BASE_API}/upload/image", data=bad_body, token=admin_token, headers_extra={
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    })
    results["Uploads: Rejects invalid non-image MIME type (400)"] = (s == 400)
    print(f"  • Non-image file upload rejection: status={s}")

    # 8.2 Valid image upload accepted -> 200
    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    good_body = (
        f"--{boundary}\r\n".encode("utf-8") +
        f'Content-Disposition: form-data; name="file"; filename="sample_icon.png"\r\n'.encode("utf-8") +
        f"Content-Type: image/png\r\n\r\n".encode("utf-8") +
        valid_png_bytes +
        f"\r\n--{boundary}--\r\n".encode("utf-8")
    )

    s, upload_res = http_request("POST", f"{BASE_API}/upload/image", data=good_body, token=admin_token, headers_extra={
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    })
    t8_2 = (s == 200 and upload_res.get("url", "").startswith("/uploads/products/"))
    results["Uploads: Accepts valid PNG image and returns static path (200)"] = t8_2
    print(f"  • Valid image upload: status={s}, url='{upload_res.get('url')}'")

    # -------------------------------------------------------------
    # SECTION 9: Category Relationship Integrity
    # -------------------------------------------------------------
    print("\n--- 9. Category Data Integrity & Cleanup ---")

    # 9.1 Deleting category with active products soft-archives rather than dropping
    s, del_cat_res = http_request("DELETE", f"{BASE_API}/categories/{cat_id}", token=admin_token)
    t9_1 = (s == 200 and del_cat_res.get("archived") is True)
    results["Categories: In-use category soft-archived to protect product relationships"] = t9_1
    print(f"  • Category deletion with active products: status={s}, archived={del_cat_res.get('archived')}")

    # 9.2 Clean up test product
    s, del_prod_res = http_request("DELETE", f"{BASE_API}/products/{prod_id}?hard_delete=true", token=admin_token)
    print(f"  • Test product cleanup: status={s}")

    # 9.3 Category can now be safely deleted once products are removed
    s, del_cat_final = http_request("DELETE", f"{BASE_API}/categories/{cat_id}", token=admin_token)
    results["Categories: Category permanently deleted once empty (200)"] = (s == 200 and del_cat_final.get("deleted") is True)
    print(f"  • Empty category permanent delete: status={s}")

    # -------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("                     PHASE 2A TEST SUMMARY")
    print("=" * 70)
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)

    for name, passed in results.items():
        tag = "[PASS]" if passed else "[FAIL]"
        print(f"  {tag:<7} {name}")

    print("-" * 70)
    print(f"  Total: {passed_count}/{total_count} tests passed ({passed_count/total_count*100:.1f}%)")
    print("=" * 70)

    return passed_count == total_count


if __name__ == "__main__":
    success = run_phase2a_tests()
    sys.exit(0 if success else 1)
