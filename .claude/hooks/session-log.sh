#!/usr/bin/env bash
# SessionEnd: append one line per session to .claude/logs/sessions.log (gitignored).
# Informational only and must stay well inside the ~1.5s budget, so it does no network or npm work.
PROJ="${CLAUDE_PROJECT_DIR:-$(pwd)}"
INPUT=$(cat)
cd "$PROJ" 2>/dev/null || exit 0

REASON=$(printf '%s' "$INPUT" | jq -r '.reason // "other"' 2>/dev/null)
SESSION=$(printf '%s' "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "-")
DIRTY=$(git status --porcelain 2>/dev/null | grep -c .)

mkdir -p .claude/logs 2>/dev/null || exit 0
printf '%s\treason=%s\tbranch=%s\tdirty=%s\tsession=%s\n' \
	"$(date '+%Y-%m-%d %H:%M:%S')" "$REASON" "$BRANCH" "${DIRTY:-0}" "$SESSION" >> .claude/logs/sessions.log
exit 0
