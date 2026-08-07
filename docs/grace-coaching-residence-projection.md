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
