# Project Mandate

> Single source of truth for repo governance. Keep this file concise and push detail into linked modules.

## Identity

| Field | Value |
|-------|-------|
| Name | kidcoin-v3 |
| Product | Expo React Native family financial education app for South African families |
| Stack | Expo SDK 54, React Native, Expo Router, Firebase Auth/Firestore, TypeScript |
| Delivery branch | `dev` is the active feature branch and publishes dev APKs |

## Instruction layers

| Layer | File or folder | Purpose |
|-------|----------------|---------|
| Repo-wide Copilot rules | [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md) | Concise always-on project guidance |
| Path-specific rules | [`../.github/instructions/`](../.github/instructions/) | Scoped instructions by file type or area |
| Coding-agent guidance | [`../AGENTS.md`](../AGENTS.md), [`../.github/agents/`](../.github/agents/) | Agent personas and boundaries |
| MDDF governance modules | [`instructions/`](./instructions/) | Auto-triggers, hierarchy, phases, standards |
| Historical setup record | [`m0-tasks.md`](./m0-tasks.md) | M0 and M0.5 archive |

## Mandatory reading order

1. Read this file.
2. Read `.github/copilot-instructions.md`.
3. Read the most relevant `.github/instructions/*.instructions.md` or `.copilot/instructions/*.md`.
4. For GitHub coding-agent work, also read `AGENTS.md` and any selected `.github/agents/*.agent.md`.

## Non-negotiables

| IF | THEN |
|----|------|
| Instruction files change | Update `.github/copilot-instructions.md`, `AGENTS.md`, scoped `.instructions.md` files, and the validator script together |
| Workflow or command changes | Reflect the change in matching instruction files in the same PR |
| GitHub agent automation is added | Use documented Copilot issue-assignment or agent-assignment paths only |
| Android release APK is needed | Prefer GitHub Actions if the local host lacks compatible Android SDK binaries |
| Repo facts are uncertain | Verify from code or official docs before writing instructions |

## Module map

| Topic | File |
|-------|------|
| Auto-triggers | [`instructions/auto-triggers.md`](./instructions/auto-triggers.md) |
| Coding standards | [`instructions/coding-standards.md`](./instructions/coding-standards.md) |
| Agent hierarchy | [`instructions/hierarchy.md`](./instructions/hierarchy.md) |
| Delivery phases | [`instructions/phases.md`](./instructions/phases.md) |
| Scaffold and native workflow rules | [`instructions/scaffolding-rules.md`](./instructions/scaffolding-rules.md) |

## Active state

| Topic | Status |
|-------|--------|
| Delivery phase | M1+ feature delivery |
| M0 and M0.5 | Historical reference only |
| Source of truth | This file plus linked modules above |

**Rule:** If a top-level instruction file grows beyond its job, split it into a linked module instead of duplicating the text.
