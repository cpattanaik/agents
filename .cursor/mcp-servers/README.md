# Vendored MCP servers

Jira (`mcp-atlassian`) and GitHub Wiki (`github-wiki-mcp`) servers vendored for reliable Cursor startup. Copy the entire `.cursor` folder into another project — no MCP config edits required.

## Layout

```
.cursor/mcp-servers/
├── scripts/
│   ├── run-atlassian-mcp.sh   # wrapper → mcp-atlassian
│   ├── run-github-wiki-mcp.sh # wrapper → github-wiki-mcp
│   └── setup-mcp-servers.sh   # rebuild github-wiki; refresh atlassian deps
├── mcp-atlassian/             # pre-built dist/ committed
└── github-wiki-mcp/           # pre-built dist/ committed
```

`.cursor/mcp.json` points at `scripts/*.sh` using `${workspaceFolder}` paths.

## Prerequisites

- **Node.js** and **npm** on PATH
- **Network** on first MCP start (wrappers run `npm ci` / `npm install` for `node_modules`; `github` server uses `npx`)
- **Shell env vars** (never commit tokens): `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `GITHUB_TOKEN`

## First run

Wrappers install production dependencies if `node_modules` is missing, then start `dist/index.js`. First start may take ~30s.

## Rebuild

After editing `github-wiki-mcp/src/`:

```bash
./.cursor/mcp-servers/scripts/setup-mcp-servers.sh
```
