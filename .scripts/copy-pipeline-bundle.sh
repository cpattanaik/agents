#!/usr/bin/env bash
# Copy the agentic SDLC pipeline bundle from this repo into a target app repository.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: copy-pipeline-bundle.sh <target-app-repo>

Copies .cursor/, project-config.yml, .docs/, .scripts/, and .github/ CI assets into the target repo.
Run from the agents template repo root, or set AGENTS_ROOT to override the source path.

Example:
  ./.scripts/copy-pipeline-bundle.sh /path/to/your-app
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

APP="$1"
ROOT="${AGENTS_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

required=(
  "$ROOT/.cursor"
  "$ROOT/project-config.yml"
  "$ROOT/.docs/TESTING.md"
  "$ROOT/.docs/PROJECT-CONFIG.md"
  "$ROOT/.docs/MCP-SETUP.md"
  "$ROOT/.docs/maven-profiles.example.xml"
  "$ROOT/.docs/agent-reports/README.md"
  "$ROOT/.docs/pipeline-runs/README.md"
  "$ROOT/.scripts/security-local.sh"
  "$ROOT/.github/workflows/ci.yml"
  "$ROOT/.github/scripts/load-project-config.py"
)

for path in "${required[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "Missing required source file: $path" >&2
    exit 1
  fi
done

mkdir -p "$APP/.github/workflows" "$APP/.github/scripts" "$APP/.docs/agent-reports" "$APP/.docs/pipeline-runs" "$APP/.scripts"

if command -v rsync >/dev/null 2>&1; then
  mkdir -p "$APP/.cursor"
  rsync -a --exclude='node_modules' "$ROOT/.cursor/" "$APP/.cursor/"
else
  cp -R "$ROOT/.cursor" "$APP/.cursor"
  find "$APP/.cursor" -name node_modules -type d -prune -exec rm -rf {} + 2>/dev/null || true
fi
cp "$ROOT/project-config.yml" "$APP/project-config.yml"
cp "$ROOT/.docs/TESTING.md" "$ROOT/.docs/PROJECT-CONFIG.md" "$ROOT/.docs/MCP-SETUP.md" \
   "$ROOT/.docs/maven-profiles.example.xml" "$APP/.docs/"
cp "$ROOT/.docs/agent-reports/README.md" "$APP/.docs/agent-reports/"
cp "$ROOT/.docs/pipeline-runs/README.md" "$APP/.docs/pipeline-runs/"
cp "$ROOT/.scripts/security-local.sh" "$APP/.scripts/"
chmod +x "$APP/.scripts/security-local.sh"
cp "$ROOT/.github/workflows/ci.yml" "$APP/.github/workflows/ci.yml"
cp "$ROOT/.github/scripts/load-project-config.py" "$APP/.github/scripts/"

echo "Pipeline bundle copied to: $APP"
echo "Next: edit $APP/project-config.yml, set MCP env vars, merge maven-profiles into pom.xml — see .docs/MCP-SETUP.md"
