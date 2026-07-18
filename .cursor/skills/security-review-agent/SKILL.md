---
name: security-review-agent
description: >-
  Runs local and CI security checks (dependency CVEs, secrets scan, SAST) from
  project-config.yml and produces a security review report. Mandatory before PR
  in strict mode. Use after code review and before regression tests.
disable-model-invocation: true
---

# Security Review Agent

Automated security gate for corporate compliance (SOC2, AppSec). Runs **local tools** from [project-config.yml](../../project-config.yml) → `security.local`, optionally verifies **CI security job** from `security.ci`. Blocks PR in strict mode on Critical/High findings.

## Prerequisites

- Code changes complete
- When `pipeline.gates.security.require_code_review_approved: true` — verify latest `review-agent-*.md` scope=code is APPROVED
- Jira story keys provided
- [project-config.yml](../../project-config.yml) present with `security` section

## Configuration

Read [project-config.yml](../../project-config.yml):

| Path | Use |
|------|-----|
| `pipeline.mode` | `strict` vs `dev` |
| `pipeline.gates.security.mandatory_in_strict` | Block PR on FAIL when true |
| `github.default_branch` | Base branch for `changed_files` scope |
| `security.block_on` | Severities that fail the gate (default: `critical`, `high`) |
| `security.local.enabled` | Run local commands |
| `security.local.wrapper_script` | Optional single script (runs instead of `commands` list) |
| `security.local.commands[]` | Named checks: `command`, `required`, `scope` |
| `security.ci.enabled` | Monitor CI security job |
| `security.ci.require_in_strict` | FAIL if CI security not PASS in strict mode |
| `security.ci.workflow` | GitHub Actions workflow name (e.g. `ci`) |
| `security.ci.job` | Optional job name/id to filter (e.g. `security`) |

## Workflow

1. **Load configuration** — read paths above from `project-config.yml`

2. **Identify scope**
   - Changed files: `git diff --name-only origin/{default_branch}...HEAD` (or `main...HEAD`)
   - Flag API endpoints, auth code, crypto, PII handling, external inputs

3. **Run local security checks**

   **If `security.local.wrapper_script` is set:**
   - Run the script from application repo root
   - Non-zero exit → FAIL if any finding is Critical/High; otherwise parse output

   **Else run each entry in `security.local.commands`:**

   | `scope` | Agent behavior |
   |---------|----------------|
   | `repo` | Run `command` as-is |
   | `changed_files` | Append changed file paths to `command` (skip check if no changed files — report SKIPPED) |

   **Per command:**
   - Run in shell from application repo root
   - Exit 0 → PASS for that check
   - Exit non-zero → parse output for severity; map to Critical/High/Medium
   - Command not found (exit 127) → SKIPPED if `required: false`; FAIL if `required: true`
   - Do not fabricate results

4. **Run CI security check** (when `security.ci.enabled: true`)

   Mirror [regression-test-agent](../regression-test-agent/SKILL.md) discovery:

   | Condition | Action |
   |-----------|--------|
   | CI run URL provided by user | Monitor that run |
   | No URL + workflow configured | `gh run list --workflow={security.ci.workflow} --limit 5`; pick latest on current branch |
   | No run found + `require_in_strict: true` + `pipeline.mode: strict` | FAIL — report `CI security NOT RUN` |
   | No run found + dev mode | SKIPPED |

   When `security.ci.job` is set, filter jobs in the run to that job name.

   Capture: status, job logs, failure reason, run URL.

5. **OWASP API checklist** (when REST/API files changed)
   - Input validation on all POST/PUT bodies
   - No secrets in code or config committed
   - Error responses do not leak stack traces in prod
   - Authz on operator/maintenance endpoints (or documented v1 exemption)

6. **Produce report** using template below

7. **Verdict**
   - Any **Critical/High** in local or CI checks (per `security.block_on`) → **FAIL**
   - Required check SKIPPED in strict mode → **FAIL**
   - All required checks PASS, no blockable findings → **PASS**

8. **Persist report** — publish to wiki `.../Agent-Reports/security-review-agent-{date}.md`

9. **Update Jira** (when Jira story keys provided)
   - Follow [jira-integration.md](../jira-integration.md)
   - Comment with wiki report URL
   - When verdict **PASS** and `jira.transitions.story_to_security_pass` is set → transition; otherwise comment only

## Report template

```markdown
# Security Review Report

## Summary
PASS | FAIL — Critical: N, High: N, Medium: N

## Local checks
| Check | Tool | Command | Status | Findings |
|-------|------|---------|--------|----------|

## CI security
| Workflow | Job | Run URL | Status | Findings |
|----------|-----|---------|--------|----------|

## Critical / High findings
| ID | Source | File | Issue | Remediation |

## OWASP API review
- Status: PASS | N/A | FINDINGS
- Notes: ...

## Verdict
PASS | CHANGES REQUIRED
```

## Default tools (when configuring project-config.yml)

| Check | Tool | Example command |
|-------|------|-----------------|
| Secrets | gitleaks | `gitleaks detect --source . --verbose` |
| SAST | semgrep | `semgrep --config auto --error` |
| Dependencies | OWASP | `./mvnw org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7` |

Install locally: `brew install gitleaks semgrep` (macOS). Maven plugin goes in app `pom.xml`.

## Rules

- Do not fabricate scan results — run configured commands or report SKIPPED with reason
- Critical/High findings → FAIL in strict mode; PR Agent blocks
- Local fast checks (secrets, semgrep) + CI full scan (when `security.ci.require_in_strict: true`)
- Hand off to Regression Test Agent on PASS
- Follow [jira-integration.md](../jira-integration.md)

## Handoff

PASS → **Regression Test Agent** → **PR Agent**
