# SCAFFOLD AND NATIVE WORKFLOW RULES

## Current repo reality

| Area | Approved path | Avoid |
|------|---------------|-------|
| Existing app scaffold | Keep the Expo-managed app already in this repo | Replacing it with `npx react-native init` |
| Native regeneration | `npx expo prebuild --platform android` or `ios` | Hand-creating native folders from scratch |
| Clone Android build | `KIDCOIN_APP_VARIANT=clone npx expo prebuild --platform android --clean` | Ad-hoc clone-specific native edits without documenting them |

## Release guidance

| Situation | Guidance |
|-----------|----------|
| Local host has compatible Android build tools | A local release build may be used |
| Local host is incompatible (for example aarch64 host with x86_64 Android build tools) | Use GitHub Actions as the trusted APK build path |
| CI or native config changes | Update instruction files and workflow docs in the same PR |

## Import and migration hygiene

| Rule | Action |
|------|--------|
| Import/path pattern is broken | Search all occurrences first, then fix in one batch |
| Framework migration or revert is attempted | Verify all imports and rerun the smallest reliable validation command |
| Native workflow changes | Prefer documented Expo commands over manual native folder surgery |

## Validation reminders

- Use repo scripts and GitHub workflows as the authoritative path when available.
- Do not document scaffold commands that contradict the current Expo-based repository.
