#!/usr/bin/env bash
# Rebuild vendored github-wiki MCP server (after pulling src/ changes).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/.cursor/mcp-servers/github-wiki-mcp"
npm install
npm run build
echo "Built: $ROOT/.cursor/mcp-servers/github-wiki-mcp/dist/index.js"
