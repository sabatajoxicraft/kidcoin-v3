# KidCoin Agent Guide

## Commands

| Purpose | Command | When |
|---------|---------|------|
| Instruction governance audit | `python3 scripts/validate_instruction_files.py` | After editing instruction, agent, or governance workflow files |
| Lint app code | `yarn lint` | When changing TypeScript or React Native code |
| Typecheck app code | `yarn typecheck` | When changing TypeScript or React Native code |

## Required context

- Read `.copilot/mandate.md`.
- Read `.github/copilot-instructions.md`.
- For instruction work, read `.github/instructions/instruction-governance.instructions.md`.

## Roles

| Role | Responsibility |
|------|----------------|
| Overseer | Shapes the issue, selects the workflow or agent, and reviews the PR |
| Coding agent | Implements the scoped task and reports back through a pull request |

## Expectations

- Treat `.copilot/mandate.md` as the governance source of truth.
- Keep `.github/copilot-instructions.md` concise and repo-wide.
- Put scoped rules in `.github/instructions/*.instructions.md`.
- Keep `AGENTS.md`, custom agent profiles, and instruction files aligned when governance changes.
- Use documented GitHub Copilot issue-assignment and agent-assignment flows for asynchronous work.

## Boundaries

- Never commit secrets, PATs, or workflow tokens.
- Never invent unsupported GitHub or Copilot automation.
- Never replace the repo's Expo-managed scaffold with a generic React Native scaffold.
- When doing instruction-only work, avoid unrelated product or UI behavior changes.
