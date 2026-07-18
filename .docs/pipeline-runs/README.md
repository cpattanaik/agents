# Pipeline Run Manifests

**Written by:** `@pipeline-orchestrator-agent`

Optional **repo mirror** for orchestrator run state. Gate verification remains **wiki-first** — see [report-persistence.md](../../.cursor/skills/report-persistence.md).

## Path convention

```
.docs/pipeline-runs/<epic-key>-<run-id>.md
```

Example:

```
.docs/pipeline-runs/PROJ-100-20260718-001.md
```

## Manifest contents

Each file tracks one pipeline run for an epic:

- Current phase and mode (`strict` | `dev`)
- Gate status table (phase, agent, wiki report URL, status)
- Blockers and recommended next agent

Orchestrator creates or updates this file when validating or advancing the pipeline. Wiki URLs in the manifest point to canonical agent reports under `Projects/{slug}/Epics/{EPIC-KEY}/Agent-Reports/`.

## Configuration

- [project-config.yml](../../project-config.yml) — `pipeline.gates.*`, `pipeline.mode`
- [pipeline-orchestrator-agent/SKILL.md](../../.cursor/skills/pipeline-orchestrator-agent/SKILL.md) — gate order and manifest workflow
