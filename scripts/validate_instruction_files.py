#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def read_text(rel_path: str) -> str:
    return (ROOT / rel_path).read_text(encoding="utf-8")


def line_count(rel_path: str) -> int:
    return len(read_text(rel_path).splitlines())


def starts_with_frontmatter(rel_path: str) -> bool:
    lines = read_text(rel_path).splitlines()
    return len(lines) >= 3 and lines[0].strip() == "---"


def has_frontmatter_key(rel_path: str, key: str) -> bool:
    lines = read_text(rel_path).splitlines()
    if not lines or lines[0].strip() != "---":
        return False
    for line in lines[1:]:
        if line.strip() == "---":
            return False
        if line.startswith(f"{key}:"):
            return True
    return False


def build_report() -> dict[str, list[str]]:
    passed: list[str] = []
    warnings: list[str] = []
    failed: list[str] = []

    required_files = [
        ".copilot/mandate.md",
        ".github/copilot-instructions.md",
        "AGENTS.md",
        ".github/workflows/instruction-governance.yml",
        "scripts/validate_instruction_files.py",
    ]
    for rel_path in required_files:
        if (ROOT / rel_path).exists():
            passed.append(f"`{rel_path}` exists")
        else:
            failed.append(f"`{rel_path}` is missing")

    max_100_files = [
        ".copilot/mandate.md",
        ".github/copilot-instructions.md",
        "AGENTS.md",
    ]
    for rel_path in max_100_files:
        if not (ROOT / rel_path).exists():
            continue
        count = line_count(rel_path)
        if count <= 100:
            passed.append(f"`{rel_path}` is {count} lines (<= 100)")
        else:
            failed.append(f"`{rel_path}` is {count} lines (> 100)")

    copilot_text = read_text(".github/copilot-instructions.md")
    if ".copilot/mandate.md" in copilot_text and ".github/instructions" in copilot_text and "AGENTS.md" in copilot_text:
        passed.append("`.github/copilot-instructions.md` references the mandate, scoped instructions, and agents")
    else:
        failed.append("`.github/copilot-instructions.md` must reference `.copilot/mandate.md`, `.github/instructions`, and `AGENTS.md`")

    mandate_text = read_text(".copilot/mandate.md")
    if ".github/copilot-instructions.md" in mandate_text:
        passed.append("`.copilot/mandate.md` points back to `.github/copilot-instructions.md`")
    else:
        failed.append("`.copilot/mandate.md` should reference `.github/copilot-instructions.md`")

    instruction_files = sorted((ROOT / ".github" / "instructions").glob("**/*.instructions.md"))
    if instruction_files:
        passed.append(f"Found {len(instruction_files)} scoped instruction file(s)")
    else:
        failed.append("No `.github/instructions/*.instructions.md` files found")
    for path in instruction_files:
        rel_path = path.relative_to(ROOT).as_posix()
        if starts_with_frontmatter(rel_path) and has_frontmatter_key(rel_path, "applyTo"):
            passed.append(f"`{rel_path}` has frontmatter with `applyTo`")
        else:
            failed.append(f"`{rel_path}` must start with YAML frontmatter and include `applyTo`")

    agent_files = sorted((ROOT / ".github" / "agents").glob("**/*.agent.md"))
    if agent_files:
        passed.append(f"Found {len(agent_files)} custom agent profile(s)")
    else:
        warnings.append("No `.github/agents/*.agent.md` files found")
    for path in agent_files:
        rel_path = path.relative_to(ROOT).as_posix()
        if starts_with_frontmatter(rel_path) and has_frontmatter_key(rel_path, "description"):
            passed.append(f"`{rel_path}` has frontmatter with `description`")
        else:
            failed.append(f"`{rel_path}` must start with YAML frontmatter and include `description`")

    scaffolding_text = read_text(".copilot/instructions/scaffolding-rules.md")
    if "expo prebuild" in scaffolding_text:
        passed.append("Scaffolding rules reflect the current Expo-managed workflow")
    else:
        failed.append("Scaffolding rules should mention the current `expo prebuild` workflow")

    if "❌ BANNED" in scaffolding_text:
        warnings.append("Scaffolding rules still contain a banned-tool marker; verify it matches current repo reality")

    return {"passed": passed, "warnings": warnings, "failed": failed}


def format_markdown(report: dict[str, list[str]]) -> str:
    lines = ["# Instruction Governance Report", ""]
    lines.append("## PASS")
    if report["passed"]:
        lines.extend(f"- {item}" for item in report["passed"])
    else:
        lines.append("- None")
    lines.append("")
    lines.append("## WARNINGS")
    if report["warnings"]:
        lines.extend(f"- {item}" for item in report["warnings"])
    else:
        lines.append("- None")
    lines.append("")
    lines.append("## FAIL")
    if report["failed"]:
        lines.extend(f"- {item}" for item in report["failed"])
    else:
        lines.append("- None")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate instruction and agent files.")
    parser.add_argument("--report-path", help="Write the markdown report to this path.")
    parser.add_argument("--json-path", help="Write the raw JSON report to this path.")
    args = parser.parse_args()

    report = build_report()
    markdown = format_markdown(report)

    if args.report_path:
        report_path = Path(args.report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(markdown, encoding="utf-8")
    else:
        print(markdown, end="")

    if args.json_path:
        json_path = Path(args.json_path)
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    return 1 if report["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
