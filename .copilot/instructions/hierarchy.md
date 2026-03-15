# AGENT HIERARCHY

> Use this model for GitHub coding-agent and workflow automation. Interactive local sessions may collapse roles when only one assistant is available.

## Roles

| Role | Responsibility | Typical artifact |
|------|----------------|------------------|
| Overseer | Shape scope, select agent/workflow, review outcome | Issue, PR review, workflow dispatch |
| Implementer | Make scoped file changes | Pull request |
| Build and validation | Run CI and quality gates | Workflow run, logs, artifacts |
| Reviewer | Check correctness, safety, and drift | Review comments, approvals |

## Preferred mapping

| Need | Tooling pattern |
|------|-----------------|
| Repo-wide async work | GitHub Copilot coding agent |
| Specialized instruction work | `.github/agents/instruction-governor.agent.md` |
| Repo-wide rules | `.github/copilot-instructions.md` |
| Scoped rules | `.github/instructions/*.instructions.md` |

## Delegation rules

| IF | THEN |
|----|------|
| Work is routine and issue-shaped | Prefer a GitHub coding-agent issue or PR flow |
| Work changes instructions or automation | Read `AGENTS.md` and the instruction-governance rules first |
| Validation or release output is needed | Let CI produce the authoritative artifact when local tooling is incompatible |
| Same failure repeats | Stop and switch to documented troubleshooting |

## Review handoff

- The overseer owns issue scope, secret management, and final review.
- The coding agent should report back through a pull request with a concise summary, validation results, and open questions.
