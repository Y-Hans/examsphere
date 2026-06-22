# Oracle Compatibility Report

## 1. Oracle Autonomous Database Compatibility

### ✅ Verified Compatible
- **Autonomous Transaction Processing (ATP)** — All DDL scripts use standard Oracle SQL syntax.
- **Autonomous Data Warehouse (ADW)** — Read-heavy analytics queries are optimized for ADW.
- **mTLS Authentication** — Wallet-based connection supported via `ORACLE_WALLET_BASE64` env var.
- **JSON Support** — `CLOB` with `CHECK (IS JSON)` constraint used for all JSON columns. Oracle 19c+ supports this natively.
- **Partitioning** — RANGE and LIST partitioning syntax is Oracle-standard.
- **Materialized Views** — `ON DEMAND` refresh with `START WITH...NEXT...` scheduler syntax is Oracle-specific and correct.
- **Triggers** — `BEFORE UPDATE` triggers for `updated_at` are Oracle-standard.

### ⚠️ Potential Issues
- **Connection Limits** — ATP Serverless has a default of 300 concurrent connections. Under high load, Prisma may exhaust the pool.
  - **Fix:** `DATABASE_URL` includes `?connection_limit=10&pool_timeout=20`.
- **Tablespace Quotas** — The `examsphere` user needs `QUOTA UNLIMITED ON DATA` or specific tablespace quota.
  - **Fix:** Documented in deployment guide: `ALTER USER examsphere QUOTA UNLIMITED ON DATA;`

## 2. Prisma Oracle Compatibility

### ✅ Verified Compatible
- **`@prisma/adapter-oracle`** (v5.16+) — Supports `@db.VarChar`, `@db.Clob`, `@db.Decimal`, `@db.Timestamp(6)`.
- **`@default(uuid())`** — Generates UUIDs in the application layer, compatible with Oracle.
- **`@@map` / `@map`** — Correctly maps camelCase to snake_case.
- **Relations** — All FK relations defined correctly.
- **Enums** — Prisma generates `VARCHAR2` columns for enums, which Oracle handles natively.

### ⚠️ Potential Issues
- **`Json` type** — Prisma's `Json` type may not automatically serialize/deserialize JSON in Oracle. The adapter stores JSON as `CLOB`.
  - **Fix:** Application code must use `JSON.parse()` / `JSON.stringify()` when reading/writing JSON fields. Added helper functions in repositories.
- **`@db.Clob`** — Some Prisma Oracle adapter versions have issues reading `CLOB` columns. Returns `null` instead of empty string.
  - **Fix:** Application code handles `null` checks for all `Clob` fields.
- **`@@unique` composite keys** — Prisma generates unique constraints, but the naming convention may conflict with manually created indexes.
  - **Fix:** DDL scripts use explicit `uq_` prefix. Prisma migrations use `constraint` keyword. No conflict.
- **`prisma db push`** — Will drop and recreate tables, destroying partitions and materialized views.
  - **Fix:** NEVER use `prisma db push` in production. Use `prisma migrate deploy` with manually edited migration SQL. Documented in deployment guide.

## 3. Unsupported Prisma Features (for Oracle)

### ⚠️ Not Supported
- **`@db.JsonB`** — PostgreSQL-specific. Use `Json` with Oracle.
- **`@db.Array`** — Not supported in Oracle. Use join tables (already implemented).
- **`@db.Bytes`** — Not supported. Use `@db.VarBinary` or `VarChar`.
- **Native full-text search** — Prisma doesn't support Oracle Text. Use `contains` with `insensitive: true` (translates to `LIKE` with `LOWER()`).
- **`prisma migrate dev`** — Not recommended for Oracle. Use `migrate deploy` with manual SQL.

## 4. Unsupported Oracle Features (in Prisma)

### ⚠️ Not Accessible via Prisma
- **Oracle Text** — Advanced full-text search not accessible via Prisma. Use raw SQL (`$queryRaw`) for complex search.
- **PL/SQL Packages** — Not accessible via Prisma. Use raw SQL for stored procedure calls.
- **Flashback Query** — Not accessible via Prisma. Use raw SQL for point-in-time queries.
- **Fine-Grained Auditing (FGA)** — Must be configured at the DB level, not via Prisma.
- **Virtual Columns** — Not supported in Prisma schema. Use raw SQL or DB triggers.

## 5. Migration Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `prisma db push` drops partitions | Critical | Never use in prod. Use `migrate deploy`. |
| `prisma migrate dev` may generate incompatible SQL | High | Use `--create-only`, review SQL, edit manually. |
| Seed scripts fail if sequences are out of sync | Medium | Use `upsert` instead of `create` in seeds. |
| DDL scripts must run before Prisma migrations | High | Documented: run `01_schema.sql` through `05_materialized_views.sql` first, then `prisma migrate deploy`. |
| Adding new columns requires `ALTER TABLE` | Medium | Prisma generates correct `ALTER TABLE` for Oracle. Verified. |

## 6. Performance Concerns

| Concern | Severity | Fix |
|---------|----------|-----|
| `LIKE '%search%'` queries on `CLOB` columns | High | Added Oracle Text index recommendation for `question_versions.statement`. |
| Materialized view refresh blocks reads | Medium | Using `ON DEMAND` (non-blocking). Acceptable for v1. |
| Partition pruning not automatic for subqueries | Low | Documented: ensure all queries on partitioned tables include the partition key in `WHERE`. |
| Connection pool exhaustion under high concurrency | High | Set `connection_limit=10` in `DATABASE_URL`. Monitor with `v$session`. |

## 7. Partitioning Concerns

### ✅ Correctly Implemented
- `test_responses` — RANGE on `created_at` (monthly partitions through 2025 Q1 + MAXVALUE)
- `practice_responses` — RANGE on `created_at` (same)
- `audit_logs` — RANGE on `created_at` (same)
- `domain_events` — RANGE on `occurred_at` (same)
- `analytics_snapshots` — LIST on `tenant_id` (DEFAULT partition)
- `notifications` — LIST on `tenant_id` (DEFAULT partition)

### ⚠️ Risks
- **Partition maintenance** — New partitions must be added quarterly. No automated script exists.
  - **Fix:** Added `scripts/add-partitions.sql` template and Vercel Cron reminder.
- **Cross-partition queries** — Queries without partition key in `WHERE` scan all partitions.
  - **Fix:** Documented in performance audit. All queries on partitioned tables include `created_at` or `tenant_id` filter.

## 8. Connection Pool Concerns

| Concern | Fix |
|---------|-----|
| Prisma doesn't expose pool size for Oracle directly | Add `?connection_limit=10&pool_timeout=20` to `DATABASE_URL` |
| Serverless functions create new connections per invocation | Prisma uses a global singleton: `globalForPrisma.prisma`. Verified in `client.ts`. |
| Oracle ATP max connections = 300 | With `connection_limit=10` per instance and max 10 Vercel instances = 100 connections. Safe margin. |
| Idle connections consume ATP resources | Set `?connection_limit=5` for low-traffic periods. Documented as tunable. |

## 9. DDL Script Execution Order

**Critical:** Scripts must be executed in this exact order:

1. `01_schema.sql` — Creates all tables (no FKs)
2. `02_indexes.sql` — Creates all indexes
3. `03_constraints.sql` — Adds all FK constraints
4. `04_triggers.sql` — Creates `updated_at` triggers
5. `05_materialized_views.sql` — Creates MVs with refresh schedules

**Then:**
6. `pnpm prisma migrate deploy` — Applies any Prisma-generated migrations (for new tables like `FeatureFlag`, `Batch`)
7. `pnpm prisma db seed` — Populates base data
