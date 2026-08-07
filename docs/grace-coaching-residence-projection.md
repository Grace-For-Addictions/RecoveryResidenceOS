# Grace Coaching → Recovery Residence projection (audit note, 2026-08-07)

Companion note to the Phase 0 audit in
`GFA-ECO/docs/discovery/grace-coaching-audit.md`. That document holds the full
inventory, security findings, and the KEEP/EXTEND/MIGRATE/DEPRECATE/REMOVE map for
the Recovery Support & Coaching Engine. This note records the residence-side facts
and the integration contract for this repository.

## Current state of this app

This application surfaces **no coaching data at all** today. A repo-wide search for
`assigned_coach`, `coach_id`, or any coaching/session/messaging table returns only
directory prose (`src/directory/iowa.ts`, directory profile pages). `ResidentHome`
has no support-team, coach, or upcoming-session card.

Meanwhile the live coaching-engine trigger `v2_on_coach_assigned` (recovered in
GFA-ECO `docs/migration/recovered/`) mirrors assignments into
`v2_profiles.coach_id` with the comment "residence app reads this" — an assumption
this codebase does not currently satisfy. No work here depends on that mirror, and
it is slated for DEPRECATE in the migration map. **Do not build against
`v2_profiles.coach_id` or `participants.assigned_coach_email`.**

## Integration contract (Phase 7 of the engine plan)

When the resident "Support Team" surface is built here, it must be a **projection
of the canonical engine, never a copy**:

- Read the same `recoveryos.coaching_relationships` / `navigation_relationships`
  rows (extended per the migration map) for "Your Recovery Coach / Navigator".
- Read the same `recoveryos.appointments` rows for "Upcoming support sessions" —
  the identical session a participant sees in VRCC, not a residential duplicate.
- Messaging stays in the engine's conversation tables; residence staff get **no
  access** to coach–participant message content or coaching notes. Staff-visible
  operational metadata (has coach: yes/no, next session where authorized,
  follow-up status) flows through consent- and role-scoped views only
  (`consent_grants` gating, `security_invoker` view pattern per recoveryos 0023).
- Coaches working in a residence context deep-link into the same coaching
  workspace (`/coach/participants/:id`) — no duplicate profile, session, or
  conversation is ever created on the residence side.

## Why nothing was changed here yet

The engine's canonical tables are being extended in GFA-ECO first (Phases 1–6 of
the sequencing in the audit). Building a residence card against the prototype
`v2_*` tables now would create exactly the duplicate-copy coupling the target
architecture forbids. This repo's Phase 7 work starts once the canonical
relationship + session reads exist behind typed services.

## P1 update (2026-08-07)

P1 (legacy containment + security) is complete on the GFA-ECO side; nothing in
this repo required changes. Relevant outcomes for the future residence
projection:

- **Progressive-disclosure read models now exist** in the prototype layer
  (`list_open_requests()`, `get_my_participants()`, and `phone` column-revoked
  from `authenticated`). The residence Support-Team surface, when built, follows
  the same principle: staff-visible operational metadata through scoped
  views/RPCs, never table-wide participant reads, and never coach–participant
  message content.
- **Meeting links are server-authoritative** (`provision_session_meeting` RPC;
  no public fallback rooms). A residence "Join session" action must call the same
  canonical provisioning path — it must not mint or expose its own room URLs.
- **Canonical frontend decision:** `apps/platform` in GFA-ECO is canonical; this
  RecoveryResidenceOS app is a legacy/migration surface. Residence experiences
  become projections within the canonical platform (ADR-0014 one-platform,
  multi-domain), not a separately-deployed copy. See
  `GFA-ECO/docs/architecture/canonical-frontend-decision.md`.
- **Still do not build against** `v2_profiles.coach_id` or
  `participants.assigned_coach_email`. The canonical coach↔participant link is
  `recoveryos.coaching_relationships` (to be extended in P2).

No canonical data migration has been performed; P2 is prepared, not executed
(`GFA-ECO/docs/migration/p2-canonical-migration-plan.md`).

## P2 update (2026-08-07) — canonical shadow domain now exists

The canonical RecoveryOS coaching domain has been built additively in GFA-ECO
(`recoveryos.*`, CANONICAL_SHADOW stage; migrations 0025–0028). The residence
Support-Team surface, when built, is a **projection of these canonical tables** —
never a residence-local copy:

- **Relationship:** read `recoveryos.coaching_relationships`
  (extended with status/is_primary/assignment_source; one active primary per
  participant). Not `v2_profiles.coach_id`, not `assigned_coach_email`.
- **Sessions:** read `recoveryos.appointments` (extended with modality,
  meeting_url, timezone, confirm/cancel/reschedule + booking/support links). The
  identical appointment the participant sees in VRCC — no residential duplicate.
- **Messaging:** `recoveryos.conversations`/`conversation_members`/`messages` —
  **membership-scoped**. Residence staff are NOT auto-members; they get no
  coach–participant message content. Operational metadata (has coach, next
  session where authorized, follow-up status) flows through consent- and
  role-scoped reads only (`recoveryos.is_admin_staff()` / future residence-scoped
  views), never table-wide participant reads.
- **Do NOT create** `residence_coach_assignments`, `residence_sessions`, or
  `residence_messages`. Recovery Residence is another authorized projection of the
  same relationship/session/conversation rows (ADR-0014 one-platform-multi-domain).

Frontend/RPC contracts the residence projection will consume:
`GFA-ECO/docs/architecture/canonical-coaching-frontend-contracts.md`.
Full P2 report: `GFA-ECO/docs/migration/p2-canonical-foundation-report.md`.

No canonical read/write cutover has occurred (CANONICAL_SHADOW). No change was
made in this repo — the contract is recorded for the Phase-6 residence projection.
