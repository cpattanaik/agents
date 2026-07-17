#!/usr/bin/env python3
"""Load build/test commands from project-config.yml for CI jobs."""
from __future__ import annotations

import os
import sys

try:
    import yaml
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "pyyaml"])
    import yaml

DEFAULTS = {
    "compile_command": "./mvnw -B compile",
    "test_command": "./mvnw -B test",
    "integration_test_command": "./mvnw -B verify -Pintegration",
    "regression_command": "./mvnw -B verify -Pregression",
}

REGRESSION_DEFAULTS = {
    "profile": "regression",
    "groups": "regression",
    "description": "Full regression suite (CI job: regression)",
}


def load_config(path: str = "project-config.yml") -> dict:
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def with_module(command: str, module: str | None) -> str:
    if not module or "-pl " in command:
        return command
    return f"{command} -pl {module}"


def main() -> None:
    cfg = load_config()
    build = cfg.get("build", {})
    regression = build.get("regression", {})
    module = build.get("maven_module") or ""

    print(f"build_tool={build.get('tool', 'maven')}")
    print(f"java_version={build.get('java_version', '21')}")
    if module:
        print(f"maven_module={module}")

    for key, default in DEFAULTS.items():
        val = build.get(key, default)
        val = with_module(val, module or None)
        if key == "regression_command":
            includes = regression.get("includes") or []
            if includes and "-Dtest=" not in val:
                val = f"{val} -Dtest={','.join(includes)}"
        print(f"{key}={val}")

    for key, default in REGRESSION_DEFAULTS.items():
        if key == "description":
            val = regression.get(key, default)
            print(f"regression_{key}={val.replace(chr(10), ' ')}")
        else:
            print(f"regression_{key}={regression.get(key, default)}")

    includes = regression.get("includes") or []
    if includes:
        print(f"regression_includes={','.join(includes)}")


if __name__ == "__main__":
    main()
