# Report Persistence (Shared)

All pipeline agents publish reports and documents to **GitHub Wiki** under the project epic. Jira receives **wiki links only** (not full document bodies).

## Read configuration

1. [project-config.yml](../../project-config.yml) — project, github, jira, wiki, pipeline, **build** settings
2. [wiki-integration.md](wiki-integration.md) — full contract
3. [docs/TESTING.md](../../docs/TESTING.md) — Spring Boot Maven test commands and pom setup

### Maven build commands (when `build.tool: maven`)

| Agent | Config field |
|-------|--------------|
| Coding | `build.compile_command` |
| Unit Test | `build.test_command` |
| Integration Test | `build.integration_test_command` |
| Regression / CI | `build.regression_command` |

Optional `build.maven_module` appends `-pl {module}` to all commands.

## Write workflow (every agent)

1. Build report or document content
2. **Publish to GitHub Wiki** (required):
   - Path: `Projects/{slug}/Epics/{EPIC-KEY}/Agent-Reports/{agent}-{YYYYMMDD}.md`
   - Or artifact pages: `.../PRD`, `.../Architecture`, `.../Technical-Design`
   - Use `github-wiki` MCP: `write_wiki_page`
3. **Update Jira** with wiki URL (required):
   ```
   Report: https://github.com/{owner}/{repo}/wiki/Projects/.../Agent-Reports/...
   ```
4. **Optional mirror** to repo when `project-config.yml` → `pipeline.reporting.mirror_to_repo: true`:
   - Path: `docs/agent-reports/<jira-key>/<agent>-<timestamp>.md`

## Jira key selection

| Agent | Jira comment target | Wiki path under epic |
|-------|---------------------|----------------------|
| Planning | Epic + all stories | PRD, Architecture, Agent-Reports |
| Design | Epic + each story | Technical-Design, Agent-Reports |
| Review, Coding, Tests, PR | Story (or epic) | Agent-Reports |
| Bugfix | Bug ticket | Agent-Reports (under linked epic if known) |

## Rules

- Wiki is **canonical** when `project-config.yml` → `pipeline.reporting.wiki_canonical: true` (default in strict mode)
- Never comment repo-only paths on Jira — always include wiki URL
- If wiki publish fails, agent status is FAIL/BLOCKED
- PR Agent links wiki URLs in PR body (not just repo paths)
- Follow [wiki-integration.md](wiki-integration.md) and [jira-integration.md](jira-integration.md)

## Verify prior gate reports (read path)

Agents that enforce prerequisites (Design, Orchestrator, PR) **must read reports from wiki first**, not `docs/agent-reports/`.

### 1. Resolve wiki base path

From [project-config.yml](../../project-config.yml):

```
Projects/{project.slug}/Epics/{jira.epic_key}/Agent-Reports/{agent-name}-{YYYYMMDD}.md
```

URL:

```
https://github.com/{github.owner}/{github.repo}/wiki/Projects/{slug}/Epics/{EPIC-KEY}/Agent-Reports/planning-agent-20260716
```

### 2. Locate the report (priority order)

1. **Wiki** — `github-wiki` MCP: read latest page matching `{agent-name}-*` under `.../Agent-Reports/`
2. **Jira** — fetch epic/story comments; find `Wiki Report:` URL from prior agent
3. **Repo mirror** (only when `pipeline.reporting.mirror_to_repo: true`) — `docs/agent-reports/<jira-key>/{agent}-*.md`

### 3. Parse status from report frontmatter

```yaml
---
agent: planning-agent
status: PASS | FAIL | COMPLETE | APPROVED | BLOCKED
---
```

Gate mapping:

| Prior agent | Required status |
|-------------|-----------------|
| planning-agent | PASS |
| design-agent | COMPLETE |
| review-agent (design) | APPROVED or APPROVED WITH COMMENTS |
| unit-test-agent | PASS |
| integration-test-agent | PASS (when API/DB changed) |
| review-agent (code) | APPROVED or APPROVED WITH COMMENTS |
| security-review-agent | PASS |
| regression-test-agent | PASS (strict mode) |

If wiki read fails and mirror is disabled → gate is **BLOCKED** in strict mode.
