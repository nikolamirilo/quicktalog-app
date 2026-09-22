#!/bin/sh
# Applies supabase/migrations plus the remaining Appendix A SQL on an in-memory
# Postgres (PGlite) and runs the RLS scenario suite on PostgreSQL 17 and 18.
# No network and no Supabase access. Needs `npm install` here and at the repo root.
set -e
cd "$(dirname "$0")"
node tools/extract-plan.mjs > /dev/null
mkdir -p results
status=0
for v in 17 18; do
  node final.mjs plan-sql $v results/plan-$v.json || status=1
done
exit $status
