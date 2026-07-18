---
name: design-agent
description: >-
  Produces technical design from PRD, architecture doc, and Jira user stories.
  Creates traceability matrix and per-story design pages. Updates Jira on
  completion. Use when planning gate passes and user asks for technical design.
disable-model-invocation: true
---

# Design Agent

Transform planning artifacts into implementation-ready technical design documents — **one wiki page per Jira story** under `Designs/`.

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

3. **For each story**, produce technical design covering:
   - Domain model (entities, enums) relevant to the story
   - API contracts (endpoints, request/response, errors)
   - Service/component breakdown
   - State machines and algorithms
   - Configuration
   - Concurrency approach
   - Edge cases
   - Testing strategy
   - Package structure

4. **Build traceability matrix** (across all stories)

| Jira Key | Story | FR | Design section | API | Component |
|----------|-------|----|----------------|-----|-----------|
| PROJ-101 | US-1 | FR-5 | Dispatch | POST /api/... | XxxService |

5. **Publish per-story design docs** — one wiki page per story:
   - Path: `Projects/{slug}/Epics/{EPIC-KEY}/Designs/{STORY-KEY}` (from `wiki.pages.designs`)
   - Example: `Projects/my-project/Epics/PROJ-100/Designs/PROJ-101`
   - Do not use a single monolithic epic-level design page

6. **Produce design report** (template below)

7. **Publish report to wiki** → `.../Agent-Reports/design-agent-{date}.md`

8. **Update Jira**
   - Comment on **each story** with that story's `Designs/{STORY-KEY}` wiki URL + design report URL
   - Comment on epic with index of all design URLs and traceability summary
   - **Do not** transition stories to Ready for Dev — only **Review Agent** may do that after design approval

## Per-story design doc structure

```markdown
# [Story summary] — Technical Design (v1)

**Jira:** PROJ-101

## PRD / Architecture refs
## Goals (from PRD, scoped to this story)
## Architecture alignment
## Domain model
## API design
## Component design
## State machines / algorithms
## Configuration
## Edge cases
## Testing strategy
## Traceability (this story)
## Implementation notes
```

## Report Template

```markdown
# Design Report

## Summary
COMPLETE — technical designs ready for review

## Design docs
| Jira | Wiki |
|------|------|
| PROJ-101 | https://github.com/org/repo/wiki/Projects/.../Epics/PROJ-100/Designs/PROJ-101 |
| PROJ-102 | https://github.com/org/repo/wiki/Projects/.../Epics/PROJ-100/Designs/PROJ-102 |

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
  Wiki Design: https://github.com/.../Designs/PROJ-101
  Wiki Report: https://github.com/.../Agent-Reports/design-agent-20260716
  Components: XxxService, YyyEngine
  APIs: POST /api/v1/...

Comment on epic:
  Wiki Designs:
  - PROJ-101: https://github.com/.../Designs/PROJ-101
  - PROJ-102: https://github.com/.../Designs/PROJ-102
  Traceability: 8/8 stories mapped
  Next: Design review → Coding Agent
```

## Rules

- Align with `.cursor/rules/` (e.g. Spring Boot conventions)
- Flag ambiguities — do not guess silently
- Do not write production code — hand off to Coding Agent after design review
- Follow [jira-integration.md](../jira-integration.md)
- **Never** transition stories to Ready for Dev — hand off to Review Agent for design approval and transition
- Publish designs and reports to GitHub Wiki per [wiki-integration.md](../wiki-integration.md)
- Jira comments must include wiki URLs

## Handoff

1. **Review Agent** — review all `Designs/{STORY-KEY}` pages for stories in scope
2. On approval → **Coding Agent** with per-story design wiki URLs + Jira story keys
