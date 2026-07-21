-- ============================================================================
-- GRACE HOUSE GATE 3 — RESIDENCE OPERATIONS EXTENSIONS
-- Pass/curfew-extension requests · grievances · emergency-removal protocol
-- (GH-D015 watermark) · granular ROI + transmission gate (GH-D013) ·
-- drug-test integrity (preliminary/confirmatory, MOUD never a violation) ·
-- Grace House seed (GH-D003 placeholder beds). Additive only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Granular Release of Information (per-category, recipient, purpose,
--    expiration, revocation). External transmission is impossible without one.
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.releases_of_information (
  id                uuid primary key default gen_random_uuid(),
  resident_id       uuid not null references gfa_ui.participant_profiles(id),
  residence_id      uuid references gfa_residence.residences(id),
  recipient_name    text not null,
  recipient_agency  text,
  purpose           text not null,
  categories        jsonb not null default '[]'::jsonb,  -- e.g. ["attendance","phase_status","supervision_compliance"]
  executed_at       timestamptz,                          -- null = not yet executed
  expires_at        timestamptz,
  revoked_at        timestamptz,
  revocation_reason text,
  signature_id      uuid references gfa_residence.gh_document_signatures(id),
  entered_by        uuid not null default auth.uid(),
  entry_mode        text not null default 'self' check (entry_mode in ('self','assisted')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- After execution, only revocation fields may change. Revocation is permanent.
create or replace function gfa_residence.roi_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'ROI records are never deleted; revoke instead';
  end if;
  if old.executed_at is not null then
    if new.resident_id is distinct from old.resident_id
       or new.recipient_name is distinct from old.recipient_name
       or new.recipient_agency is distinct from old.recipient_agency
       or new.purpose is distinct from old.purpose
       or new.categories is distinct from old.categories
       or new.executed_at is distinct from old.executed_at
       or new.expires_at is distinct from old.expires_at
       or new.signature_id is distinct from old.signature_id then
      raise exception 'An executed ROI is immutable; only revocation is permitted';
    end if;
    if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
      raise exception 'ROI revocation is permanent';
    end if;
  end if;
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_roi_guard on gfa_residence.releases_of_information;
create trigger trg_roi_guard
  before update or delete on gfa_residence.releases_of_information
  for each row execute function gfa_residence.roi_guard();

create or replace function gfa_residence.roi_audit()
returns trigger
language plpgsql security definer set search_path = gfa_residence, public as $$
begin
  insert into gfa_residence.residence_audit_log
    (event_type, resident_id, residence_id, subject_table, subject_id, detail)
  values (case when tg_op = 'INSERT' then 'roi_created'
               when new.revoked_at is not null and old.revoked_at is null then 'roi_revoked'
               when new.executed_at is not null and old.executed_at is null then 'roi_executed'
               else 'roi_updated' end,
          new.resident_id, new.residence_id, 'releases_of_information', new.id,
          jsonb_build_object('recipient', new.recipient_name, 'categories', new.categories));
  return new;
end; $$;

drop trigger if exists trg_roi_audit on gfa_residence.releases_of_information;
create trigger trg_roi_audit
  after insert or update on gfa_residence.releases_of_information
  for each row execute function gfa_residence.roi_audit();

-- The gate: is there an executed, unexpired, unrevoked ROI for this resident
-- covering this category (and, when given, this recipient agency)?
create or replace function gfa_residence.has_executed_roi(
  p_resident uuid, p_category text, p_agency text default null)
returns boolean
language sql stable security definer set search_path = gfa_residence, public as $$
  select exists (
    select 1 from gfa_residence.releases_of_information r
    where r.resident_id = p_resident
      and r.executed_at is not null
      and r.revoked_at is null
      and (r.expires_at is null or r.expires_at > now())
      and r.categories ? p_category
      and (p_agency is null or r.recipient_agency = p_agency or r.recipient_name = p_agency)
  );
$$;

-- Wire the gate into supervision_reports: a report can exist as a draft, but
-- can never move to 'sent' without a matching executed ROI (GH-D013).
alter table gfa_residence.supervision_reports
  add column if not exists roi_id uuid references gfa_residence.releases_of_information(id);

create or replace function gfa_residence.supervision_report_roi_gate()
returns trigger
language plpgsql security definer set search_path = gfa_residence, public as $$
begin
  if new.status = 'sent' then
    if not gfa_residence.has_executed_roi(new.resident_id, 'supervision_compliance', new.referral_partner) then
      raise exception 'BLOCKED (GH-D013): no executed, unexpired ROI covering supervision_compliance for this resident and recipient';
    end if;
    insert into gfa_residence.residence_audit_log
      (event_type, resident_id, residence_id, subject_table, subject_id, detail)
    values ('supervision_report_sent', new.resident_id, new.residence_id,
            'supervision_reports', new.id,
            jsonb_build_object('referral_partner', new.referral_partner));
  end if;
  return new;
end; $$;

drop trigger if exists trg_supervision_report_roi_gate on gfa_residence.supervision_reports;
create trigger trg_supervision_report_roi_gate
  before insert or update on gfa_residence.supervision_reports
  for each row execute function gfa_residence.supervision_report_roi_gate();

-- ---------------------------------------------------------------------------
-- 2. Pass / curfew-extension requests (values come from GH-CURFEW-001)
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.pass_requests (
  id             uuid primary key default gen_random_uuid(),
  residence_id   uuid not null references gfa_residence.residences(id),
  resident_id    uuid not null references gfa_ui.participant_profiles(id),
  request_type   text not null check (request_type in ('curfew_extension','overnight_pass')),
  reason_category text check (reason_category in
                   ('work','medical','treatment','court','recovery_activity','family','transportation','other')),
  details        text,
  location       text,   -- required for overnight passes (enforced below)
  host_name      text,   -- required for overnight passes (enforced below)
  requested_for  date not null,
  expected_return text,
  status         text not null default 'pending'
                 check (status in ('pending','approved','denied','cancelled')),
  decided_by     uuid,
  decided_at     timestamptz,
  decision_note  text,
  entered_by     uuid not null default auth.uid(),
  entry_mode     text not null default 'self' check (entry_mode in ('self','assisted','on_behalf')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function gfa_residence.pass_request_guard()
returns trigger language plpgsql as $$
begin
  if new.request_type = 'overnight_pass' and (new.location is null or new.host_name is null) then
    raise exception 'Overnight pass requests require location and host (GH-CURFEW-001)';
  end if;
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_pass_request_guard on gfa_residence.pass_requests;
create trigger trg_pass_request_guard
  before insert or update on gfa_residence.pass_requests
  for each row execute function gfa_residence.pass_request_guard();

-- ---------------------------------------------------------------------------
-- 3. Grievances (anti-retaliation, deadline tracking, optional anonymity)
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.grievances (
  id             uuid primary key default gen_random_uuid(),
  residence_id   uuid not null references gfa_residence.residences(id),
  resident_id    uuid references gfa_ui.participant_profiles(id),  -- null = anonymous
  submitted_anonymously boolean not null default false,
  category       text,
  description    text not null,
  status         text not null default 'submitted'
                 check (status in ('submitted','acknowledged','in_review','resolved','escalated')),
  acknowledgment_due date not null default (current_date + 2),
  resolution_due     date not null default (current_date + 14),
  acknowledged_at timestamptz,
  resolved_at     timestamptz,
  resolution_summary text,
  entered_by     uuid not null default auth.uid(),
  entry_mode     text not null default 'self' check (entry_mode in ('self','assisted','on_behalf')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Emergency-removal documentation workflow (Legal Addendum protocol).
--    2-hour incident report, 48-hour written notice, resource provision,
--    grievance notice. Notices carry the GH-D015 watermark until cleared.
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.emergency_removals (
  id             uuid primary key default gen_random_uuid(),
  residence_id   uuid not null references gfa_residence.residences(id),
  resident_id    uuid not null references gfa_ui.participant_profiles(id),
  incident_id    uuid references gfa_residence.incidents(id),
  removal_at     timestamptz not null default now(),
  incident_report_due     timestamptz,   -- removal_at + 2 hours (set by trigger)
  incident_report_completed_at timestamptz,
  written_notice_due      timestamptz,   -- removal_at + 48 hours (set by trigger)
  written_notice_delivered_at timestamptz,
  resources_provided jsonb not null default '[]'::jsonb,
  grievance_notice_provided boolean not null default false,
  legal_watermark text not null default 'LEGAL REVIEW REQUIRED - IOWA OCCUPANCY STATUS',
  narrative      text,
  created_by     uuid not null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function gfa_residence.emergency_removal_guard()
returns trigger
language plpgsql security definer set search_path = gfa_residence, public as $$
declare v_d015_open boolean;
begin
  new.incident_report_due := new.removal_at + interval '2 hours';
  new.written_notice_due  := new.removal_at + interval '48 hours';
  -- watermark is mandatory while GH-D015 is open
  select (status = 'open') into v_d015_open
    from gfa_residence.decision_register where code = 'GH-D015';
  if coalesce(v_d015_open, true)
     and (new.legal_watermark is null or new.legal_watermark = '') then
    raise exception 'Emergency-removal notices must carry the GH-D015 legal watermark until the decision is resolved';
  end if;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    insert into gfa_residence.residence_audit_log
      (event_type, resident_id, residence_id, subject_table, subject_id, detail)
    values ('emergency_removal_opened', new.resident_id, new.residence_id,
            'emergency_removals', new.id,
            jsonb_build_object('removal_at', new.removal_at));
  end if;
  return new;
end; $$;

drop trigger if exists trg_emergency_removal_guard on gfa_residence.emergency_removals;
create trigger trg_emergency_removal_guard
  before insert or update on gfa_residence.emergency_removals
  for each row execute function gfa_residence.emergency_removal_guard();

-- ---------------------------------------------------------------------------
-- 5. Drug-test integrity (additive columns on the existing table):
--    preliminary vs confirmatory; disclosed prescribed medication (MOUD) is
--    never recorded as a violation — enforced at the database level.
-- ---------------------------------------------------------------------------
alter table gfa_residence.drug_tests
  add column if not exists stage text not null default 'preliminary'
    check (stage in ('preliminary','confirmatory')),
  add column if not exists confirmatory_of uuid references gfa_residence.drug_tests(id),
  add column if not exists moud_disclosed boolean not null default false,
  add column if not exists is_violation boolean;

create or replace function gfa_residence.drug_test_integrity()
returns trigger language plpgsql as $$
begin
  -- GH-MOUD-001: disclosed prescribed medication never constitutes a violation
  if new.moud_disclosed then
    new.is_violation := false;
  elsif new.is_violation is null then
    -- a violation may only ever be recorded from a CONFIRMATORY result
    new.is_violation := (new.result = 'positive' and new.stage = 'confirmatory');
  elsif new.is_violation and new.stage <> 'confirmatory' then
    raise exception 'A violation may only be recorded from a confirmatory result (preliminary results are never conclusive)';
  end if;
  return new;
end; $$;

drop trigger if exists trg_drug_test_integrity on gfa_residence.drug_tests;
create trigger trg_drug_test_integrity
  before insert or update on gfa_residence.drug_tests
  for each row execute function gfa_residence.drug_test_integrity();

-- ---------------------------------------------------------------------------
-- 6. RLS for the new tables
-- ---------------------------------------------------------------------------
alter table gfa_residence.releases_of_information enable row level security;
alter table gfa_residence.pass_requests           enable row level security;
alter table gfa_residence.grievances              enable row level security;
alter table gfa_residence.emergency_removals      enable row level security;

create policy roi_self_read on gfa_residence.releases_of_information for select
  using (resident_id = gfa_ui.my_participant_id());
create policy roi_self_insert on gfa_residence.releases_of_information for insert
  with check (resident_id = gfa_ui.my_participant_id() and entered_by = auth.uid());
create policy roi_self_revoke on gfa_residence.releases_of_information for update
  using (resident_id = gfa_ui.my_participant_id());
create policy roi_operator on gfa_residence.releases_of_information for all
  using (residence_id is not null and gfa_residence.operates_residence(residence_id));
create policy roi_admin on gfa_residence.releases_of_information for all using (is_admin());

create policy pr_self_read on gfa_residence.pass_requests for select
  using (resident_id = gfa_ui.my_participant_id());
create policy pr_self_insert on gfa_residence.pass_requests for insert
  with check (resident_id = gfa_ui.my_participant_id() and entered_by = auth.uid());
create policy pr_self_cancel on gfa_residence.pass_requests for update
  using (resident_id = gfa_ui.my_participant_id() and status = 'pending');
create policy pr_operator on gfa_residence.pass_requests for all
  using (gfa_residence.operates_residence(residence_id));
create policy pr_admin on gfa_residence.pass_requests for all using (is_admin());

create policy gr_self_read on gfa_residence.grievances for select
  using (resident_id is not null and resident_id = gfa_ui.my_participant_id());
create policy gr_self_insert on gfa_residence.grievances for insert
  with check ((resident_id = gfa_ui.my_participant_id() or resident_id is null)
              and entered_by = auth.uid());
create policy gr_operator on gfa_residence.grievances for all
  using (gfa_residence.operates_residence(residence_id));
create policy gr_admin on gfa_residence.grievances for all using (is_admin());

create policy er_self_read on gfa_residence.emergency_removals for select
  using (resident_id = gfa_ui.my_participant_id());
create policy er_operator on gfa_residence.emergency_removals for all
  using (gfa_residence.operates_residence(residence_id));
create policy er_admin on gfa_residence.emergency_removals for all using (is_admin());

grant select, insert, update on gfa_residence.releases_of_information,
  gfa_residence.pass_requests, gfa_residence.grievances to authenticated;
grant select, insert, update on gfa_residence.emergency_removals to authenticated;
grant all on gfa_residence.releases_of_information, gfa_residence.pass_requests,
  gfa_residence.grievances, gfa_residence.emergency_removals to service_role;

-- ---------------------------------------------------------------------------
-- 7. Seed: Grace For Addictions provider + Grace House residence + placeholder
--    beds (GH-D003: beds are data; labels say PLACEHOLDER; status offline).
--    Canonical values from the Truth Register; certification status: pending
--    ("Preparing for NARR Level II certification") — never 'certified'.
-- ---------------------------------------------------------------------------
do $$
declare v_provider uuid; v_residence uuid;
begin
  select id into v_provider from gfa_residence.providers where name = 'Grace For Addictions';
  if v_provider is null then
    insert into gfa_residence.providers (name, entity_type, contact_phone, contact_email, website)
    values ('Grace For Addictions', '501(c)(3) nonprofit organization',
            '515-220-8771', 'gracehouse@graceforaddictions.org', 'https://graceforaddictions.org')
    returning id into v_provider;
  end if;

  select id into v_residence from gfa_residence.residences where name = 'Grace House';
  if v_residence is null then
    insert into gfa_residence.residences
      (provider_id, name, operator_entity, program_operator, address, city, state,
       population_served, narr_level, narr_cert_status,
       shared_room_fee, private_room_fee, accepts_mat, accepts_supervision,
       contact_phone, warmline, contact_email, public_listed, active, notes)
    values
      (v_provider, 'Grace House', 'Grace For Addictions, a 501(c)(3) nonprofit organization',
       'Grace For Addictions', '1311 9th Street', 'Des Moines', 'Iowa',
       'Women-focused recovery residence', 'Level II / Type M (aligned)', 'pending',
       175, 200, true, true,
       '515-220-8771', '515-310-DIAL (3425)', 'gracehouse@graceforaddictions.org',
       true, true,
       'Peer-led, non-clinical recovery residence preparing for NARR Level II certification. Fees per GH-FEES-001. Bed configuration pending verification (GH-D003).')
    returning id into v_residence;

    -- GH-D003: placeholder bed rows only; offline until configuration verified
    insert into gfa_residence.beds (residence_id, label, room_type, status) values
      (v_residence, 'PLACEHOLDER (GH-D003) - Shared Room A / Bed 1', 'shared',  'offline'),
      (v_residence, 'PLACEHOLDER (GH-D003) - Shared Room A / Bed 2', 'shared',  'offline'),
      (v_residence, 'PLACEHOLDER (GH-D003) - Shared Room B / Bed 1', 'shared',  'offline'),
      (v_residence, 'PLACEHOLDER (GH-D003) - Shared Room B / Bed 2', 'shared',  'offline'),
      (v_residence, 'PLACEHOLDER (GH-D003) - Private Room C / Bed 1', 'private', 'offline');

    -- scope the Grace House policies to the residence row
    update gfa_residence.policies set residence_id = v_residence
    where code like 'GH-%' and residence_id is null;
  end if;
end $$;
