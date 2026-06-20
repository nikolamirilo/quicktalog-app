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
		echo "Blocked: '$FILE_PATH' is a Supabase migration. Generate migrations via the Supabase CLI, don't hand-edit." >&2
		exit 2 ;;
esac

exit 0
