# HELIX — GYNECOLOGIST & NURSE REGISTRATION AND AUTHENTICATION ARCHITECTURE REPORT

## Executive Summary

This report documents the implementation and verification of the clinical registration, professional verification, and role-based authentication system for **Helix**, a clinical genetics referral decision-support platform designed for Indian healthcare institutions.

The implementation strictly restricts public registration to two verified healthcare categories:
1. **Gynecologist / OB-GYN**
2. **Nurse / Medical Assistant**

System administrator accounts cannot be created through public self-service registration and must be provisioned through secure, administrative channels.

---

## 1. Required Pages and Routes Implemented

All authentication and credentialing routes have been developed in Next.js using the **Helix visual design system** (midnight navy `#031525` / `#08243B`, bioluminescent teal `#00D8C3`, muted cyan `#22C9EE`, frosted glass cards `#102B43`, and mathematical B-DNA visual panels):

| Route | Purpose | File Path | Status |
|---|---|---|---|
| `/login` | Public clinical portal sign-in | `src/app/(frontend)/(app)/login/page.tsx` | Implemented & Tested |
| `/signup` | Dedicated healthcare professional registration | `src/app/(frontend)/(app)/signup/page.tsx` | Implemented & Tested |
| `/forgot-password` | Single-use credential recovery dispatch | `src/app/(frontend)/(app)/forgot-password/page.tsx` | Implemented & Tested |
| `/reset-password` | Expirable token password update | `src/app/(frontend)/(app)/reset-password/page.tsx` | Implemented & Tested |
| `/verify-email` | Institutional email verification gateway | `src/app/(frontend)/(app)/verify-email/page.tsx` | Implemented & Tested |
| `/account-pending` | Verification status & progress tracker | `src/app/(frontend)/(app)/account-pending/page.tsx` | Implemented & Tested |
| `/account-rejected` | Structured notice & appeal channel | `src/app/(frontend)/(app)/account-rejected/page.tsx` | Implemented & Tested |
| `/doctor/dashboard` | Verified Gynecologist clinical workspace | `src/app/(frontend)/(app)/doctor/dashboard/page.tsx` | Implemented & Tested |
| `/nurse/dashboard` | Verified Nurse intake & pedigree workspace | `src/app/(frontend)/(app)/nurse/dashboard/page.tsx` | Implemented & Tested |
| `/admin/dashboard` | Governance & credential verification interface | `src/app/(frontend)/(app)/admin/dashboard/page.tsx` | Implemented & Tested |

---

## 2. Component Architecture: Split-Screen Authentication

In accordance with specifications, the reusable authentication interface has been placed in:
- `src/components/ui/sign-in.tsx`
- `src/components/ui/sign-up.tsx`

### Visual and Structural Invariants Preserved
- **Split-Screen Layout**: Left column houses clean, accessible form controls; right column renders a dedicated clinical visual panel.
- **Helix Brand Identity**: Midnight navy background with frosted glass input wrappers, border illumination on focus, and high-contrast clinical typography.
- **Restrained 3D B-DNA Visual**: Right-hand panel features an animated mathematical double helix with base-pair rungs, teal/cyan nucleotide nodes, subtle pulse effects, and clinical branding:
  > *"Clinical Clarity. Connected Genetics."*
  > *"Structured clinical assessment and genetic referral decision support for healthcare professionals."*
- **Form UX**: Glass-style inputs with icons (`Mail`, `Lock`, `Phone`, `Award`, `Building`), password visibility toggles, disabled states, accessible labels, and smooth state transitions.

---

## 3. Professional Registration & Indian Healthcare Specifics

The registration system captures Indian-specific statutory credentials:

### 3.1 Category 1: Gynecologist / OB-GYN
- **Medical Registration Number**: State Medical Council / NMC registration number.
- **State Medical Council**: Full dropdown registry including all 30 Indian State Medical Councils (Maharashtra Medical Council, Delhi Medical Council, Karnataka Medical Council, Tamil Nadu Medical Council, etc.) and NMC.
- **Medical Council Registration State**: State/UT corresponding to the registration.
- **Hospital / Clinic Name**: Institutional practice affiliation.
- **Department**: Clinical specialty department (default: Obstetrics & Gynecology).
- **Professional Designation**: Consultant, Senior Resident, Professor, etc.

### 3.2 Category 2: Nurse / Medical Assistant
- **Nursing Registration Number**: State Nursing Council / INC registration number (where applicable).
- **State Nursing Council**: INC and state nursing councils registry dropdown.
- **Hospital / Clinic Name**: Practice healthcare facility.
- **Department**: Clinical genetics / antenatal outpatient unit.
- **Professional Designation**: Staff Nurse, Genetic Nurse Coordinator, Clinical Nurse Specialist.

### 3.3 Mandatory Consents
1. *I agree to the Terms of Service.*
2. *I acknowledge the Privacy Policy and patient health data protection provisions.*
3. *I understand that clinical access requires professional verification and administrator approval.*

---

## 4. Account Lifecycle & State Machine Workflow

The user account state machine enforces strict data isolation:

```
[ Public Registration ]
         │
         ▼
[ REGISTERED / EMAIL_VERIFICATION_PENDING ]
         │ (Token confirmed via /api/auth/verify-email)
         ▼
[ PROFESSIONAL_VERIFICATION_PENDING ]  <── Access to Patient Records LOCKED
         │
         ├───▶ [ REJECTED ] ───▶ Locked out (Redirects to /account-rejected)
         │
         ├───▶ [ SUSPENDED ] ──▶ Locked out (403 Forbidden)
         │
         ▼ (Reviewed by Authorized Admin)
    [ APPROVED ]
         │
         ├── Role: Gynecologist ──▶ Redirects to /doctor/dashboard (Can finalize referrals)
         │
         ├── Role: Nurse ─────────▶ Redirects to /nurse/dashboard (Intake & Drafts only)
         │
         └── Role: Admin ─────────▶ Redirects to /admin/dashboard (Credentialing & Audit only)
```

### State Transitions Enforced on the Backend
- Newly created accounts start with `enabled: false` and `verificationStatus: 'PROFESSIONAL_VERIFICATION_PENDING'`.
- Attempted logins with unapproved accounts receive session tokens configured exclusively to display `/account-pending`. They cannot access patient records or assessment endpoints.
- Role changes are strictly guarded in `Users.ts` and API routes; callers cannot escalate roles via frontend payloads.

---

## 5. Professional Verification: Administrator Interface

Built into `src/components/admin/AdminVerificationPanel.tsx` on `/admin/dashboard`:
- **Applicant Registry Queue**: Real-time listing of pending, approved, and rejected healthcare professionals.
- **Credential Inspection**: Detailed view displaying applicant name, work email, mobile number, hospital, department, designation, registration number, and state council.
- **Administrative Decision Controls**:
  - **Approve**: Sets `verificationStatus = 'APPROVED'`, `enabled = true`, authorizes reviewer capabilities for gynecologists, records reviewer identity and timestamp, and writes an immutable audit record.
  - **Reject**: Requires a specific reason, sets `verificationStatus = 'REJECTED'`, `enabled = false`, and records the audit log.
  - **Request Additional Information**: Flags the profile with clarification notes.
- **Manual Verification Protocol**: The system explicitly documents that until direct API integrations with the National Medical Commission (NMC) or State Medical Councils are formally established, administrators must follow documented manual gazette verification.

---

## 6. Role-Based Permissions & Least-Privilege Enforcement

| Capability | Gynecologist / OB-GYN | Nurse / Medical Assistant | Administrator |
|---|:---:|:---:|:---:|
| Register Patients & Baseline ANC Vitals | Yes | Yes | No |
| Construct Family Pedigrees | Yes | Yes | No |
| Create Draft Clinical Assessments | Yes | Yes | No |
| Approve & Sign Genetic Referrals | **Yes** | **No** (Locked) | **No** (Locked) |
| Generate Specialist Consultation Briefs | **Yes** | **No** | **No** |
| Access Full Referral History | Yes | Yes (Assigned) | Audit Only |
| Review Professional Verification Queue | No | No | **Yes** |
| Approve / Reject Clinician Credentials | No | No | **Yes** |
| Manage User Roles & Suspensions | No | No | **Yes** |

---

## 7. Security Controls Implemented and Verified

1. **Password Security**: Argon2/bcrypt password hashing managed via Payload CMS authentication engine. Password validation enforces minimum 8 characters with strength requirements.
2. **Brute-Force & Lockout Protection**: Configured with `maxLoginAttempts: 5` and automatic `lockTime: 10 minutes`.
3. **Session & Cookie Security**: `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`, `maxAge: 3600` (1 hour expiration). Dual-cookie synchronization (`app-session` and `payload-token`) ensures API routes and React Server Actions stay synchronized.
4. **Account Enumeration Prevention**: Authentication error messages return generic responses (`Invalid email or password`). Password reset requests always return success regardless of whether the email exists.
5. **Session Revocation**: `/api/auth/logout` explicitly deletes session cookies across all authentication domains.
6. **Immutable Audit Logging**: Every registration, approval, and rejection is recorded in the PostgreSQL `audit_logs` table with cryptographic UUIDs and verified actor attribution.
7. **No Sensitive Patient Information in LocalStorage**: Authentication tokens reside strictly in HTTP-only cookies; no PHI or JWT tokens are stored in browser local storage.

---

## 8. Automated Test Execution & Verification

A comprehensive automated test suite (`scripts/test_auth_registration_system.mjs`) was executed against the running Next.js application on PostgreSQL staging:

| Test Case | Evaluated Behavior | Result |
|---|---|:---:|
| 1. Route Accessibility (`/login`) | Accessible with HTTP 200 | **PASSED** |
| 2. Route Accessibility (`/signup`) | Accessible with HTTP 200 | **PASSED** |
| 3. Route Accessibility (`/forgot-password`) | Accessible with HTTP 200 | **PASSED** |
| 4. Route Accessibility (`/reset-password`) | Accessible with HTTP 200 | **PASSED** |
| 5. Route Accessibility (`/verify-email`) | Accessible with HTTP 200 | **PASSED** |
| 6. Route Accessibility (`/account-pending`) | Accessible with HTTP 200 | **PASSED** |
| 7. Route Accessibility (`/account-rejected`) | Accessible with HTTP 200 | **PASSED** |
| 8. Route Guard (`/doctor/dashboard`) | Unauthenticated request redirected (HTTP 307) | **PASSED** |
| 9. Route Guard (`/nurse/dashboard`) | Unauthenticated request redirected (HTTP 307) | **PASSED** |
| 10. Route Guard (`/admin/dashboard`) | Unauthenticated request redirected (HTTP 307) | **PASSED** |
| 11. Security: Admin Public Signup Prevention | Payload with `role: admin` returns 403 Forbidden | **PASSED** |
| 12. Validation: Unsupported Category | Registration with invalid category returns 400 | **PASSED** |
| 13. Validation: Password Mismatch | Mismatched password returns 400 | **PASSED** |
| 14. Registration: Gynecologist / OB-GYN | Valid MMC registration submitted successfully (HTTP 201) | **PASSED** |
| 15. Security: Duplicate Email Prevention | Duplicate email rejected with HTTP 409 Conflict | **PASSED** |
| 16. Registration: Nurse / Medical Assistant | Valid KNC registration submitted successfully (HTTP 201) | **PASSED** |
| 17. Workflow: Email Verification | Verification token confirmed with HTTP 200 | **PASSED** |
| 18. Access Control: Pending Account Login | Unapproved account redirects to `/account-pending` | **PASSED** |
| 19. Security: Bad Credentials Generic Response | Invalid password returns generic 401 | **PASSED** |
| 20. Workflow: Forgot Password Request | Returns success message without revealing user existence | **PASSED** |
| 21. RBAC: Direct API Protection | Non-admin blocked from `/api/admin/verifications` (403) | **PASSED** |
| 22. Role Redirection: Approved Gynecologist | Log in redirects to `/doctor/dashboard` | **PASSED** |
| 23. Role Redirection: Approved Nurse | Log in redirects to `/nurse/dashboard` | **PASSED** |
| 24. Access Control: Rejected Account | Log in redirects to `/account-rejected` with reason (403) | **PASSED** |
| 25. Access Control: Suspended Account | Log in blocked with 403 Forbidden | **PASSED** |
| 26. Session Revocation: Logout | Session cookies cleared on sign out (HTTP 200) | **PASSED** |
| 27. Regression Check: Python Criteria Engine | 39 of 39 backend criteria and HTTP unit tests pass | **PASSED** |

---

## 9. Planned Integrations vs. Implemented Functionality

### 9.1 Implemented Functionality (Ready & Working)
- Full Next.js 16 + React 19 split-screen UI components with mathematical DNA graphics.
- Gynecologist and Nurse registration endpoints with Indian state councils and mobile validation.
- Database schema migrations in PostgreSQL 16 with audit logging.
- Role-based server-side redirection and route protection.
- Administrative credential review and approval/rejection panel.

### 9.2 Planned External Integrations (Documented Roadmap)
- **Ayushman Bharat Health Account (ABHA / ABDM)**:
  - *Planned Role*: Optional patient-level health record linking and consent-based health information exchange (HIE).
  - *Status*: Architecture planned. ABHA is explicitly not used for professional practitioner login.
- **DigiLocker Integration**:
  - *Planned Role*: Optional digital retrieval of verified degree and registration certificates via official National Academic Depository (NAD) / State APIs.
  - *Status*: Marked for future integration; no simulated responses are used.
- **National Medical Commission (NMC) Digital Registry API**:
  - *Planned Role*: Real-time automated verification of Indian Medical Register (IMR) numbers.
  - *Status*: Currently using documented manual review protocol pending official API onboarding.

---

## 10. Compliance & Legal Disclaimer

*Notice*: Implementation of the above technical and operational safeguards does not constitute legal or regulatory certification under the Digital Personal Data Protection (DPDP) Act, 2023, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, or HIPAA. Formal certification requires an independent statutory audit of administrative, physical, and technical safeguards.

