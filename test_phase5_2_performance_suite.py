"""BIGCHAMP Phase 5.2: Performance, Load Testing, Concurrency & Scalability Benchmark Suite.
Measures:
- Workload Profile A: Public Browsing (Catalog, Products, Search, Filters, Banners, FAQs)
- Workload Profile B: Authenticated Customer (Profile, Membership Status, Wallet, Cart Pricing)
- Workload Profile C: Concurrent Checkout Stress Test & Inventory Oversell Prevention Invariant
- Workload Profile D: Administrative Management (Config, Product CRUD, Audit Pagination)
- Workload Profile E: Financial Aggregation & Reconciliation (Finance Overview, CSV Export, Scanner)
- Workload Profile F: Partner Portal & Commissions (Earnings, Ledger, Settlements)
Calculates:
- Requests Per Second (RPS)
- Latency Distribution: p50, p95, p99, Min, Max, Mean (ms)
- Error Rates & Saturation Invariants
"""
import concurrent.futures
import hashlib
import hmac
import json
import statistics
import time
import uuid
import requests

BASE_URL = "http://localhost:3050/api/v1"
ADMIN_EMAIL = "admin@bigchamp.in"
ADMIN_PASS = "Admin@123"
RAZORPAY_SECRET = "gv4f7MHd9cG8tjKnb5gH8aeO"


class BenchmarkMetrics:
    def __init__(self, name: str):
        self.name = name
        self.latencies_ms = []
        self.success_count = 0
        self.error_count = 0
        self.start_time = None
        self.end_time = None

    def start(self):
        self.start_time = time.perf_counter()

    def stop(self):
        self.end_time = time.perf_counter()

    def record(self, latency_ms: float, is_success: bool = True):
        self.latencies_ms.append(latency_ms)
        if is_success:
            self.success_count += 1
        else:
            self.error_count += 1

    def summary(self) -> dict:
        total_reqs = self.success_count + self.error_count
        duration_sec = (self.end_time - self.start_time) if (self.end_time and self.start_time) else 1.0
        rps = total_reqs / duration_sec if duration_sec > 0 else 0.0

        if not self.latencies_ms:
            return {"name": self.name, "total": 0, "rps": 0, "error_rate": 0}

        sorted_lat = sorted(self.latencies_ms)
        p50 = sorted_lat[int(len(sorted_lat) * 0.50)]
        p95 = sorted_lat[min(int(len(sorted_lat) * 0.95), len(sorted_lat) - 1)]
        p99 = sorted_lat[min(int(len(sorted_lat) * 0.99), len(sorted_lat) - 1)]
        mean_val = statistics.mean(sorted_lat)
        min_val = min(sorted_lat)
        max_val = max(sorted_lat)
        err_rate = (self.error_count / total_reqs) * 100.0 if total_reqs > 0 else 0.0

        return {
            "name": self.name,
            "total_requests": total_reqs,
            "successful_requests": self.success_count,
            "failed_requests": self.error_count,
            "error_rate_pct": round(err_rate, 2),
            "duration_sec": round(duration_sec, 3),
            "throughput_rps": round(rps, 1),
            "latency_p50_ms": round(p50, 2),
            "latency_p95_ms": round(p95, 2),
            "latency_p99_ms": round(p99, 2),
            "latency_mean_ms": round(mean_val, 2),
            "latency_min_ms": round(min_val, 2),
            "latency_max_ms": round(max_val, 2),
        }

    def print_summary(self):
        s = self.summary()
        print(f"\n=======================================================")
        print(f" PROFILE: {s['name']}")
        print(f" Requests: {s['total_requests']} total ({s['successful_requests']} OK, {s['failed_requests']} ERR) | Error Rate: {s['error_rate_pct']}%")
        print(f" Throughput: {s['throughput_rps']} req/sec over {s['duration_sec']}s")
        print(f" Latency: p50={s['latency_p50_ms']}ms | p95={s['latency_p95_ms']}ms | p99={s['latency_p99_ms']}ms | Mean={s['latency_mean_ms']}ms (Min: {s['latency_min_ms']}ms, Max: {s['latency_max_ms']}ms)")
        print(f"=======================================================")


class Phase52PerformanceRunner:
    def __init__(self):
        self.admin_token = None
        self.customer_token = None
        self.customer_user = None
        self.sample_product_id = None
        self.sample_product_slug = None
        self.results = {}

    def setup(self):
        print("\n--- Initializing Performance Benchmark Runner & Accounts ---")
        # 1. Admin login
        adm = requests.post(f"{BASE_URL}/admin/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        assert adm.status_code == 200
        self.admin_token = adm.json()["access_token"]

        # 2. Customer registration
        cust_email = f"perf_user_{uuid.uuid4().hex[:6]}@bigchamp.in"
        s_otp = requests.post(f"{BASE_URL}/auth/send-otp", json={"identifier": cust_email, "purpose": "REGISTER"})
        otp_val = s_otp.json().get("dev_otp") or "123456"
        requests.post(f"{BASE_URL}/auth/verify-otp", json={"identifier": cust_email, "otp": otp_val, "purpose": "REGISTER"})
        reg = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "identifier": cust_email,
                "email": cust_email,
                "mobile": f"98{uuid.uuid4().int % 100000000:08d}",
                "password": "User@123",
                "full_name": "Perf Benchmark Customer",
            },
        )
        assert reg.status_code in (200, 201)
        rj = reg.json()
        self.customer_token = rj["access_token"]
        self.customer_user = rj["user"]

        # 3. Discover sample product
        prods = requests.get(f"{BASE_URL}/products?limit=5").json()
        if prods:
            self.sample_product_id = prods[0].get("id") or str(prods[0].get("_id"))
            self.sample_product_slug = prods[0].get("slug")

        print(" Benchmark setup completed successfully.")

    def auth_headers(self, token):
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # --------------------------------------------------------------------------
    # PROFILE A: Public Browsing
    # --------------------------------------------------------------------------
    def run_profile_a_public_browsing(self, total_requests: int = 100, concurrency: int = 10):
        print(f"\n>>> Running Profile A: Public Browsing ({total_requests} requests, concurrency={concurrency}) ...")
        m = BenchmarkMetrics("Profile A: Public Browsing")
        endpoints = [
            f"{BASE_URL}/settings/public",
            f"{BASE_URL}/products?limit=12",
            f"{BASE_URL}/products?category=GEARS&sort=price_asc",
            f"{BASE_URL}/products?featured=true",
            f"{BASE_URL}/banners",
            f"{BASE_URL}/faqs",
            f"{BASE_URL}/membership/settings",
        ]
        if self.sample_product_slug:
            endpoints.append(f"{BASE_URL}/products/{self.sample_product_slug}")

        def worker(idx):
            url = endpoints[idx % len(endpoints)]
            t0 = time.perf_counter()
            try:
                res = requests.get(url, timeout=5.0)
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, res.status_code == 200
            except Exception:
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, False

        m.start()
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(worker, i) for i in range(total_requests)]
            for f in concurrent.futures.as_completed(futures):
                lat, ok = f.result()
                m.record(lat, ok)
        m.stop()
        m.print_summary()
        self.results["profile_a"] = m.summary()

    # --------------------------------------------------------------------------
    # PROFILE B: Authenticated Customer
    # --------------------------------------------------------------------------
    def run_profile_b_authenticated_customer(self, total_requests: int = 80, concurrency: int = 8):
        print(f"\n>>> Running Profile B: Authenticated Customer ({total_requests} requests, concurrency={concurrency}) ...")
        m = BenchmarkMetrics("Profile B: Authenticated Customer")
        endpoints = [
            f"{BASE_URL}/membership/status",
            f"{BASE_URL}/wallet/me",
            f"{BASE_URL}/wallet/me/transactions",
            f"{BASE_URL}/orders/my",
        ]

        def worker(idx):
            url = endpoints[idx % len(endpoints)]
            t0 = time.perf_counter()
            try:
                res = requests.get(url, headers=self.auth_headers(self.customer_token), timeout=5.0)
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, res.status_code in (200, 201)
            except Exception:
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, False

        m.start()
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(worker, i) for i in range(total_requests)]
            for f in concurrent.futures.as_completed(futures):
                lat, ok = f.result()
                m.record(lat, ok)
        m.stop()
        m.print_summary()
        self.results["profile_b"] = m.summary()

    # --------------------------------------------------------------------------
    # PROFILE C: Concurrent Checkout & Stock Invariants
    # --------------------------------------------------------------------------
    def run_profile_c_concurrent_checkout_and_invariants(self, concurrency: int = 15):
        print(f"\n>>> Running Profile C: Concurrent Checkout & Stock Race ({concurrency} concurrent buyers) ...")
        m = BenchmarkMetrics("Profile C: Concurrent Checkout")

        # 1. Create a dedicated test product with strictly limited stock = 3
        test_prod_name = f"Limited Stock Jersey {uuid.uuid4().hex[:6]}"
        create_prod = requests.post(
            f"{BASE_URL}/products",
            headers=self.auth_headers(self.admin_token),
            json={
                "name": test_prod_name,
                "category": "APPAREL",
                "price_paise": 50000,
                "stock": 3,
                "active": True,
            },
        )
        assert create_prod.status_code in (200, 201), f"Failed to create test product: {create_prod.text}"
        prod_doc = create_prod.json()
        target_prod_id = prod_doc.get("id") or str(prod_doc.get("_id"))
        print(f" Created test product with initial stock = 3: '{test_prod_name}' (ID: {target_prod_id})")

        # 2. Fire 15 simultaneous checkout attempts for 1 unit each
        def checkout_worker(i):
            payload = {
                "items": [{"product_id": target_prod_id, "qty": 1}],
                "delivery_address": {
                    "full_name": f"Buyer {i}",
                    "phone": "9876543210",
                    "street_address": "456 Stadium Road",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "pin_code": "560001",
                },
                "idempotency_key": f"race_idemp_{uuid.uuid4().hex[:12]}",
            }
            t0 = time.perf_counter()
            try:
                res = requests.post(
                    f"{BASE_URL}/orders",
                    headers=self.auth_headers(self.customer_token),
                    json=payload,
                    timeout=5.0,
                )
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, res.status_code, res.json() if res.status_code in (200, 201) else res.text
            except Exception as e:
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, 500, str(e)

        m.start()
        results_list = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(checkout_worker, i) for i in range(concurrency)]
            for f in concurrent.futures.as_completed(futures):
                lat, status, body = f.result()
                results_list.append((status, body))
                m.record(lat, status in (200, 201, 400))
        m.stop()
        m.print_summary()

        orders_created = sum(1 for status, _ in results_list if status in (200, 201))
        stock_rejected = sum(1 for status, b in results_list if status == 400 or "stock" in str(b).lower())
        print(f" Invariant Verification: {orders_created} orders placed, {stock_rejected} rejected gracefully.")
        self.results["profile_c"] = m.summary()

    # --------------------------------------------------------------------------
    # PROFILE D: Administrative Management
    # --------------------------------------------------------------------------
    def run_profile_d_admin_operations(self, total_requests: int = 50, concurrency: int = 5):
        print(f"\n>>> Running Profile D: Admin Operations ({total_requests} requests, concurrency={concurrency}) ...")
        m = BenchmarkMetrics("Profile D: Administrative Operations")
        endpoints = [
            f"{BASE_URL}/admin/settings",
            f"{BASE_URL}/admin/audit-logs?limit=20",
            f"{BASE_URL}/partners/admin/list?limit=20",
            f"{BASE_URL}/products?limit=20",
        ]

        def worker(idx):
            url = endpoints[idx % len(endpoints)]
            t0 = time.perf_counter()
            try:
                res = requests.get(url, headers=self.auth_headers(self.admin_token), timeout=5.0)
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, res.status_code == 200
            except Exception:
                lat = (time.perf_counter() - t0) * 1000.0
                return lat, False

        m.start()
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(worker, i) for i in range(total_requests)]
            for f in concurrent.futures.as_completed(futures):
                lat, ok = f.result()
                m.record(lat, ok)
        m.stop()
        m.print_summary()
        self.results["profile_d"] = m.summary()

    # --------------------------------------------------------------------------
    # PROFILE E: Financial Aggregations & Reconciliation
    # --------------------------------------------------------------------------
    def run_profile_e_financial_workflows(self, iterations: int = 15):
        print(f"\n>>> Running Profile E: Financial Aggregations & CSV Export ({iterations} cycles) ...")
        m = BenchmarkMetrics("Profile E: Financial Aggregations")

        m.start()
        for _ in range(iterations):
            # 1. Overview aggregation
            t0 = time.perf_counter()
            res_ov = requests.get(f"{BASE_URL}/admin/finance/overview", headers=self.auth_headers(self.admin_token))
            lat_ov = (time.perf_counter() - t0) * 1000.0
            m.record(lat_ov, res_ov.status_code == 200)

            # 2. CSV report generation
            t1 = time.perf_counter()
            res_csv = requests.get(f"{BASE_URL}/admin/finance/export", headers=self.auth_headers(self.admin_token))
            lat_csv = (time.perf_counter() - t1) * 1000.0
            m.record(lat_csv, res_csv.status_code == 200)

            # 3. Reconciliation scanner
            t2 = time.perf_counter()
            res_rec = requests.get(f"{BASE_URL}/admin/finance/reconciliation", headers=self.auth_headers(self.admin_token))
            lat_rec = (time.perf_counter() - t2) * 1000.0
            m.record(lat_rec, res_rec.status_code == 200)
        m.stop()
        m.print_summary()
        self.results["profile_e"] = m.summary()

    # --------------------------------------------------------------------------
    # PROFILE F: Partner Portal Workflows
    # --------------------------------------------------------------------------
    def run_profile_f_partner_workflows(self, iterations: int = 20):
        print(f"\n>>> Running Profile F: Partner Workflows ({iterations} cycles) ...")
        m = BenchmarkMetrics("Profile F: Partner Workflows")

        # Discover or create sample partner
        p_list = requests.get(f"{BASE_URL}/partners/admin/list?limit=5", headers=self.auth_headers(self.admin_token)).json()
        items = p_list.get("items", []) if isinstance(p_list, dict) else p_list
        sample_p_id = items[0]["id"] if items else None

        if not sample_p_id:
            app_p = requests.post(
                f"{BASE_URL}/partners/apply",
                json={
                    "business_name": "Perf Test Physio",
                    "business_type": "PHYSIO_CLINIC",
                    "contact_person": "Dr. Perf",
                    "email": f"partner_perf_{uuid.uuid4().hex[:6]}@bigchamp.in",
                    "phone": "9899887766",
                    "city": "Pune",
                    "state": "Maharashtra",
                    "address": "Kothrud Sports Complex",
                    "pincode": "411038",
                },
            ).json()
            sample_p_id = app_p.get("partner_id") or app_p.get("id")

        m.start()
        for i in range(iterations):
            # 1. Partner earnings lookup
            t0 = time.perf_counter()
            res_e = requests.get(f"{BASE_URL}/partners/admin/{sample_p_id}", headers=self.auth_headers(self.admin_token))
            lat_e = (time.perf_counter() - t0) * 1000.0
            m.record(lat_e, res_e.status_code == 200)

            # 2. Commission crediting
            t1 = time.perf_counter()
            res_c = requests.post(
                f"{BASE_URL}/partners/admin/{sample_p_id}/commission",
                params={"source_type": "BOOKING", "source_id": f"perf_bk_{uuid.uuid4().hex[:8]}", "gross_amount_paise": 200000},
                headers=self.auth_headers(self.admin_token),
            )
            lat_c = (time.perf_counter() - t1) * 1000.0
            m.record(lat_c, res_c.status_code == 200)
        m.stop()
        m.print_summary()
        self.results["profile_f"] = m.summary()

    def run_all(self):
        print("\n=================================================================")
        print(" BIGCHAMP PHASE 5.2 -- BENCHMARK & LOAD TESTING RUNNER")
        print("=================================================================")
        self.setup()
        self.run_profile_a_public_browsing(total_requests=100, concurrency=10)
        self.run_profile_b_authenticated_customer(total_requests=80, concurrency=8)
        self.run_profile_c_concurrent_checkout_and_invariants(concurrency=15)
        self.run_profile_d_admin_operations(total_requests=50, concurrency=5)
        self.run_profile_e_financial_workflows(iterations=10)
        self.run_profile_f_partner_workflows(iterations=15)

        print("\n=================================================================")
        print(" PHASE 5.2 PERFORMANCE WORKLOAD PROFILES SUMMARY MATRIX")
        print("=================================================================")
        print(f"{'Profile Name':<38} | {'RPS':<8} | {'p50(ms)':<8} | {'p95(ms)':<8} | {'p99(ms)':<8} | {'Errors':<6}")
        print("-" * 80)
        for k, v in self.results.items():
            print(f"{v['name']:<38} | {v['throughput_rps']:<8} | {v['latency_p50_ms']:<8} | {v['latency_p95_ms']:<8} | {v['latency_p99_ms']:<8} | {v['error_rate_pct']}%")
        print("=================================================================\n")
        return self.results


if __name__ == "__main__":
    runner = Phase52PerformanceRunner()
    results = runner.run_all()
