# Helix clinical workspace

## Preview only until reviewed

This app supports clinical decisions; it is not a diagnostic or emergency triage
service. Starter criteria, citations, patients, assessments, and audit entries are
demonstration content, not evidence of clinical validation.

All 24 starter criteria require explicit specialist attestation. Historical sample
validation labels alone do not qualify: `approvalAttested` must also be true.
Clinical actions refuse to save decisions from an unapproved pathway. Simulations
generate clearly marked sample documents without persisting patient assessments.
An unmatched rule is unresolved/borderline, never a negative assessment.

## Provision staff

1. Use the existing Figma-managed CMS sign-in at `/admin`.
2. Open **Staff access → Users** and create a staff account with an email, password,
   name, and enabled status.
3. Assign `provider` for assessments/intake or `admin` for specialist governance
   and aggregate reporting. Public staff signup is disabled.
4. Sign in through **Staff sign in** in the clinical workspace. App sessions use
   the HTTP-only `app-session` cookie independently of CMS sign-in.
5. Disable accounts when access should end. Sessions expire after one hour; the
   interface also clears sensitive state after 15 idle minutes.

Synthetic QA accounts retained after verification must remain disabled.

## Review and approve a pathway

With an app specialist-admin account, open **Clinical criteria** and select a
criterion. Verify its trigger conditions, target, urgency, rationale, and source
against current guidelines. Enter a new revision and review notes. Attest only
if qualified to approve the rule.

An empty conditions array uses the original named trigger. Nonempty arrays override
it: every `{ "field": "...", "equals": ... }` condition must match. The editor lists
supported keys and values. Changes to clinical fields outside the attestation
workflow revoke approval. Payload version history retains previous revisions.

Negative-baseline criteria also require review. The entire pathway must be
approved before clinical decisions can be recorded.

## PHI deployment gate

Do not enter real patient information until the organization verifies:

- HIPAA-appropriate hosting and a signed BAA where required.
- Encryption in transit and at rest, key management, backups, and recovery.
- Retention, access reviews, incident response, and minimum-necessary permissions.
- Clinical validation, local referral targets, turnaround times, and guideline currency.

The app does not certify hosting encryption or HIPAA compliance. Audit events do
not infer encryption. Authenticated patient/assessment reads are logged. Clinical
writes and criteria reviews create immutable audit events via collection hooks
using the same request context. New assessments retain a stable patient relationship
as well as historical patient and criterion snapshots.

Downloaded documents may contain PHI. Downloads are not EHR orders, appointments,
or specialist notifications.

## Rendering and freshness

`/` is a static shell with a cached public clinical catalog, tagged with
`clinical-pathways` and `clinical-criteria`. Collection `afterChange` and
`afterDelete` hooks invalidate these tags. The specialist editor refreshes after
successful writes. Private records and metrics use authenticated uncached actions;
they are never embedded in the static shell or a shared public cache.

CLI seeds run outside the Next.js cache context. Invalidation warnings are surfaced;
rebuild/Publish after CLI content changes. Normal app/CMS writes run within the
server runtime and invalidate the tagged public catalog.

## Checks

- `pnpm exec tsc --noEmit`
- `node --test tests/clinical-engine.test.cjs`
- `pnpm run format <changed paths>`
- `figma make verify-deploy`

The managed development server is already running. Do not start another one.
