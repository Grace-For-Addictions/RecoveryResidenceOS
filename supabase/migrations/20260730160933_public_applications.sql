-- ============================================================================
-- Public application submissions (online application wizard).
-- Anyone may SUBMIT (insert-only, status forced to 'submitted');
-- only residence staff/admins may read or process. Additive only.
-- ============================================================================
create table if not exists gfa_residence.applications (
  id                uuid primary key default gen_random_uuid(),
  residence_id      uuid not null references gfa_residence.residences(id),
  full_name         text not null,
  preferred_name    text,
  date_of_birth     date,
  phone             text not null,
  email             text,
  living_situation  text,
  referral_source   text,
  pathway           text check (pathway in ('recovery','family')),
  family_relationship text,
  substances        text,
  last_use          text,
  in_treatment      text,
  provider          text,
  moud_prescribed   boolean,
  prescriber        text,
  medical_needs     text,
  safety_history    text,
  accommodations    text,
  why_now           text,
  six_month_goals   text,
  signature_name    text not null,
  certified         boolean not null default false check (certified),
  status            text not null default 'submitted'
                    check (status in ('submitted','contacted','interview','waitlisted','admitted','referred','withdrawn')),
  staff_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table gfa_residence.applications enable row level security;

-- public submission: insert only, always lands as 'submitted'; no read-back
create policy app_public_insert on gfa_residence.applications for insert
  to anon, authenticated
  with check (status = 'submitted');

create policy app_operator on gfa_residence.applications for all
  using (gfa_residence.operates_residence(residence_id));
create policy app_admin on gfa_residence.applications for all using (is_admin());

grant insert on gfa_residence.applications to anon, authenticated;
grant select, update on gfa_residence.applications to authenticated;
grant all on gfa_residence.applications to service_role;

notify pgrst, 'reload schema';
