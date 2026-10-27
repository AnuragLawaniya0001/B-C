"""Low-overhead operational and financial metrics registry for production observability (Phase 5.3)."""
import time
from datetime import datetime, timezone
from typing import Dict, Any, List
import threading


class OperationalMetricsRegistry:
    """Thread-safe in-memory metrics registry for application telemetry."""

    def __init__(self):
        self._lock = threading.Lock()
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.requests_total: Dict[str, int] = {}
        self.requests_by_status: Dict[str, int] = {}
        self.in_flight_requests: int = 0
        self.latency_samples_ms: List[float] = []
        self.max_latency_samples = 1000

        # Business & Financial Invariants Metrics
        self.payment_events: Dict[str, int] = {
            "initiated": 0,
            "verified": 0,
            "failed": 0,
            "signature_rejected": 0,
            "webhook_received": 0,
            "webhook_duplicate": 0,
        }
        self.refund_events: Dict[str, int] = {
            "requested": 0,
            "processed": 0,
            "rejected_capacity": 0,
            "reconciliation_required": 0,
        }
        self.partner_events: Dict[str, int] = {
            "commission_credited": 0,
            "settlement_processed": 0,
            "settlement_replayed": 0,
            "settlement_overdraft_blocked": 0,
        }
        self.inventory_events: Dict[str, int] = {
            "stock_deducted": 0,
            "stock_restocked": 0,
            "oversell_blocked": 0,
        }
        self.financial_discrepancies_detected: int = 0

        # Production Operations & DR Telemetry (Phase 5.9)
        self.backup_telemetry: Dict[str, Any] = {
            "last_backup_timestamp": None,
            "last_backup_status": "UNKNOWN",
            "last_backup_duration_seconds": 0.0,
            "observed_age_seconds": None,
            "is_stale": False,
        }
        self.dr_telemetry: Dict[str, Any] = {
            "last_drill_timestamp": None,
            "last_drill_status": "UNKNOWN",
            "observed_rto_seconds": 0.0,
            "observed_rpo_seconds": 0,
            "target_rto_met": None,
            "target_rpo_met": None,
        }
        self.background_task_failures: List[Dict[str, Any]] = []

    def record_backup_event(self, status: str, duration_sec: float, age_sec: int, is_stale: bool):
        with self._lock:
            self.backup_telemetry = {
                "last_backup_timestamp": datetime.now(timezone.utc).isoformat(),
                "last_backup_status": status,
                "last_backup_duration_seconds": round(duration_sec, 3),
                "observed_age_seconds": age_sec,
                "is_stale": is_stale,
            }

    def record_dr_drill_event(self, status: str, rto_sec: float, rpo_sec: int, rto_met: bool, rpo_met: bool):
        with self._lock:
            self.dr_telemetry = {
                "last_drill_timestamp": datetime.now(timezone.utc).isoformat(),
                "last_drill_status": status,
                "observed_rto_seconds": round(rto_sec, 3),
                "observed_rpo_seconds": rpo_sec,
                "target_rto_met": rto_met,
                "target_rpo_met": rpo_met,
            }

    def record_background_task_failure(self, task_name: str, error: str):
        with self._lock:
            self.background_task_failures.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "task_name": task_name,
                "error": str(error),
            })
            if len(self.background_task_failures) > 50:
                self.background_task_failures.pop(0)

    def record_request_start(self):
        with self._lock:
            self.in_flight_requests += 1

    def record_request_end(self, method: str, path_template: str, status_code: int, latency_ms: float):
        status_bucket = f"{status_code // 100}xx"
        route_key = f"{method.upper()} {path_template}"

        with self._lock:
            self.in_flight_requests = max(0, self.in_flight_requests - 1)
            self.requests_total[route_key] = self.requests_total.get(route_key, 0) + 1
            self.requests_by_status[status_bucket] = self.requests_by_status.get(status_bucket, 0) + 1
            self.requests_by_status[str(status_code)] = self.requests_by_status.get(str(status_code), 0) + 1

            self.latency_samples_ms.append(latency_ms)
            if len(self.latency_samples_ms) > self.max_latency_samples:
                self.latency_samples_ms.pop(0)

    def record_payment_event(self, event_type: str, count: int = 1):
        with self._lock:
            self.payment_events[event_type] = self.payment_events.get(event_type, 0) + count

    def record_refund_event(self, event_type: str, count: int = 1):
        with self._lock:
            self.refund_events[event_type] = self.refund_events.get(event_type, 0) + count

    def record_partner_event(self, event_type: str, count: int = 1):
        with self._lock:
            self.partner_events[event_type] = self.partner_events.get(event_type, 0) + count

    def record_inventory_event(self, event_type: str, count: int = 1):
        with self._lock:
            self.inventory_events[event_type] = self.inventory_events.get(event_type, 0) + count

    def record_reconciliation_discrepancy(self, count: int = 1):
        with self._lock:
            self.financial_discrepancies_detected += count

    def get_summary(self) -> Dict[str, Any]:
        with self._lock:
            total_reqs = sum(self.requests_total.values())
            latencies = sorted(self.latency_samples_ms) if self.latency_samples_ms else [0.0]

            p50 = latencies[int(len(latencies) * 0.50)]
            p95 = latencies[min(int(len(latencies) * 0.95), len(latencies) - 1)]
            p99 = latencies[min(int(len(latencies) * 0.99), len(latencies) - 1)]
            mean_lat = sum(latencies) / len(latencies) if latencies else 0.0

            return {
                "started_at": self.started_at,
                "uptime_seconds": round(time.time() - datetime.fromisoformat(self.started_at).timestamp(), 1),
                "in_flight_requests": self.in_flight_requests,
                "total_http_requests": total_reqs,
                "requests_by_status": dict(self.requests_by_status),
                "latency_summary_ms": {
                    "p50": round(p50, 2),
                    "p95": round(p95, 2),
                    "p99": round(p99, 2),
                    "mean": round(mean_lat, 2),
                },
                "routes_traffic_top": sorted(
                    [{"route": k, "count": v} for k, v in self.requests_total.items()],
                    key=lambda x: x["count"],
                    reverse=True,
                )[:15],
                "financial_integrity_telemetry": {
                    "payments": dict(self.payment_events),
                    "refunds": dict(self.refund_events),
                    "partners": dict(self.partner_events),
                    "inventory": dict(self.inventory_events),
                    "reconciliation_discrepancies": self.financial_discrepancies_detected,
                },
                "backup_operations": dict(self.backup_telemetry),
                "disaster_recovery": dict(self.dr_telemetry),
                "background_task_failures_count": len(self.background_task_failures),
            }


# Singleton metrics instance
metrics = OperationalMetricsRegistry()
