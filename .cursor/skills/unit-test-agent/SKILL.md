---
name: unit-test-agent
description: >-
  Generates unit test cases for changed code, runs them, produces a test report,
  and updates Jira with results. Use when the user asks to write unit tests,
  run unit tests, or generate a unit test report after coding changes.
disable-model-invocation: true
---

# Unit Test Agent

Generate unit tests for new or changed code, execute them, and produce a structured report for the Review Agent.

## Workflow

1. **Identify scope**
   - Determine changed files from git diff or user-provided context
   - Map each change to the classes/methods that need test coverage

2. **Detect project type**
   - Read [project-config.yml](../../project-config.yml) → `build.tool` (must be `maven` for bundled CI)
   - **Spring Boot + Maven**: `pom.xml` + `src/test/java` → follow `.cursor/rules/springboot.mdc`

3. **Analyze existing tests**
   - Find the project's test directory and match existing style, frameworks, and naming
   - Avoid duplicating tests that already cover the behavior

4. **Generate unit tests**
   - Cover happy path, edge cases, and error conditions
   - Mock external dependencies (DB, HTTP, messaging)
   - Follow project rules in `.cursor/rules/` when applicable

5. **Run tests**
   - Run `build.test_command` (default: `./mvnw -B test`)
   - See [.docs/TESTING.md](../../.docs/TESTING.md)
   - Capture stdout, stderr, pass/fail counts, and duration

6. **Fix failing tests** (only tests you generated or that fail due to your changes)
   - Diagnose failures from test output
   - Fix test logic or code bugs within scope
   - Re-run until all targeted tests pass

7. **Produce report** using the template below

8. **Enforce coverage threshold** (when `pipeline.gates.unit_tests.enforce_threshold_in_strict: true` and mode is strict)
   - Read `pipeline.gates.unit_tests.coverage_threshold_percent` (default 80)
   - If measurable and below threshold → report status **FAIL**
   - When `pipeline.gates.unit_tests.mandatory_in_strict: false` (dev), warn but do not block downstream on FAIL unless user confirms

9. **Persist report** — publish to wiki `.../Agent-Reports/unit-test-agent-{date}.md`

10. **Update Jira** (when Jira story keys provided)
   - Follow [jira-integration.md](../jira-integration.md)
   - Comment on each story: status PASS/FAIL, tests run, failures
   - When status **PASS** and `jira.transitions.story_to_unit_test_pass` is set → transition; otherwise comment only

```
## Unit Test Agent Report
**Status:** PASS | FAIL
**Tests:** N run, N passed, N failed
[Link to failures if any]
```

## Test Generation Guidelines

### Spring Boot (JUnit 5 + Mockito)

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;

    @Test
    void shouldReturnUser_whenIdExists() {
        // arrange → act → assert
    }

    @Test
    void shouldThrowNotFound_whenIdMissing() {
        // ...
    }
}
```

### Naming

- Test classes: `<ClassUnderTest>Test`
- Test methods: `should<Expected>_when<Condition>()`

### Coverage priorities

1. New public methods and changed logic paths
2. Error/exception branches
3. Input validation boundaries
4. Skip trivial getters/setters and generated code

## Report Template

```markdown
# Unit Test Report

## Summary
- **Status**: PASS | FAIL
- **Tests run**: N
- **Passed**: N | **Failed**: N | **Skipped**: N
- **Duration**: Xs

## Tests Generated
| Test Class | Methods Added | Target |
|------------|---------------|--------|
| ... | ... | ... |

## Execution Results
```
[paste relevant test runner output]
```

## Failures (if any)
| Test | Error | Resolution |
|------|-------|------------|
| ... | ... | ... |

## Coverage Gaps
- [List behaviors not yet covered and why]

## Recommendations
- [Actions for Review Agent or developer]
```

## Rules

- Only add tests; do not refactor unrelated production code
- Run tests locally — do not assume pass without execution
- Inspect `pom.xml` and existing tests under `src/test/java` before generating new tests
- Hand off the report to the Review Agent when complete
- Update Jira when story keys provided — see [jira-integration.md](../jira-integration.md)
- Persist report to GitHub Wiki per [wiki-integration.md](../wiki-integration.md)
