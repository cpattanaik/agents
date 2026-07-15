# Jira Integration (Shared)

All pipeline agents use this contract to read from and update Jira.

## Authentication (priority order)

1. **Jira MCP tools** — preferred if configured in Cursor
2. **Jira REST API** — env vars: `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
3. **Stop** — if neither works, report blocker; do not fabricate updates

## REST API examples

```bash
# Create epic
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "PROJ"},
      "summary": "Lift Control System v1",
      "description": {"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Epic from PRD"}]}]},
      "issuetype": {"name": "Epic"}
    }
  }'

# Create story under epic (Jira Cloud — parent field)
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "PROJ"},
      "summary": "Hall call UP/DOWN",
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
| Design | Design task → Done | Tech design approved |
| Design | Stories → Ready for Dev | After design review pass |
| Coding | Story → In Progress | Implementation started |
| Coding | Story → In Review | Code complete |
| Unit Test | Comment only | Test report |
| Review | Comment only | Review report |
| Regression | Comment only | CI result |
| PR | Story → In Review | PR opened |
| PR | Story → Done | After merge (if user confirms) |
| Bugfix | Bug → In Progress | Fix started |
| Bugfix | Comment only | Fix report |

Replace transition names/IDs with your Jira workflow. If transition fails, comment only and report the error.

## Linking artifacts in Jira

When updating, set or comment these links:

| Artifact | Jira field / comment |
|----------|---------------------|
| PRD | Comment: `PRD: docs/...` |
| Architecture | Comment: `Architecture: docs/...` |
| Tech design | Comment + custom field `Design Doc URL` |
| PR | Comment + custom field `PR URL` |
| CI run | Comment: `CI: https://github.com/.../actions/runs/...` |

## Rules

- Never close or transition issues without explicit permission in the agent workflow
- Always include Jira issue key in comments (e.g. `PROJ-123`)
- On failure, comment with `Status: BLOCKED` and reason
- Fetch issue before updating to avoid stale transitions
