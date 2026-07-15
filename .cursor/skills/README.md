# Development Pipeline Agents

Production-grade Cursor skills for the full SDLC: planning → design → coding → testing → review → release, with Jira integration.

All agents live under `.cursor/skills/<agent-name>/SKILL.md`.

## Agent Pipeline

```mermaid
flowchart TB
    subgraph plan [Planning]
        PRD[PRD + Architecture]
        JiraPlan[Jira Epics + Stories]
        PlanningAgent[Planning Agent]
    end
    subgraph design [Design]
        DesignAgent[Design Agent]
        DesignReview[Review Agent]
    end
    subgraph build [Build]
        CodingAgent[Coding Agent]
        UnitTest[Unit Test Agent]
        CodeReview[Review Agent]
    end
    subgraph release [Release]
        Regression[Regression Test Agent]
        PRAgent[PR Agent]
    end
    subgraph prod [Production]
        Bugfix[Bugfix Agent]
    end

    PRD --> PlanningAgent
    JiraPlan --> PlanningAgent
    PlanningAgent --> DesignAgent
    DesignAgent --> DesignReview
    DesignReview --> CodingAgent
    CodingAgent --> UnitTest
    UnitTest --> CodeReview
    CodeReview --> Regression
    Regression --> PRAgent
    Bugfix --> UnitTest
```

## Agents

| Agent | Skill path | Trigger |
|-------|------------|---------|
| Planning | [planning-agent/](planning-agent/) | PRD + architecture; creates Jira epic/stories |
| Design | [design-agent/](design-agent/) | After planning gate |
| Coding | [coding-agent/](coding-agent/) | After design review approved |
| Review | [review-agent/](review-agent/) | After design, coding, testing, bugfix |
| Unit Test | [unit-test-agent/](unit-test-agent/) | After code changes |
| Regression Test | [regression-test-agent/](regression-test-agent/) | CI pipeline link (optional) |
| Bugfix | [bugfix-agent/](bugfix-agent/) | Jira bug link (mandatory in production) |
| PR | [pr-agent/](pr-agent/) | Review + tests pass |

**Shared Jira contract:** [jira-integration.md](jira-integration.md)

## Usage

Invoke by skill name in Cursor:

```
@planning-agent
@design-agent
@coding-agent
@review-agent
@unit-test-agent
@regression-test-agent
@bugfix-agent
@pr-agent
```

## Jira setup

1. Configure **Jira MCP** in Cursor, or set env vars: `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
2. Align transition names in [jira-integration.md](jira-integration.md) with your Jira workflow

## Typical workflow

```
1. Human writes PRD + architecture
2. Planning Agent    → creates Jira epic/stories + validates
3. Design Agent      → tech design + traceability matrix
4. Review Agent      → design review
5. Coding Agent      → implementation
6. Unit Test Agent   → tests
7. Review Agent      → code review
8. Regression Agent  → CI result (if link provided)
9. PR Agent          → PR opened
10. Bugfix Agent     → prod hotfix (Jira mandatory)
```
