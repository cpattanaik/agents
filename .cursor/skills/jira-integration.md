# Jira Integration (Shared)

All pipeline agents use this contract to read from and update Jira.

## Configuration file

Read [project-config.yml](../../project-config.yml) from repo root.

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

[`project-config.yml`](../../project-config.yml) sets all `jira.transitions.*` to `null` by default. Agents **comment only** until you set real IDs:

```yaml
jira:
  transitions:
    story_to_refined: "21"                    # Planning Agent
    story_to_ready_for_dev: "31"              # Review Agent (design)
    story_to_in_progress: "11"                # Coding Agent (start)
    story_to_in_review: "41"                  # Coding Agent (complete)
    story_to_code_review_approved: "42"       # Review Agent (code)
    story_to_unit_test_pass: "43"             # Unit Test Agent
    story_to_integration_test_pass: "44"      # Integration Test Agent
    story_to_security_pass: "45"              # Security Review Agent
    story_to_regression_pass: "46"            # Regression Test Agent
    story_to_pr_open: "47"                    # PR Agent (PR opened)
    story_to_done: "51"                       # PR Agent (after merge)
    bug_to_in_progress: "11"                  # Bugfix Agent
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

Optional repo mirror: `.docs/agent-reports/` per [report-persistence.md](report-persistence.md).

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

| Agent | Config key | Typical transition | When |
|-------|------------|-------------------|------|
| Planning | `story_to_refined` | → Refined | PRD + stories ready |
| Review (design) | `story_to_ready_for_dev` | → Ready for Dev | Design APPROVED, no Critical |
| Coding | `story_to_in_progress` | → In Progress | Implementation started |
| Coding | `story_to_in_review` | → In Review | Code complete |
| Review (code) | `story_to_code_review_approved` | → (your workflow) | Code APPROVED, no Critical |
| Unit Test | `story_to_unit_test_pass` | → (your workflow) | Report PASS |
| Integration Test | `story_to_integration_test_pass` | → (your workflow) | Report PASS |
| Security Review | `story_to_security_pass` | → (your workflow) | Report PASS |
| Regression | `story_to_regression_pass` | → (your workflow) | CI PASS |
| PR | `story_to_pr_open` | → (your workflow) | PR opened |
| PR | `story_to_done` | → Done | After merge (user confirms) |
| Bugfix | `bug_to_in_progress` | → In Progress | Fix started |
| Design | — | Comment only | Design doc written |
| Review (tests/bugfix) | — | Comment only | Report published |

Replace transition names/IDs with your Jira workflow. When ID is `null` or transition fails, comment only and report the skip in the agent report.

## Linking artifacts in Jira

Jira stores **links only** — full documents live in GitHub Wiki.

| Artifact | Wiki page | Jira update |
|----------|-----------|-------------|
| PRD | `.../Epics/{KEY}/PRD` | Comment wiki URL on epic + stories |
| Architecture | `.../Epics/{KEY}/Architecture` | Comment wiki URL on epic + stories |
| Tech design | `.../Epics/{KEY}/Designs/{STORY-KEY}` | Comment that story's design wiki URL on story + epic index |
| Agent report | `.../Epics/{KEY}/Agent-Reports/{agent}-{date}` | Comment wiki URL on story/epic |
| PR | GitHub PR URL | Comment on story |
| CI run | Actions run URL | Comment on story |

Story details live in **Jira** (description, AC, DoD) — Planning Agent does not create wiki pages under `Stories/`.

Configure paths in [project-config.yml](../../project-config.yml). See [wiki-integration.md](wiki-integration.md).

## Rules

- Never close or transition issues without explicit permission in the agent workflow
- Always include Jira issue key in comments (e.g. `PROJ-123`)
- On failure, comment with `Status: BLOCKED` and reason
- Fetch issue before updating to avoid stale transitions
