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

Copy [`.cursor/mcp.json.example`](../.cursor/mcp.json.example) to `.cursor/mcp.json`:

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

Restart Cursor → **Settings → MCP** → verify `atlassian`, `github`, `github-wiki` are green.

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
└── Stories/
    └── <STORY-KEY>-user-story-slug
```

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
| No MCP servers | Create `.cursor/mcp.json`, set env vars, restart |
| Wiki write fails | Enable wiki on repo; check `GITHUB_TOKEN` has `repo` scope |
| Jira 401 | Verify `ATLASSIAN_*` env vars |
| Wrong wiki path | Check `project-config.yml` → `project.slug` and `jira.epic_key` |
