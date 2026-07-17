#!/usr/bin/env bash
# Start vendored mcp-atlassian MCP (installs deps on first run).
set -euo pipefail
MCP_SERVERS="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$MCP_SERVERS/mcp-atlassian"
cd "$DIR"
if [[ ! -d node_modules ]]; then
  npm ci --omit=dev 2>/dev/null || npm install --omit=dev
fi
if [[ ! -f dist/index.js ]]; then
  echo "mcp-atlassian dist/index.js missing — re-vendor from npm mcp-atlassian" >&2
  exit 1
fi
exec node dist/index.js
