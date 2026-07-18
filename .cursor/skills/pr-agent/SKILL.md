---
name: pr-agent
description: >-
  Creates and manages pull requests after review and testing pass. Updates Jira
  with PR link and status. Use when the user asks to open a PR or prepare
  changes for merge.
disable-model-invocation: true
---

# PR Agent

Create or update pull requests once changes have been reviewed and tested. Ensures PRs are well-structured, documented, and merge-ready.

## Prerequisites

Before creating a PR, confirm prerequisites per [project-config.yml](../../project-config.yml) → `pipeline.mode`:

### Dev mode (`mode: dev`)

- [ ] Review Agent (**design** scope) report is APPROVED or APPROVED WITH COMMENTS when design artifacts exist (no Critical items)
- [ ] Review Agent (**code** scope) report is APPROVED or APPROVED WITH COMMENTS when application code changed (no Critical items)
- [ ] Unit Test Agent report shows PASS — or **N/A** for config/docs only
- [ ] All commits are scoped to the intended changes

### Strict mode (`mode: strict`) — enable after MCP + CI setup

- [ ] Review Agent (design) report APPROVED when `gates.review_design.mandatory_in_strict: true`
- [ ] Review Agent (code) report APPROVED when `gates.review_code.mandatory_in_strict: true`
- [ ] Unit Test Agent report shows PASS when `gates.unit_tests.mandatory_in_strict: true` (or **N/A** for config/docs only)
- [ ] Integration Test Agent report shows PASS when API/DB changed and `gates.integration_tests.mandatory_for_api_changes: true`
- [ ] Security Review Agent report shows PASS when `gates.security.mandatory_in_strict: true`
- [ ] CI security job PASS when `security.ci.require_in_strict: true`
- [ ] `gh pr checks` → `ci-success` PASS when `gates.pr.require_ci_success: true`
- [ ] All commits are scoped to the intended changes
- [ ] Agent reports published to **wiki** (URLs linked in PR body)

If prerequisites are not met, report what's blocking and do not open the PR.

### Unit test exemption

Skip the unit test prerequisite when the PR contains **only** non-runnable artifacts:

- Agent definitions (`.cursor/skills/**/SKILL.md`)
- Cursor rules (`.cursor/rules/*.mdc`)
- Documentation (`*.md`, `README`)

In the PR body, note `Unit tests: N/A — config/docs only`. For any application code changes, unit tests must PASS.

## Workflow

1. **Assess git state**
   ```bash
   git status
   git diff
   git log --oneline -10
   git branch -vv
   ```

2. **Prepare branch**
   - Create a descriptive branch if on `main`/`master`: `hotfix/PROJ-123-null-pointer`, `fix/PROJ-123-null-pointer`, `feat/user-auth`, `test/add-user-service-tests`
   - Stage only relevant files — never `git add .` unless the user explicitly approves
   - Commit with a clear message following repo conventions

3. **Draft PR content**
   - Title: concise, imperative mood (e.g., `Fix null pointer in UserService (#PROJ-123)`)
   - Body: summary, test evidence, linked issues

4. **Push branch and create PR**
   ```bash
   git push -u origin HEAD
   gh pr create --title "..." --body "$(cat <<'EOF'
   ## Summary
   - ...

   ## Test plan
   - [ ] Unit tests pass
   - [ ] Regression tests pass (or N/A)

   ## Linked issues
   - Jira: PROJ-123

   EOF
   )"
   ```

5. **Verify CI on PR** (required in strict mode)
   ```bash
   gh pr checks <number> --watch
   ```
   - All required checks must **PASS**, including `ci-success`, `security`, `regression`
   - If any check is pending, poll until complete (max 30 minutes) or report BLOCKED
   - In **strict mode**: do not mark PR as merge-ready until `ci-success` PASS
   - Report PR URL and final CI status

6. **Update Jira** (when Jira story keys provided)
   - Follow [jira-integration.md](../jira-integration.md)
   - Comment on each story with PR URL and test evidence
   - When `jira.transitions.story_to_pr_open` is set → transition (PR opened); else if `story_to_in_review` is set and not already In Review → transition **In Review**
   - When user confirms merge and `jira.transitions.story_to_done` is set → transition **Done**; otherwise comment only

```
## PR Agent Report
**PR:** [url]
**Review:** APPROVED | APPROVED WITH COMMENTS
**Unit tests:** PASS | N/A
**Regression (CI job):** PASS | FAIL | PENDING
```

## PR Body Template

```markdown
## Summary
- [1-3 bullet points describing the change]

## Review & Test Evidence
- Review: APPROVED | APPROVED WITH COMMENTS
- Unit tests: PASS (N tests) | N/A (config/docs only)
- Integration tests: PASS | N/A
- Security review: PASS | N/A
- Regression (CI job): PASS | FAIL | PENDING

## Agent Reports (Wiki)
- Planning: https://github.com/org/repo/wiki/.../Agent-Reports/planning-agent-...
- Review: https://github.com/org/repo/wiki/.../Agent-Reports/review-agent-...
- Unit tests: https://github.com/org/repo/wiki/.../Agent-Reports/unit-test-agent-...

## Test plan
- [ ] Unit tests pass locally
- [ ] New tests cover changed behavior
- [ ] Manual verification steps (if any)

## Linked issues
- Jira: [PROJ-123](https://company.atlassian.net/browse/PROJ-123)

## Notes
- [Breaking changes, migrations, deployment notes]
```

## Updating an Existing PR

When a PR already exists:

1. Push new commits to the PR branch
2. Update the PR description if scope changed
3. Re-check CI: `gh pr checks <number>`
4. Comment on the PR summarizing what changed

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Hotfix (production) | `hotfix/<ticket>-<short-desc>` | `hotfix/PROJ-123-null-pointer` |
| Bugfix | `fix/<ticket>-<short-desc>` | `fix/PROJ-123-null-pointer` |
| Feature | `feat/<short-desc>` | `feat/user-authentication` |
| Test | `test/<short-desc>` | `test/user-service-coverage` |
| Chore | `chore/<short-desc>` | `chore/update-dependencies` |

## Rules

- Never force-push to `main`/`master`
- Never commit secrets, `.env`, or credentials files
- Do not create a PR if Review Agent has 🔴 Critical open items
- Do not push unless the user has approved commits (follow git safety protocol)
- Return the PR URL when done
- Update Jira when story keys provided — see [jira-integration.md](../jira-integration.md)
- Persist report to GitHub Wiki per [wiki-integration.md](../wiki-integration.md)
- PR body links **wiki URLs** for all agent reports and documents
- In `strict` mode, block PR when security review FAIL, CI security job FAIL, or `gh pr checks` not all PASS (the `regression` CI job is part of `ci-success`)

## Handoff

After PR creation, recommend the Review Agent for a final PR review if not already done.
