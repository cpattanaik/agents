#!/usr/bin/env bash
# Rebuild / refresh vendored MCP servers.
set -euo pipefail
MCP_SERVERS="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> github-wiki-mcp"
cd "$MCP_SERVERS/github-wiki-mcp"
npm install
npm run build
echo "Built: $MCP_SERVERS/github-wiki-mcp/dist/index.js"

echo "==> mcp-atlassian (refresh prod deps)"
cd "$MCP_SERVERS/mcp-atlassian"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
echo "Ready: $MCP_SERVERS/mcp-atlassian/dist/index.js"
