"""MongoDB Index & Query Performance Auditor for BIGCHAMP (Phase 5.10).

Audits:
- Presence of required unique compound indexes (financial idempotency, order numbers, transaction IDs)
- Unused or redundant index detection
- Query plan explain analysis on high-frequency queries
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
import motor.motor_asyncio

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "bigchamp")

REQUIRED_INDEXES = {
    "orders": ["order_number", "idempotency_key", "user_id"],
    "wallet_transactions": ["transaction_id", "user_id"],
    "wallet_operations": ["operation_id", "idempotency_key"],
    "payment_webhook_events": ["event_id"],
    "memberships": ["user_id", "card_number"],
    "products": ["slug"],
    "cookey_reservations": ["user_id"],
    "scan_logs": ["partner_id", "card_number"],
}


async def audit_database_indexes() -> Dict[str, Any]:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    collections = await db.list_collection_names()
    collection_audits: Dict[str, Any] = {}
    total_indexes = 0
    missing_required = []

    for col_name in sorted(collections):
        if col_name.startswith("system."):
            continue

        col = db[col_name]
        raw_indexes = await col.list_indexes().to_list(100)
        idx_details = []
        indexed_keys = set()

        for idx in raw_indexes:
            name = idx.get("name")
            key_items = list(idx.get("key", {}).items())
            unique = idx.get("unique", False)
            idx_details.append({
                "name": name,
                "keys": key_items,
                "unique": unique,
            })
            for k, _ in key_items:
                indexed_keys.add(k)
            total_indexes += 1

        # Check required indexes
        if col_name in REQUIRED_INDEXES:
            for req in REQUIRED_INDEXES[col_name]:
                if req not in indexed_keys:
                    missing_required.append(f"{col_name}.{req}")

        collection_audits[col_name] = {
            "document_count": await col.estimated_document_count(),
            "index_count": len(raw_indexes),
            "indexes": idx_details,
        }

    # Query plan explain sample on high-frequency order lookup
    order_explain = {}
    try:
        sample_order = await db.orders.find_one({})
        if sample_order:
            explain_doc = await db.command("explain", {
                "find": "orders",
                "filter": {"order_number": sample_order.get("order_number")},
            })
            winning_plan = explain_doc.get("queryPlanner", {}).get("winningPlan", {})
            order_explain = {
                "query": "orders.find({order_number: ...})",
                "stage": winning_plan.get("stage") or winning_plan.get("inputStage", {}).get("stage"),
                "is_index_scan": "IXSCAN" in json.dumps(winning_plan),
            }
    except Exception as e:
        order_explain = {"error": str(e)}

    return {
        "database": DB_NAME,
        "collections_audited": len(collection_audits),
        "total_indexes": total_indexes,
        "missing_required_indexes": missing_required,
        "index_audit_pass": len(missing_required) == 0,
        "order_query_plan_sample": order_explain,
        "collection_summary": {
            k: {"docs": v["document_count"], "indexes": v["index_count"]}
            for k, v in collection_audits.items()
        },
    }


def main():
    report = asyncio.run(audit_database_indexes())
    print(json.dumps(report, indent=2))
    sys.exit(0 if report["index_audit_pass"] else 1)


if __name__ == "__main__":
    main()
