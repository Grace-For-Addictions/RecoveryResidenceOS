-- ============================================================================
-- GRACE HOUSE GATE 2 — DOCUMENT VERSIONING & SIGNATURE INTEGRITY
-- Immutable content snapshots, explicit intent-to-sign, re-acknowledgment on
-- version change, no silent edits of signed content (Iowa UETA-aligned).
-- Additive only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Audit log (insert-only), used by this gate and later gates
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.residence_audit_log (
  id            uuid primary key default gen_random_uuid(),
  event_type    text not null,           -- document_signed | policy_status_change | roi_granted | ...
  actor_user_id uuid default auth.uid(),
  resident_id   uuid references gfa_ui.participant_profiles(id),
  residence_id  uuid references gfa_residence.residences(id),
  subject_table text,
  subject_id    uuid,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create or replace function gfa_residence.audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'residence_audit_log is append-only';
end; $$;

drop trigger if exists trg_audit_log_immutable on gfa_residence.residence_audit_log;
create trigger trg_audit_log_immutable
  before update or delete on gfa_residence.residence_audit_log
  for each row execute function gfa_residence.audit_log_immutable();

-- ---------------------------------------------------------------------------
-- 2. Document catalog + versions
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.gh_documents (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,      -- e.g. GH-DOC-RIGHTS
  title         text not null,
  category      text,                      -- onboarding | rights | financial | agreement | ...
  residence_id  uuid references gfa_residence.residences(id),
  non_waivable  boolean not null default false,
  requires_witness boolean not null default false,
  sort_order    integer not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists gfa_residence.gh_document_versions (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references gfa_residence.gh_documents(id),
  version        text not null,
  status         text not null default 'draft'
                 check (status in ('draft','leadership_review','legal_review_required','active','superseded')),
  content_md     text not null,            -- full rendered content at this version
  content_sha256 text not null,
  policy_refs    jsonb not null default '[]'::jsonb,  -- policy codes this doc consumes
  required_initials jsonb not null default '[]'::jsonb, -- sections needing initials
  effective_date date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (document_id, version)
);

create unique index if not exists gh_document_versions_one_active
  on gfa_residence.gh_document_versions (document_id) where (status = 'active');

-- sha computed automatically; content frozen once active/superseded
create or replace function gfa_residence.gh_document_version_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.content_sha256 := encode(public.digest(new.content_md, 'sha256'), 'hex');
    return new;
  end if;
  if old.status in ('active','superseded') then
    if new.content_md is distinct from old.content_md
       or new.version is distinct from old.version
       or new.document_id is distinct from old.document_id
       or new.required_initials is distinct from old.required_initials then
      raise exception 'Signed-document content is immutable once % — publish a new version and re-acknowledge', old.status;
    end if;
    if old.status = 'superseded' and new.status is distinct from 'superseded' then
      raise exception 'A superseded document version cannot be reactivated';
    end if;
  end if;
  new.content_sha256 := encode(public.digest(new.content_md, 'sha256'), 'hex');
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_gh_document_version_guard on gfa_residence.gh_document_versions;
create trigger trg_gh_document_version_guard
  before insert or update on gfa_residence.gh_document_versions
  for each row execute function gfa_residence.gh_document_version_guard();

-- ---------------------------------------------------------------------------
-- 3. Signatures: immutable snapshot + explicit intent + entry provenance
-- ---------------------------------------------------------------------------
create table if not exists gfa_residence.gh_document_signatures (
  id                  uuid primary key default gen_random_uuid(),
  document_version_id uuid not null references gfa_residence.gh_document_versions(id),
  resident_id         uuid not null references gfa_ui.participant_profiles(id),
  residence_id        uuid references gfa_residence.residences(id),
  content_snapshot    text not null,      -- copied at signing; never re-derived
  content_sha256      text not null,
  signature_name      text not null,      -- typed/drawn signature representation
  intent_acknowledged boolean not null check (intent_acknowledged), -- must be true
  initials            jsonb not null default '[]'::jsonb,
  witness_user_id     uuid,
  witness_name        text,
  entered_by          uuid not null default auth.uid(),
  entry_mode          text not null default 'self' check (entry_mode in ('self','assisted')),
  signed_at           timestamptz not null default now(),
  superseded_by_signature_id uuid references gfa_residence.gh_document_signatures(id),
  unique (document_version_id, resident_id)
);

-- On insert: snapshot content from the version (must be ACTIVE), verify witness
-- requirement, write audit event. Signatures are only ever taken on active versions.
create or replace function gfa_residence.gh_signature_before_insert()
returns trigger
language plpgsql
security definer
set search_path = gfa_residence, public
as $$
declare
  v_doc gfa_residence.gh_documents%rowtype;
  v_ver gfa_residence.gh_document_versions%rowtype;
begin
  select * into v_ver from gfa_residence.gh_document_versions where id = new.document_version_id;
  if v_ver.status <> 'active' then
    raise exception 'Signatures may only be captured on the ACTIVE document version';
  end if;
  select * into v_doc from gfa_residence.gh_documents where id = v_ver.document_id;
  if v_doc.requires_witness and (new.witness_name is null or new.witness_user_id is null) then
    raise exception 'Document % requires a witness', v_doc.code;
  end if;
  -- immutable snapshot comes from the version row, never from the client
  new.content_snapshot := v_ver.content_md;
  new.content_sha256   := v_ver.content_sha256;
  return new;
end; $$;

drop trigger if exists trg_gh_signature_before_insert on gfa_residence.gh_document_signatures;
create trigger trg_gh_signature_before_insert
  before insert on gfa_residence.gh_document_signatures
  for each row execute function gfa_residence.gh_signature_before_insert();

-- No edits, no deletes — the only permitted change is linking a re-acknowledgment.
create or replace function gfa_residence.gh_signature_freeze()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Signed documents cannot be deleted';
  end if;
  if new.content_snapshot  is distinct from old.content_snapshot
     or new.content_sha256 is distinct from old.content_sha256
     or new.signature_name is distinct from old.signature_name
     or new.initials       is distinct from old.initials
     or new.signed_at      is distinct from old.signed_at
     or new.resident_id    is distinct from old.resident_id
     or new.document_version_id is distinct from old.document_version_id
     or new.entered_by     is distinct from old.entered_by
     or new.entry_mode     is distinct from old.entry_mode
     or new.intent_acknowledged is distinct from old.intent_acknowledged
     or new.witness_user_id is distinct from old.witness_user_id
     or new.witness_name   is distinct from old.witness_name then
    raise exception 'Signed content is immutable; no administrator may edit a captured signature';
  end if;
  if old.superseded_by_signature_id is not null then
    raise exception 'This signature record is already superseded';
  end if;
  return new;
end; $$;

drop trigger if exists trg_gh_signature_freeze on gfa_residence.gh_document_signatures;
create trigger trg_gh_signature_freeze
  before update or delete on gfa_residence.gh_document_signatures
  for each row execute function gfa_residence.gh_signature_freeze();

-- Audit every signature
create or replace function gfa_residence.gh_signature_audit()
returns trigger
language plpgsql
security definer
set search_path = gfa_residence, public
as $$
begin
  insert into gfa_residence.residence_audit_log
    (event_type, actor_user_id, resident_id, residence_id, subject_table, subject_id, detail)
  values ('document_signed', new.entered_by, new.resident_id, new.residence_id,
          'gh_document_signatures', new.id,
          jsonb_build_object('document_version_id', new.document_version_id,
                             'entry_mode', new.entry_mode,
                             'sha256', new.content_sha256));
  return new;
end; $$;

drop trigger if exists trg_gh_signature_audit on gfa_residence.gh_document_signatures;
create trigger trg_gh_signature_audit
  after insert on gfa_residence.gh_document_signatures
  for each row execute function gfa_residence.gh_signature_audit();

-- ---------------------------------------------------------------------------
-- 4. Re-acknowledgment status view: for each resident with a bed, which active
--    document versions still need a signature (drives the portal flow).
-- ---------------------------------------------------------------------------
create or replace view gfa_residence.gh_signature_status
with (security_invoker = true) as
select
  b.resident_id,
  b.residence_id,
  d.id   as document_id,
  d.code as document_code,
  d.title,
  dv.id  as document_version_id,
  dv.version,
  (s.id is not null) as signed,
  s.signed_at
from gfa_residence.beds b
join gfa_residence.gh_documents d
  on (d.residence_id is null or d.residence_id = b.residence_id)
join gfa_residence.gh_document_versions dv
  on dv.document_id = d.id and dv.status = 'active'
left join gfa_residence.gh_document_signatures s
  on s.document_version_id = dv.id and s.resident_id = b.resident_id
where b.resident_id is not null;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
alter table gfa_residence.gh_documents           enable row level security;
alter table gfa_residence.gh_document_versions   enable row level security;
alter table gfa_residence.gh_document_signatures enable row level security;
alter table gfa_residence.residence_audit_log    enable row level security;

create policy ghd_read on gfa_residence.gh_documents for select to authenticated using (true);
create policy ghd_admin on gfa_residence.gh_documents for all using (is_admin());
create policy ghd_operator on gfa_residence.gh_documents for all
  using (residence_id is not null and gfa_residence.operates_residence(residence_id));

create policy ghdv_read_active on gfa_residence.gh_document_versions for select to authenticated
  using (status = 'active');
create policy ghdv_admin on gfa_residence.gh_document_versions for all using (is_admin());
create policy ghdv_operator on gfa_residence.gh_document_versions for all
  using (exists (select 1 from gfa_residence.gh_documents d
                 where d.id = gh_document_versions.document_id
                   and d.residence_id is not null
                   and gfa_residence.operates_residence(d.residence_id)));

-- a resident signs for herself; the row records who physically entered it
create policy ghs_self_read on gfa_residence.gh_document_signatures for select
  using (resident_id = gfa_ui.my_participant_id());
create policy ghs_self_insert on gfa_residence.gh_document_signatures for insert
  with check (resident_id = gfa_ui.my_participant_id() and entered_by = auth.uid());
create policy ghs_operator_read on gfa_residence.gh_document_signatures for select
  using (residence_id is not null and gfa_residence.operates_residence(residence_id));
-- assisted capture by residence staff (entry_mode = 'assisted'; provenance preserved)
create policy ghs_operator_insert on gfa_residence.gh_document_signatures for insert
  with check (residence_id is not null and gfa_residence.operates_residence(residence_id)
              and entry_mode = 'assisted' and entered_by = auth.uid());
create policy ghs_admin_read on gfa_residence.gh_document_signatures for select using (is_admin());

create policy ral_admin_read on gfa_residence.residence_audit_log for select using (is_admin());
create policy ral_operator_read on gfa_residence.residence_audit_log for select
  using (residence_id is not null and gfa_residence.operates_residence(residence_id));

grant select on gfa_residence.gh_documents, gfa_residence.gh_document_versions,
                gfa_residence.gh_signature_status, gfa_residence.residence_audit_log to authenticated;
grant select, insert on gfa_residence.gh_document_signatures to authenticated;
grant all on gfa_residence.gh_documents, gfa_residence.gh_document_versions,
             gfa_residence.gh_document_signatures, gfa_residence.residence_audit_log
  to service_role;
