#!/usr/bin/env bash
# PostToolUseFailure(Bash): recognise this project's recurring failures and inject the known fix,
# so a transient font fetch or an RLS error is not debugged from scratch each time.
# Non-blocking: always exits 0.
INPUT=$(cat)
command -v jq >/dev/null 2>&1 || exit 0
ERR=$(printf '%s' "$INPUT" | jq -r '[(.tool_error // ""), (.tool_result | tostring? // "")] | join(" ")' 2>/dev/null)
[ -z "$ERR" ] && exit 0

HINT=""
case "$ERR" in
	*42501*) HINT="Postgres 42501 means the query ran outside a withUser/withPublic/asAdmin block in utils/db. See docs/architecture/data-access.md." ;;
	*"queries have exactly one entry"*) HINT="Known Turbopack + Google Fonts failure: Google served a /l/font?kit= URL Turbopack cannot parse. Clear .next and restart - not a code bug." ;;
	*"Cannot read properties of null (reading '1')"*) HINT="Known flaky next/font Google Fonts fetch in fonts/index.ts. Retry the build before changing anything." ;;
	*ECONNREFUSED*|*ENOTFOUND*|*ETIMEDOUT*) HINT="Connection failure - check whether the TEST Supabase project is paused or the dev server is down before assuming a code fault." ;;
	*EADDRINUSE*) HINT="Port already in use - a dev server is probably already running; reuse it instead of starting another." ;;
esac
[ -z "$HINT" ] && exit 0

jq -n --arg ctx "$HINT" '{hookSpecificOutput:{hookEventName:"PostToolUseFailure",additionalContext:$ctx}}'
