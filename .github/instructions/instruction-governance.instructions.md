---
name: Instruction governance
description: Rules for instruction, agent, and governance workflow files.
applyTo: ".github/copilot-instructions.md,.github/instructions/**/*.instructions.md,.github/agents/**/*.agent.md,.github/workflows/instruction-governance.yml,.copilot/**/*.md,AGENTS.md,scripts/validate_instruction_files.py"
---
# Instruction governance rules

- Treat `.copilot/mandate.md` as the governance source of truth.
- Keep `.github/copilot-instructions.md` concise and repo-wide; do not turn it into a second mandate.
- Use `.github/instructions/*.instructions.md` for scoped rules and include YAML frontmatter with `applyTo`.
- Use `AGENTS.md` for general agent behavior and `.github/agents/*.agent.md` for task-specific personas.
- Changes to instruction, agent, or governance workflow files must keep `python3 scripts/validate_instruction_files.py` passing.
- Prefer links to source files over duplicated prose.
- Do not claim unsupported GitHub or Copilot automation; if agent assignment depends on a PAT or preview feature, say so in the file or workflow.
