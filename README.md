# RecoveryResidenceOS — Grace House

The Grace House operational system inside RecoveryOS / VRCC: resident experience, staff
operations, document infrastructure, and compliance evidence engine for
Grace For Addictions' women-focused recovery residence in Des Moines, Iowa
(preparing for NARR Level II certification).

## Architecture

- **Frontend:** React 19 · TypeScript · Vite · Tailwind CSS · React Router
- **Backend:** Supabase (PostgreSQL 17, Auth, RLS) — extends the existing
  `gfa_residence` schema and `gfa_ui.participant_profiles` identity spine;
  no parallel residence subsystem
- **Deploy target:** Cloudflare Pages

## The policy engine is the source of truth

Every binding value (curfew, fees, contacts, visitor rules) lives in
`gfa_residence.policies` / `policy_versions` as versioned, immutable-once-active
records. UI copy and workflow logic consume policy values — nothing is hand-copied.
Key locked policies:

- **GH-CURFEW-001 v2.0** — phase-based curfew with a hard midnight ceiling,
  enforced by a database trigger *and* a build-time validator
- **GH-FEES-001 v1.0** — $175/wk shared · $200/wk private ($650/$700 monthly
  prepaid in full); deposit/refund pending decision GH-D004
- **GH-MOUD-001** — prescribed medication is never a violation, never a positive
  screen, never a privilege reduction (enforced at the database level)

Open items live in `gfa_residence.decision_register` (GH-D003, GH-D004, GH-D013,
GH-D015) and render as labeled placeholders — never invented facts.

## Commands

```bash
npm run dev        # local dev server
npm run validate   # curfew / consistency / certification-language / language audits
npm run lint       # eslint
npm run build      # tsc + vite production build
npm run check      # all of the above
```

Copy `.env.example` to `.env` for local development (publishable values only).

## Documentation

- [`docs/GRACE_HOUSE_AUDIT_AND_INTEGRATION_PLAN.md`](docs/GRACE_HOUSE_AUDIT_AND_INTEGRATION_PLAN.md)
  — the repository/schema audit, gap analysis, role matrices, RLS plan, and gate sequence
- `supabase/migrations/` — additive migrations applied to the live instance
  (policy engine → documents/signatures → residence operations → hardening)
