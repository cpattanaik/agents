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

## Inputs (required)

| Input | Source |
|-------|--------|
| PRD | Repo `docs/` path or user-provided content |
| Architecture document | Repo `docs/` path or user-provided content |
| Jira epic link | Optional — if missing, agent creates epic from PRD |

If PRD or architecture is missing, stop and ask the user to provide them.

## Workflow

### A. Jira setup (create if missing)

1. **Check for existing Jira epic**
   - If user provides epic key/URL → fetch and use it
   - If no epic provided → **create epic** from PRD title and summary

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

### B. Validate and cross-check

5. **Fetch all Jira issues** under epic
   - Extract: summary, description, AC, parent, blocked-by, assignee, DoD

6. **Validate PRD** — goals, stories, FRs, ACs present

7. **Validate architecture document** — components, stack, NFRs

8. **Cross-check PRD ↔ Jira stories**
   - Every Must-have PRD story has a Jira story
   - Every Jira story maps to a PRD user story or FR
   - Blocked-by dependencies documented

9. **Produce planning gate report**

10. **Update Jira** — on PASS:
    - Comment on epic with planning report + list of created stories
    - Comment on each story with PRD/FR mapping
    - Transition stories to **Refined** (if workflow supports it)

## Story creation template (Jira description)

```markdown
## User story
As a [persona], I [action] so that [benefit].

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
| PROJ-101 | Hall call UP | US-1 | Created |

## Handoff
- [ ] Ready for Design Agent: PRD + Architecture + Jira stories
```

## Jira update (on PASS)

```
Comment on epic PROJ-100:
  Planning Gate: PASS
  PRD: docs/...
  Architecture: docs/...
  Stories ready for design: PROJ-101, PROJ-102, ...
```

## Rules

- **Create** epic and Must-have stories when missing — do not require pre-existing Jira issues
- Do not create stories for out-of-scope (non-goal) items in PRD
- Do not duplicate stories — check epic children before creating
- Do not write technical design — hand off to Design Agent
- Do not transition to Ready for Dev
- Follow [jira-integration.md](../jira-integration.md) for all Jira operations
- On FAIL, comment on epic with gaps; do not transition stories

## Handoff

On PASS → invoke **Design Agent** with PRD path, architecture path, and Jira story keys.
