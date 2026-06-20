#!/usr/bin/env bash
# Stop: type-check with `tsc --noEmit` and block finishing if there are type errors,
# so Claude fixes them in the same turn. Only runs when there are uncommitted
# .ts/.tsx changes, so pure Q&A / non-TS turns are not slowed down.
INPUT=$(cat)

# Prevent the consecutive-block loop (Stop hook block cap).
if [ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false')" = "true" ]; then
	exit 0
fi

PROJ="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJ" 2>/dev/null || exit 0

# Skip when there are no uncommitted TypeScript changes to check.
CHANGED=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null | grep -Ec '\.(ts|tsx)$' )
[ "${CHANGED:-0}" -eq 0 ] && exit 0

OUT=$(npx --no-install tsc --noEmit 2>&1)
RC=$?
[ "$RC" -eq 0 ] && exit 0

{
	echo "Type check failed (tsc --noEmit) — fix these before finishing:"
	ERRS=$(printf '%s\n' "$OUT" | grep "error TS")
	if [ -n "$ERRS" ]; then
		printf '%s\n' "$ERRS" | head -50
	else
		printf '%s\n' "$OUT" | tail -30
	fi
} >&2
exit 2
