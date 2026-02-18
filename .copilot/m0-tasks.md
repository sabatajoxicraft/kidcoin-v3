# M0 + M0.5 Tasks

> Create via shrimp-tasks-split_tasks with updateMode: "clearAllTasks"

===

## Project Context
| Field | Value |
|-------|-------|
| Name | kidcoin-v3 |
| Stack | React Native (no Expo) |
| Platform | Mobile (Android/iOS) |

**Description:** KidCoin is a React Native family financial education app for South African families that turns chores and educational activities into a points economy where children earn points (default 10 points = R1) and parents approve rewards.  Core MVP: Firebase Google auth for parents, family + multi-child profiles with role-based access and child PIN kiosk mode, task creation/assignment (including recurring and team tasks), child photo evidence submission, parent approval/return feedback workflow, points ledger + transaction history, payout request/approval with configurable minimum threshold, age-banded financial lessons (Junior/Standard/Teen) with quizzes and rewards, badges/streaks dashboards, push notifications, real-time Firestore sync with offline support, Firebase Storage image handling, and accessible dark-mode mobile UI.  Out of scope for v1: social/leaderboards, direct payment rails, AI suggestions, multi-currency, and web portal.

===

## M0 Phase: PRD Definition

### M0-T1: Generate PRD
| Field | Value |
|-------|-------|
| Agent | Architect |
| Dependencies | none |

Auto-derive from mandate.md: problem statement, users, features, acceptance criteria.

---

### M0-T2: Component Architecture  
| Field | Value |
|-------|-------|
| Agent | Architect |
| Dependencies | M0-T1 |

Apply Atomic Design: atoms → molecules → organisms → templates → pages.
Use React Native compatible components.

---

### M0-T3: Folder Structure
| Field | Value |
|-------|-------|
| Agent | Architect |
| Dependencies | M0-T2 |

Create MDDF structure. Configure NativeWind, TypeScript strict.

---

### M0-T4: API/Data Strategy
| Field | Value |
|-------|-------|
| Agent | Architect |
| Dependencies | M0-T1 |

Define backend needs, API contracts, TypeScript interfaces.

---

### M0-T5: USER APPROVAL ⚠️
| Field | Value |
|-------|-------|
| Agent | OVERSEER |
| Dependencies | M0-T1, M0-T2, M0-T3, M0-T4 |

**HUMAN TOUCHPOINT #2 - DO NOT AUTO-COMPLETE**

===

## M0.5 Phase: Scaffold Validation (MANDATORY)

> ⚠️ DO NOT SKIP - Validates tech stack works in CI BEFORE implementation

### M0.5-T1: Create Minimal Scaffold
| Field | Value |
|-------|-------|
| Agent | Architect |
| Dependencies | M0-T5 |

Initialize project, create "Hello World", configure all dependencies.

---

### M0.5-T2: Configure CI/CD
| Field | Value |
|-------|-------|
| Agent | BuildBot |
| Dependencies | M0.5-T1 |

Push to GitHub, verify workflows in place.

---

### M0.5-T3: Verify CI Build ✅
| Field | Value |
|-------|-------|
| Agent | BuildBot |
| Dependencies | M0.5-T2 |

**GATE: CI BUILD MUST BE GREEN**

IF BUILD FAILS:
- Invoke `skill(build-failure-triage)`
- Fix configs only (not code)
- 2nd identical error → CIRCUIT BREAKER

---

### M0.5-T4: Lock Configs
| Field | Value |
|-------|-------|
| Agent | OVERSEER |
| Dependencies | M0.5-T3 |

Freeze: babel, metro, tailwind, tsconfig, package.json deps.
Document working versions in decision-log.md.

===

## AI Instructions

### "Start M0":
1. Read mandate.md
2. Create M0-T1 through M0-T5 in shrimp-tasks
3. Execute M0-T1 → M0-T4 via Architect
4. **STOP at M0-T5** for approval

### After M0-T5 approved:
1. Create M0.5-T1 through M0.5-T4
2. Execute scaffold validation
3. **GATE: M0.5-T3 must be GREEN**
4. Only then proceed to M1

### AUTO-TRIGGERS:
| IF | THEN |
|----|------|
| Build fails | `skill(build-failure-triage)` |
| 2nd identical error | CIRCUIT BREAKER → Research |
| M0.5-T3 fails 3x | STOP → Escalate to user |
