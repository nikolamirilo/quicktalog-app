#!/bin/sh
# First PGlite run (2026-09-16), against the design drafts: rls.original.sql (as drafted) and rls.patched.sql (P1-P5).
# Kept for traceability; the plan's own SQL is verified by run-final.sh.
set -e
cd "$(dirname "$0")"
mkdir -p results
for v in 17 18; do
  node run.mjs rls.original.sql $v results/results-original-$v.json | head -1
  node run.mjs rls.patched.sql  $v results/results-patched-$v.json  | head -1
done
node run-decision.mjs > results/results-decision-17.log
