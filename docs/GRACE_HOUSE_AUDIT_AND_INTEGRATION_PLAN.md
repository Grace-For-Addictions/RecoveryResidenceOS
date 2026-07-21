# Grace House VRCC — Audit & Operations Integration Plan

**Date:** July 21, 2026 · **Branch:** `claude/grace-house-vrcc-buildout-oqjtik`
**Live database:** Supabase project "Grace For Addictions" (`ykykeioydvtxpyreshhs`, us-west-2, Postgres 17)

This document is the required output of the initial architectural audit (Super Prompt §34–35). It records what exists today in the live system, what the Grace House build-out requires, the gap between them, and the gate sequence used to close that gap.

---

## A. Current State

### A.1 Repository

`Grace-For-Addictions/RecoveryResidenceOS` contained only a README at audit time. All application code for this build-out is created fresh in this repository. The prior VRCC frontend lives outside this repo; nothing here overwrites it.

### A.2 Live database (verified against the live instance, not legacy audit documents)

~90 applied migrations. Four application schemas:

| Schema | Contents | Reuse verdict |
|---|---|---|
| `public` | participants, coaching, assessments, recovery capital, slogans, ICARE plans, resources/referrals, organizations, programs, program_enrollments (FK → `gfa_residence.residences`), `app_users` (RBAC, roles: `admin` / `coach` / `participant`, server-controlled) | Reuse as-is |
| `gfa_ui` | `participant_profiles` (canonical participant identity; residence FKs point here), `user_profiles`, consent_records (insert-only 42 CFR-style audit trail), privacy_preferences, security_audit_log, check-ins, journey_events, invites | Reuse as-is — this is the identity spine |
| `gfa_core` | participants, coaches, navigators, volunteers, lookup tables | Reuse; bridged via `core_participant_id` |
| `gfa_residence` | providers, provider_members (roles: operator / house_manager / staff), residences, public_profiles, beds, waitlist, drug_tests, house_meetings, chore_assignments, incidents (levels 1–4), phase_history, discharges, fee_ledger, supervision_reports, narr_compliance, iowa_hhs_checklist | Reuse and extend — **no parallel residence subsystem is created** |

Key verified facts:

- `gfa_residence.beds.resident_id`, `waitlist.resident_id`, `drug_tests.resident_id`, etc. all FK to `gfa_ui.participant_profiles.id` — the single longitudinal participant identity already spans VRCC and residence. Preserved.
- `residences.narr_cert_status` is a check-constrained field (`certified` / `pending` / `not_certified`) defaulting to `pending` — compatible with the "never claim certified" rule; the compliance engine layers an external-decision-document requirement on top.
- `narr_compliance.status` already uses honest states (`met` / `in_progress` / `not_met` / `na`).
- RLS is enabled on every table; helper functions `public.get_my_role()`, `gfa_core.is_staff()`, `public.is_coach()`, `gfa_ui.my_participant_id()` exist and are the authorization vocabulary to reuse.
- All residence tables were empty at audit time (no Grace House row, no beds, no residents). Seeding is safe.

### A.3 What is missing (the Grace House gap)

1. **No canonical policy engine.** Nothing stores GH-CURFEW-001, GH-FEES-001, or any versioned policy; any curfew value in UI copy would be hardcoded.
2. **No document infrastructure.** No document catalog, versioning, immutable signed snapshots, or re-acknowledgment flow.
3. **No decision register.** Open items (GH-D003/D004/D013/D015) have no system representation.
4. **No pass / curfew-extension workflow.**
5. **No grievance system.**
6. **No emergency-removal documentation workflow** (Legal Addendum protocol, GH-D015 watermark).
7. **No granular ROI**, and `supervision_reports` has **no ROI gate** — a report could be generated/sent with no executed release.
8. **`drug_tests` gaps:** no preliminary vs. confirmatory distinction, no structural MOUD protection ("MOUD never counts as positive").
9. **No resident portal / staff portal code** in this repo.
10. **No release validators** (curfew ceiling, cross-document consistency, prohibited language, certification language).

## B. Target State

The Grace House operational system per the Super Prompt: policy engine feeding every document, screen, and workflow; immutable signed documents; resident portal (onboarding → daily life); staff portal (beds, intake, screens, incidents, passes, grievances); compliance evidence engine; ROI-gated justice-partner module — all additive on the existing `gfa_residence` + `gfa_ui` architecture.

## C. Gap Analysis → Build Scope

| Gap | Resolution | Gate |
|---|---|---|
| Policy engine | `gfa_residence.policies` + `policy_versions` (JSONB structured values + prose) + `policy_acknowledgments` | 1 |
| Decision register | `gfa_residence.decision_register` seeded with GH-D003/D004/D013/D015 | 1 |
| Documents & signatures | `gh_documents`, `gh_document_versions` (immutable), `gh_document_signatures` + tamper-block triggers | 2 |
| Passes / curfew extensions | `pass_requests` wired to policy engine values | 3 |
| Grievances | `grievances` with deadline tracking + anti-retaliation notice text | 3 |
| Emergency removals | `emergency_removals` with 2-hour/48-hour timers and GH-D015 watermark flag | 3 |
| Granular ROI | `releases_of_information` (per-category, recipient, purpose, expiration, revocation) | 3 |
| ROI gate | `assert_roi_for_supervision_report()` trigger on `supervision_reports` | 3 |
| Drug-test integrity | additive columns: `stage` (preliminary/confirmatory), `moud_disclosed`, DB-level rule that disclosed prescribed medication is never recorded as a violation | 3 |
| Grace House seed | residence row (canonical facts, fees from GH-FEES-001, cert status `pending`) + placeholder beds (GH-D003: beds are data, no capacity prose) | 3 |
| Portals | React app in this repo: resident + staff shells consuming the policy engine | 4 |
| Validators | `npm run validate` — curfew ceiling/consistency, prohibited language, certification language | 5 |

## D. Architecture

```
user (auth.users)
  → public.app_users.role (admin | coach | participant)          — server-controlled
  → gfa_ui.participant_profiles (participant identity spine)
  → gfa_residence.provider_members (operator | house_manager | staff) — residence-side roles
  → workspace (resident portal | staff portal)
  → gfa_residence.* operational records
  → policy engine (policies/policy_versions) feeds every rendered value
```

```
VRCC room / portal screen → React route → typed service layer (src/lib) → supabase-js
  → PostgreSQL RLS (get_my_role / my_participant_id / provider_members) → operational record + audit
```

## E. Role × Capability Matrix (residence scope)

| Capability | Resident | Peer Mentor / Coach | House Manager | Residence Admin / Operator | Compliance Admin / ED | External agency |
|---|---|---|---|---|---|---|
| Own profile, documents, ledger, IRP | personal | assigned-relationship (read where authorized) | operational | operational | operational | none |
| Other residents' records | none | none | operational (own residence) | operational (own residences) | operational | none |
| Policy engine (ACTIVE versions) | read | read | read | read + propose | approve/activate | none |
| Beds / waitlist | none | none | operational | operational | read | none |
| Drug screens | own results | none | operational | operational | read | none (curated export only) |
| Incidents / emergency removals | own (notice copy) | none | create/manage | manage | review | none |
| Grievances | submit + own | none | track (non-retaliation guarded) | manage | review | none |
| ROI | grant/revoke own | none | request | request | manage | zero direct DB access — curated exports gated on executed ROI |
| Supervision reports | view own where appropriate | none | generate (ROI-gated) | generate (ROI-gated) | review | receive export only |
| Certification status | read | read | read | read | set **only** via external-decision document | none |

## F. Participant Data Responsibility Matrix

| Workflow | Self | Assisted | On-behalf (authorized) | Staff-only | System |
|---|---|---|---|---|---|
| Intake application | ✔ | ✔ | ✔ (recorded as such) | | completion status |
| Onboarding signatures | ✔ (only the resident signs) | guided | never | | immutable snapshot |
| Daily check-in | ✔ | ✔ | | | staff-alert flags |
| IRP goals | ✔ shared ownership | ✔ | ✔ | | milestone events |
| Pass / curfew-extension request | ✔ | ✔ | ✔ | approval | policy-window validation |
| Fee ledger | view | | | ✔ entries | balance |
| Drug screens | view own | | | ✔ | phase-frequency schedule |
| Incidents | | | | ✔ | timing deadlines |
| Grievance | ✔ | ✔ | ✔ | tracking | deadline clock |
| ROI grant/revocation | ✔ | ✔ | | | expiry, audit |

Every row that permits assisted/on-behalf entry stores `entered_by` + `entry_mode` — staff-entered data is never presented as self-entered.

## G. Route Map (this repo's app)

| Area | Route | Backing data |
|---|---|---|
| Resident home | `/resident` | policy engine (curfew by phase), journey |
| Onboarding | `/resident/onboarding` | gh_documents + signatures |
| Documents ("what I signed") | `/resident/documents` | gh_document_signatures |
| Fee ledger | `/resident/fees` | fee_ledger + GH-FEES-001 |
| Passes | `/resident/passes` | pass_requests + GH-CURFEW-001 |
| Grievance | `/resident/grievance` | grievances |
| Support Now | persistent component on every screen | crisis_resources |
| Staff dashboard | `/staff` | beds, waitlist, queues |
| Beds & waitlist | `/staff/beds` | beds, waitlist |
| Screens | `/staff/screens` | drug_tests (policy-phased) |
| Incidents | `/staff/incidents` | incidents, emergency_removals |
| Grievance tracking | `/staff/grievances` | grievances |
| Compliance | `/staff/compliance` | narr_compliance, iowa_hhs_checklist, policies |

## H. Database Map

**Existing (reused, unchanged):** everything in §A.2.
**New (all additive, all RLS-enabled, in `gfa_residence`):** `policies`, `policy_versions`, `policy_acknowledgments`, `decision_register`, `gh_documents`, `gh_document_versions`, `gh_document_signatures`, `pass_requests`, `grievances`, `emergency_removals`, `releases_of_information`, `residence_audit_log`.
**Extended (additive columns only):** `drug_tests` (+`stage`, `confirmatory_of`, `moud_disclosed`, `is_violation`).

No primary-key convention changes; UUID `gen_random_uuid()` throughout, matching the existing schema.

## I. RLS Plan

- Residents: `resident_id = gfa_ui.my_participant_id()` for personal rows; ACTIVE policy versions readable by all authenticated users.
- Residence staff: membership check via `gfa_residence.provider_members` (active row, role in scope) joined through the residence's provider — same pattern as existing residence policies.
- Compliance/ED functions map to `public.get_my_role() = 'admin'` until the role vocabulary is extended (extension logged as future gate; **not** widened silently).
- Signed document snapshots: no UPDATE/DELETE policy for anyone + BEFORE trigger raising an exception — immutability enforced twice.
- External agencies: no Supabase principals at all; exports are staff-generated artifacts gated by the ROI trigger.
- Every new table: `security_audit_log`-style events for signatures, policy activation, ROI grant/revocation, exports, emergency removals.

## J. 3D / VRCC note

The immersive Des Moines world (Layers E–G of the phased map) is out of scope for this residence-operations repo and unchanged by it. Every capability here is exposed through plain React routes, which is exactly what the 3D world's rooms bind to later — one source of truth, 2D-first.

## K. Implementation Gates

| Gate | Scope | Status |
|---|---|---|
| 1 | Policy engine + decision register (migration + seed of GH-CURFEW-001 v2.0, GH-FEES-001 v1.0, GH-CONTACT-001, derived quiet/visitor hours) | this branch |
| 2 | Document versioning + signature integrity | this branch |
| 3 | Residence ops extensions (passes, grievances, emergency removals, ROI + gate, drug-test integrity, Grace House seed) | this branch |
| 4 | React app scaffold: policy client, resident + staff shells, Support Now | this branch |
| 5 | Release validators (curfew / language / certification audits) wired into `npm run validate` | this branch |
| 6 | Full resident onboarding flow (guided, 10 steps, signatures) | next |
| 7 | Staff intake workflow + orientation checklist | next |
| 8 | Compliance evidence chain + certification binder export | next |
| 9 | Justice-partner module UI (referral, bed inquiry, agency log) | next |
| 10 | Role vocabulary extension (peer_mentor, compliance_admin, executive_director) with RLS review | next |

## Decision Register (open items — never fabricated)

| ID | Item | System behavior until resolved |
|---|---|---|
| GH-D003 | Verified bed capacity / room configuration | Beds seeded as clearly-labeled placeholder rows; no capacity number appears in prose |
| GH-D004 | Deposit & refund policy | Fees render from GH-FEES-001; deposit/refund fields render as labeled placeholders |
| GH-D013 | DOC/justice-partner reporting commitments | Supervision report generation exists but transmission is blocked without an executed ROI |
| GH-D015 | Iowa occupancy-status legal review | Emergency-removal notices carry "LEGAL REVIEW REQUIRED — IOWA OCCUPANCY STATUS" watermark |
