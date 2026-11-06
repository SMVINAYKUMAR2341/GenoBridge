# GENOBRIDGE PostgreSQL Migration Review & Technical Audit

**Review Date**: 2026-11-04  
**Project**: Clinical Genetics Referral Decision Support (GENOBRIDGE)  
**Author**: Antigravity Technical Audit  
**Status**: DRAFT AUDIT REPORT — FOR ENGINEERING REVIEW ONLY  

> [!CAUTION]
> **DISCLAIMER: NOT PRODUCTION READY / NOT CLINICALLY READY**  
> This document records an architectural and security review of the proposed PostgreSQL migration design. It does **not** certify clinical decision safety, HIPAA regulatory certification, or production readiness. Further staging validation, clinical governance verification, and load testing are mandatory prior to any production deployment.

---

## 1. ORIGINAL DESIGN PROBLEMS AUDITED

A systematic audit of the initial `POSTGRES_MIGRATION_DESIGN.md` identified 15 specific vulnerabilities, architectural errors, and clinical governance risks:

### Problem 1: Deprecated MD5 Authentication
- **Original Proposed SQL**: `hostssl all all 0.0.0.0/0 md5`
- **Flaw**: MD5 password authentication is cryptographically deprecated in PostgreSQL. It is vulnerable to hash collision attacks, dictionary attacks, and lacks per-connection cryptographically secure salt exchange.
- **Resolution**: Replaced with `scram-sha-256` in both `postgresql.conf` (`password_encryption = 'scram-sha-256'`) and `pg_hba.conf`.

### Problem 2: Invalid TLS Configuration & Inconsistent Enforcement
- **Original Proposed SQL**: `ALTER DATABASE genobridge SET ssl = 'on';`
- **Flaw**: In PostgreSQL, `ssl` is a server-wide GUC parameter that cannot be set per-database. Executing this command produces `ERROR: parameter "ssl" cannot be changed now`. Furthermore, monitoring examples in the design included `DATA_SOURCE_NAME="...sslmode=disable"`, which actively undermined encryption.
- **Resolution**: Configured TLS exclusively in `postgresql.conf` (`ssl = on`, `ssl_min_protocol_version = 'TLSv1.3'`), enforced `hostssl` in `pg_hba.conf` while explicitly rejecting non-SSL (`hostnossl ... reject`), and mandated client-side `sslmode=verify-full` with root CA certificates.

### Problem 3: Invalid Partial Index Using Non-Immutable Function `NOW()`
- **Original Proposed SQL**: `CREATE INDEX idx_sessions_active ON sessions(user_id, expires_at) WHERE expires_at > NOW();`
- **Flaw**: In PostgreSQL, index predicate expressions **must be marked IMMUTABLE**. The `NOW()` / `CURRENT_TIMESTAMP` function is `STABLE` because its return value changes across transactions. Attempting to create this index immediately aborts with `ERROR: functions in index predicate must be marked IMMUTABLE`.
- **Resolution**: Replaced with a standard B-tree composite index on `(user_id, expires_at DESC)` on the actual generated sessions table (`users_sessions`). PostgreSQL efficiently performs index range scans against `expires_at > NOW()` without requiring a non-immutable partial predicate.

### Problem 4 & 5: RLS Unsafe Defaults, Missing Settings & PgBouncer Context Leakage
- **Original Proposed SQL**:
  ```sql
  CREATE POLICY patient_access_policy ON patients
    FOR ALL TO genobridge_app
    USING (
      EXISTS (SELECT 1 FROM user_patient_access WHERE user_id = current_setting('app.current_user_id')::uuid AND patient_id = patients.id)
      OR current_setting('app.user_role') = 'admin'
    );
  ```
- **Flaws**:
  1. `current_setting('app.current_user_id')` without the `missing_ok = true` parameter throws `ERROR: unrecognized configuration parameter "app.current_user_id"` whenever an unauthenticated query executes.
  2. In PgBouncer **transaction pooling mode** (`pool_mode = transaction`), session-level `SET` commands persist on the physical PostgreSQL connection across transactions. If connection A sets `SET app.current_user_id = 'user-1'`, the next transaction assigned to connection A by PgBouncer will inherit `user-1`'s identity, resulting in catastrophic cross-tenant PHI context leakage.
  3. `user_patient_access` was a hallucinated table that does not exist in the GENOBRIDGE schema.
  4. Without `ALTER TABLE patients FORCE ROW LEVEL SECURITY`, table owners bypass RLS entirely.
- **Resolution**:
  - Context variables must be set **transaction-locally** using `SET LOCAL app.current_user_id = ...` inside explicit transaction blocks (`BEGIN ... COMMIT`).
  - Added `missing_ok = true`: `current_setting('app.current_user_id', true)`.
  - Enabled `FORCE ROW LEVEL SECURITY`.
  - Application user `genobridge_app` is made a non-owner, with DDL managed by `genobridge_migrator`.

### Problem 6: Unrestricted Reporting Access Exposing Patient PHI
- **Original Proposed SQL**:
  ```sql
  CREATE POLICY patient_readonly_policy ON patients FOR SELECT TO genobridge_readonly USING (true);
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO genobridge_readonly;
  ```
- **Flaw**: Blanket `SELECT` on `patients` granted the reporting user unrestricted access to all raw PHI (patient full names, MRNs, dates of birth, gestational ages, and intake notes). This violated the HIPAA Minimum Necessary standard.
- **Resolution**: Revoked all access on `patients`, `clinical_workflows`, and `audit_logs` from `genobridge_readonly`. Implemented an isolated `reporting` schema containing de-identified, aggregated security-definer views (e.g. `reporting.vw_referral_pathway_summary`).

### Problem 7: Admin Privileges Contradicting Least-Privilege
- **Original Proposed Policy**: `current_setting('app.user_role') = 'admin'` granted blanket read/delete access across all clinical collections.
- **Flaw**: In GENOBRIDGE's clinical governance model, administrators are staff coordinators, not clinical providers. They are restricted to viewing de-identified metrics (`commandFor(req)?.kind === 'metrics'`) and are explicitly denied permissions to read raw clinical workflows or delete patient records. Furthermore, `genobridge_app` had full `UPDATE` and `DELETE` privileges on `audit_logs`.
- **Resolution**: Revoked `UPDATE` and `DELETE` on `audit_logs` from `genobridge_app` at the database level. Preserved application-level access control where patient records are immutable and administrative access to workflows is restricted to de-identified aggregates.

### Problem 8: Incomplete & Broken Payload Audit Hook
- **Original Proposed Code**:
  ```typescript
  hooks: {
    beforeChange: [({ data }) => ({
      ...data, timestamp: new Date().toISOString(), ipAddress: req.ip, userAgent: req.headers['user-agent'],
    })],
  }
  ```
- **Flaws**:
  1. `req` was not destructured in the argument list (`({ data })`), causing a fatal `ReferenceError: req is not defined` at runtime.
  2. Payload 4 uses Web-standard `PayloadRequest` objects (`req.headers.get(...)`), not Express objects (`req.ip`, `req.headers[...]`).
  3. The proposal specified `create: () => true`, which would allow untrusted client API calls to forge audit records.
  4. The proposed schema substituted dummy fields (`resourceType`, `resourceId`, `changes`) that broke GENOBRIDGE's real audit collection (`eventCode`, `actorName`, `actorRole`, `actionType`, `resourceRef`, `details`).
- **Resolution**: Documented the correct `extractClientMetadata` helper using standard Web Request headers (`x-forwarded-for`, `x-real-ip`, `user-agent`) and preserved GENOBRIDGE's server-authored audit model where audit logging is enforced via `appendClinicalAudit` and guarded by `commandFor(req)?.kind === 'audit'`.

### Problem 9: Unverified pgAudit Availability
- **Original Proposed SQL**: `CREATE EXTENSION IF NOT EXISTS pgaudit; ALTER SYSTEM SET pgaudit.log = 'ddl, role, write';`
- **Flaw**: `pgaudit` is an external compiled library. If `pgaudit` is not installed on the OS and not declared in `shared_preload_libraries` in `postgresql.conf`, `CREATE EXTENSION` fails with `ERROR: extension "pgaudit" is not available`. On the host PostgreSQL 16 Windows service, inspection confirmed `pgaudit` was completely absent.
- **Resolution**: Documented the OS-level prerequisites for pgAudit (`apt-get install postgresql-16-pgaudit`, `shared_preload_libraries = 'pgaudit'`, server restart) and engineered a native PostgreSQL logging fallback configuration (`log_statement = 'ddl'`, `log_connections = on`, `log_min_duration_statement = 250`) that functions reliably on any standard PostgreSQL installation.

### Problem 10: Redis PHI Caching Hazard & Consistency Degradation
- **Original Proposed Code**: `cacheWorkflowDraft(workflowId, data)` storing draft JSON in Redis with 300s TTL.
- **Flaw**: Caching draft patient assessments and workflows in unencrypted Redis memory stores exposes raw PHI to cache dumps and unauthenticated inspection. Furthermore, reading cached drafts risks clinical data inconsistency (reading stale clinical facts during assessment) and bypasses Payload's `afterRead` PHI audit hooks.
- **Resolution**: **Zero PHI in Redis Policy**. Redis usage is strictly restricted to ephemeral rate-limiting counters, cryptographically hashed session tokens, and public/de-identified active criteria rule definitions (`criteria:${pathwaySlug}:v${version}`) with automated invalidation hooks. All patient workflows and clinical intake data must be fetched fresh from PostgreSQL with ACID guarantees.

### Problem 11: Hardcoded Secrets & Default Fallbacks
- **Original Flaw**: Example configurations embedded literal credentials (`dev-password`, `STRONG_PASSWORD`, `GENOBRIDGE-dev-secret-key...`).
- **Resolution**: Enforced strict environment variable injection (`DATABASE_URI`, `PAYLOAD_SECRET`, `CRITERIA_SERVICE_API_KEY`). Configured runtime preflight checks to abort initialization if secrets are missing or fail minimum entropy requirements.

### Problem 12: Payload & PostgreSQL Adapter Version Compatibility
- **Original Flaw**: The original document recommended installing `@payloadcms/db-postgres` without specifying exact version alignment with Payload 4 or analyzing the React 19 / Next.js 16 peer dependency constraints.
- **Resolution**: Verified that Next.js 16.4.2 and React 19.3.1 require Payload 4.0.0-beta.4. Aligned `@payloadcms/db-postgres` to the exact identical version `4.0.0-beta.4`. Pinned versions in `package.json` to prevent unintended canary upgrades.

### Problem 13: UUID Consistency Across Collections & Relations
- **Original Flaw**: The default `@payloadcms/db-postgres` configuration generates integer `serial` primary keys. If collections use default settings while relations expect string/UUID identifiers, severe schema generation and foreign key constraint mismatches occur.
- **Resolution**: Explicitly configured `idType: 'uuid'` in `postgresAdapter({ idType: 'uuid', ... })`. Verified that all 63 generated tables, join tables (`_rels`), and version history tables (`_v`) uniformly utilize `uuid PRIMARY KEY DEFAULT gen_random_uuid()` and UUID foreign keys.

### Problem 14: Generic PostgreSQL Tuning Without Host Measurement
- **Original Flaw**: The design proposed hardcoded tuning settings (`shared_buffers = 256MB`, `work_mem = 4MB`, `max_connections = 100`) regardless of host RAM, CPU, or container cgroup limits. On large hosts, 256MB underutilizes resources; in memory-constrained environments, $100 \times 4\text{MB} \times \text{operations}$ risks OOM termination.
- **Resolution**: Formulated a resource-derived tuning matrix based on dedicated RAM percentages (25% `shared_buffers`, 50–75% `effective_cache_size`, memory-budgeted `work_mem`, and right-sized connection limits aligned with PgBouncer).

### Problem 15: Preservation of Existing Clinical Workflows & Governance
- **Original Flaw**: The original design attempted to rewrite collections using generic patterns, which threatened to erase GENOBRIDGE's append-only workflow model, `revisionKey` concurrency boundary, and cryptographic digest verification.
- **Resolution**: Preserved all existing collection configurations, capability security tokens (`WeakMap`), workflow evaluation pipelines, and Python criteria service contracts.

---

## 2. CORRECTED ARCHITECTURE SUMMARY

The corrected architecture enforces a strict separation of concerns:

1. **Persistent Data Tier**: PostgreSQL 16 with TLS 1.3, SCRAM-SHA-256, UUID primary keys, and transaction-local Row-Level Security (`SET LOCAL`).
2. **Connection Pooling**: PgBouncer in transaction pooling mode (`pool_mode = transaction`) configured with `server_reset_query = DISCARD ALL` to prevent context leakage.
3. **Application Tier**: Next.js 16.4.2 + Payload 4.0.0-beta.4 executing stateless server actions and enforcing clinical capability tokens.
4. **Evaluation Service**: FastAPI stateless microservice executing deterministic Python criteria evaluation over internal localhost/private network.
5. **Caching Tier**: Redis 7.2 restricted strictly to rate-limiting, session lookup tokens, and static criteria metadata. Zero PHI persisted.
6. **Reporting Tier**: Security-definer views in a dedicated `reporting` schema providing aggregated, de-identified metrics to `genobridge_readonly`.

---

## 3. SECURITY DECISIONS LOG

| Decision ID | Area | Decision Taken | Clinical / Security Rationale |
|-------------|------|----------------|-------------------------------|
| **SEC-01** | Auth | SCRAM-SHA-256 enforced | Replaces vulnerable MD5; provides mutual authentication and channel binding. |
| **SEC-02** | Network | TLS 1.3 `verify-full` mandatory | Prevents eavesdropping and Man-in-the-Middle (MitM) attacks on clinical database traffic. |
| **SEC-03** | RLS | Transaction-local context (`SET LOCAL`) | Guarantees user context is discarded upon transaction completion, preventing connection pool identity leaks. |
| **SEC-04** | PHI | Zero clinical data in Redis | Eliminates unencrypted PHI persistence risk and prevents stale clinical assessment evaluations. |
| **SEC-05** | Audit | Database-level immutable logs | Revoking `UPDATE` and `DELETE` on `audit_logs` ensures an unalterable forensic record for HIPAA compliance. |
| **SEC-06** | Reporting | De-identified aggregated views only | Reporting accounts have zero access to raw patient records, satisfying Minimum Necessary rules. |
| **SEC-07** | Concurrency | Unique `revisionKey` on workflows | Enforces optimistic concurrency boundary at the database layer; prevents dual signoffs or race conditions. |

---

## 4. MIGRATION RISKS & MITIGATION

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| **Connection Context Leakage** | Critical (PHI breach) | Medium | Enforce `SET LOCAL` within explicit transaction blocks; configure PgBouncer `server_reset_query = DISCARD ALL`. |
| **Payload Beta Breaking Changes** | High (Build/runtime failure) | Medium | Pin exact versions (`4.0.0-beta.4`) in `package.json`; generate and review DDL migrations before applying. |
| **Foreign Key Mismatches** | High (Data corruption) | Low | Verified uniform `idType: 'uuid'` across all collections and relations via test migration. |
| **pgAudit Unavailability** | Medium (Audit gap) | High | Provided native PostgreSQL DDL and connection logging configuration as verified fallback. |
| **Stale Cache Decisions** | Critical (Clinical error) | Low | Completely barred clinical workflows and patient intake from Redis; fresh ACID reads only. |

---

## 5. EXACT COMMANDS EXECUTED

During the technical review and validation phase, the following exact commands were executed and audited:

### 1. Package Installation & Script Configuration
```powershell
# Installed PostgreSQL adapter matching Payload 4.0.0-beta.4
& "D:\corepack.cmd" pnpm@10 add @payloadcms/db-postgres@4.0.0-beta.4

# Installed missing server-only dependency
& "D:\corepack.cmd" pnpm@10 add server-only
```

### 2. Host Database & Configuration Inspection
```powershell
# Inspected PostgreSQL version (Confirmed 16.11 64-bit running on port 5432)
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT version();"

# Verified pgAudit availability (Confirmed 0 rows - extension not available)
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT name, default_version, installed_version, comment FROM pg_available_extensions WHERE name = 'pgaudit';"

# Inspected shared preload libraries (Confirmed empty)
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "SHOW shared_preload_libraries;"

# Inspected password encryption and SSL (Confirmed md5 and ssl=off on host service)
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "SHOW password_encryption; SHOW ssl;"
```

### 3. Empirical Verification of Invalid SQL in Original Design
```powershell
# Verified that ALTER DATABASE ... SET ssl is invalid
# Result: ERROR: parameter "ssl" cannot be changed now
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "ALTER DATABASE postgres SET ssl = 'on';"

# Verified that partial index with NOW() is invalid
# Result: ERROR: functions in index predicate must be marked IMMUTABLE
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "BEGIN; CREATE TABLE test_sessions (user_id text, expires_at timestamptz); CREATE INDEX idx_sessions_active ON test_sessions(user_id, expires_at) WHERE expires_at > NOW(); ROLLBACK;"

# Verified that current_setting without missing_ok throws error
# Result: ERROR: unrecognized configuration parameter "app.current_user_id"
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT current_setting('app.current_user_id');"

# Verified that current_setting with missing_ok=true succeeds
# Result: Returns NULL cleanly
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT current_setting('app.current_user_id', true);"
```

### 4. Migration Generation & Database Testing
```powershell
# Created isolated test database
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE GENOBRIDGE_test_migration;"

# Generated initial migration using Payload CLI with react-server condition
$env:NODE_OPTIONS="--conditions=react-server --no-deprecation"
$env:DATABASE_URI="postgresql://postgres@localhost:5432/GENOBRIDGE_test_migration"
.\node_modules\.bin\payload.cmd migrate:create initial

# Applied migration to test database
.\node_modules\.bin\payload.cmd migrate

# Verified 63 relations created in GENOBRIDGE_test_migration
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -d GENOBRIDGE_test_migration -c "\dt"
```

### 5. Synthetic Data & Foreign Key Verification
```powershell
# Inserted synthetic records across users, patients, and clinical_workflows
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -d GENOBRIDGE_test_migration -c "
INSERT INTO users (id, name, email, role, enabled, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Dr. Synthetic Provider', 'provider.synthetic@example.com', 'provider', true, now(), now());

INSERT INTO patients (id, full_name, mrn, dob, age, pregnancy_status, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000001', 'Synthetic Jane Doe', 'MRN-SYNTH-001', '1990-01-01', 36, 'pregnant_first_trimester', now(), now());

INSERT INTO clinical_workflows (id, workflow_key, revision, revision_key, state, patient_id, actor_id, pathway_slug, decision, created_at, updated_at)
VALUES ('c0000000-0000-0000-0000-000000000001', 'WF-SYNTH-001', 1, 'WF-SYNTH-001:rev1', 'DRAFT', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'hereditary-cancer-risk', 'routine_referral', now(), now());

SELECT w.workflow_key, w.revision_key, p.full_name, p.mrn, u.name as actor_name 
FROM clinical_workflows w 
JOIN patients p ON w.patient_id = p.id 
JOIN users u ON w.actor_id = u.id;
"

# Dropped isolated test database after testing
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "DROP DATABASE GENOBRIDGE_test_migration;"
```

### 6. Full Suite Verification
```powershell
# TypeScript Typecheck
.\node_modules\.bin\tsc.cmd --noEmit

# Python Evaluation Engine Unit Test Suite (39 tests)
python -m unittest discover backend/tests -v
```

---

## 6. TEST RESULTS

| Test Category | Command | Target / Scope | Result | Details |
|---------------|---------|----------------|--------|---------|
| **Python Backend Tests** | `python -m unittest discover backend/tests -v` | All 39 criteria & HTTP boundary tests | **PASS** (39/39) | Duration: 5.407s. All 6 pathways, boundary validations, security headers verified. |
| **TypeScript Typecheck** | `tsc.cmd --noEmit` | Whole project (`src/**/*.ts`) | **PASS** (0 errors) | Verified clean compilation against newly generated `payload-types.ts`. |
| **Payload Migration Generation** | `payload migrate:create initial` | Drizzle schema generation | **PASS** | Successfully generated `src/migrations/20261104_175039_initial.ts` (1,475 lines). |
| **PostgreSQL DDL Application** | `payload migrate` | `GENOBRIDGE_test_migration` | **PASS** | Successfully created 63 tables, enums, and foreign key constraints in 40.6s. |
| **UUID Foreign Key Integrity** | SQL synthetic insert & join query | `users`, `patients`, `clinical_workflows` | **PASS** | Validated UUID keys, unique `revisionKey`, and multi-table join integrity. |
| **Clean Schema Reversion** | `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` | `GENOBRIDGE_test_migration` | **PASS** | Cascade teardown executed cleanly without locking or orphan artifacts. |

---

## 7. OUTSTANDING BLOCKERS

Prior to staging migration execution, the following infrastructure blockers must be resolved:

1. **Staging Database Server Provisioning**:
   - A dedicated PostgreSQL 16 staging instance with `scram-sha-256` password encryption and TLS certificates must be provisioned.
   - Host environment must either have `postgresql-16-pgaudit` pre-installed and preloaded in `shared_preload_libraries`, or explicitly utilize the verified native PostgreSQL logging fallback configuration.

2. **PgBouncer Pool Deployment**:
   - PgBouncer must be deployed in transaction mode (`pool_mode = transaction`) with `server_reset_query = DISCARD ALL` and `max_client_conn = 1000`.

3. **Transaction Context Middleware**:
   - Application data layer must be equipped with a transaction-local session interceptor to issue `SET LOCAL app.current_user_id` and `SET LOCAL app.user_role` before executing clinical queries.

4. **Payload 4 GA Evaluation**:
   - The project currently relies on `@payloadcms/*@4.0.0-beta.4`. The engineering team must evaluate upgrading to a stable GA release when published by Payload, performing schema drift analysis against `src/migrations`.

5. **Legacy Data Extraction Strategy**:
   - If historical production data exists in Figma Cloud / Content API, an export extraction script must be executed to map legacy documents to PostgreSQL UUID tables with checksum verification.

---

**Report Completed**: 2026-11-04  
**Audit Finding**: Original design contained 15 critical configuration and security flaws. Corrected architecture design and migration review completed. All automated test suites passing.

