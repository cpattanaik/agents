---
name: integration-test-agent
description: >-
  Runs integration tests for API and service boundaries (@SpringBootTest,
  REST Assured, Testcontainers). Use after unit tests and before code review
  when REST or database boundaries changed.
disable-model-invocation: true
---

# Integration Test Agent

Bridge between unit tests and full CI regression. Required when API/DB boundaries change.

## Activation

| Condition | Action |
|-----------|--------|
| API controllers, DB, messaging changed | Run integration tests |
| Config/docs only | Report N/A — skip |
| `project-config.yml` → `pipeline.gates.integration_tests.mandatory_for_api_changes: true` | FAIL if API changed and no tests |

## Workflow

1. **Identify scope**
   - Changed controllers, repositories, external clients from git diff
   - Read technical design for API contracts to validate

2. **Detect project type**
   - Read [project-config.yml](../../project-config.yml) → `build.tool` (must be `maven` for bundled CI)
   - **Spring Boot**: `@SpringBootTest`, `@WebMvcTest`, REST Assured, Testcontainers — see [docs/TESTING.md](../../docs/TESTING.md)

3. **Generate or extend integration tests**
   - End-to-end API flows (happy path + key error codes)
   - Service layer with testcontainers (DB, Redis) when applicable
   - Match existing test style in `src/test/` or `tests/`

4. **Run tests**
   - Run `build.integration_test_command` (default: `./mvnw -B verify -Pintegration`)
   - See [docs/TESTING.md](../../docs/TESTING.md)
   - Capture pass/fail counts and duration

5. **Produce report** (same structure as unit-test report)

6. **Persist report** — publish to wiki `.../Agent-Reports/integration-test-agent-{date}.md`

7. **Update Jira** — comment with wiki report URL

## Spring Boot example

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiIntegrationTest {
    @Autowired TestRestTemplate rest;

    @Test
    void shouldReturn201_whenValidRequest() { ... }
}
```

## Rules

- Run tests locally — do not assume pass
- Do not replace unit tests — complement them
- Hand off to **Review Agent** (code scope) on completion
- Follow [jira-integration.md](../jira-integration.md)

## Handoff

PASS → **Review Agent** (code) → **Security Review Agent** → **Regression Test Agent**
