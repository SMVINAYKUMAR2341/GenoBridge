# HELIX PostgreSQL Architecture Migration — Corrected Design Specification

**Version**: 2.0 (Audited & Corrected)  
**Date**: 2026-11-04  
**Status**: DRAFT DESIGN — UNDER ARCHITECTURAL REVIEW (NOT PRODUCTION READY / NOT CLINICALLY READY)  
**Goal**: Migrate from Figma Cloud to self-hosted PostgreSQL with hardened security, HIPAA-aligned PHI isolation, transaction-safe connection pooling, and strict clinical governance.

---

## 1. EXECUTIVE SUMMARY

The objective of this design is migrating Helix from the hosted Figma Content API to a fully self-hosted PostgreSQL 16 database architecture while preserving all clinical decision-support logic, immutable workflow auditing, and capability-based access controls.

### Core Architectural Principles
1. **Zero Unencrypted PHI**: All database and cache communication requires TLS 1.3 encryption. Unencrypted Redis draft caching of patient data is strictly prohibited.
2. **Deterministic Role & Context Separation**: Least privilege database roles, strict transaction-local session variables (`SET LOCAL`) for Row-Level Security, and isolated migration users.
3. **De-Identified Reporting**: Reporting roles receive access only to aggregated/de-identified views; unrestricted access to raw patient records is barred.
4. **Verified DDL & Extensions**: No invalid SQL (`ALTER DATABASE ... SET ssl`), no non-immutable partial index predicates (`NOW()`), and no unverified extensions (`pgAudit` requires host binary preloading).
5. **Exact Framework Alignment**: Payload 4.0.0-beta.4 paired with `@payloadcms/db-postgres@4.0.0-beta.4` configured with uniform `idType: 'uuid'` across all collections and relationships.

---

## 2. CORRECTED ARCHITECTURE

### System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                       Load Balancer / Reverse Proxy                    │
│                      (TLS 1.3 Termination / NGINX)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          │                                                   │
    ┌─────▼─────────────────────────┐                   ┌─────▼─────────────────────────┐
    │     Next.js Application       │                   │     Next.js Application       │
    │     (Payload CMS 4.0 API)     │                   │     (Payload CMS 4.0 API)     │
    │     Stateless Server Actions  │                   │     Stateless Server Actions  │
    └─────┬───────────────────┬─────┘                   └─────┬───────────────────┬─────┘
          │                   │                               │                   │
          │                   └───────────────┬───────────────┘                   │
          │                                   │                                   │
┌─────────▼───────────────┐       ┌───────────▼───────────┐           ┌───────────▼───────────┐
│      Redis Cluster      │       │       PgBouncer       │           │     FastAPI Eval      │
│  (Session Tokens &      │       │   Connection Pool     │           │   Stateless Criteria  │
│   Criteria Metadata)    │       │  (Transaction Mode)   │           │     Engine Service    │
│  [NO PHI PERSISTED]     │       └───────────┬───────────┘           └───────────────────────┘
└─────────────────────────┘                   │
                                              │ TLS 1.3 / SCRAM-SHA-256
                                  ┌───────────▼───────────┐
                                  │      PostgreSQL 16    │
                                  │   (Primary RDBMS)     │
                                  │  - Strict UUID Keys   │
                                  │  - Transaction RLS    │
                                  │  - Immutable Audit    │
                                  └───────────┬───────────┘
                                              │
                                  ┌───────────┴───────────┐
                                  │                       │
                             ┌────▼─────┐            ┌────▼─────┐
                             │   WAL    │            │ Encrypted│
                             │ Archive  │            │ Backups  │
                             └──────────┘            └──────────┘
```

### Technology Stack & Version Mapping

| Component | Technology | Version | Purpose | Hardened Configuration |
|-----------|-----------|---------|---------|------------------------|
| **Database** | PostgreSQL | 16.x | Authoritative persistent RDBMS | SCRAM-SHA-256, TLS 1.3 required, `idType: 'uuid'` |
| **Connection Pool** | PgBouncer | 1.21+ | High-throughput connection pooling | `pool_mode = transaction`, `server_reset_query = DISCARD ALL` |
| **Cache & Rate Limit** | Redis | 7.2+ | Rate limits, token cache, criteria rules | Authenticated TLS, **Zero PHI caching** |
| **App Server** | Next.js | 16.4.2 | Application server & React 19 UI | Standalone output, node-server |
| **CMS Framework** | Payload CMS | 4.0.0-beta.4 | Clinical schema & data layer | `@payloadcms/db-postgres` adapter, `idType: 'uuid'` |
| **Evaluation Engine** | FastAPI | 0.128+ | Pure deterministic criteria logic | Uvicorn ASGI, stateless internal API |

---

## 3. SECURITY & COMPLIANCE IMPLEMENTATION

### 3.1 Authentication & Encryption

#### SCRAM-SHA-256 Password Authentication
MD5 authentication is cryptographically obsolete and completely replaced with SCRAM-SHA-256 across all accounts.

```ini
# postgresql.conf
password_encryption = 'scram-sha-256'
```

```ini
# pg_hba.conf - Enforce TLS and SCRAM-SHA-256 for all remote connections
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
hostssl all             all             127.0.0.1/32            scram-sha-256
hostssl all             all             ::1/128                 scram-sha-256
hostssl all             all             10.0.0.0/8              scram-sha-256
# Reject any unencrypted connection attempt
hostnossl all           all             0.0.0.0/0               reject
```

#### TLS Configuration
`ALTER DATABASE ... SET ssl = on` is invalid PostgreSQL syntax. TLS must be configured in `postgresql.conf`:

```ini
# postgresql.conf
ssl = on
ssl_cert_file = '/etc/postgresql/certs/server.crt'
ssl_key_file = '/etc/postgresql/certs/server.key'
ssl_ca_file = '/etc/postgresql/certs/ca.crt'
ssl_min_protocol_version = 'TLSv1.3'
ssl_ciphers = 'HIGH:!aNULL:!kEDH'
```

Clients connecting to PostgreSQL must enforce strict certificate verification:
```
DATABASE_URI=postgresql://helix_app:${DATABASE_PASSWORD}@pgbouncer:6432/helix?sslmode=verify-full&sslrootcert=/etc/ssl/certs/helix-ca.crt
```

---

### 3.2 Least-Privilege Database Roles

Database privileges are segregated across separate administrative, runtime, backup, and reporting roles:

```sql
-- 1. Schema Owner / Migration Role (Runs DDL only)
CREATE USER helix_migrator WITH PASSWORD '{{MIGRATOR_SECRET}}';
GRANT CONNECT ON DATABASE helix TO helix_migrator;
GRANT ALL ON SCHEMA public TO helix_migrator;

-- 2. Runtime Application User (Runs DML, NO DDL)
CREATE USER helix_app WITH PASSWORD '{{APP_SECRET}}';
GRANT CONNECT ON DATABASE helix TO helix_app;
GRANT USAGE ON SCHEMA public TO helix_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO helix_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO helix_app;

-- Revoke dangerous permissions from public and application users
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM helix_app;

-- Immutable audit logs: App user may INSERT and SELECT, but NEVER UPDATE or DELETE
REVOKE UPDATE, DELETE ON TABLE audit_logs FROM helix_app;
REVOKE UPDATE, DELETE ON TABLE _audit_logs_v FROM helix_app;

-- 3. Dedicated Backup User (No DDL, read-only dump)
CREATE USER helix_backup WITH PASSWORD '{{BACKUP_SECRET}}';
GRANT CONNECT ON DATABASE helix TO helix_backup;
GRANT USAGE ON SCHEMA public TO helix_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO helix_backup;

-- 4. Restricted Reporting User (NO access to raw PHI tables)
CREATE USER helix_readonly WITH PASSWORD '{{REPORTING_SECRET}}';
GRANT CONNECT ON DATABASE helix TO helix_readonly;
GRANT USAGE ON SCHEMA public TO helix_readonly;

-- Explicitly revoke access to sensitive patient and audit records
REVOKE ALL ON TABLE patients, clinical_workflows, audit_logs, _patients_v, _clinical_workflows_v, _audit_logs_v FROM helix_readonly;
```

---

### 3.3 Restricted Reporting Views (De-Identified Metrics Only)

To prevent PHI leakage through reporting tools, `helix_readonly` is only granted access to de-identified, aggregated security-definer views:

```sql
CREATE SCHEMA IF NOT EXISTS reporting;
GRANT USAGE ON SCHEMA reporting TO helix_readonly;

-- Aggregated pathway and decision summary without patient identifiers
CREATE OR REPLACE VIEW reporting.vw_referral_pathway_summary AS
SELECT 
  pathway_slug,
  decision,
  state,
  date_trunc('month', created_at) AS referral_month,
  count(*) AS total_cases
FROM public.clinical_workflows
GROUP BY pathway_slug, decision, state, date_trunc('month', created_at);

-- De-identified gestational age distribution for obstetric genetics
CREATE OR REPLACE VIEW reporting.vw_gestational_age_metrics AS
SELECT 
  pregnancy_status,
  width_bucket(gestational_age_weeks, 0, 42, 7) AS gestational_week_bracket,
  count(*) AS case_count
FROM public.patients
WHERE pregnancy_status IS NOT NULL
GROUP BY pregnancy_status, width_bucket(gestational_age_weeks, 0, 42, 7);

GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO helix_readonly;
```

---

### 3.4 Transaction-Local Row-Level Security (RLS) & Connection Pooling

#### Preventing Context Leakage in PgBouncer Transaction Mode
When PgBouncer operates in `pool_mode = transaction`, session-level `SET` commands persist on the physical connection across subsequent clients. 

**Rule**: All user context settings must use `SET LOCAL` inside an explicit transaction block:
```sql
BEGIN;
-- SET LOCAL automatically resets upon COMMIT or ROLLBACK
SET LOCAL app.current_user_id = 'c1234567-89ab-cdef-0123-456789abcdef';
SET LOCAL app.user_role = 'provider';

SELECT * FROM patients WHERE id = '...';
COMMIT;
```

#### Safe RLS Policy Implementation
RLS functions must specify `missing_ok = true` (`current_setting(..., true)`) to prevent fatal errors when unauthenticated queries run:

```sql
-- Enable and force RLS on clinical tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;

ALTER TABLE clinical_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_workflows FORCE ROW LEVEL SECURITY;

-- Policy: Only clinical staff (provider/nurse) can view patient records
CREATE POLICY patient_clinical_staff_policy ON patients
  FOR SELECT
  TO helix_app
  USING (
    current_setting('app.user_role', true) IN ('provider', 'nurse')
  );

-- Policy: Patient records are immutable via direct SQL; inserts only by authorized staff
CREATE POLICY patient_insert_policy ON patients
  FOR INSERT
  TO helix_app
  WITH CHECK (
    current_setting('app.user_role', true) IN ('provider', 'nurse')
  );

-- Deletions are forbidden at database level
CREATE POLICY patient_deny_delete_policy ON patients
  FOR DELETE
  TO helix_app
  USING (false);
```

---

### 3.5 Database Auditing (Host pgAudit vs Native Logging Fallback)

On servers where `pgaudit` binary is pre-compiled and configured in `shared_preload_libraries`:
```ini
# postgresql.conf
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'ddl, role, write'
pgaudit.log_catalog = off
pgaudit.log_parameter = on
pgaudit.log_relation = on
```

If `pgaudit` is not available in the PostgreSQL environment (such as default Windows or Alpine installations), enable native PostgreSQL audit logging:
```ini
# postgresql.conf (Native Fallback Audit)
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'ddl'
log_line_prefix = '%m [%p] %q%u@%d [%a] '
log_connections = on
log_disconnections = on
log_duration = off
log_min_duration_statement = 250
```

---

### 3.6 Application Audit Logging (Payload Web Request Context)

Payload 4 uses Web-standard `PayloadRequest` objects. IP addresses and user agents must be extracted safely from Web headers:

```typescript
// src/hooks/clinical-audit.ts (Audited Implementation)
import type { PayloadRequest } from 'payload'

export function extractClientMetadata(req: PayloadRequest) {
  const forwarded = req.headers?.get?.('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers?.get?.('x-real-ip') || 'unknown-ip'
  const userAgent = req.headers?.get?.('user-agent') || 'unknown-agent'
  return { ip, userAgent }
}
```

The application audit trail enforces:
- **Server-Authored Only**: `AuditLogs.access.create = ({ req }) => commandFor(req)?.kind === 'audit'`
- **Zero Updates / Zero Deletions**: `update: () => false`, `delete: () => false`, and `beforeDelete` throws an error.

---

### 3.7 Redis Caching Security: Zero PHI Exposure

Unencrypted caching of patient records or workflow drafts in Redis violates HIPAA security guidelines.

**Corrected Caching Policy**:
1. **Never Cache Patient Data**: Patient intake, pedigree JSON, clinical notes, and workflow revisions are **NEVER stored in Redis**. They are always queried directly from PostgreSQL with ACID guarantees and read audit logging.
2. **Safe Redis Usage**:
   - Cryptographically hashed session tokens (TTL 3600s).
   - Distributed API rate limiting counters.
   - Public, active criteria definitions (`criteria:${pathwaySlug}:${version}`) with automated cache invalidation upon criteria publication.

```typescript
// lib/criteria-cache.ts
import { redis } from '@/lib/redis'

export async function getCachedCriteria(pathwaySlug: string, version: number) {
  const cacheKey = `clinical_criteria:${pathwaySlug}:v${version}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  return null
}

export async function setCachedCriteria(pathwaySlug: string, version: number, data: unknown) {
  const cacheKey = `clinical_criteria:${pathwaySlug}:v${version}`
  // Cache for 24 hours, strictly metadata / criteria rules (NO PHI)
  await redis.setex(cacheKey, 86400, JSON.stringify(data))
}

export async function invalidateCriteriaCache(pathwaySlug: string) {
  const keys = await redis.keys(`clinical_criteria:${pathwaySlug}:*`)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

---

## 4. DATABASE SCHEMA & PERFORMANCE TUNING

### 4.1 Indexing Corrections

1. **Remove Invalid Partial Index with `NOW()`**:
   In PostgreSQL, partial index predicates must be IMMUTABLE. `NOW()` is STABLE.
   ```sql
   -- INVALID (causes syntax/execution error):
   -- CREATE INDEX idx_sessions_active ON sessions(user_id, expires_at) WHERE expires_at > NOW();

   -- CORRECTED:
   CREATE INDEX idx_users_sessions_user_expires ON users_sessions(user_id, expires_at DESC);
   ```

2. **Core Clinical Indexes**:
   ```sql
   -- Patient Lookups
   CREATE UNIQUE INDEX idx_patients_mrn_unique ON patients(mrn);
   CREATE INDEX idx_patients_created_at ON patients(created_at DESC);

   -- Workflow Revision Concurrency Boundary
   CREATE UNIQUE INDEX idx_workflows_revision_key ON clinical_workflows(revision_key);
   CREATE INDEX idx_workflows_lookup ON clinical_workflows(workflow_key, revision DESC);
   CREATE INDEX idx_workflows_patient_fk ON clinical_workflows(patient_id);
   CREATE INDEX idx_workflows_actor_fk ON clinical_workflows(actor_id);
   CREATE INDEX idx_workflows_state_pathway ON clinical_workflows(state, pathway_slug);

   -- Criteria Versioning & Governance
   CREATE INDEX idx_criteria_slug_version ON clinical_criteria(pathway_slug, version_number DESC);
   CREATE INDEX idx_criteria_lifecycle ON clinical_criteria(lifecycle) WHERE lifecycle = 'ACTIVE';

   -- Immutable Audit Log Queries
   CREATE INDEX idx_audit_logs_event_code ON audit_logs(event_code);
   CREATE INDEX idx_audit_logs_actor_name ON audit_logs(actor_name);
   CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
   CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
   ```

---

### 4.2 Resource-Derived PostgreSQL Tuning

Do not apply generic static values without measuring hardware resources. Derive settings using host metrics:

| Setting | Formula / Logic | Example for 8GB RAM / 4 CPU Cores (Dedicated) |
|---------|-----------------|-----------------------------------------------|
| `max_connections` | PgBouncer pool_size $\times$ instances + buffer | 40–50 connections |
| `shared_buffers` | 25% of total system RAM | 2GB |
| `effective_cache_size` | 50% to 75% of total system RAM | 6GB |
| `work_mem` | $(\text{RAM} - \text{shared\_buffers}) / (\text{max\_connections} \times 3)$ | 32MB |
| `maintenance_work_mem` | 5% of total RAM (capped at 2GB) | 512MB |
| `checkpoint_completion_target` | High checkpoint spread | 0.9 |
| `wal_buffers` | 16MB or 3% of `shared_buffers` | 16MB |
| `random_page_cost` | NVMe/SSD storage optimization | 1.1 |
| `effective_io_concurrency` | SSD concurrent requests | 200 |

---

## 5. REVISED 4-WEEK MIGRATION ROADMAP

### Week 1: Environment & Base Migration
- [x] Configure `@payloadcms/db-postgres@4.0.0-beta.4` with `idType: 'uuid'` in `payload.config.ts`.
- [x] Validate `--conditions=react-server` script execution.
- [x] Generate initial DDL migration (`src/migrations/*_initial.ts`).
- [x] Test migration application and synthetic data persistence in isolated database.
- [x] Verify rollback DDL execution.
- [ ] Configure SCRAM-SHA-256 and TLS certificates on staging PostgreSQL.

### Week 2: Security & RLS Integration
- [ ] Implement database roles (`helix_migrator`, `helix_app`, `helix_backup`, `helix_readonly`).
- [ ] Set up transaction-local session middleware in Next.js/Payload for `SET LOCAL app.current_user_id`.
- [ ] Establish reporting views schema (`reporting.vw_*`).
- [ ] Deploy PgBouncer in transaction mode with `server_reset_query = DISCARD ALL`.
- [ ] Validate zero-PHI policy in Redis.

### Week 3: Data Integrity & Validation
- [ ] Back up existing data stores.
- [ ] Execute dry-run migration on staging database.
- [ ] Validate UUID foreign keys across all 6 clinical pathways.
- [ ] Verify immutable audit trail on clinical workflow transitions.
- [ ] Run automated Python backend test suite (all 39 tests passing).

### Week 4: Deployment & Cutover
- [ ] Execute production migration via `helix_migrator`.
- [ ] Validate service health endpoints and criteria evaluation bridge.
- [ ] Run post-cutover data consistency audit.
- [ ] Archive legacy endpoints.

---

**Document Status**: REVIEW COMPLETED — REVISED SPECIFICATION  
**Author**: Antigravity Technical Review  
**Notice**: This document represents a structural design review and does not constitute clinical or production sign-off.
