# AUTO-TRIGGERS

> Keep triggers explicit, evidence-based, and tied to the current repo workflow.

## Trigger table

| IF | THEN | Priority |
|----|------|----------|
| Build, lint, or typecheck fails | Invoke `skill(build-failure-triage)` | P0 |
| Same failure appears twice | Stop and switch to root-cause analysis before retrying | P0 |
| New dependency or framework change is proposed | Invoke `skill(pre-migration-compatibility-check)` before editing | P0 |
| Code change is requested | Follow `skill(implement-with-validation)` and repo quality gates | P1 |
| Instruction, agent, or workflow governance files change | Run `python3 scripts/validate_instruction_files.py` and keep instruction layers in sync | P0 |
| Import or path error appears | Find all occurrences and fix them in one batch | P0 |
| Repo facts are uncertain | Verify with code or official docs before updating instructions | P0 |

## Batch-fix rule

| Step | Action |
|------|--------|
| 1 | Search all occurrences before editing |
| 2 | Fix the full pattern in one commit |
| 3 | Re-run the smallest reliable validation command |
| 4 | Only then push or publish |

## Circuit breaker

| Attempt | Action |
|---------|--------|
| 1 | Investigate and try the most likely fix |
| 2 | Stop repeating tactics and switch to documented troubleshooting |
| 3 | Escalate to a human decision or narrower scope |

## Instruction-governance reminders

- `.copilot/mandate.md` remains the governance source of truth.
- `.github/copilot-instructions.md` should stay concise and repo-wide.
- Use `.github/instructions/*.instructions.md` for scoped rules and `.github/agents/*.agent.md` for task-specific personas.
