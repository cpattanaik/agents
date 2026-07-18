# Agent Reports

**Canonical store:** GitHub Wiki under `Projects/{project-slug}/Epics/{EPIC-KEY}/Agent-Reports/`

Jira epic and stories receive **wiki links** in comments — not full report bodies.

## Wiki path convention

```
Projects/<project-slug>/Epics/<EPIC-KEY>/Agent-Reports/<agent-name>-<YYYYMMDD>.md
```

Example (values from `project-config.yml`):

```
https://github.com/myorg/my-repo/wiki/Projects/my-project/Epics/PROJ-100/Agent-Reports/planning-agent-20260716
```

## Report header (required in wiki page content)

```markdown
---
agent: planning-agent
jira_key: PROJ-100
status: PASS | FAIL | COMPLETE | BLOCKED
timestamp: 2026-07-16T20:30:00Z
pipeline_mode: strict | dev
wiki_url: https://github.com/.../wiki/.../Agent-Reports/planning-agent-20260716
---
```

## All documents under epic (wiki)

| Document | Wiki page |
|----------|-----------|
| PRD | `.../Epics/{EPIC-KEY}/PRD` |
| Architecture | `.../Epics/{EPIC-KEY}/Architecture` |
| Technical design | `.../Epics/{EPIC-KEY}/Designs/{STORY-KEY}` |
| Agent reports | `.../Epics/{EPIC-KEY}/Agent-Reports/` |

Story details (user story, AC, DoD) are in **Jira only** — not wiki pages.

## Optional repo mirror

When `project-config.yml` → `pipeline.reporting.mirror_to_repo: true`:

```
.docs/agent-reports/<jira-key>/<agent-name>-<timestamp>.md
```

## Configuration

- [project-config.yml](../../project-config.yml) — all project, Jira, wiki, and pipeline settings
- [PROJECT-CONFIG.md](../PROJECT-CONFIG.md) — field reference
- [wiki-integration.md](../../.cursor/skills/wiki-integration.md) — full contract

## Jira linkage

Every agent comments on Jira:

```
Wiki Report: https://github.com/org/repo/wiki/Projects/{slug}/Epics/{EPIC-KEY}/Agent-Reports/review-agent-20260716
```

PR Agent collects wiki URLs in the PR body under **Agent Reports (Wiki)**.
