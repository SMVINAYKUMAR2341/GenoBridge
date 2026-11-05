# Internal stateless criteria evaluator

Python 3.11+; all implementation and tests live in `backend/`. This is a pure
compute integration, **not** a second application backend. It has no database,
Payload adapter, migrations, criteria storage, patient storage, user accounts,
sessions, custom user authentication, outbound calls, or clinical defaults.
The existing Next.js/Payload application remains authoritative for records,
criteria approval, application authorization, and any permitted audit storage.
No frontend or Payload files are changed by this service.

**Use synthetic, de-identified software-test inputs only. Do not send real PHI.**
Nothing here constitutes clinical validation, a guideline, or a deployment
compliance claim. The tests contain arbitrary logic fixtures, not clinical
thresholds or default referral advice. No production criteria are supplied.

## Trust boundary and deployment

```text
Browser -> authenticated/authorized Next server bridge -> private Python service
                     |                                          |
              approved Payload criteria                   pure evaluation
```

The parent application implements the bridge; it is intentionally not included
here. The bridge must authenticate/authorize its caller, validate and allowlist
facts against the requested pathway, load approved criteria from trusted
server-side records, and assign `evaluatedAt` using its own clock. **Never accept
criteria, reviewer/approval metadata, or evaluation time from a browser, and
never forward a browser-supplied request envelope unchanged.** The service key
asserts that the caller is the trusted bridge; it does not cryptographically
verify each criteria record or replace application authorization.

Provision `CRITERIA_SERVICE_API_KEY` as an external-integration secret on both
servers (at least 32 UTF-8 bytes, cryptographically random, no surrounding
whitespace). Supply it through each hosting platform's secret-management flow,
not source control, chat, a URL/query string, or a public environment variable.
This is **not** a Payload/Figma platform-owned secret. Do not change Payload
configuration or request its managed secrets to run this service. On the Next
side, read the key only in server-only code. A bridge-only
`CRITERIA_SERVICE_URL` can hold the private service origin. Never use
`NEXT_PUBLIC_*`/`VITE_*` for credentials or expose the key in browser props.
Coordinate rotation on both hosts; this implementation accepts one current key.

`POST /evaluate` requires exactly one `X-Criteria-API-Key` header. UTF-8 bytes are
compared with `hmac.compare_digest`; authentication occurs before body parsing.
Missing/short service-key configuration fails startup closed. `GET /health`
returns only `{"status":"ok"}` without authentication. All responses specify
`Cache-Control: no-store`. Interactive docs/OpenAPI endpoints and CORS are not
enabled. **CORS is not an authorization or network isolation control.**

Deploy independently of the managed Next/Payload lifecycle. Use private ingress,
TLS, restrictive network policies, request/time/concurrency limits, and hosting
secret management. A shared service key is not sufficient protection over the
public internet. Disable request/response body and credential logging at all
proxies/APM layers; the service itself does not log payloads or keys. Disable
access logs if URLs might acquire sensitive information. The adapter limits
request bodies to 1 MiB, but does not implement infrastructure rate limiting.

Independent hosting controls, **MFA, encryption at rest, regulatory compliance,
external audit retention, secret rotation automation, and TLS termination are
not implemented**. Although this service stores nothing, process memory, crash
dumps, infrastructure logs, backups, and the parent app remain separate risks.
There is no persistence or custom authentication backend to configure here.

## Run and validate

From the repository root (not from inside `backend/`):

```sh
python -m pip install -r backend/requirements.txt
# First provision CRITERIA_SERVICE_API_KEY through server environment management.
python -m uvicorn backend.app:app --host 127.0.0.1 --no-access-log
```

The local-only command uses Uvicorn's default service port, 8000. For deployment,
use the independently allocated service port and private interface supplied by
its host; do not replace or modify the existing Next.js dev server or its port.
Direct dependency versions are pinned; deployment owners should review/lock
transitive dependencies and apply dependency security updates before hosting.

No pip installation is needed for the engine tests:

```sh
python -B -S -m unittest discover -s backend/tests -p test_engine.py -v
```

`-S` disables site-packages, demonstrating that the engine/tests need only the
standard library. To run all tests, including the optional HTTP adapter suite:

```sh
python -B -m unittest discover -s backend/tests -v
```

HTTP tests use a small in-process ASGI client, not an extra test dependency.
They skip if FastAPI is absent. No test opens a network port or uses real PHI.

## Engine and HTTP API: exact v1 contract

Python entry point: `from backend.engine import evaluate`; call
`evaluate(payload)` to receive a plain JSON-serializable dictionary. It reads no
environment, clock, file, network, or database, and does not mutate its argument.
Identical JSON inputs produce identical output, including ordering and timestamp.
Rule and citation order follows the supplied array order; the bridge should
supply stable ordering. No runtime Pydantic import is needed by the engine.

The HTTP adapter uses this same contract:

```http
POST /evaluate
Content-Type: application/json
X-Criteria-API-Key: [server-only configured credential]
```

A safe empty-criteria request (not a default recommendation):

```json
{
  "schemaVersion": "1.0",
  "pathway": "hereditary-cancer-risk",
  "evaluatedAt": "2026-06-01T12:00:00Z",
  "facts": {},
  "criteria": []
}
```

The empty array produces `criteria_pending_approval`. All object fields in the
following request types are required; undocumented keys are rejected. Flat fact
keys are literal identifiers, **not** property paths or executable expressions.
The types document the wire format for the parent TypeScript bridge; they are
not modifications to the parent application.

```ts
type Pathway =
  | 'hereditary-cancer-risk'
  | 'preconception-carrier-screening'
  | 'nipt-results'
  | 'abnormal-ultrasound-findings'
  | 'infertility-recurrent-pregnancy-loss'
  | 'positive-family-history';
type Primitive = string | number | boolean; // finite numbers only; no coercion
type ClinicalOutcome =
  | 'urgent_referral' | 'routine_referral'
  | 'no_referral_needed' | 'borderline_consideration';
type Outcome = ClinicalOutcome
  | 'insufficient_information' | 'criteria_pending_approval';
type Condition =
  | { field: string; op: 'eq' | 'ne'; value: Primitive }
  | { field: string; op: 'in'; value: Primitive[] }
  | { field: string; op: 'gte' | 'lte'; value: number }
  | { field: string; op: 'exists'; value: boolean };
type Source = {
  title: string;
  org: string;
  guidelineVersion: string;
  date: string; // YYYY-MM-DD
  page: string | null;
  section: string | null;
  url: string; // absolute HTTP(S), no credentials; never fetched by this service
};
type Criterion = {
  id: string; // unique within this request; supply one selected version per ID
  pathway: Pathway;
  status: string; // only exact 'ACTIVE' is eligible; others are pending/inactive
  approvedAt: string | null; // offset-aware ISO timestamp; null is ineligible
  reviewer: string | null; // approved reviewer identifier; null is ineligible
  effectiveDate: string; // YYYY-MM-DD, inclusive in UTC
  reviewDate: string; // YYYY-MM-DD, exclusive in UTC; due means ineligible
  simulated: false; // all other values are rejected, not silently skipped
  sources: Source[]; // nonempty
  conditions: Condition[]; // nonempty; logical AND
  requiredFields: string[]; // unique, all must be present and non-null to match
  exclusions: Condition[]; // logical OR; any true exclusion prevents a match
  outcome: ClinicalOutcome;
  destination: string;
  rationale: string;
  version: string; // immutable approved criteria version supplied by bridge
};
type EvaluationRequest = {
  schemaVersion: '1.0';
  pathway: Pathway;
  evaluatedAt: string; // offset-aware ISO timestamp assigned by trusted server
  facts: Record<string, Primitive | null>;
  criteria: Criterion[];
};

type EligibilityReason =
  | 'not_active' | 'approval_missing' | 'approval_in_future'
  | 'not_yet_effective' | 'review_due' | 'different_pathway'
  | 'invalid_criteria' | 'invalid_evaluation_time';
type EvaluationResponse = {
  schemaVersion: '1.0';
  engineVersion: '1.0.0';
  pathway: Pathway | null;
  timestamp: string | null; // echoes valid evaluatedAt, NEVER a local wall clock
  outcome: Outcome;
  reasonCode: 'invalid_input' | 'no_eligible_criteria' | 'conflicting_criteria'
    | 'incomplete_potential_match' | 'no_match' | 'matched_criteria';
  rationale: string; // selected criteria text, or nonclinical safety explanation
  destinations: string[]; // selected winning rules only; empty for fallbacks
  matchedCriteria: { id: string; version: string; outcome: ClinicalOutcome }[];
  missingFields: string[]; // sorted unknown/absent/null/incompatible fact keys
  criteriaSnapshots: {
    index: number;
    criteria: Criterion | null;
    eligible: boolean;
    eligibilityReasons: EligibilityReason[];
    evaluation: 'not_evaluated' | 'matched' | 'unmatched' | 'unresolved';
    missingFields: string[];
  }[];
  sourceCitations: { criteriaId: string; source: Source }[];
  criteriaVersions: { id: string; version: string }[];
  reviewPending: boolean;
  validationErrors: { path: string; message: string }[];
};
```

Dates/timestamps and strings are validated, not inferred. Non-null metadata
strings must be nonempty (max 8192 characters); review date must follow effective
date. Approval must not be in the future. A rule is eligible only for the
requested pathway, with exact `ACTIVE`, an approval timestamp and reviewer,
`simulated: false`, and `effectiveDate <= UTC date(evaluatedAt) < reviewDate`.
Approval provenance/authenticity remains the bridge's responsibility. This
service cannot detect a correctly shaped but forged approval from a trusted
caller. Citation URLs are only returned as data; render them safely in the UI.

Bounds: 250 criteria, 500 facts, 100 conditions/exclusions/required fields per
rule, 100 sources per rule, and 100 `in` operands. `in` operands are nonempty.
Null is allowed as a fact (unknown), but not as a condition operand. `exists`
uses true/false to test non-null presence. Equality/membership are type-aware:
`true` is not numeric `1`; only finite numeric values are order-comparable.
String-to-number and truthy conversions are never performed.

### Safety decision order

1. Any malformed/missing envelope or malformed rule (even one for another
   pathway), duplicate criteria ID, or simulated criterion returns
   `insufficient_information`. Duplicate JSON keys and invalid JSON also fail
   closed. No partially validated set is evaluated.
2. No eligible rules returns `criteria_pending_approval`.
3. For each eligible rule: conditions are AND, exclusions are OR. A known false
   condition or known true exclusion proves a nonmatch even if other fields are
   missing. Otherwise, unknown condition/exclusion facts or missing required
   fields leave the rule unresolved. Incompatible types count as unknown, not
   as false (including `ne`). Missing required fields alone cannot make a rule
   match. An explicit `exists: false` can match absence unless requiredFields
   forbids it; it can **never** alone justify a negative outcome.
4. Matched negative plus matched urgent/routine positive yields manual
   `borderline_consideration`, even if urgent matched. No destination is chosen.
5. Any unresolved eligible rule returns `insufficient_information` **unless an
   urgent rule already matched**. This conservatively includes missing fields
   in negative/borderline rules, not just potentially urgent ones. An urgent
   result still reports all missing fields for follow-up.
6. No matches yields manual `borderline_consideration`, never a negative.
7. Otherwise priority is urgent, routine, borderline, explicit negative. Only a
   matched negative with complete required and referenced fields, no conflicting
   positive or borderline match, and no unresolved rule produces
   `no_referral_needed`. There is no implicit negative or clinical threshold.

Every evaluation response contains the full response envelope, including safety
outcomes. Snapshots include **all** supplied valid rules, including ineligible
and different-pathway rules; malformed entries have `criteria: null` and an
`invalid_criteria` marker rather than reflecting untrusted malformed content.
When the criteria array itself is missing/invalid/over limit, snapshots are
empty. Citations/versions cover validated rules for the requested pathway,
including ineligible rules; they are provenance, not evidence that a rule
matched. Use `matchedCriteria` and snapshot evaluation state to distinguish.
Facts and credentials are never echoed. Invalid evaluation time/pathway are
represented by null timestamp/pathway, never manufactured defaults.

`reviewPending` is true for invalid/pending criteria, any ineligible rule for the
requested pathway, unresolved information (even with an urgent result), and any
manual borderline outcome. It is **not** a claim that a real review task was
persisted, and false does not certify clinical safety. Snapshots are returned
only; the service never stores them. The bridge must handle any needed audit
capture under the existing Payload authorization/privacy model.

Evaluation/domain failures return HTTP 200 with a safety outcome; callers must
inspect `outcome`, not merely HTTP success. Transport errors are separate:
401 unauthorized, 413 body too large, 415 unsupported content type, normal
404/405 for unknown routes/methods. Their body is `{ "detail": string }`, not an
evaluation response. The bridge must fail closed on HTTP errors, timeouts, or
an unexpected response schema; it must never convert those into a negative
recommendation. `/health` is a liveness check, not clinical readiness.
