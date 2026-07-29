-- ============================================================================
-- GRACE HOUSE GATE 1 — CANONICAL POLICY ENGINE + DECISION REGISTER
-- Additive only. Mirrors existing gfa_residence RLS vocabulary:
--   is_admin(), gfa_residence.operates_residence(), gfa_ui.my_participant_id()
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Policy catalog
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.policies (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- e.g. GH-CURFEW-001
  title       text not null,
  category    text,                          -- curfew | fees | contact | visitors | screening | ...
  residence_id uuid references gfa_residence.residences(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists gfa_residence.policy_versions (
  id                uuid primary key default gen_random_uuid(),
  policy_id         uuid not null references gfa_residence.policies(id),
  version           text not null,           -- '1.0', '2.0'
  status            text not null default 'draft'
                    check (status in ('draft','leadership_review','legal_review_required',
                                      'certification_review','approved','active','superseded')),
  effective_date    date,
  structured_values jsonb not null default '{}'::jsonb,
  prose             text,
  supersedes_version_id uuid references gfa_residence.policy_versions(id),
  created_by        uuid,
  approved_by       uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (policy_id, version)
);

-- exactly one ACTIVE version per policy
create unique index if not exists policy_versions_one_active
  on gfa_residence.policy_versions (policy_id) where (status = 'active');

create table if not exists gfa_residence.policy_acknowledgments (
  id                uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references gfa_residence.policy_versions(id),
  resident_id       uuid not null references gfa_ui.participant_profiles(id),
  residence_id      uuid references gfa_residence.residences(id),
  acknowledged_at   timestamptz not null default now(),
  unique (policy_version_id, resident_id)
);

create table if not exists gfa_residence.decision_register (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,    -- GH-D003 ...
  title             text not null,
  description       text,
  build_instruction text,
  status            text not null default 'open' check (status in ('open','resolved')),
  resolved_at       timestamptz,
  resolution_policy_version_id uuid references gfa_residence.policy_versions(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Curfew guard: no curfew value may exceed midnight, in any phase, ever.
--    '00:00' encodes midnight (the hard ceiling). Valid values: 20:00–23:59
--    or exactly 00:00.
-- ---------------------------------------------------------------------------
create or replace function gfa_residence.validate_policy_version()
returns trigger
language plpgsql
security definer
set search_path = gfa_residence, public
as $$
declare
  v_code  text;
  v_phase jsonb;
  v_t     text;
  v_key   text;
begin
  select p.code into v_code from gfa_residence.policies p where p.id = new.policy_id;

  if v_code = 'GH-CURFEW-001' then
    if jsonb_typeof(new.structured_values->'phases') is distinct from 'array' then
      raise exception 'GH-CURFEW-001 requires a phases array';
    end if;
    for v_phase in select * from jsonb_array_elements(new.structured_values->'phases') loop
      foreach v_key in array array['sun_thu','fri_sat'] loop
        v_t := v_phase->>v_key;
        if v_t is null or v_t !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
          raise exception 'Curfew phase % has invalid time for %: %', v_phase->>'phase', v_key, v_t;
        end if;
        -- midnight ceiling: allowed values are 20:00–23:59, or exactly 00:00 (midnight).
        -- Any other value in 00:01–19:59 would mean a curfew past midnight or nonsense.
        if v_t <> '00:00' and (v_t < '20:00') then
          raise exception 'Curfew value % exceeds the midnight hard ceiling (GH-CURFEW-001)', v_t;
        end if;
      end loop;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_policy_version on gfa_residence.policy_versions;
create trigger trg_validate_policy_version
  before insert or update on gfa_residence.policy_versions
  for each row execute function gfa_residence.validate_policy_version();

-- ---------------------------------------------------------------------------
-- 3. Immutability: once a version is active or superseded its content is
--    frozen. New values require a NEW version row — never an edit.
-- ---------------------------------------------------------------------------
create or replace function gfa_residence.freeze_policy_version_content()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('active','superseded') then
    if new.structured_values is distinct from old.structured_values
       or new.prose is distinct from old.prose
       or new.version is distinct from old.version
       or new.policy_id is distinct from old.policy_id then
      raise exception 'Policy version content is immutable once % — create a new version', old.status;
    end if;
    if old.status = 'superseded' and new.status is distinct from 'superseded' then
      raise exception 'A superseded policy version cannot be reactivated';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_freeze_policy_version on gfa_residence.policy_versions;
create trigger trg_freeze_policy_version
  before update on gfa_residence.policy_versions
  for each row execute function gfa_residence.freeze_policy_version_content();

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table gfa_residence.policies              enable row level security;
alter table gfa_residence.policy_versions       enable row level security;
alter table gfa_residence.policy_acknowledgments enable row level security;
alter table gfa_residence.decision_register     enable row level security;

-- catalog readable by any authenticated user; writes admin-only
create policy pol_read   on gfa_residence.policies for select to authenticated using (true);
create policy pol_admin  on gfa_residence.policies for all using (is_admin());
create policy pol_operator on gfa_residence.policies for all
  using (residence_id is not null and gfa_residence.operates_residence(residence_id));

-- active versions readable by everyone signed in; drafts visible to admin/operator
create policy pv_read_active on gfa_residence.policy_versions for select to authenticated
  using (status = 'active');
create policy pv_admin on gfa_residence.policy_versions for all using (is_admin());
create policy pv_operator on gfa_residence.policy_versions for all
  using (exists (select 1 from gfa_residence.policies p
                 where p.id = policy_versions.policy_id
                   and p.residence_id is not null
                   and gfa_residence.operates_residence(p.residence_id)));

create policy pa_self_read on gfa_residence.policy_acknowledgments for select
  using (resident_id = gfa_ui.my_participant_id());
create policy pa_self_insert on gfa_residence.policy_acknowledgments for insert
  with check (resident_id = gfa_ui.my_participant_id());
create policy pa_admin on gfa_residence.policy_acknowledgments for all using (is_admin());
create policy pa_operator on gfa_residence.policy_acknowledgments for select
  using (residence_id is not null and gfa_residence.operates_residence(residence_id));

create policy dr_read  on gfa_residence.decision_register for select to authenticated using (true);
create policy dr_admin on gfa_residence.decision_register for all using (is_admin());

grant select on gfa_residence.policies, gfa_residence.policy_versions,
                gfa_residence.decision_register to authenticated;
grant select, insert on gfa_residence.policy_acknowledgments to authenticated;
grant all on gfa_residence.policies, gfa_residence.policy_versions,
             gfa_residence.policy_acknowledgments, gfa_residence.decision_register
  to service_role;

-- ---------------------------------------------------------------------------
-- 5. Seed canonical policies (Canonical Truth Register)
-- ---------------------------------------------------------------------------
with p as (
  insert into gfa_residence.policies (code, title, category)
  values ('GH-CURFEW-001', 'Grace House Phase-Based Curfew & Quiet Hours', 'curfew')
  returning id
)
insert into gfa_residence.policy_versions (policy_id, version, status, effective_date, structured_values, prose)
select id, '2.0', 'active', current_date,
  '{
    "hard_ceiling": "00:00",
    "phases": [
      {"phase": 1, "days": "1-30",  "sun_thu": "21:00", "fri_sat": "22:00"},
      {"phase": 2, "days": "31-90", "sun_thu": "22:00", "fri_sat": "23:00"},
      {"phase": 3, "days": "91+",   "sun_thu": "23:00", "fri_sat": "00:00"}
    ],
    "quiet_hours": {"begin": "at_curfew", "end": "07:00"},
    "extension_request_notice_hours": 24,
    "overnight_pass": {"eligible_after_days": 60, "notice_hours": 48, "requires": ["location", "host"]},
    "violations": {"threshold_in_30_days": 3,
      "response": "community accountability conversation and possible phase reset - never automatic discharge"},
    "emergencies_and_transport_disruptions": "never treated as misconduct"
  }'::jsonb,
  'Curfew progresses by phase and never extends past midnight in any phase, for any reason, on any day. '
  || 'Phase 1 (Days 1-30): 9:00 PM Sun-Thu, 10:00 PM Fri-Sat. Phase 2 (Days 31-90): 10:00 PM Sun-Thu, 11:00 PM Fri-Sat. '
  || 'Phase 3 (Days 91+): 11:00 PM Sun-Thu, 12:00 AM (midnight) Fri-Sat. Quiet hours begin at each phase''s curfew time and end at 7:00 AM. '
  || 'Curfew extensions (work, medical, treatment, court, recovery activities) require a written request to the House Manager 24 hours in advance; '
  || 'emergencies and unavoidable transportation disruptions are never treated as misconduct. '
  || 'Overnight passes: eligible after 60 days in good standing; written request 48 hours in advance with location and host. '
  || 'More than three curfew violations in 30 days leads to a community accountability conversation and possible phase reset - never automatic discharge.'
from p;

with p as (
  insert into gfa_residence.policies (code, title, category)
  values ('GH-FEES-001', 'Grace House Program Fees', 'fees')
  returning id
)
insert into gfa_residence.policy_versions (policy_id, version, status, effective_date, structured_values, prose)
select id, '1.0', 'active', current_date,
  '{
    "currency": "USD",
    "double_shared_room": {"weekly": 175, "monthly_prepaid_in_full": 650},
    "single_private_room": {"weekly": 200, "monthly_prepaid_in_full": 700},
    "monthly_rate_condition": "monthly prepay rates apply ONLY to full advance payment",
    "deposit": {"placeholder": true, "pending_decision": "GH-D004"},
    "refund":  {"placeholder": true, "pending_decision": "GH-D004"}
  }'::jsonb,
  'Program fees: Double (shared) room $175/week, or $650/month when paid in advance in full. '
  || 'Single (private) room $200/week, or $700/month when paid in advance in full. '
  || 'Monthly prepay rates apply only to full advance payment. '
  || 'Deposit and refund terms are pending leadership decision GH-D004 and render as clearly labeled placeholders until resolved.'
from p;

with p as (
  insert into gfa_residence.policies (code, title, category)
  values ('GH-CONTACT-001', 'Grace House Canonical Contact Information', 'contact')
  returning id
)
insert into gfa_residence.policy_versions (policy_id, version, status, effective_date, structured_values, prose)
select id, '1.0', 'active', current_date,
  '{
    "office_phone": "515-220-8771",
    "email": "gracehouse@graceforaddictions.org",
    "residents_warmline": "515-310-DIAL (3425)",
    "address": "1311 9th Street, Des Moines, Iowa 50314",
    "operator": "Grace For Addictions, a 501(c)(3) nonprofit organization"
  }'::jsonb,
  'GFA Office: 515-220-8771. Email: gracehouse@graceforaddictions.org. Residents Warmline: 515-310-DIAL (3425). '
  || 'Grace House, 1311 9th Street, Des Moines, Iowa 50314, operated by Grace For Addictions, a 501(c)(3) nonprofit organization.'
from p;

with p as (
  insert into gfa_residence.policies (code, title, category)
  values ('GH-VISITOR-001', 'Grace House Visitor Hours (Derived From Curfew)', 'visitors')
  returning id
)
insert into gfa_residence.policy_versions (policy_id, version, status, effective_date, structured_values, prose)
select id, '1.0', 'active', current_date,
  '{
    "derivation": "visitor hours end no later than N minutes before the earliest applicable curfew",
    "minutes_before_curfew": 30,
    "source_policy": "GH-CURFEW-001"
  }'::jsonb,
  'Visitor hours are derived from the active curfew policy, never hand-copied: visitors depart no later than 30 minutes '
  || 'before the earliest applicable curfew for residents present (Phase 1 Sun-Thu example: visitors out by 8:30 PM).'
from p;

with p as (
  insert into gfa_residence.policies (code, title, category)
  values ('GH-MOUD-001', 'Medication & MOUD Affirmation', 'screening')
  returning id
)
insert into gfa_residence.policy_versions (policy_id, version, status, effective_date, structured_values, prose)
select id, '1.0', 'active', current_date,
  '{
    "prescribed_medication_is_never_a_violation": true,
    "prescribed_medication_never_counts_as_positive_screen": true,
    "prescribed_medication_never_reduces_privileges": true,
    "covered": ["buprenorphine", "methadone", "naltrexone", "all FDA-approved SUD medications", "all FDA-approved mental-health medications"]
  }'::jsonb,
  'Grace House is fully MOUD/MAT-affirming. Prescribed medications - including buprenorphine, methadone, naltrexone, and all '
  || 'FDA-approved medications for substance use disorder or mental health - never constitute a program violation, never count '
  || 'as a positive screen, and never reduce privileges.'
from p;

with p as (
  insert into gfa_residence.policies (code, title, category)
  values ('GH-RTU-001', 'Return-to-Use Supportive Re-Engagement', 'support')
  returning id
)
insert into gfa_residence.policy_versions (policy_id, version, status, effective_date, structured_values, prose)
select id, '1.0', 'active', current_date,
  '{"framework": "supportive re-engagement", "automatic_discharge": false}'::jsonb,
  'A return to use is met with a supportive re-engagement framework. It never results in automatic discharge. '
  || 'The response centers safety, dignity, reconnection, and a revised recovery plan.'
from p;

-- ---------------------------------------------------------------------------
-- 6. Seed the Decision Register (open items — never fabricated)
-- ---------------------------------------------------------------------------
insert into gfa_residence.decision_register (code, title, description, build_instruction) values
('GH-D003', 'Verified bed capacity and room configuration',
 'Legacy materials state "up to 10" beds - unverified.',
 'Bed inventory is data, not copy: bed table seeded with placeholder rooms; no capacity number in prose.'),
('GH-D004', 'Deposit and refund policy',
 'Fee rates are canonical per GH-FEES-001; deposit and refund terms are not yet decided by leadership.',
 'Deposit and refund fields remain clearly-labeled placeholders; Participant Agreement Part 1 refund language ships flagged for leadership decision.'),
('GH-D013', 'DOC/justice-partner reporting commitments',
 'Scope of reporting commitments to justice partners not yet executed.',
 'Supervision Compliance Report generator exists but any external transmission is gated behind an executed ROI record.'),
('GH-D015', 'Iowa occupancy-status legal review of termination/removal language',
 'Legal review of termination and removal language under Iowa occupancy law is pending.',
 'Emergency-removal workflow ships with the legal addendum documentation protocol; all termination notices carry the watermark "LEGAL REVIEW REQUIRED - IOWA OCCUPANCY STATUS" until cleared.');
