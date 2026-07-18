---
name: regression-test-agent
description: >-
  Runs regression test suites via CI pipeline when a CI link is provided; updates
  Jira with results. Skips when no link. Use when the user provides a CI
  pipeline URL or asks to run regression tests.
disable-model-invocation: true
---

# Regression Test Agent

Run pre-existing regression test suites through the CI pipeline. Behavior depends on [project-config.yml](../../project-config.yml).

## Activation

| Condition | Action |
|-----------|--------|
| CI pipeline link provided | Fetch status, monitor run, produce report |
| No CI link + `auto_discover_ci: true` | Try `gh workflow list`, read `.github/workflows/`, trigger `gates.regression.ci_workflow` |
| No CI link + `mode: strict` | Report **NOT RUN — blocked for strict mode**; PR Agent will reject |
| No CI link + `mode: dev` | Skip execution; report status as `NOT RUN — dev mode skip` |

## Workflow

1. **Check for CI link or auto-discovery**
   - Read [project-config.yml](../../project-config.yml):
     - `pipeline.gates.regression` — `ci_workflow`, `ci_job`, `auto_discover_ci`
     - `build.regression_command` — command CI runs (e.g. `./mvnw verify -Pregression`)
     - `build.regression` — `profile`, `groups`, `includes` (suite metadata for report)
   - Look for a CI pipeline URL in the user message or session context
   - If absent and `auto_discover_ci: true`:
     - `gh workflow list` and match `ci_workflow` name (default: `ci`)
     - Or inspect `.github/workflows/*.yml` for the primary CI workflow
   - Supported sources: GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure DevOps
   - If still absent → output skip/blocked report per mode (see Activation table)

2. **Trigger or monitor**
   - **Existing run link provided** → monitor that run (go to step 3)
   - **No link but user asks to run regression** → trigger a new pipeline, then monitor:
     - GitHub Actions: `gh workflow run <workflow> --ref <branch>` then `gh run list --workflow=<workflow> --limit 1`
     - GitLab CI: trigger via GitLab API or CI UI; capture the returned pipeline URL
     - Jenkins: trigger via Jenkins API or parameterized build URL
     - Return the new run URL and continue monitoring

3. **Parse CI link**
   - Use `gh` for GitHub Actions runs: `gh run view <run-id> --log`
   - For other CI systems, fetch the URL and extract run status, failed jobs, and logs

4. **Monitor pipeline**
   - If the run is in progress, poll until complete or timeout (max 30 minutes)
   - Capture: overall status, per-job/suite results, failure logs, duration
   - **On timeout**: report status as `PARTIAL — timed out after 30 minutes`, include last known job states, and ask the user whether to continue monitoring or accept partial results

5. **Triage failures**
   - Categorize: code regression, environment/infra, flaky, unrelated to current changes
   - Map failures to test suites and source files when possible
   - Include in report: `build.regression_command`, profile, groups from config

6. **Produce report** using the template below

7. **Persist report** — publish to wiki `.../Agent-Reports/regression-test-agent-{date}.md`

8. **Update Jira** (when Jira story keys provided)
   - Follow [jira-integration.md](../jira-integration.md)
   - Comment with CI link, PASS/FAIL/PARTIAL/NOT RUN, failed suites
   - On FAIL: comment "Escalate to Bugfix Agent with Jira bug ticket"
   - When status **PASS** and `jira.transitions.story_to_regression_pass` is set → transition; otherwise comment only

## CI Link Examples

```
# GitHub Actions
https://github.com/org/repo/actions/runs/12345678

# GitLab CI
https://gitlab.com/org/repo/-/pipelines/12345

# Jenkins
https://jenkins.example.com/job/project/42/
```

## GitHub Actions Commands

```bash
# Trigger a new workflow run
gh workflow run <workflow-name> --ref <branch> --repo org/repo

# Get the latest run URL after triggering
gh run list --workflow=<workflow-name> --repo org/repo --limit 1

# View run summary
gh run view <run-id> --repo org/repo

# View failed jobs
gh run view <run-id> --repo org/repo --json jobs --jq '.jobs[] | select(.conclusion != "success")'

# Fetch logs for a failed job
gh run view <run-id> --repo org/repo --log-failed
```

## Report Template

```markdown
# Regression Test Report

## Summary
- **Status**: PASS | FAIL | PARTIAL | NOT RUN
- **CI Link**: [url or "not provided"]
- **Pipeline**: [name/id]
- **Regression command**: [from project-config.yml → build.regression_command]
- **Suite profile / groups**: [build.regression.profile / build.regression.groups]
- **Duration**: Xs
- **Suites**: N total | N passed | N failed

## Suite Results
| Suite / Job | Status | Duration | Notes |
|-------------|--------|----------|-------|
| ... | ✅/❌ | ... | ... |

## Failures
| Suite | Test / Step | Error | Category |
|-------|-------------|-------|----------|
| ... | ... | ... | regression / flaky / infra |

## Logs (failed suites)
```
[relevant failure excerpts]
```

## Recommendations
- [ ] Block release — critical regression
- [ ] Investigate flaky test
- [ ] Escalate to Bugfix Agent with Jira link
```

## Skip Report (no CI link)

```markdown
# Regression Test Report

## Summary
- **Status**: NOT RUN
- **Reason**: No CI pipeline link was provided. Regression testing skipped.

To run regression tests, provide a CI pipeline URL in your prompt.
```

## Rules

- Never run regression suites locally unless the user explicitly asks — use the CI pipeline
- Do not fabricate CI results; only report what the pipeline returns
- If the CI link is invalid or inaccessible, report the error clearly
- Hand off the report to the Review Agent; escalate blocking failures to the Bugfix Agent with Jira links if provided
- Update Jira when story keys provided — see [jira-integration.md](../jira-integration.md)
- Persist report per [report-persistence.md](../report-persistence.md)
