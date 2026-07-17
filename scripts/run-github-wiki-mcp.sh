#!/usr/bin/env bash
# Start vendored github-wiki MCP (installs deps on first run).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/.cursor/mcp-servers/github-wiki-mcp"
cd "$DIR"
if [[ ! -d node_modules ]]; then
  npm ci --omit=dev 2>/dev/null || npm install --omit=dev
fi
if [[ ! -f dist/index.js ]]; then
  npm run build
fi
exec node dist/index.js
