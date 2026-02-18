# Project Mandate

> ⚠️ AI AGENTS: Read this ENTIRE document before ANY action.
> This project follows MDDF v2.0. Deviations not permitted.

===

## Version
| Field | Value |
|-------|-------|
| Created | 2026-02-16 |
| Updated | 2026-02-18 |
| Framework | MDDF v2.0 |

===

## Project Identity
| Field | Value |
|-------|-------|
| Name | kidcoin-v3 |
| Description | Expo React Native family financial education app for South African families. |
| Tech Stack | Expo SDK 54, React Native, Expo Router, Firebase Auth/Firestore, TypeScript |

===

## Auto-Derived Requirements

> 🤖 These are auto-derived by AI in M0 phase:

- Problem statement
- Target users
- Core features (MVP)
- Out of scope items
- Success criteria
- Milestones

===

## 4-LAYER HIERARCHY

| Layer | Agent | Type | Responsibility |
|-------|-------|------|----------------|
| 1 | **OVERSEER** | You | Observe, delegate, enforce |
| 2 | **Architect** | general-purpose | Write code, architecture |
| 2 | **BuildBot** | task | Run builds, tests |
| 3 | **CodeScout** | explore | Research, file search |
| 3 | **Reviewer** | code-review | Security, quality |
| 4 | **shrimp-tasks** | MCP Tool | Task tracking |

===

## HUMAN TOUCHPOINTS (Only 3)

| # | When | Action |
|---|------|--------|
| 1 | Initial Input | `mddf mandate` ✓ |
| 2 | PRD Approval | After M0-T5 |
| 3 | Escalation | Circuit breaker maxed |

**Everything else is autonomous.**

===

## AUTO-TRIGGERS (Mandatory)

| IF | THEN |
|----|------|
| Build fails | `skill(build-failure-triage)` |
| New dependency | `skill(pre-migration-compatibility-check)` |
| Code change | `skill(implement-with-validation)` |
| 2nd identical error | **CIRCUIT BREAKER** |

===

## CODING STANDARDS (FIXED)

### Architecture
| Standard | Value |
|----------|-------|
| Design | React Native component composition (shared UI components + screen-level composition) |
| Styling | React Native `StyleSheet` + themed components (no web-only styling assumptions) |
| Icons | Expo Vector Icons / Material Symbols |
| Types | TypeScript strict mode (no `any`) |

### File Structure
```
app/ (Expo Router route groups/screens)
components/ (shared RN UI)
hooks/, contexts/, lib/, constants/, assets/, src/
```

### Quality Gates
| Tier | Blocks? | Examples |
|------|---------|----------|
| 🔴 CRITICAL | YES | Security, crashes, build fails |
| 🟡 WARNING | NO | Type errors, test failures |
| 🟢 INFO | NO | Formatting, style |

===

## PHASES

| Phase | Gate | Description |
|-------|------|-------------|
| M0 | PRD approved | Define requirements |
| M0.5 | **CI GREEN** | Validate scaffold |
| M1+ | Feature complete | Implementation |

### M0.5 is MANDATORY
Do NOT skip scaffold validation.

===

## AI Instructions

1. Read mandate.md, then m0-tasks.md
2. Use shrimp-tasks for all work tracking
3. Stop at USER APPROVAL tasks
4. Invoke skills on triggers (see AUTO-TRIGGERS)
5. Escalate after circuit breaker
