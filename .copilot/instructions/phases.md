# DEVELOPMENT PHASES

## Current state

| Phase | Status | Notes |
|-------|--------|-------|
| M0 | Complete | Historical planning and PRD work |
| M0.5 | Complete | Scaffold and CI validation already shipped |
| M1+ | Active | Feature delivery and maintenance |

## What this means now

| Situation | Guidance |
|-----------|----------|
| New feature or bugfix | Work in M1+ delivery mode |
| Instruction or workflow drift | Update governance files in the same PR |
| Native or build-path changes | Revalidate CI before trusting release output |

## Historical references

| Topic | File |
|-------|------|
| M0 and M0.5 archive | `.copilot/m0-tasks.md` |
| Product requirements | `prd.md` |
| Key decisions | `decision-log.md` |

## Human touchpoints

| When | Action |
|------|--------|
| Scope or product behavior changes materially | Get human approval |
| Same blocker repeats | Escalate with evidence |
| Release or agent output is ready | Hand back for overseer review |
