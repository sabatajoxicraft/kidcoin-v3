---
name: Workflow governance
description: Guidance for GitHub Actions workflows in this repository.
applyTo: ".github/workflows/**/*.yml"
---
# Workflow rules

- Match the repo's current branch model: `dev` publishes dev APKs; `main` or `master` are release-oriented.
- Prefer explicit permissions and avoid broader scopes than necessary.
- Use Yarn-based install and validation steps for JavaScript jobs unless the repo changes its package manager.
- For Copilot agent automation, require a documented secret such as `GH_AW_AGENT_TOKEN`; never hardcode credentials.
- When a workflow changes commands or release behavior, update the related instruction files in the same PR.
