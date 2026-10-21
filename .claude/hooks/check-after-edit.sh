#!/bin/bash
# After an edit to code or config, run typecheck and tests. Exit 2 shows Claude the failure.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"
file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  *.ts | *.tsx | *.js | *.json) ;;
  *) exit 0 ;;
esac

if ! out=$(npm run --silent typecheck 2>&1); then
  echo "$(date -u +%FT%TZ) PostToolUse $file: typecheck FAILED" >> .claude/hooks.log
  printf 'Typecheck failed after editing %s:\n%s\n' "$file" "$(tail -n 40 <<<"$out")" >&2
  exit 2
fi

if ! out=$(npx vitest run 2>&1); then
  echo "$(date -u +%FT%TZ) PostToolUse $file: tests FAILED" >> .claude/hooks.log
  printf 'Tests failed after editing %s:\n%s\n' "$file" "$(tail -n 40 <<<"$out")" >&2
  exit 2
fi

echo "$(date -u +%FT%TZ) PostToolUse $file: typecheck and tests passed" >> .claude/hooks.log
