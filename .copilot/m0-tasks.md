# M0 and M0.5 Record

> Historical reference only. The repository has passed scaffold validation and now operates in M1+ delivery mode.

## Status

| Phase | State | Source |
|-------|-------|--------|
| M0 | Complete | `prd.md`, `decision-log.md` |
| M0.5 | Complete | `.github/workflows/*.yml`, historical build runs |
| Current | M1+ delivery | `.copilot/mandate.md` |

## What to read instead

| Need | File |
|------|------|
| Current repo governance | `.copilot/mandate.md` |
| Repo-wide Copilot guidance | `.github/copilot-instructions.md` |
| Scoped rules | `.github/instructions/*.instructions.md` |
| MDDF support modules | `.copilot/instructions/*.md` |

## Historical M0 outputs

| Artifact | Purpose |
|----------|---------|
| `prd.md` | Product requirements and scope |
| `decision-log.md` | Architectural decisions and tradeoffs |
| `m0-t2-component-architecture.md` | Component architecture record |
| `m0-t3-folder-structure-conventions.md` | Folder and convention record |
| `m0-t4-api-data-strategy.md` | API and data strategy record |

## Historical M0.5 outputs

| Artifact | Purpose |
|----------|---------|
| `.github/workflows/android-build.yml` | Android CI build and APK publication |
| `.github/workflows/ios-build.yml` | iOS build validation |
| `.github/workflows/test-lint.yml` | lint and typecheck gate |
| `quality-report.md` | Earlier quality and setup notes |

## If bootstrap is ever revisited

1. Start from `.copilot/mandate.md`.
2. Use the repo's current Expo-managed workflow, not generic starter assumptions.
3. Revalidate CI before feature delivery.
4. Update instruction files and workflow docs in the same change.
