-- ============================================================================
-- GRACE HOUSE GATE 4b — HOUSE BOARD & CHECK-IN OPERATIONS
-- Announcements (house board) · residence-staff visibility into resident
-- check-in flags (scoped through bed assignment) · check-in follow-up log.
-- Reuses gfa_ui.check_in_records — no parallel check-in subsystem.
-- Additive only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. House board announcements
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.announcements (
  id           uuid primary key default gen_random_uuid(),
  residence_id uuid not null references gfa_residence.residences(id),
  author_role  text not null default 'staff'
               check (author_role in ('house_lead','executive_director','staff')),
  urgent       boolean not null default false,
  body         text not null,
  created_by   uuid not null default auth.uid(),
  created_at   timestamptz not null default now()
);

alter table gfa_residence.announcements enable row level security;

-- residents with a bed in the residence can read the board
create policy ann_resident_read on gfa_residence.announcements for select
  using (exists (select 1 from gfa_residence.beds b
                 where b.residence_id = announcements.residence_id
                   and b.resident_id = gfa_ui.my_participant_id()));
create policy ann_operator on gfa_residence.announcements for all
  using (gfa_residence.operates_residence(residence_id));
create policy ann_admin on gfa_residence.announcements for all using (is_admin());

grant select, insert on gfa_residence.announcements to authenticated;
grant all on gfa_residence.announcements to service_role;

-- ---------------------------------------------------------------------------
-- 2. Check-in follow-ups: staff acknowledgment of a flagged check-in.
--    Supportive follow-up, never punitive scoring.
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.checkin_followups (
  id           uuid primary key default gen_random_uuid(),
  checkin_id   uuid not null unique references gfa_ui.check_in_records(id),
  residence_id uuid not null references gfa_residence.residences(id),
  followed_up_by uuid not null default auth.uid(),
  note         text,
  created_at   timestamptz not null default now()
);

alter table gfa_residence.checkin_followups enable row level security;

create policy cfu_operator on gfa_residence.checkin_followups for all
  using (gfa_residence.operates_residence(residence_id));
create policy cfu_admin on gfa_residence.checkin_followups for all using (is_admin());

grant select, insert on gfa_residence.checkin_followups to authenticated;
grant all on gfa_residence.checkin_followups to service_role;

-- ---------------------------------------------------------------------------
-- 3. Residence staff may read check-ins of residents currently housed in a
--    residence they operate (spec: daily check-in with staff-alert flags).
--    Scope is the bed assignment — staff never see check-ins of participants
--    outside their residence.
-- ---------------------------------------------------------------------------
create policy cir_residence_operator on gfa_ui.check_in_records for select
  using (exists (select 1 from gfa_residence.beds b
                 where b.resident_id = check_in_records.participant_id
                   and gfa_residence.operates_residence(b.residence_id)));
