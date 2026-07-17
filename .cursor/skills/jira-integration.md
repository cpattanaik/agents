# Jira Integration (Shared)

All pipeline agents use this contract to read from and update Jira.

## Configuration file

Read [project-config.yml](../../project-config.yml) from repo root (copy from [project-config.yml.example](../../project-config.yml.example)).

| Field | Required | Use |
|-------|----------|-----|
| `jira.project_key` | Yes for Planning Agent | Jira project key (e.g. `PROJ`) |
| `jira.epic_name_field` | Jira Cloud | Custom field ID for Epic Name when creating epics |
| `jira.epic_link_field` | Jira Server/DC | Epic Link field; Cloud uses `parent` instead |
| `jira.transitions` | Optional | Workflow transition IDs — `null` skips transition (comment only) |
| `jira.custom_fields` | Optional | Design Doc URL, PR URL fields |

Env var fallback: `JIRA_PROJECT_KEY` when `jira.project_key` is absent in config.

## Authentication (priority order)

1. **Jira MCP tools** — preferred if configured in Cursor
2. **Jira REST API** — env vars: `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
3. **Stop** — if neither works, report blocker; do not fabricate updates

**Documents** are stored in **GitHub Wiki** (not Jira). Every Jira comment must include wiki links per [wiki-integration.md](wiki-integration.md).

## REST API examples

```bash
# Create epic (Jira Cloud — include Epic Name custom field)
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "PROJ"},
      "summary": "My Product v1",
      "description": {"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Epic from PRD"}]}]},
      "issuetype": {"name": "Epic"},
      "customfield_10011": "My Product v1"
    }
  }'

# Create story under epic (Jira Cloud — parent field)
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "PROJ"},
      "summary": "User story title",
      "description": {"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"US-1 from PRD"}]}]},
      "issuetype": {"name": "Story"},
      "parent": {"key": "PROJ-100"}
    }
  }'

# Link issues (blocks / is blocked by)
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$JIRA_URL/rest/api/3/issueLink" \
  -d '{
    "type": {"name": "Blocks"},
    "inwardIssue": {"key": "PROJ-101"},
    "outwardIssue": {"key": "PROJ-102"}
  }'

# Get issue
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_URL/rest/api/3/issue/PROJ-123"

# Add comment
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$JIRA_URL/rest/api/3/issue/PROJ-123/comment" \
  -d '{"body":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Agent report here"}]}]}}'

# Transition issue (workflow-dependent transition id)
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$JIRA_URL/rest/api/3/issue/PROJ-123/transitions" \
  -d '{"transition":{"id":"31"}}'
```

Use `GET /rest/api/3/issue/PROJ-123/transitions` to discover valid transition IDs for the project.

### Null transitions (default in template)

`project-config.yml.example` sets all `jira.transitions.*` to `null`. Agents **comment only** until you set real IDs:

```yaml
jira:
  transitions:
    story_to_refined: "21"           # Planning Agent
    story_to_ready_for_dev: "31"     # Review Agent (design scope)
    story_to_in_progress: "11"       # Coding Agent
    story_to_in_review: "41"         # Coding Agent (complete)
    story_to_done: "51"              # PR Agent (after merge, if user confirms)
    bug_to_in_progress: "11"         # Bugfix Agent
```

If a transition ID is `null` or the API returns an error, **comment only** and note the skip in the agent report.

## Jira Cloud vs Server/Data Center

| Operation | Jira Cloud | Jira Server / DC |
|-----------|------------|------------------|
| Story under epic | `"parent": {"key": "PROJ-100"}` | `"parent"` or Epic Link field |
| Epic Name | Required custom field (e.g. `customfield_10011`) | Often not required |
| Description format | Atlassian Document Format (ADF) | ADF or wiki markup |

## Report persistence

Agent reports and documents are published to **GitHub Wiki** under `Projects/{slug}/Epics/{EPIC-KEY}/`. See [wiki-integration.md](wiki-integration.md).

Jira comments must use wiki URLs:

```
Wiki PRD: https://github.com/org/repo/wiki/Projects/my-project/Epics/PROJ-100/PRD
Wiki Report: https://github.com/org/repo/wiki/.../Agent-Reports/planning-agent-20260716
```

Optional repo mirror: `docs/agent-reports/` per [report-persistence.md](report-persistence.md).

## Pipeline mode

Read [project-config.yml](../../project-config.yml):

| Mode | Jira / Wiki MCP | Typical use |
|------|-----------------|-------------|
| `dev` (default in template) | **Jira required for Planning Agent** (epic/story creation); wiki recommended; other gates relaxed | First-run with MCP configured |
| `strict` | Required — agents FAIL without MCP + wiki publish | Corporate gates after CI and transitions configured |

Planning Agent always requires Jira. In `strict`, all agents that update Jira must be configured; agents do not fabricate updates.

## Standard Jira fields to read

| Field | Use |
|-------|-----|
| summary | Task title |
| description | Requirements, AC |
| parent | Epic link |
| issuelinks | Blocked by / blocks |
| assignee | Owner |
| status | Current workflow state |
| customfield_* | Design Doc URL, PR URL (project-specific) |

## Agent update contract

Every agent appends a **comment** on completion. Format:

```markdown
## [Agent Name] Report — [timestamp]

**Status:** COMPLETE | BLOCKED | FAILED

[Agent-specific report summary]

**Artifacts:** [links to docs, PRs, reports]
```

Only transition issues when the agent's workflow explicitly requires it and the target transition is valid.

## Transition map (configure per project)

| Agent | Typical transition | When |
|-------|-------------------|------|
| Planning | Create epic + stories from PRD | When epic/stories missing |
| Planning | → Refined | PRD + stories ready |
| Design | Comment only on design complete | Design doc written |
| Review (design scope) | Stories → Ready for Dev | Design APPROVED, no Critical items |
| Coding | Story → In Progress | Implementation started |
| Coding | Story → In Review | Code complete |
| Unit Test | Comment only | Test report |
| Integration Test | Comment only | Integration test report |
| Security Review | Comment only | Security report |
| Review (code scope) | Comment only | Code review report |
| Regression | Comment only | CI result |
| PR | Story → In Review | PR opened |
| PR | Story → Done | After merge (if user confirms) |
| Bugfix | Bug → In Progress | Fix started |
| Bugfix | Comment only | Fix report |

Replace transition names/IDs with your Jira workflow. When ID is `null` or transition fails, comment only and report the skip in the agent report.

## Linking artifacts in Jira

Jira stores **links only** — full documents live in GitHub Wiki.

| Artifact | Wiki page | Jira update |
|----------|-----------|-------------|
| PRD | `.../Epics/{KEY}/PRD` | Comment wiki URL on epic + stories |
| Architecture | `.../Epics/{KEY}/Architecture` | Comment wiki URL on epic + stories |
| Tech design | `.../Epics/{KEY}/Technical-Design` | Comment wiki URL on epic + stories |
| Agent report | `.../Epics/{KEY}/Agent-Reports/{agent}-{date}` | Comment wiki URL on story/epic |

Story details live in **Jira** (description, AC, DoD) — Planning Agent does not create wiki pages under `Stories/`.
| PR | GitHub PR URL | Comment on story |
| CI run | Actions run URL | Comment on story |

Configure paths in [project-config.yml](../../project-config.yml). See [wiki-integration.md](wiki-integration.md).

## Rules

- Never close or transition issues without explicit permission in the agent workflow
- Always include Jira issue key in comments (e.g. `PROJ-123`)
- On failure, comment with `Status: BLOCKED` and reason
- Fetch issue before updating to avoid stale transitions
