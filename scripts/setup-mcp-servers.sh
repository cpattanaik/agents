#!/usr/bin/env bash
# Rebuild / refresh vendored MCP servers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> github-wiki-mcp"
cd "$ROOT/.cursor/mcp-servers/github-wiki-mcp"
npm install
npm run build
echo "Built: $ROOT/.cursor/mcp-servers/github-wiki-mcp/dist/index.js"

echo "==> mcp-atlassian (refresh prod deps)"
cd "$ROOT/.cursor/mcp-servers/mcp-atlassian"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
echo "Ready: $ROOT/.cursor/mcp-servers/mcp-atlassian/dist/index.js"
