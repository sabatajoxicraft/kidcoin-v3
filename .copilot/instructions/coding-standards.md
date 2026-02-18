# CODING STANDARDS (FIXED)

> These standards are NON-NEGOTIABLE. Cannot be overridden.

## Architecture

| Category | Standard |
|----------|----------|
| Design | React Native component composition (shared UI + screen-level composition) |
| Styling | React Native `StyleSheet` + themed components (no web-only Tailwind/shadcn assumptions) |
| Icons | Expo Vector Icons / Material Symbols |
| Types | TypeScript strict mode (no `any`) |

## File Structure

```
app/             # Expo Router routes and layouts
components/      # Shared React Native UI components
hooks/           # Custom React hooks
contexts/        # Cross-screen state/context providers
constants/       # App-level constants
lib/             # Third-party library configurations
assets/          # Static assets
src/             # Project-specific assets/modules
```

## Quality Gates

| Tier | Blocks Shipping? | Examples |
|------|------------------|----------|
| 🔴 CRITICAL | YES | Security, crashes, build failures |
| 🟡 WARNING | NO (track) | Type errors, test failures |
| 🟢 INFO | NO | Formatting, style |

**Milestone Complete = Feature Works** — not perfect code.

## Styling Rules

- Prefer `StyleSheet.create` for reusable styles; keep inline style objects minimal.
- Reuse shared themed components/tokens before introducing one-off styles.
- No web-only CSS framework assumptions (Tailwind/shadcn/pages).
