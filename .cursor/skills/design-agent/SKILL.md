---
name: design-agent
description: >-
  Produces technical design from PRD, architecture doc, and Jira user stories.
  Creates traceability matrix and design doc. Updates Jira on completion. Use
  when planning gate passes and user asks for technical design.
disable-model-invocation: true
---

# Design Agent

Transform planning artifacts into an implementation-ready technical design document.

## Prerequisites

One of the following must be true:

1. **Planning PASS report on wiki** — verify per [report-persistence.md](../report-persistence.md) → *Verify prior gate reports*:
   - Read latest `planning-agent-*.md` from wiki `.../Agent-Reports/` (or Jira epic comment `Wiki Report:` URL)
   - Frontmatter `status: PASS` required
2. **Audited skip** — user provides `SKIP_PLANNING_GATE` and **approver name/email** in the prompt (record in design report header)

Silent skip is not allowed when `project-config.yml` → `pipeline.mode: strict`.

- PRD, architecture doc, and Jira story keys provided (from Planning Agent)
- Wiki epic folder exists (from Planning Agent) — read PRD/Architecture from wiki or user input

## Inputs

| Input | Required |
|-------|----------|
| PRD | Yes — wiki path or content |
| Architecture document | Yes — wiki path or content |
| Jira story keys | Yes — e.g. `PROJ-101`, `PROJ-102` |
| Project config | [project-config.yml](../../project-config.yml) |
| Existing Cursor rules | Read `.cursor/rules/` for project conventions |

## Workflow

1. **Fetch Jira stories**
   - Follow [jira-integration.md](../jira-integration.md)
   - Read summary, description, AC, parent epic, blocked-by, DoD per story

2. **Read planning artifacts**
   - PRD: goals, FRs, NFRs, acceptance criteria
   - Architecture: components, stack, integrations, constraints

3. **Produce technical design** covering:
   - Domain model (entities, enums)
   - API contracts (endpoints, request/response, errors)
   - Service/component breakdown
   - State machines and algorithms
   - Configuration
   - Concurrency approach
   - Edge cases
   - Testing strategy
   - Package structure

4. **Build traceability matrix**

| Jira Key | Story | FR | Design section | API | Component |
|----------|-------|----|----------------|-----|-----------|
| PROJ-101 | US-1 | FR-5 | Dispatch | POST /api/... | XxxService |

5. **Write design doc** — publish to GitHub Wiki at `Projects/{slug}/Epics/{EPIC-KEY}/Technical-Design` (not repo `docs/` unless mirror enabled)

6. **Produce design report** (template below)

7. **Publish report to wiki** → `.../Agent-Reports/design-agent-{date}.md`

8. **Update Jira**
   - Comment on each story with wiki URL to Technical-Design + design report
   - Comment on epic with design wiki URL and traceability summary
   - **Do not** transition stories to Ready for Dev — only **Review Agent** may do that after design approval

## Design doc structure

```markdown
# [Feature] — Technical Design (v1)

## PRD / Architecture refs
## Goals (from PRD)
## Architecture alignment
## Domain model
## API design
## Component design
## State machines / algorithms
## Configuration
## Edge cases
## Testing strategy
## Traceability matrix
## Implementation phases
```

## Report Template

```markdown
# Design Report

## Summary
COMPLETE — technical design ready for review

## Design doc
- **Wiki**: https://github.com/org/repo/wiki/Projects/.../Epics/PROJ-100/Technical-Design
- **Sections**: N

## Traceability
| Jira | Design section | Covered |
|------|----------------|---------|
| PROJ-101 | Dispatch | ✅ |

## Open items
- [Ambiguities flagged for discussion]
```

## Jira update

```
Comment on PROJ-101:
  Design Agent: COMPLETE
  Wiki Design: https://github.com/.../Technical-Design
  Wiki Report: https://github.com/.../Agent-Reports/design-agent-20260716
  Components: XxxService, YyyEngine
  APIs: POST /api/v1/...

Comment on epic:
  Wiki Technical Design: https://github.com/.../Technical-Design
  Traceability: 8/8 stories mapped
  Next: Design review → Coding Agent
```

## Rules

- Align with `.cursor/rules/` (e.g. Spring Boot conventions)
- Flag ambiguities — do not guess silently
- Do not write production code — hand off to Coding Agent after design review
- Follow [jira-integration.md](../jira-integration.md)
- **Never** transition stories to Ready for Dev — hand off to Review Agent for design approval and transition
- Publish design and reports to GitHub Wiki per [wiki-integration.md](../wiki-integration.md)
- Jira comments must include wiki URLs

## Handoff

1. **Review Agent** — review design doc
2. On approval → **Coding Agent** with wiki Technical-Design URL + Jira story keys
