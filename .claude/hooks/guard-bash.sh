#!/usr/bin/env bash
# PreToolUse(Bash): block commands that leak secrets or are destructive to DB/git/fs.
# Conservative starting set - extend the patterns below as needed.
# exit 2 = block, with the reason sent to stderr (shown to Claude).
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0

block() { echo "Blocked: $1" >&2; exit 2; }

# --- Secret exposure ---
printf '%s' "$CMD" | grep -Eq '\b(cat|bat|less|more|head|tail|nl|tac|xxd|strings)\b[^|;&]*\.env' \
	&& block "command reads a .env secrets file (would leak credentials into the transcript)"
printf '%s' "$CMD" | grep -Eq '\bprintenv\b' \
	&& block "'printenv' dumps environment secrets"

# --- Destructive database / infra ---
printf '%s' "$CMD" | grep -Eq 'drizzle-kit[[:space:]]+(push|drop)' \
	&& block "'drizzle-kit push/drop' mutates the live database schema"
printf '%s' "$CMD" | grep -Eq 'supabase[[:space:]]+db[[:space:]]+reset' \
	&& block "'supabase db reset' wipes the database"

# --- Destructive git ---
printf '%s' "$CMD" | grep -Eq 'git[[:space:]]+push\b[^|;&]*(--force\b|--force-with-lease=?|[[:space:]]-f\b)' \
	&& block "force-push can overwrite remote history"
printf '%s' "$CMD" | grep -Eq 'git[[:space:]]+reset[[:space:]]+--hard\b' \
	&& block "'git reset --hard' discards uncommitted work"

# --- Destructive filesystem ---
printf '%s' "$CMD" | grep -Eiq '\brm\b[^|;&]*(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-rf|-fr)\b' \
	&& block "'rm -rf' is destructive"

exit 0
