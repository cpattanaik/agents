# Testing — Spring Boot + Maven

Bundled CI (`.github/workflows/ci.yml`) is **Maven/Java only**. Integration and regression tests live in the **application repository** (`src/test/java/`). No deployment to staging/production is required — tests run embedded or via Testcontainers locally and in CI.

## Test layout

```
src/test/java/
├── unit/              *Test.java           → Surefire (unit-test job)
├── integration/       *IT.java @Tag("integration")
└── regression/        *IT.java @Tag("regression")
```

| Tier | Maven profile | Config command | CI job |
|------|---------------|----------------|--------|
| Unit | (default) | `build.test_command` | `unit-test` |
| Integration | `integration` | `build.integration_test_command` | `integration-test` |
| Regression | `regression` | `build.regression_command` | `regression` |

Commands are defined in [project-config.yml](../project-config.yml). See [PROJECT-CONFIG.md](PROJECT-CONFIG.md) for editable fields.

## pom.xml setup

Copy snippets from [maven-profiles.example.xml](maven-profiles.example.xml) into your app `pom.xml`:

1. **Failsafe plugin** — integration + regression (`*IT.java`, JUnit tags)
2. **Surefire plugin** — unit tests (`*Test.java`, exclude `*IT.java`)
3. **OWASP dependency-check plugin** — required for CI `security` job
4. **JaCoCo** (optional) — coverage threshold from `pipeline.gates.unit_tests.coverage_threshold_percent`

### Maven profiles (required)

```xml
<profiles>
  <profile>
    <id>integration</id>
    <build>
      <plugins>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-failsafe-plugin</artifactId>
          <configuration>
            <groups>integration</groups>
          </configuration>
        </plugin>
      </plugins>
    </build>
  </profile>
  <profile>
    <id>regression</id>
    <build>
      <plugins>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-failsafe-plugin</artifactId>
          <configuration>
            <groups>regression</groups>
          </configuration>
        </plugin>
      </plugins>
    </build>
  </profile>
</profiles>
```

### Example integration test (no deploy)

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Tag("integration")
class UserApiIT {
    @Autowired TestRestTemplate rest;

    @Test
    void shouldReturn201_whenValidRequest() {
        var response = rest.postForEntity("/api/v1/users", request, Void.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
```

### Testcontainers (optional, for real DB)

```java
@Testcontainers
@SpringBootTest
@Tag("integration")
class UserRepositoryIT {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void registerProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
    }
}
```

GitHub Actions runners include Docker — Testcontainers works in CI without a deployed environment.

## Agent commands

Agents read [project-config.yml](../project-config.yml) → `build` when `build.tool: maven`:

| Agent | Command field |
|-------|---------------|
| Coding | `build.compile_command` |
| Unit Test | `build.test_command` |
| Integration Test | `build.integration_test_command` |
| Regression Test | `build.regression_command` (via CI) |

## Verify locally

```bash
./mvnw -B compile                    # compile_command
./mvnw -B test                       # test_command
./mvnw -B verify -Pintegration       # integration_test_command
./mvnw -B verify -Pregression        # regression_command
```

## Multi-module Maven

For reactor builds, set optional module in config:

```yaml
build:
  maven_module: api-module    # optional; adds -pl api-module to commands
```

Agents append `-pl {maven_module}` when the field is set.
