#!/usr/bin/env bash
# PostToolUse(Edit|Write): auto-format + safe-fix the edited file with Biome.
# Non-blocking: always exits 0 so it never interrupts Claude.
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# Only touch files Biome actually handles.
case "$FILE_PATH" in
	*.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.jsonc|*.css) ;;
	*) exit 0 ;;
esac
[ -f "$FILE_PATH" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
npx --no-install biome check --write --no-errors-on-unmatched "$FILE_PATH" >/dev/null 2>&1
exit 0
