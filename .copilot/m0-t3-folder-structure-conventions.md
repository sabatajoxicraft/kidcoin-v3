# M0-T3: Folder Structure + Conventions

Recommended structure:
```text
src/
  components/{atoms,molecules,organisms,templates}
  screens/
  hooks/
  services/
  stores/
  lib/
  utils/
  theme/
  types/
```

Conventions:
- Keep screen orchestration in `screens/`; reusable UI in `components/`.
- Put Firebase/remote access in `services/`; shared business logic in `lib/`.
- Use strict TypeScript types from `types/`; avoid `any`.
- Keep naming consistent: `PascalCase` for components, `camelCase` for hooks/util files.
