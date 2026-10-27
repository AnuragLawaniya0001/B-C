"""
Migration script: Copy entire database from local MongoDB to MongoDB Atlas
Preserves documents, ObjectIds, BSON types, and collection indexes.
"""

import sys
import time
import pymongo
from pymongo.errors import BulkWriteError

LOCAL_URI = "mongodb://localhost:27017"
ATLAS_URI = "mongodb+srv://anuraglawaniya0001_db_user:TUyWPN8p5Bj0Cm6x@cluster0.hhqvt0i.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "bigchamp"


def run_migration():
    print(f"Connecting to source Local MongoDB: {LOCAL_URI}...")
    source_client = pymongo.MongoClient(LOCAL_URI, serverSelectionTimeoutMS=5000)
    source_db = source_client[DB_NAME]

    print(f"Connecting to target MongoDB Atlas...")
    target_client = pymongo.MongoClient(ATLAS_URI, serverSelectionTimeoutMS=10000)
    target_db = target_client[DB_NAME]

    collections = sorted(source_db.list_collection_names())
    print(f"\nFound {len(collections)} collections in local '{DB_NAME}' database.")

    total_docs_migrated = 0
    start_time = time.time()

    migration_report = []

    for col_name in collections:
        if col_name.startswith("system."):
            continue

        src_col = source_db[col_name]
        tgt_col = target_db[col_name]

        src_count = src_col.count_documents({})

        # Copy documents
        if src_count > 0:
            # Clear target collection if needed to avoid duplicate keys on rerun
            tgt_col.delete_many({})

            cursor = src_col.find({})
            batch = []
            col_migrated = 0
            for doc in cursor:
                batch.append(doc)
                if len(batch) >= 500:
                    tgt_col.insert_many(batch, ordered=False)
                    col_migrated += len(batch)
                    batch = []

            if batch:
                tgt_col.insert_many(batch, ordered=False)
                col_migrated += len(batch)

            total_docs_migrated += col_migrated
        else:
            col_migrated = 0

        # Copy indexes
        try:
            indexes = src_col.index_information()
            for idx_name, idx_info in indexes.items():
                if idx_name == "_id_":
                    continue
                keys = idx_info["key"]
                options = {}
                if "unique" in idx_info:
                    options["unique"] = idx_info["unique"]
                if "sparse" in idx_info:
                    options["sparse"] = idx_info["sparse"]
                if "expireAfterSeconds" in idx_info:
                    options["expireAfterSeconds"] = idx_info["expireAfterSeconds"]

                tgt_col.create_index(keys, name=idx_name, **options)
        except Exception as e:
            print(f"  [Warning] Index copy for {col_name}: {e}")

        tgt_count = tgt_col.count_documents({})
        status = "MATCH" if src_count == tgt_count else "MISMATCH!"
        migration_report.append((col_name, src_count, tgt_count, status))
        print(f"  [OK] {col_name:25} | Source: {src_count:4} | Atlas: {tgt_count:4} | Status: {status}")

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 65)
    print(f"MIGRATION SUMMARY (Completed in {elapsed}s)")
    print("=" * 65)
    all_matched = all(status == "MATCH" for _, _, _, status in migration_report)
    print(f"Collections migrated: {len(migration_report)}")
    print(f"Total documents copied: {total_docs_migrated}")
    print(f"All collection counts matched: {all_matched}")

    if not all_matched:
        print("\nMismatches found:")
        for col_name, src, tgt, status in migration_report:
            if status != "MATCH":
                print(f"  {col_name}: local={src}, atlas={tgt}")
        sys.exit(1)
    else:
        print("\nAll data migrated to MongoDB Atlas successfully!")


if __name__ == "__main__":
    run_migration()
