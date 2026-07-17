#!/usr/bin/env bash
# Start vendored github-wiki MCP (installs deps on first run).
set -euo pipefail
MCP_SERVERS="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$MCP_SERVERS/github-wiki-mcp"
cd "$DIR"
if [[ ! -d node_modules ]]; then
  if [[ ! -f dist/index.js ]]; then
    npm ci 2>/dev/null || npm install
  else
    npm ci --omit=dev 2>/dev/null || npm install --omit=dev
  fi
fi
if [[ ! -f dist/index.js ]]; then
  npm run build
fi
exec node dist/index.js
