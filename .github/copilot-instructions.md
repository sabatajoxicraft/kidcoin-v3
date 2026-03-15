# KidCoin v3 Copilot Instructions

KidCoin v3 is an Expo React Native family financial education app. Parents manage tasks, payouts, announcements, reporting, and family settings; children earn points, submit evidence, request payouts, and work through lessons and goals.

## Stack

| Area | Value |
|------|-------|
| Mobile app | Expo SDK 54, React Native 0.81, Expo Router |
| Backend | Firebase Auth, Firestore, Storage, Cloud Functions |
| Language | TypeScript strict mode |
| UI style | React Native `StyleSheet` + themed wrappers |
| CI | GitHub Actions in `.github/workflows/` |

## Validate changes

| Purpose | Command | Notes |
|---------|---------|-------|
| Install deps | `yarn install` | CI uses Yarn |
| Lint | `yarn lint` | `expo lint` under the hood |
| Typecheck | `yarn typecheck` | `tsc --noEmit` |
| Instruction audit | `python3 scripts/validate_instruction_files.py` | Run after editing instruction, agent, or workflow files |
| Android APK release path | Push to `dev` | `.github/workflows/android-build.yml` publishes `latest-dev-apk` |

## Architecture map

| Area | Paths | Notes |
|------|-------|-------|
| Routes | `app/` | Expo Router route groups for parent, child, auth, setup |
| Shared UI | `components/` | Dashboard and themed components live here |
| State | `contexts/`, `hooks/` | Family, auth, task, lesson contexts |
| Domain helpers | `lib/`, `src/types/` | Firebase services, business logic, shared types |
| Repo governance | `.copilot/`, `.github/`, `AGENTS.md` | Keep these files aligned |

## Source of truth

- Treat [`../.copilot/mandate.md`](../.copilot/mandate.md) as the repo governance source of truth.
- Keep this file concise and repo-wide only.
- Put scoped rules in `.github/instructions/*.instructions.md`.
- Put coding-agent personas in `AGENTS.md` and `.github/agents/*.agent.md`.
- If commands, workflows, or architecture paths change, update the matching instruction files in the same change.

## Repo-specific rules

- Follow the Expo-managed workflow already used by this repo; do not replace it with a vanilla React Native scaffold.
- Prefer React Native `StyleSheet` and existing themed components over new styling systems.
- Use GitHub-documented Copilot automation only. For agent assignment automation, require the documented PAT/secret flow instead of embedding credentials or inventing unsupported steps.
- When local Android build tools are host-incompatible, treat the GitHub Actions APK pipeline as the trusted build path.
