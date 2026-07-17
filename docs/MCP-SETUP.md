# MCP Setup — Jira + GitHub Wiki

Configure Cursor MCP so agents can manage **Jira epics/stories** and publish **all documents to GitHub Wiki** under the project epic.

## Document model

| Content | Storage | Jira |
|---------|---------|------|
| PRD, architecture, design | GitHub Wiki under `Projects/{slug}/Epics/{EPIC-KEY}/` | Wiki links on epic + stories |
| Agent reports | Wiki `.../Agent-Reports/` | Wiki link in comment |
| Epic, stories, status | Jira only | System of record for work |

See [wiki-integration.md](../.cursor/skills/wiki-integration.md) for the full contract.

## 1. Environment variables

Add to `~/.zshrc` or `~/.bashrc` (never commit tokens):

```bash
export ATLASSIAN_URL="https://yourcompany.atlassian.net"
export ATLASSIAN_EMAIL="you@company.com"
export ATLASSIAN_API_TOKEN="your-atlassian-api-token"
export GITHUB_TOKEN="ghp_..."   # scopes: repo (includes wiki)
```

Atlassian token: [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

GitHub PAT: Settings → Developer settings → PAT → `repo` scope.

## 2. MCP configuration

MCP config ships in `.cursor/mcp.json` (env var references only — **never put tokens in this file**).

**New app repo:** copy the whole `.cursor` folder — no MCP file edits needed:

```bash
cp -R /path/to/agents/.cursor /path/to/your-app/.cursor
```

**This repo:** `.cursor/mcp.json` is already present. Set env vars (section 1) and restart Cursor.

### Prerequisites

| Requirement | Used by |
|-------------|---------|
| Node.js + npm | Vendored server wrappers (first-start `npm ci`) |
| Network (first start) | `npm ci` for atlassian/github-wiki; `npx` for github server |
| Shell env vars | `ATLASSIAN_*`, `GITHUB_TOKEN` — see section 1 |

Restart Cursor → **Settings → MCP** → verify `atlassian`, `github`, `github-wiki` are green.

**atlassian** and **github-wiki** are **vendored** in this repo (reliable startup without `npx`):

```json
"atlassian": {
  "command": "bash",
  "args": ["${workspaceFolder}/.cursor/mcp-servers/scripts/run-atlassian-mcp.sh"],
  "cwd": "${workspaceFolder}"
},
"github-wiki": {
  "command": "bash",
  "args": ["${workspaceFolder}/.cursor/mcp-servers/scripts/run-github-wiki-mcp.sh"],
  "cwd": "${workspaceFolder}"
}
```

`${workspaceFolder}` resolves to the project root (where `.cursor/mcp.json` lives) so the same config works in any repo after copy.

Wrappers install production dependencies on first run, then start the local `dist/index.js` for each server.

After updating vendored `src/` (github-wiki only), refresh:

```bash
./.cursor/mcp-servers/scripts/setup-mcp-servers.sh
```

This server provides `write_wiki_page`, `read_wiki_page`, `list_wiki_pages`, etc. — used by planning and design agents.

## 3. Project configuration

```bash
cp project-config.yml.example project-config.yml
```

Edit `project-config.yml` for your repository:

```yaml
project:
  name: My Project
  slug: my-project

github:
  owner: myorg
  repo: my-repo

jira:
  project_key: PROJ
  epic_key: null          # set after planning agent creates epic

pipeline:
  mode: dev               # default — switch to strict after MCP + CI verified
```

See [PROJECT-CONFIG.md](PROJECT-CONFIG.md) for all sections.

## 4. Upgrade to strict mode

After the integration checklist passes:

1. Set Jira transition IDs in `jira.transitions` (discover via REST API — see PROJECT-CONFIG.md)
2. Verify `@planning-agent` publishes to wiki and Jira comments include wiki URLs
3. Push a branch and confirm CI jobs (`unit-test`, `integration-test`, `security`, `regression`, `ci-success`) pass
4. Set `pipeline.mode: strict` in `project-config.yml`

## 5. Enable GitHub Wiki on repo

Repo → **Settings → Features → Wikis** → Enable.

## 6. Wiki structure (created by agents)

```
Projects/<project-slug>/Epics/<EPIC-KEY>/
├── Overview
├── PRD
├── Architecture
├── Technical-Design
├── Agent-Reports/
│   └── planning-agent-20260716.md
```

Story details (user story, AC) are in **Jira only** — Planning Agent does not create `Stories/` wiki pages.

Example with `slug: my-project`, epic `PROJ-100`:

```
Projects/my-project/Epics/PROJ-100/PRD
```

## 7. Run pipeline

```
@planning-agent
PRD: (content or draft)
Architecture: (content or draft)
```

Planning agent reads `project-config.yml` for `project.slug`, `jira.project_key`, and `github.*`. It will:

1. Create Jira epic + stories under your project key
2. Publish PRD and Architecture to wiki under `Epics/{EPIC-KEY}/`
3. Comment Jira epic and each story with wiki URLs
4. Set `jira.epic_key` in config (or report the key to update manually)

Then `@design-agent`, etc. — each publishes to wiki and updates Jira with links.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No MCP servers | Copy `.cursor` folder (includes `mcp.json`); set env vars; restart |
| `github-wiki-mcp` npm 404 / Connection closed | Use vendored `.cursor/mcp-servers/scripts/run-github-wiki-mcp.sh` (see `.cursor/mcp.json`) |
| `mcp-atlassian` / atlassian Connection closed | Use vendored `.cursor/mcp-servers/scripts/run-atlassian-mcp.sh` — not `npx` or missing local `dist/` |
| `MODULE_NOT_FOUND` … `mcp-servers/.../dist/index.js` | Do **not** point `mcp.json` at `node …/dist/index.js` — use wrapper scripts; or run `./.cursor/mcp-servers/scripts/setup-mcp-servers.sh` |
| `Cannot find module` (e.g. `@modelcontextprotocol/sdk`, `jsdom`) | Wrappers run `npm ci` on first start — ensure `.cursor/mcp-servers/` was copied with `.cursor` |
| `@modelcontextprotocol/server-atlassian` 404 | Removed — use vendored `mcp-atlassian` via `.cursor/mcp-servers/scripts/run-atlassian-mcp.sh` |
| Wiki write fails | Enable wiki on repo; check `GITHUB_TOKEN` has `repo` scope |
| Jira 401 | Verify `ATLASSIAN_*` env vars |
| Wrong wiki path | Check `project-config.yml` → `project.slug` and `jira.epic_key` |
