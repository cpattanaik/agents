---
name: planning-agent
description: >-
  Validates PRD and architecture, creates Jira epics/stories from PRD when
  missing, cross-checks traceability, and updates Jira when planning gate
  passes. Use when the user provides a PRD and architecture doc for planning.
disable-model-invocation: true
---

# Planning Agent

Validate planning artifacts, **create Jira epics and stories from PRD when they do not exist**, cross-check traceability, and confirm readiness for the Design Agent.

**Jira is mandatory** — this agent creates the epic and Must-have stories in Jira. Do not run planning without Jira MCP (or REST API) and `jira.project_key` configured.

## Inputs (required)

| Input | Source |
|-------|--------|
| PRD | Draft content or user-provided — published to wiki by agent |
| Architecture document | Draft content or user-provided — published to wiki by agent |
| Project config | [project-config.yml](../../project-config.yml) — `github.*`, `project.*`, `jira.project_key` |
| Jira project key | `project-config.yml` → `jira.project_key`, env `JIRA_PROJECT_KEY`, or user prompt |
| Jira epic link | Optional — if missing, agent creates epic from PRD |

If PRD or architecture content is missing, stop and ask the user to provide them.

If Jira is not configured (no MCP/REST, or missing `jira.project_key`):
- **`pipeline.mode: strict`** → FAIL the planning gate
- **`pipeline.mode: dev`** → FAIL the planning gate — Jira is required for epic/story creation; configure MCP first (see [MCP-SETUP.md](../../.docs/MCP-SETUP.md))

If GitHub Wiki MCP is not configured:
- **`strict`** → FAIL (documents must be published to wiki)
- **`dev`** → WARN; optional repo mirror when `pipeline.reporting.mirror_to_repo: true`

## Workflow

### A. Jira setup (create if missing)

1. **Check for existing Jira epic**
   - If user provides epic key/URL → fetch and use it
   - If no epic provided → **create epic** from PRD title and summary
   - **Update** `jira.epic_key` in [project-config.yml](../../project-config.yml) with the resolved epic key

2. **Create stories from PRD**
   - For each Must-have user story (US-X) in the PRD:
     - Check if a matching Jira story already exists under the epic (by summary or PRD ref in description)
     - If missing → **create story** under the epic with:
       - **Summary**: from PRD user story title
       - **Description**: story text + acceptance criteria + FR references
       - **Issue type**: Story
       - **Parent**: epic key
   - For Could-have / Won't-have stories: create only if user explicitly asks

3. **Set story fields** (on create or update if empty):
   - Description with AC and Definition of Done
   - `Blocked by` links if PRD specifies dependencies
   - Assignee — set if user provides; otherwise leave unassigned and flag in report

4. Follow [jira-integration.md](../jira-integration.md) for create operations

### B. Publish documents to GitHub Wiki

5. **Publish epic documents** per [wiki-integration.md](../wiki-integration.md) — paths from `project-config.yml` (`project.slug`, `jira.epic_key`):
   - `Projects/{slug}/Epics/{EPIC-KEY}/PRD`
   - `Projects/{slug}/Epics/{EPIC-KEY}/Architecture`

6. **Publish PRD and Architecture** via `github-wiki` MCP (`write_wiki_page`)

Do **not** create wiki pages under `Stories/` — story details (user story, AC, DoD) live in **Jira only**. Wiki holds PRD, Architecture, Designs, and agent reports.

### C. Validate and cross-check

8. **Fetch all Jira issues** under epic
   - Extract: summary, description, AC, parent, blocked-by, assignee, DoD

9. **Validate PRD** — goals, stories, FRs, ACs present

10. **Validate architecture document** — components, stack, NFRs

11. **Cross-check PRD ↔ Jira stories**
    - Every Must-have PRD story has a Jira story
    - Every Jira story maps to a PRD user story or FR
    - Blocked-by dependencies documented
    - Every Jira story description includes wiki links to PRD and Architecture — not per-story wiki pages

12. **Produce planning gate report**

13. **Publish report to wiki** → `.../Agent-Reports/planning-agent-{date}.md`

14. **Update Jira** — on PASS:
    - Comment on epic with wiki URLs: PRD, Architecture, planning report
    - Comment on each story with wiki URLs: PRD, Architecture (no story wiki page)
    - Transition stories to **Refined** only when `jira.transitions.story_to_refined` is set (non-null); otherwise comment only — see [jira-integration.md](../jira-integration.md)

## Story creation template (Jira description)

```markdown
## User story
As a [persona], I [action] so that [benefit].

## Wiki
- PRD: https://github.com/{owner}/{repo}/wiki/Projects/{slug}/Epics/{EPIC-KEY}/PRD
- Architecture: https://github.com/{owner}/{repo}/wiki/Projects/{slug}/Epics/{EPIC-KEY}/Architecture

## PRD reference
US-X | FR-1, FR-2

## Acceptance criteria
- Given ... When ... Then ...

## Definition of Done
- [ ] Design approved
- [ ] Code implemented
- [ ] Unit tests pass
- [ ] Review approved
- [ ] PR merged
```

## Planning Gate Checklist

- [ ] PRD complete with goals, stories, FRs, ACs
- [ ] Architecture doc complete
- [ ] Jira epic exists (created or provided)
- [ ] All Must-have PRD stories exist in Jira (created or mapped)
- [ ] All stories have acceptance criteria in description
- [ ] Blocked-by dependencies set
- [ ] Assignee set or flagged

## Report Template

```markdown
# Planning Gate Report

## Summary
PASS | FAIL — ready for Design Agent

## Configuration
- **pipeline.mode**: dev | strict

## Epic
- **Key**: PROJ-100
- **Summary**: [from Jira]

## Artifact validation
| Artifact | Status | Notes |
|----------|--------|-------|
| PRD | ✅/🔴 | ... |
| Architecture | ✅/🔴 | ... |

## Story traceability
| Jira Key | Summary | PRD ref | FR refs | Blocked by | Status |
|----------|---------|---------|---------|------------|--------|
| PROJ-101 | ... | US-1 | FR-5,11 | — | ✅ |

## Gaps
- [List missing stories, ACs, or arch decisions]

## Jira issues created
| Key | Summary | PRD ref | Action |
|-----|---------|---------|--------|
| PROJ-100 | Epic | — | Created / Existing |
| PROJ-101 | User login flow | US-1 | Created |

## Handoff
- [ ] Ready for Design Agent: PRD + Architecture + Jira story keys
```

## Jira update (on PASS)

```
Comment on epic PROJ-100:
  Planning Gate: PASS
  Wiki PRD: https://github.com/.../PRD
  Wiki Architecture: https://github.com/.../Architecture
  Stories ready for design: PROJ-101, PROJ-102, ...
```

## Rules

- **Jira is mandatory** — create epic and Must-have stories when missing; do not run planning without Jira
- **Do not create wiki story pages** — keep story details in Jira; wiki gets PRD, Architecture, Designs, and agent reports only
- Do not create stories for out-of-scope (non-goal) items in PRD
- Do not duplicate stories — check epic children before creating
- Do not write technical design — hand off to Design Agent
- Do not transition to Ready for Dev
- Follow [jira-integration.md](../jira-integration.md) for all Jira operations
- Read `jira.project_key` from [project-config.yml](../../project-config.yml) or `JIRA_PROJECT_KEY`
- Publish all documents to GitHub Wiki per [wiki-integration.md](../wiki-integration.md)
- Jira comments must include wiki URLs — never repo-only paths
- On FAIL, comment on epic with gaps; do not transition stories
- Optional repo mirror per [report-persistence.md](../report-persistence.md)

## Handoff

On PASS → invoke **Design Agent** with PRD path, architecture path, and Jira story keys.
