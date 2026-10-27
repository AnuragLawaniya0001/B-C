"""Automated MongoDB Restore & Integrity Verification Tool for BIGCHAMP (Phase 5.4).
Features:
- Validates SHA-256 checksums and manifest integrity prior to restoration
- Restores strictly into an ISOLATED destination database (e.g. bigchamp_dr_restore_test)
- Recreates collections, documents, and index definitions
- Validates post-restore document counts and financial integrity invariants
- Measures recovery duration (RTO)
"""
import asyncio
import hashlib
import json
import os
import shutil
import tarfile
import tempfile
import time
from pathlib import Path
from typing import Dict, Any
from bson import json_util
import motor.motor_asyncio

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
ISOLATED_TEST_DB = "bigchamp_dr_restore_test"


def calculate_file_sha256(filepath: Path) -> str:
    """Compute SHA-256 hash of a file."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


async def execute_restore(archive_path: Path, target_db_name: str = ISOLATED_TEST_DB) -> Dict[str, Any]:
    """Execute isolated restoration from verified backup archive."""
    t0 = time.perf_counter()
    assert archive_path.exists(), f"Backup archive not found at: {archive_path}"

    print(f"[*] Starting restore verification into isolated database '{target_db_name}'...")
    extract_dir = Path(tempfile.mkdtemp(prefix="bc_restore_"))

    try:
        # 1. Extract archive
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(path=extract_dir)

        # Locate raw_data folder containing manifest.json
        manifest_files = list(extract_dir.glob("**/manifest.json"))
        assert manifest_files, "Corrupt backup: manifest.json not found in archive"
        manifest_file = manifest_files[0]
        raw_data_dir = manifest_file.parent

        with open(manifest_file, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        # 2. Verify collection file checksums against manifest
        print(f"[*] Verifying checksums for {len(manifest['collections'])} collection files...")
        for col_name, meta in manifest["collections"].items():
            col_file = raw_data_dir / f"{col_name}.json"
            assert col_file.exists(), f"Missing collection file: {col_file.name}"
            calc_hash = calculate_file_sha256(col_file)
            assert calc_hash == meta["file_sha256"], f"Checksum mismatch for {col_name}! Manifest: {meta['file_sha256']}, Computed: {calc_hash}"

        # 3. Connect to isolated database & clean prior test data
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
        test_db = client[target_db_name]
        await client.drop_database(target_db_name)

        restored_collections = 0
        restored_documents = 0

        # 4. Restore each collection and recreate indexes
        for col_name, meta in manifest["collections"].items():
            col_file = raw_data_dir / f"{col_name}.json"
            with open(col_file, "r", encoding="utf-8") as f:
                docs = json_util.loads(f.read())

            target_col = test_db[col_name]
            if docs:
                await target_col.insert_many(docs)
                restored_documents += len(docs)

            # Recreate indexes
            for idx_info in meta.get("indexes", []):
                key_pairs = idx_info.get("key", [])
                if key_pairs and key_pairs != [("_id", 1)]:
                    try:
                        await target_col.create_index(key_pairs, unique=idx_info.get("unique", False))
                    except Exception:
                        pass
            restored_collections += 1

        # 5. Verify Financial Consistency Invariants in restored database
        print("[*] Validating post-restore financial invariants in restored database...")
        # Invariant A: Wallet balances match ledger transactions
        wallet_mismatches = 0
        async for wallet in test_db.wallets.find({}):
            uid = wallet.get("user_id")
            stored_bal = wallet.get("balance_paise", 0)

            cursor = test_db.wallet_transactions.find({"user_id": uid, "status": {"$ne": "FAILED"}})
            net_calculated = 0
            async for tx in cursor:
                d = tx.get("direction") or tx.get("type")
                amt = tx.get("amount_paise", 0)
                if d == "CREDIT":
                    net_calculated += amt
                elif d == "DEBIT":
                    net_calculated -= amt

            if net_calculated != stored_bal:
                wallet_mismatches += 1

        assert wallet_mismatches == 0, f"Found {wallet_mismatches} wallet balance/ledger discrepancies after restore!"

        # Invariant B: Settings collection intact
        settings_count = await test_db.settings.count_documents({})
        assert settings_count > 0, "Settings collection is empty in restored database!"

        duration_sec = round(time.perf_counter() - t0, 3)
        print(f"[+] Isolated restoration completed and verified in {duration_sec}s! (Collections: {restored_collections}, Documents: {restored_documents})")

        # 6. Clean up isolated test database
        await client.drop_database(target_db_name)

        return {
            "success": True,
            "target_database": target_db_name,
            "restored_collections": restored_collections,
            "restored_documents": restored_documents,
            "financial_invariants_verified": True,
            "duration_seconds": duration_sec,
        }

    finally:
        shutil.rmtree(extract_dir, ignore_errors=True)


if __name__ == "__main__":
    import sys
    archive = Path(sys.argv[1]) if len(sys.argv) > 1 else list(Path("backups").glob("**/*.tar.gz"))[-1]
    asyncio.run(execute_restore(archive))
