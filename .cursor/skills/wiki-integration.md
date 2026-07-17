# GitHub Wiki Integration (Shared)

**Canonical document store:** all PRD, architecture, technical design, and agent reports live in the **GitHub Wiki** under the project epic. **Jira** holds epics and stories only; every Jira update includes wiki links.

## Architecture

```mermaid
flowchart LR
    subgraph jira [Jira]
        Epic[Epic PROJ-100]
        Story1[Story PROJ-101]
        Story2[Story PROJ-102]
    end
    subgraph wiki [GitHub Wiki]
        Project[Projects/my-project]
        EpicPages[Epics/PROJ-100]
        PRD[PRD]
        Arch[Architecture]
        Design[Technical-Design]
        Reports[Agent-Reports]
    end
    Epic -->|comments wiki URLs| EpicPages
    Story1 -->|AC, summary, status| Epic
    Story2 -->|AC, summary, status| Epic
    EpicPages --> PRD
    EpicPages --> Arch
    EpicPages --> Design
    EpicPages --> Reports
```

| System | Stores | Does not store |
|--------|--------|----------------|
| **GitHub Wiki** | PRD, architecture, design, agent reports | Issue workflow state, per-story detail pages |
| **Jira** | Epic, stories, status, assignee, AC, user story text | Full document bodies (PRD, design) |

## Configuration

Read [project-config.yml](../../project-config.yml) (copy from [project-config.yml.example](../../project-config.yml.example)).

| Field | Example | Use |
|-------|---------|-----|
| `github.owner` | `myorg` | GitHub org or user |
| `github.repo` | `my-repo` | Repo with wiki enabled |
| `project.slug` | `my-project` | Wiki folder under `Projects/` |
| `project.name` | `My Project` | Display name |
| `jira.epic_key` | `PROJ-100` | Set per run or from Jira |
| `wiki.base_path` | `Projects/my-project/Epics` | Epic root (auto-derived from `project.slug`) |

**MCP:** Configure `github-wiki` server in `.cursor/mcp.json` (see [MCP-SETUP.md](../../docs/MCP-SETUP.md)).

## Wiki page tree (per epic)

```
Projects/<project-slug>/
├── Overview                          # project landing (optional)
└── Epics/<EPIC-KEY>/                 # e.g. Epics/PROJ-100
    ├── Overview                      # epic summary + links to all docs
    ├── PRD
    ├── Architecture
    ├── Technical-Design
    ├── Agent-Reports/
    │   ├── planning-agent-20260716.md
    │   ├── design-agent-20260716.md
    │   ├── review-agent-20260716.md
    │   └── ...
```

Per-story wiki pages under `Stories/` are **not** created by Planning Agent — story details stay in Jira.

## Wiki URL format

```
https://github.com/{owner}/{repo}/wiki/Projects/{slug}/Epics/{EPIC-KEY}/PRD
```

Encode spaces as hyphens in page names. Subpages use `/` in the path when using folder-style naming.

## Agent workflow (every document-writing agent)

1. **Write content** to markdown (in memory or temp)
2. **Publish to wiki** via `github-wiki` MCP:
   - `write_wiki_page` or `append_to_wiki_page`
   - `owner`, `repo` from `project-config.yml` → `github`
   - `pageName`: full path e.g. `Projects/my-project/Epics/PROJ-100/PRD`
3. **Build wiki URL** from config + page path
4. **Update Jira** — comment on epic and/or story with wiki link (required)
5. **Optional:** mirror to `docs/` in repo for git audit (when `project-config.yml` → `pipeline.reporting.mirror_to_repo: true`)

## Jira comment format (required)

Every agent comment on Jira must include wiki links:

```markdown
## [Agent Name] Report — [timestamp]

**Status:** PASS | COMPLETE | FAIL

**Wiki:**
- PRD: https://github.com/org/repo/wiki/Projects/my-project/Epics/PROJ-100/PRD
- Report: https://github.com/org/repo/wiki/Projects/my-project/Epics/PROJ-100/Agent-Reports/planning-agent-20260716

**Jira:** PROJ-100 (epic) | PROJ-101 (story)
```

### What to link per artifact

| Artifact | Wiki page | Jira target |
|----------|-----------|-------------|
| PRD | `.../Epics/{KEY}/PRD` | Epic + all stories |
| Architecture | `.../Epics/{KEY}/Architecture` | Epic + all stories |
| Technical design | `.../Epics/{KEY}/Technical-Design` | Epic + related stories |
| Agent report | `.../Epics/{KEY}/Agent-Reports/{agent}-{date}` | Epic or story |

Story details (user story, AC, DoD) are stored in **Jira only** — Planning Agent does not create wiki pages under `Stories/`.

### Jira description update (on create)

When Planning Agent creates a story, set description to include epic wiki links and full story text in Jira:

```markdown
## Wiki
- Epic: https://github.com/.../wiki/Projects/.../Epics/PROJ-100/Overview
- PRD: https://github.com/.../wiki/Projects/.../Epics/PROJ-100/PRD
- Architecture: https://github.com/.../wiki/Projects/.../Epics/PROJ-100/Architecture

## User story
...
```

## Planning Agent specifics

1. Create Jira epic + stories (story details in Jira description)
2. Create wiki epic folder: `Projects/{slug}/Epics/{EPIC-KEY}/Overview`
3. Publish PRD → `.../PRD`
4. Publish Architecture → `.../Architecture`
5. Comment epic with Overview, PRD, Architecture wiki URLs
6. Comment each story with epic wiki URLs (PRD, Architecture, Overview) — **no** per-story wiki pages

## Design Agent specifics

1. Publish technical design → `.../Technical-Design`
2. Comment each story with section anchor link in wiki
3. Comment epic with design wiki URL

## Report agents (review, test, coding, etc.)

1. Publish report → `.../Agent-Reports/{agent}-{YYYYMMDD}.md`
2. Comment linked Jira issue with report wiki URL only (not repo path)

## Authentication

| Priority | Method |
|----------|--------|
| 1 | `github-wiki` MCP tools |
| 2 | GitHub API with `GITHUB_TOKEN` (repo + wiki scope) |
| 3 | Stop — report blocker; do not fabricate wiki URLs |

## Rules

- **Wiki is canonical** for all documents in strict mode
- **Jira always gets wiki links** — never repo-only links in Jira comments
- Epic key in wiki path must match Jira epic key (e.g. `PROJ-100`)
- Do not store full PRD/design body in Jira description — link to wiki; keep AC summary in Jira
- If wiki publish fails, FAIL the agent report and do not mark Jira PASS
