# Project Configuration

All agent pipeline settings live in a **single file**: `project-config.yml`.

## Quick start

```bash
cp project-config.yml.example project-config.yml
```

Edit `project-config.yml` for your repository. Copy `.cursor/skills/` unchanged — agents resolve paths from this file.

## Copying to a new project

Copy the full bundle into your **application repository**:

```bash
APP=/path/to/your-app
mkdir -p "$APP/.cursor/skills" "$APP/.github/workflows" "$APP/.github/scripts"

cp -R .cursor/skills/*              "$APP/.cursor/skills/"
cp -R .cursor/rules/*               "$APP/.cursor/rules/" 2>/dev/null || true
cp project-config.yml.example       "$APP/project-config.yml"
cp .github/workflows/ci.yml         "$APP/.github/workflows/ci.yml"
cp .github/scripts/load-project-config.py "$APP/.github/scripts/"
```

Then:

1. Edit `$APP/project-config.yml` — `project`, `github`, `jira`, `build`, `security`
2. Configure MCP — see [MCP-SETUP.md](MCP-SETUP.md)
3. Run `@planning-agent` in **`pipeline.mode: dev`** (default) — it sets `jira.epic_key` after creating the epic
4. After MCP, CI, pom profiles, and Jira transitions work → set `pipeline.mode: strict`

Gate reports are verified from **GitHub Wiki** (see [report-persistence.md](../.cursor/skills/report-persistence.md)), not `docs/agent-reports/` unless `mirror_to_repo: true`.

## Sections

| Section | Purpose | Key fields |
|---------|---------|------------|
| `project` | Identity | `name`, `slug` |
| `github` | Repo + wiki | `owner`, `repo`, `default_branch` |
| `jira` | Epics, stories, workflow | `project_key`, `epic_key`, `transitions` |
| `wiki` | Document page names | `pages.prd`, `pages.agent_reports`, … |
| `pipeline` | Gates and reporting | `mode`, `gates.*`, `reporting.*` |
| `build` | Maven/Java commands (CI is Maven-only) | `tool`, `java_version`, `compile_command`, `test_command`, `regression.*` |
| `security` | Local + CI security scans | `local.commands[]`, `ci.workflow`, `ci.job` |

## Wiki path resolution

Agents derive wiki paths from config — do not hardcode:

```
Projects/{project.slug}/Epics/{jira.epic_key}/{wiki.pages.<page>}
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

## Pipeline modes

| Mode | When to use |
|------|-------------|
| `dev` | **Default** — relaxed regression/security gates; **Jira still required for `@planning-agent`** |
| `strict` | Full corporate gates after MCP, CI, pom profiles, and Jira transitions are configured |

```yaml
pipeline:
  mode: dev    # change to strict when integration checklist is complete
```

In `strict`, Planning Agent requires Jira + Wiki MCP; PR Agent requires regression PASS and CI security PASS.

## Planning gate (`pipeline.gates.planning`)

| Field | Default | Read by | Effect |
|-------|---------|---------|--------|
| `require_artifact_approval` | `false` | *(reserved)* | Planned for human sign-off on PRD/architecture before design — not wired to agents yet. |

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

Install tools on the developer machine (e.g. `brew install gitleaks semgrep`). Optional wrapper: `security.local.wrapper_script: ./scripts/security-local.sh`.

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

Define regression in **`project-config.yml`** — CI reads commands from here via `.github/scripts/load-project-config.py`.

### Agent gate (which workflow/job)

```yaml
pipeline:
  gates:
    regression:
      ci_workflow: ci
      ci_job: regression
```

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

Copy into your application repository:

```bash
mkdir -p .github/workflows .github/scripts
cp .github/workflows/ci.yml           <app-repo>/.github/workflows/ci.yml
cp .github/scripts/load-project-config.py <app-repo>/.github/scripts/
cp project-config.yml.example         <app-repo>/project-config.yml   # local; add to .gitignore
cp docs/maven-profiles.example.xml    <app-repo>/docs/                # merge into pom.xml
```

The `config` job loads `build.*_command` and `build.regression.*` from `project-config.yml` — no need to edit hardcoded commands in `ci.yml`.

| Job | Agent |
|-----|-------|
| `unit-test` | Unit Test Agent, PR Agent |
| `integration-test` | Integration Test Agent, PR Agent |
| `security` | Security Review Agent |
| `regression` | Regression Test Agent |
| `ci-success` | PR Agent aggregate gate (`gh pr checks`) |

Optional secret: `NVD_API_KEY` for OWASP dependency-check.



