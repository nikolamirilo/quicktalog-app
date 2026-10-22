#!/usr/bin/env bash
# PostToolUse(Bash, supabase/drizzle commands): remind Claude of the step that follows a schema change.
# Non-blocking: always exits 0.
INPUT=$(cat)
command -v jq >/dev/null 2>&1 || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$CMD" ] && exit 0

printf '%s' "$CMD" | grep -Eq 'supabase[[:space:]]+(db[[:space:]]+push|migration[[:space:]]+up)' || exit 0

jq -n '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:"A migration was just applied: regenerate DB types with '\''drizzle-kit pull'\'' in @quicktalog/common (../quicktalog-packages), and remember shared schema changes need a release before this app can use them."}}'
