-- ============================================================================
-- Allow bed removal by residence staff/admins.
-- DELETE stays table-scoped to beds only; RLS (beds_operator / beds_admin)
-- decides who may remove, and the trigger below refuses to remove an
-- occupied bed — residents are never displaced by a grid action.
-- ============================================================================

grant delete on gfa_residence.beds to authenticated;

create or replace function gfa_residence.bed_delete_guard()
returns trigger
language plpgsql
set search_path = gfa_residence, public, pg_temp
as $$
begin
  if old.resident_id is not null or old.status = 'occupied' then
    raise exception 'An occupied bed cannot be removed - discharge or reassign the resident first';
  end if;
  return old;
end; $$;

drop trigger if exists trg_bed_delete_guard on gfa_residence.beds;
create trigger trg_bed_delete_guard
  before delete on gfa_residence.beds
  for each row execute function gfa_residence.bed_delete_guard();
