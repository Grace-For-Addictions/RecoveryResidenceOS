-- ============================================================================
-- GRACE HOUSE GATE 3b — FUNCTION HARDENING
-- Pin search_path on the trigger functions added in Gates 1-3
-- (security-advisor: function_search_path_mutable).
-- ============================================================================
alter function gfa_residence.freeze_policy_version_content() set search_path = gfa_residence, public, pg_temp;
alter function gfa_residence.audit_log_immutable()           set search_path = gfa_residence, public, pg_temp;
alter function gfa_residence.gh_document_version_guard()     set search_path = gfa_residence, public, pg_temp;
alter function gfa_residence.gh_signature_freeze()           set search_path = gfa_residence, public, pg_temp;
alter function gfa_residence.roi_guard()                     set search_path = gfa_residence, public, pg_temp;
alter function gfa_residence.pass_request_guard()            set search_path = gfa_residence, public, pg_temp;
alter function gfa_residence.drug_test_integrity()           set search_path = gfa_residence, public, pg_temp;
