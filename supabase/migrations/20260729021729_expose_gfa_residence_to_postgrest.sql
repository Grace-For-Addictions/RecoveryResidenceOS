-- ============================================================================
-- Expose gfa_residence via PostgREST so the residence portal can query it.
-- Follows the established pattern from expose_gfa_schemas_to_postgrest.
-- Authorization remains enforced by RLS on every table; the anon role gets
-- read access only to the publicly-listed residence directory tables.
-- ============================================================================

alter role authenticator set pgrst.db_schemas to 'public,gfa_ui,gfa_community,gfa_residence';
notify pgrst, 'reload config';

grant usage on schema gfa_residence to anon, authenticated;

-- Public directory: active+listed residences and their public profiles
-- (row visibility limited by the existing res_public / pp_public policies).
grant select on gfa_residence.residences, gfa_residence.public_profiles to anon;

-- Authenticated users: table-level grants were issued per-table in Gates 1-4b;
-- cover any residence tables that predate those gates.
grant select, insert, update on all tables in schema gfa_residence to authenticated;

-- Future tables in this schema get the same table-level surface;
-- RLS policies still decide row access.
alter default privileges in schema gfa_residence
  grant select, insert, update on tables to authenticated;
