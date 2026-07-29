#!/usr/bin/env bash
# Apply repo migrations to the Supabase database, in filename order,
# skipping any version already recorded in supabase_migrations.schema_migrations.
# Each migration runs in a single transaction; failure stops the run.
#
# Required env: SUPABASE_DB_URL (postgres connection string; use the session
# pooler URL from the Supabase dashboard with the database password).
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"

shopt -s nullglob
files=(supabase/migrations/*.sql)
if [ ${#files[@]} -eq 0 ]; then
  echo "No migration files found."
  exit 0
fi

for f in "${files[@]}"; do
  base=$(basename "$f" .sql)
  version=${base%%_*}
  name=${base#*_}

  applied=$(psql "$SUPABASE_DB_URL" -tAc \
    "select 1 from supabase_migrations.schema_migrations where version = '$version'")
  if [ "$applied" = "1" ]; then
    echo "= already applied: $base"
    continue
  fi

  echo "+ applying: $base"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$f"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
    -v v="$version" -v n="$name" -v c="$(cat "$f")" \
    -c "insert into supabase_migrations.schema_migrations (version, name, statements) values (:'v', :'n', array[:'c']);"
  echo "  recorded as version $version"
done

echo "Done."
