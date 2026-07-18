# Project Configuration

All agent pipeline settings live in a **single file**: [`project-config.yml`](../project-config.yml). Edit it in place — no separate template copy.

## Editable fields by scope

| Scope | When to edit | Fields |
|-------|--------------|--------|
| **Project** | Once per application repository | `project.name`, `project.slug`, `github.*`, `jira.project_key`, `jira.epic_name_field`, `jira.epic_link_field`, `jira.custom_fields`, `jira.transitions`, `wiki.pages.*`, `pipeline.*`, `build.*`, `security.*` |
| **Epic / feature** | Each new epic or feature run | `jira.epic_key` — `null` until `@planning-agent` creates the epic; then set e.g. `PROJ-100`. Drives wiki path `Projects/{slug}/Epics/{epic_key}/...` |
| **Not in config** | Per story in Jira + wiki | User story, AC, status → **Jira**. Per-story design → wiki `Designs/{STORY-KEY}`. Agent reports → wiki `Agent-Reports/{agent}-{date}` |

### Project-level (set once)

```yaml
project:
  name: My Project          # display name
  slug: my-project          # wiki path segment — lowercase kebab-case

github:
  owner: myorg              # GitHub org or user
  repo: my-repo             # repo with wiki enabled
  default_branch: main

jira:
  project_key: PROJ         # Jira project for all epics in this repo
  epic_name_field: customfield_10011
  transitions: { ... }      # workflow IDs — same project-wide

build: { ... }              # Maven commands, Java version
security: { ... }           # gitleaks, semgrep, CI security job
pipeline:
  mode: dev                   # switch to strict when gates are wired
```

### Epic / feature-level (per run)

```yaml
jira:
  epic_key: PROJ-100        # update when starting a new epic/feature
```

After `@planning-agent` creates epic `PROJ-100`, set `epic_key` (or note it from the planning report). All wiki documents for that feature live under:

```
Projects/{project.slug}/Epics/{jira.epic_key}/
├── PRD
├── Architecture
├── Designs/{STORY-KEY}
└── Agent-Reports/
```

Starting a **new epic** (e.g. `PROJ-200`): update `jira.epic_key` and run `@planning-agent` again. Stories for that epic are created in Jira — not listed in this file.

## Quick start

Edit [`project-config.yml`](../project-config.yml) for your repository. Copy the pipeline bundle unchanged — agents resolve paths from this file.

## Copying to a new project

Copy the full bundle into your **application repository**:

```bash
# From the agents template repo root:
./.scripts/copy-pipeline-bundle.sh /path/to/your-app
```

See [.scripts/copy-pipeline-bundle.sh](../.scripts/copy-pipeline-bundle.sh) for the exact file list.

Then:

1. Edit `$APP/project-config.yml` — **project** fields once (`project`, `github`, `jira.project_key`, `build`, `security`); set **`jira.epic_key`** per epic/feature
2. Configure MCP — see [MCP-SETUP.md](MCP-SETUP.md)
3. Run `@planning-agent` in **`pipeline.mode: dev`** (default) — it sets `jira.epic_key` after creating the epic
4. After MCP, CI, pom profiles, and Jira transitions work → set `pipeline.mode: strict`

Gate reports are verified from **GitHub Wiki** (see [report-persistence.md](../.cursor/skills/report-persistence.md)), not `.docs/agent-reports/` unless `mirror_to_repo: true`.

## Sections

| Section | Purpose | Key fields |
|---------|---------|------------|
| `project` | Identity | `name`, `slug` |
| `github` | Repo + wiki | `owner`, `repo`, `default_branch` |
| `jira` | Epics, stories, workflow | `project_key`, `epic_key`, `transitions` |
| `wiki` | Document page names | `pages.prd`, `pages.designs`, `pages.agent_reports`, … |
| `pipeline` | Gates and reporting | `mode`, `gates.*`, `reporting.*` |
| `build` | Maven/Java commands (CI is Maven-only) | `tool`, `java_version`, `compile_command`, `test_command`, `regression.*` |
| `security` | Local + CI security scans | `local.commands[]`, `ci.workflow`, `ci.job` |

## Wiki path resolution

Agents derive wiki paths from config — do not hardcode:

```
Projects/{project.slug}/Epics/{jira.epic_key}/{wiki.pages.<page>}
Projects/{project.slug}/Epics/{jira.epic_key}/{wiki.pages.designs}/{STORY-KEY}   # per-story design
```

Example URL:

```
https://github.com/{github.owner}/{github.repo}/wiki/Projects/my-project/Epics/PROJ-100/PRD
```

## Environment variable fallbacks

| Config field | Env fallback |
|--------------|--------------|
| `jira.project_key` | `JIRA_PROJECT_KEY` |
| Jira auth | `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` |
| GitHub wiki | `GITHUB_TOKEN` |

## Per-epic runs

`jira.epic_key` starts as `null`. After `@planning-agent` creates the epic, update it (or let the agent write it back in a comment). Each epic gets its own wiki subtree under `Epics/{EPIC-KEY}/`.

## Jira transition IDs

Template defaults all transitions to `null` — agents **comment only** until you set IDs.

Discover IDs for your Jira project:

```bash
curl -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  "$ATLASSIAN_URL/rest/api/3/issue/PROJ-101/transitions"
```

Copy IDs into `jira.transitions` in `project-config.yml`. Map each key to your workflow (see [jira-integration.md](../.cursor/skills/jira-integration.md) → Transition map).

| Config key | Agent |
|------------|-------|
| `story_to_refined` | Planning |
| `story_to_ready_for_dev` | Review (design) |
| `story_to_in_progress` | Coding (start) |
| `story_to_in_review` | Coding (complete) |
| `story_to_code_review_approved` | Review (code) |
| `story_to_unit_test_pass` | Unit Test |
| `story_to_integration_test_pass` | Integration Test |
| `story_to_security_pass` | Security Review |
| `story_to_pr_open` | PR (opened) |
| `story_to_done` | PR (after merge) |
| `bug_to_in_progress` | Bugfix |

## Pipeline modes

| Mode | When to use |
|------|-------------|
| `dev` | **Default** — relaxed security gates; **Jira still required for `@planning-agent`** |
| `strict` | Full corporate gates after MCP, CI, pom profiles, and Jira transitions are configured |

```yaml
pipeline:
  mode: dev    # change to strict when integration checklist is complete
```

In `strict`, Planning Agent requires Jira + Wiki MCP; PR Agent requires `ci-success` (which includes the CI `regression` job) and CI security PASS.

## Planning gate (`pipeline.gates.planning`)

| Field | Default | Read by | Effect |
|-------|---------|---------|--------|
| `mandatory_in_strict` | `true` | Orchestrator | Planning PASS required before design in strict mode |
| `require_artifact_approval` | `false` | *(reserved)* | Human sign-off on PRD/architecture before design |

## Full gate map (`pipeline.gates.*`)

| Gate | Key fields | Transition (`jira.transitions`) |
|------|------------|----------------------------------|
| `planning` | `mandatory_in_strict` | `story_to_refined` |
| `design` | `require_planning_pass_report`, `allow_skip_with_approver` | — |
| `review_design` | `require_approved` | `story_to_ready_for_dev` |
| `coding` | `require_design_review_approved` | `story_to_in_progress`, `story_to_in_review` |
| `unit_tests` | `coverage_threshold_percent`, `enforce_threshold_in_strict` | `story_to_unit_test_pass` |
| `integration_tests` | `mandatory_for_api_changes` | `story_to_integration_test_pass` |
| `review_code` | `require_approved`, `require_unit_test_pass`, `require_integration_test_pass` | `story_to_code_review_approved` |
| `security` | `require_code_review_approved` | `story_to_security_pass` |
| `pr` | `require_ci_success` | `story_to_pr_open`, `story_to_done` |

`pipeline.environments.dev.gates` relaxes selected gates in dev mode (see [project-config.yml](../project-config.yml)).

**Jira is always mandatory for Planning Agent** — it creates the epic and Must-have stories. Configure Jira MCP and `jira.project_key` before running `@planning-agent` (see [MCP-SETUP.md](MCP-SETUP.md)).

When Jira is unavailable, Planning Agent **FAILs** in both `dev` and `strict` mode.

## Security scans

Configured in `security:` — read by `@security-review-agent`.

### Local checks

```yaml
security:
  local:
    enabled: true
    commands:
      - name: secrets
        command: gitleaks detect --source . --verbose
        required: true
        scope: repo              # repo | changed_files
```

Install tools on the developer machine (e.g. `brew install gitleaks semgrep`). Optional wrapper: `security.local.wrapper_script: ./.scripts/security-local.sh`.

### CI checks

```yaml
security:
  ci:
    enabled: true
    require_in_strict: true      # CI security job must PASS before PR
    workflow: ci
    job: security
```

Add a `security` job to `.github/workflows/ci.yml` in the app repo. The agent discovers the latest run via `gh run list`.

### Severity gate

`security.block_on: [critical, high]` — findings at these levels FAIL the gate in strict mode.

## Regression test suites

Regression runs as a **CI job** (there is no dedicated regression agent). CI reads the suite command from `build.regression_command` via `.github/scripts/load-project-config.py`, and the PR gate covers it through the aggregate `ci-success` check.

### Suite command (what CI runs)

```yaml
build:
  test_command: ./mvnw test
  integration_test_command: ./mvnw verify -Pintegration
  regression_command: ./mvnw verify -Pregression

  regression:
    profile: regression          # Maven -P flag — must exist in pom.xml
    groups: regression           # JUnit @Tag — configure in pom.xml Failsafe
    description: End-to-end regression suite
    includes: []                 # optional: [MyRegressionTest]
    excludes: []
```

### Wire tests in the app repo (`pom.xml`)

```xml
<profile>
  <id>regression</id>
  <build>
    <plugins>
      <plugin>
        <artifactId>maven-failsafe-plugin</artifactId>
        <configuration>
          <groups>regression</groups>
        </configuration>
      </plugin>
    </plugins>
  </build>
</profile>
```

```java
@Tag("regression")
class UserFlowRegressionIT { }
```

See [TESTING.md](TESTING.md) and [maven-profiles.example.xml](maven-profiles.example.xml) for full `pom.xml` setup (Failsafe profiles, OWASP plugin).

### Maven build commands (Spring Boot)

Agents and CI share commands from `project-config.yml`:

```yaml
build:
  tool: maven
  java_version: "21"
  maven_module: null
  compile_command: ./mvnw -B compile
  test_command: ./mvnw -B test
  integration_test_command: ./mvnw -B verify -Pintegration
  regression_command: ./mvnw -B verify -Pregression
```

**Note:** Bundled `.github/workflows/ci.yml` is **Maven/Java only**. Gradle Spring Boot projects need a custom CI workflow.

### Example CI job (app repo `.github/workflows/ci.yml`)

```yaml
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Secrets scan
        uses: gitleaks/gitleaks-action@v2
      - name: Semgrep
        run: pip install semgrep && semgrep --config auto --error
      - name: Dependency check
        run: ./mvnw org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7
```

Set `security.ci.job: security` to match the job id above.

### CI workflow template

Copy into your application repository (from the agents template repo root):

```bash
./.scripts/copy-pipeline-bundle.sh /path/to/your-app
```

The `config` job loads `build.*_command` and `build.regression.*` from `project-config.yml` — no need to edit hardcoded commands in `ci.yml`.

| Job | Agent |
|-----|-------|
| `unit-test` | Unit Test Agent, PR Agent |
| `integration-test` | Integration Test Agent, PR Agent |
| `security` | Security Review Agent |
| `regression` | CI regression suite (covered by `ci-success`) |
| `ci-success` | PR Agent aggregate gate (`gh pr checks`) |

Optional secret: `NVD_API_KEY` for OWASP dependency-check.



