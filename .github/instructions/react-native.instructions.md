---
name: Expo React Native
description: Repo-specific guidance for KidCoin application code.
applyTo: "app/**/*.ts,app/**/*.tsx,components/**/*.ts,components/**/*.tsx,contexts/**/*.ts,contexts/**/*.tsx,hooks/**/*.ts,lib/**/*.ts,src/**/*.ts,constants/**/*.ts"
---
# Expo React Native rules

- This repository uses Expo SDK 54, Expo Router, and React Native.
- Prefer shared dashboard components, themed wrappers, and `StyleSheet.create`.
- Keep routes in `app/`, shared UI in `components/`, state in `contexts/` and `hooks/`, and domain helpers in `lib/`.
- Avoid web-only styling or framework assumptions.
- Validate app code with `yarn lint` and `yarn typecheck`.
