#!/usr/bin/env bash
# UserPromptSubmit: remind Claude that code comments are rare and one line long.
# Non-blocking: always exits 0; the text is injected as context, not shown in the transcript.
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"Comments: add one only when the code cannot be made clear on its own (a non-obvious why, a workaround, a subtle invariant). Never restate what the code does. Keep any comment extremely concise - one short line, no banners, no change logs."},"suppressOutput":true}
JSON
