# Decision Log

> 📋 AI AGENTS: Check here before making architectural decisions. Don't re-litigate what's already decided.

## How to Use This Log
1. Before making a significant decision, check if it's already been made
2. If making a new decision, add it here with rationale
3. If reversing a decision, document WHY and mark the old one as superseded

---

## Decisions

### [DECISION-001] Expo React Native Baseline
- **Date**: 2026-02-16
- **Status**: Active
- **Category**: Tech Stack
- **Decision**: Keep the project on Expo + React Native with Expo Router and TypeScript.
- **Context**: Project entry point/scripts/dependencies are Expo-based (`expo-router/entry`, Expo scripts in `package.json`).
- **Rationale**: Existing scaffold and CI path already align with Expo.
- **Consequences**: Standards and gates must be RN/Expo aligned and avoid web-only assumptions.

### [DECISION-002] M1 Started with Auth Foundation
- **Date**: 2026-02-18
- **Status**: Active
- **Category**: Architecture
- **Decision**: Implement authentication/session foundation first, then family/child and role gating.
- **Context**: Commit `f8ba2c7` introduced Firebase Google sign-in flow, auth context, session routing, and parent profile upsert.
- **Rationale**: Family-scoped and role-gated features depend on authenticated session context.
- **Consequences**: M1 remains in progress; family creation, child PIN flow, and role gating are still pending.

## Decision Index by Category

### Architecture
- [DECISION-002] M1 Started with Auth Foundation

### Tech Stack
- [DECISION-001] Expo React Native Baseline

### Design
- None recorded.

### Process
- None recorded.

### Security
- None recorded.
