#!/usr/bin/env bash
# SessionStart(startup|resume|clear): brief Claude on live checkout state CLAUDE.md cannot state statically.
# Non-blocking: always exits 0; read-only git only. Output is injected as context.
PROJ="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJ" 2>/dev/null || exit 0
command -v jq >/dev/null 2>&1 || exit 0

LINES=""
add() { LINES="${LINES}${LINES:+$'\n'}- $1"; }

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
DIRTY=$(git status --porcelain 2>/dev/null | grep -c .)
case "$BRANCH" in
	main|master) add "On the default branch '$BRANCH' - branch before any commit (and only commit when asked)." ;;
	*) add "Branch: $BRANCH ($DIRTY uncommitted files)." ;;
esac

# Uncommitted migrations are the ones still safe to edit; committed ones count as applied.
NEW_MIGRATIONS=$(git ls-files --others --exclude-standard -- supabase/migrations 2>/dev/null | grep -c '\.sql$')
[ "${NEW_MIGRATIONS:-0}" -gt 0 ] && add "$NEW_MIGRATIONS uncommitted migration(s) in supabase/migrations - apply to TEST first, then regenerate types with 'drizzle-kit pull' in @quicktalog/common."

for SIB in ../quicktalog-packages ../quicktalog-backend; do
	[ -d "$SIB" ] || continue
	SIB_DIRTY=$(git -C "$SIB" status --porcelain 2>/dev/null | grep -c .)
	[ "${SIB_DIRTY:-0}" -gt 0 ] && add "$(basename "$SIB") has $SIB_DIRTY uncommitted files - shared changes there need a release before this app sees them."
done

[ -z "$LINES" ] && exit 0
jq -n --arg ctx "Checkout state at session start:
$LINES" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$ctx}}'
