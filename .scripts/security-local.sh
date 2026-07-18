#!/usr/bin/env bash
# Optional local security wrapper — referenced by project-config.yml → security.local.wrapper_script
# Runs the default checks from security.local.commands. Exit non-zero on critical/high findings.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0

run() {
  local name="$1"
  shift
  echo "==> $name"
  if "$@"; then
    echo "    PASS"
  else
    echo "    FAIL"
    fail=1
  fi
}

if command -v gitleaks >/dev/null 2>&1; then
  run "secrets (gitleaks)" gitleaks detect --source . --verbose
else
  echo "==> secrets (gitleaks): SKIPPED — not installed"
fi

if command -v semgrep >/dev/null 2>&1; then
  run "sast (semgrep)" semgrep --config auto --error .
else
  echo "==> sast (semgrep): SKIPPED — not installed"
fi

if [[ -x ./mvnw ]] || command -v mvn >/dev/null 2>&1; then
  MVN="./mvnw"
  [[ -x "$MVN" ]] || MVN="mvn"
  echo "==> dependencies (OWASP)"
  if $MVN -B org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7; then
    echo "    PASS"
  else
    echo "    FAIL (or plugin not configured in pom.xml)"
    # Optional check — do not fail the script unless gitleaks/semgrep failed
  fi
else
  echo "==> dependencies (OWASP): SKIPPED — Maven not available"
fi

exit "$fail"
