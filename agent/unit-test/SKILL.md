---
name: unit-test-agent
description: >-
  Generates unit test cases for changed code, runs them, and produces a test
  report. Use when the user asks to write unit tests, run unit tests, or
  generate a unit test report after coding changes.
disable-model-invocation: true
---

# Unit Test Agent

Generate unit tests for new or changed code, execute them, and produce a structured report for the Review Agent.

## Workflow

1. **Identify scope**
   - Determine changed files from git diff or user-provided context
   - Map each change to the classes/methods that need test coverage

2. **Detect project type**
   - Inspect build files and source layout to determine stack:
     - **Java/Spring Boot**: `pom.xml` or `build.gradle` + `src/test/java` → follow `.cursor/rules/springboot.mdc`
     - **Kotlin/Spring Boot**: `build.gradle.kts` + `src/test/kotlin`
     - **Node/TypeScript**: `package.json` + `jest`/`vitest`/`mocha` config
     - **Python**: `pyproject.toml`/`requirements.txt` + `pytest`/`unittest`
     - **Other**: match the framework already used in the project's test directory

3. **Analyze existing tests**
   - Find the project's test directory and match existing style, frameworks, and naming
   - Avoid duplicating tests that already cover the behavior

4. **Generate unit tests**
   - Cover happy path, edge cases, and error conditions
   - Mock external dependencies (DB, HTTP, messaging)
   - Follow project rules in `.cursor/rules/` when applicable

5. **Run tests**
   - Java/Maven: `./mvnw test -pl <module> -Dtest=<TestClass>` or `./mvnw test`
   - Java/Gradle: `./gradlew test` or `./gradlew test --tests <TestClass>`
   - Node: `npm test` or `npx vitest run` / `npx jest`
   - Python: `pytest` or `python -m unittest`
   - Capture stdout, stderr, pass/fail counts, and duration

6. **Fix failing tests** (only tests you generated or that fail due to your changes)
   - Diagnose failures from test output
   - Fix test logic or code bugs within scope
   - Re-run until all targeted tests pass

7. **Produce report** using the template below

## Test Generation Guidelines

### Non-Java projects

When the project is not Java/Spring Boot, match the existing test framework and conventions found in the repo. Do not impose Spring Boot patterns on non-Java code.

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
- If the test framework is unknown, inspect `pom.xml` or `build.gradle` first
- Hand off the report to the Review Agent when complete
