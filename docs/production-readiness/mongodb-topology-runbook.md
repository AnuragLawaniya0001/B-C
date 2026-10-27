# BIGCHAMP — MongoDB Topology & Transaction Readiness Runbook

**Classification:** Infrastructure Architecture Runbook  
**Applicability:** Database Reliability Engineering (DBRE), SRE, DevOps  
**Current Verified Topology:** Standalone Single-Node MongoDB 7.0 (`bigchamp-mongodb:27017`)  
**Target Production Topology:** 3-Node MongoDB Replica Set (`rs0`) with Keyfile Authentication

---

## 1. Executive Topology Comparison

| Architectural Property | Current Verified Topology (Standalone) | Target Production Topology (3-Node Replica Set) |
| :--- | :--- | :--- |
| **Node Count** | 1 Container (`bigchamp-mongodb`) | 3 Nodes (1 Primary, 2 Secondary) |
| **High Availability / Failover** | None (Single Point of Failure) | Automatic election (< 12 seconds) |
| **Multi-Document ACID Transactions** | **Not Supported** (Server throws `IllegalOperation`) | **Supported** (`session.start_transaction()`) |
| **Single-Document Atomicity** | **Guaranteed** (`$inc`, `$set`, `$setOnInsert`) | **Guaranteed** |
| **Concurrency Safeguards** | Atomic conditional queries & unique indexes | Full multi-document serializability |
| **Backup Compatibility** | Full logical backup via `backup_mongodb.py` | Full logical backup + oplog point-in-time recovery |
| **Hosting Resource Footprint** | ~200MB RAM, 1 vCPU | ~1.5GB RAM, 3 vCPU minimum |

---

## 2. Standalone Compensating Sagas (Current Production Strategy)

Because the current deployment operates on standalone MongoDB, BIGCHAMP achieves financial integrity without native multi-document transactions using a two-phase saga design:
1. **Single-Document Preconditions:**
   ```python
   # Example: Atomic balance deduction with non-negative guard
   res = await db.wallets.update_one(
       {"user_id": uid, "balance_paise": {"$gte": amount}},
       {"$inc": {"balance_paise": -amount}}
   )
   ```
2. **Durable Intent Logging:** `db.wallet_operations` and `db.payment_operations` record transition intent before mutating balances.
3. **Automated Recovery Scanner:** If a process crashes between balance update and ledger creation, `wallet_service.recover_wallet_operations()` detects the orphaned state and repairs the ledger entry.
4. **Unique Constraint Enforcement:** Hard unique indexes on `transaction_id`, `idempotency_key`, `order_number`, and `operation_id` reject duplicate submissions.

---

## 3. Migration Runbook: Standalone to 3-Node Replica Set

### Phase 1: Pre-Migration Backup (Mandatory)
```bash
python scripts/backup_scheduler.py --once
python scripts/dr_drill.py
```
*Verification Gate:* Confirm SHA-256 manifest and isolated restore verification pass before proceeding.

### Phase 2: Keyfile Generation & Security
Generate a 1024-byte cryptographically random shared keyfile:
```bash
openssl rand -base64 756 > ./docker/mongo-keyfile
chmod 400 ./docker/mongo-keyfile
```

### Phase 3: Docker Compose Replica Set Topology
Update `docker-compose.yml` to define 3 MongoDB nodes:
```yaml
services:
  mongo-primary:
    image: mongo:7.0
    command: ["mongod", "--replSet", "rs0", "--keyFile", "/etc/mongo/keyfile", "--bind_ip_all"]
    volumes:
      - mongo_data_1:/data/db
      - ./docker/mongo-keyfile:/etc/mongo/keyfile:ro
  mongo-sec-1:
    image: mongo:7.0
    command: ["mongod", "--replSet", "rs0", "--keyFile", "/etc/mongo/keyfile", "--bind_ip_all"]
    volumes:
      - mongo_data_2:/data/db
      - ./docker/mongo-keyfile:/etc/mongo/keyfile:ro
  mongo-sec-2:
    image: mongo:7.0
    command: ["mongod", "--replSet", "rs0", "--keyFile", "/etc/mongo/keyfile", "--bind_ip_all"]
    volumes:
      - mongo_data_3:/data/db
      - ./docker/mongo-keyfile:/etc/mongo/keyfile:ro
```

### Phase 4: Initialization & Member Registration
Execute in primary container:
```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo-primary:27017", priority: 2 },
    { _id: 1, host: "mongo-sec-1:27017", priority: 1 },
    { _id: 2, host: "mongo-sec-2:27017", priority: 1 }
  ]
});
```

### Phase 5: Application Connection String Update
Update backend environment configuration:
```env
MONGO_URI=mongodb://mongo-primary:27017,mongo-sec-1:27017,mongo-sec-2:27017/bigchamp?replicaSet=rs0&readPreference=primaryPreferred&retryWrites=true&w=majority
```

### Phase 6: Rollback Plan
If replica set election fails or network partitioning occurs:
1. Revert `MONGO_URI` to standalone single-node connection string `mongodb://mongodb:27017`.
2. Restore verified snapshot: `python scripts/restore_mongodb.py --target-db bigchamp`.
3. Restart `bigchamp-app` container.
