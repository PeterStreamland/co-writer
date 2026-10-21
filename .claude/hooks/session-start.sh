#!/bin/bash
# Installs dependencies on fresh cloud machines so the check hooks can run.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"
echo "$(date -u +%FT%TZ) SessionStart" >> .claude/hooks.log

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

npm install --no-audit --no-fund >&2
echo "$(date -u +%FT%TZ) SessionStart: npm install done" >> .claude/hooks.log
