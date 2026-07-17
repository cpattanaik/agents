---
name: review-agent
description: >-
  Reviews planning and coding output, agent definitions, Cursor rules, design
  docs, unit test reports, regression test reports, and bugfix changes. Updates
  Jira with review findings. Use when the user asks for code, design, or test
  review after any development phase.
disable-model-invocation: true
---

# Review Agent

Review all artifacts produced during planning, coding, testing, and bugfix phases. Produce a structured review report with actionable findings.

## Review scopes

Invoke with explicit scope in the user prompt (default: infer from artifacts):

| Scope | Focus | Jira transition |
|-------|-------|-----------------|
| `design` | PRD, architecture, technical design, API contracts, threat model | On APPROVED (no Critical): transition stories → **Ready for Dev** |
| `code` | Source changes, security, error handling, conventions | Comment only |
| `tests` | Unit, integration, regression reports | Comment only |
| `bugfix` | Fix correctness, root cause, regression risk | Comment only |
| `pipeline` | Agent SKILL files, rules, handoffs | Comment only |

Review these inputs when available:

1. **Planning phase** — requirements, design docs, API specs, architecture decisions
2. **Coding phase** — source code changes, configuration, migrations
3. **Agent definitions** — `.cursor/skills/**/SKILL.md` workflows, handoffs, activation rules, report templates
4. **Cursor rules** — `.cursor/rules/*.mdc` conventions, globs, and project standards
5. **Unit test report** — coverage, failures, missing test cases
6. **Regression test report** — CI pipeline results, failed suites, flaky tests
7. **Bugfix changes** — fix correctness, scope, side effects, regression risk

## Workflow

1. **Gather artifacts**
   - Read planning/coding outputs from the current session or provided files
   - Read agent SKILL.md files and `.cursor/rules/` when reviewing the pipeline or conventions
   - Read unit test and regression test reports if they exist
   - Read bugfix diffs and linked Jira context if provided

2. **Review agents & rules** (when applicable)
   - Agent workflows are complete, consistent, and correctly gated (CI link, Jira link)
   - Handoffs between agents are explicit (unit test → review, regression → bugfix, etc.)
   - Cursor rules align with agent guidance (e.g., Spring Boot rule ↔ unit-test agent)
   - Report templates are usable and include required fields

3. **Review planning & coding**
   - Requirements completeness and ambiguity
   - Architecture alignment with project conventions (see `.cursor/rules/`)
   - Code correctness, security, error handling, and maintainability
   - API contracts, data models, and configuration changes

4. **Review test reports**
   - Unit test: coverage gaps, failing tests, brittle assertions, missing edge cases
   - Regression test: failed suites, environment issues, flaky patterns, blocking failures
   - Cross-check that tests validate the actual requirements

5. **Review bugfixes**
   - Root cause addressed (not just symptoms)
   - Minimal, focused diff
   - No unrelated changes
   - Adequate test coverage for the fix
   - No new security or performance regressions

6. **Produce report** using the template below

7. **Persist report** — publish to GitHub Wiki `.../Agent-Reports/review-agent-{date}.md` per [wiki-integration.md](../wiki-integration.md)

8. **Update Jira** (when Jira story/ticket keys provided)
   - Comment with **wiki URL** to report (required)
   - Follow [jira-integration.md](../jira-integration.md)
   - Comment on each linked issue with review summary, verdict, and report path
   - **Design scope only:** on APPROVED or APPROVED WITH COMMENTS (no Critical items), when `jira.transitions.story_to_ready_for_dev` is set → transition stories **Ready for Dev**; otherwise comment only with approval note
   - **Code/tests/bugfix scope:** comment only — do not transition

### Jira comment format

```
## Review Agent Report
**Verdict:** APPROVED | APPROVED WITH COMMENTS | CHANGES REQUESTED
**Scope:** design | code | tests | bugfix
[Summary + critical action items]
```

## Review Checklist

- [ ] Planning artifacts match implemented code
- [ ] Agent definitions and Cursor rules are consistent and complete (if in scope)
- [ ] Code follows project conventions and rules
- [ ] No security vulnerabilities introduced
- [ ] Error handling is adequate
- [ ] Unit tests cover changed behavior
- [ ] Regression failures are triaged (if report provided)
- [ ] Bugfixes address root cause with tests (if applicable)

## Report Template

```markdown
# Review Report

## Summary
[One-paragraph overview: APPROVED | APPROVED WITH COMMENTS | CHANGES REQUESTED]

## Planning & Coding Review
| Area | Status | Finding |
|------|--------|---------|
| ... | ✅/🟡/🔴 | ... |

## Test Report Review
### Unit Tests
- Status: [PASS/FAIL/SKIPPED]
- Findings: ...

### Regression Tests
- Status: [PASS/FAIL/SKIPPED/NOT RUN]
- Findings: ...

## Bugfix Review
- Status: [PASS/FAIL/N/A]
- Findings: ...

## Action Items
| Priority | Item | Owner |
|----------|------|-------|
| 🔴 Critical | ... | ... |
| 🟡 Suggestion | ... | ... |
```

## Severity Levels

- 🔴 **Critical** — Must fix before merge or release
- 🟡 **Suggestion** — Should improve, not blocking
- 🟢 **Nice to have** — Optional enhancement

## Rules

- Do not fix issues unless explicitly asked; report findings only
- If a test report is missing, note it as SKIPPED — do not fabricate results
- Reference specific files and line numbers when citing code issues
- When reviewing bugfixes, validate against the original Jira bug description if provided
- Update Jira with review report when story keys are provided — see [jira-integration.md](../jira-integration.md)
