#!/usr/bin/env bash
# PreToolUse(Edit|Write): block edits to secrets, lockfiles, git hooks, and DB migrations.
# exit 2 = block, with the reason sent to stderr (shown to Claude).
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

case "$FILE_PATH" in
	*.env|*.env.*|*/.env|*/.env.*)
		echo "Blocked: '$FILE_PATH' is a secrets file (.env*). Edit it manually outside Claude." >&2
		exit 2 ;;
esac

case "$FILE_PATH" in
	package-lock.json|*/package-lock.json)
		echo "Blocked: package-lock.json is managed by npm. Run 'npm install' instead of editing it." >&2
		exit 2 ;;
	.husky/*|*/.husky/*)
		echo "Blocked: '$FILE_PATH' is a git hook under .husky/. Edit it manually if this is intended." >&2
		exit 2 ;;
	supabase/migrations/*|*/supabase/migrations/*)
		# New migration files (created with `supabase migration new`, not yet committed) may be written.
		# Committed migrations are treated as applied and must never be edited.
		if git -C "${CLAUDE_PROJECT_DIR:-.}" ls-files --error-unmatch -- "$FILE_PATH" >/dev/null 2>&1; then
			echo "Blocked: '$FILE_PATH' is a committed Supabase migration. Never edit an applied migration; create a new one with 'supabase migration new <name>'." >&2
			exit 2
		fi ;;
esac

exit 0
