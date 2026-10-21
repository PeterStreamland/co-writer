#!/bin/bash
# Blocks Claude from finishing while tests fail. After 3 blocks in a row in one
# session it lets the stop through, so a test that needs David can't loop forever.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"
session=$(jq -r '.session_id // "unknown"')
counter="${TMPDIR:-/tmp}/co-writer-stop-blocks-$session"

if out=$(npx vitest run 2>&1); then
  rm -f "$counter"
  echo "$(date -u +%FT%TZ) Stop: tests passed" >> .claude/hooks.log
  exit 0
fi

blocks=$(( $(cat "$counter" 2>/dev/null || echo 0) + 1 ))
echo "$blocks" > "$counter"
summary=$(tail -n 30 <<<"$out")

if [ "$blocks" -gt 3 ]; then
  rm -f "$counter"
  echo "$(date -u +%FT%TZ) Stop: tests FAILED, allowed after 3 blocks" >> .claude/hooks.log
  printf 'Tests still fail after 3 attempts. Tell David which tests fail and why, in plain English.\n%s\n' "$summary" >&2
  exit 0
fi

echo "$(date -u +%FT%TZ) Stop: tests FAILED, blocked ($blocks/3)" >> .claude/hooks.log
jq -n --arg r "Tests are failing; fix them before finishing (block $blocks of 3):
$summary" '{decision: "block", reason: $r}'
