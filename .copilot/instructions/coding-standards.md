# CODING STANDARDS

## Core standards

| Category | Standard |
|----------|----------|
| App model | Expo SDK 54 + Expo Router + React Native |
| Styling | React Native `StyleSheet` + existing themed components |
| Types | TypeScript strict mode; no `any` without a very specific reason |
| UI reuse | Prefer shared dashboard and themed components before inventing new patterns |
| Native workflow | Use Expo-managed prebuild flow when native regeneration is required |

## File layout

| Path | Purpose |
|------|---------|
| `app/` | Expo Router screens and layouts |
| `components/` | Shared React Native UI |
| `contexts/`, `hooks/` | State and reusable behavior |
| `lib/` | Domain helpers and service integrations |
| `src/types/` | Shared domain types |

## Quality gates

| Purpose | Command |
|---------|---------|
| Lint | `yarn lint` |
| Typecheck | `yarn typecheck` |
| Instruction governance | `python3 scripts/validate_instruction_files.py` |

## Style reminders

- Prefer `StyleSheet.create` for reusable styles; keep inline objects minimal.
- Avoid web-only assumptions such as Tailwind/shadcn conventions.
- Update docs and instruction files when commands, workflows, or architectural paths change.
