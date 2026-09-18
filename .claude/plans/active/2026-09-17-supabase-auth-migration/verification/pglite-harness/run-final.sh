#!/bin/sh
# Runs the final PGlite scenarios (692) against the SQL of ../../PLAN.md Appendix A on PostgreSQL 17.5 and 18.3.
# No network, no Supabase access. Requires `npm install` in this folder and `npm install` at the repo root
# (the Drizzle app-layer scenarios use the app's drizzle-orm and @quicktalog/common).
set -e
cd "$(dirname "$0")"
node tools/extract-plan.mjs > /dev/null
mkdir -p results
for v in 17 18; do
  node final.mjs plan-sql $v results/plan-$v.json | head -1
done
