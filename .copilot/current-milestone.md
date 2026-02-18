# Milestone: M1 - Authentication + Family Setup

> 🎯 AI AGENTS: This is your current objective. Every action must serve this milestone.

## Status
- **State**: [ ] Not Started | [x] In Progress | [ ] Blocked | [ ] Complete
- **Started**: 2026-02-17
- **Target Completion**: No deadline
- **Actual Completion**: N/A

## Objective
Deliver a working authentication and family setup flow where a parent can sign in, create a family, add child profiles with age groups and PINs, and enforce parent/child role access as the foundation for all M1+ features.

## Deliverables
- [x] Deliverable 1: Parent authentication flow using Firebase Auth Google Sign-In is functional end-to-end.
- [ ] Deliverable 2: Family setup flow supports creating a family and adding child profiles (Junior/Standard/Teen) with PIN-based access data.
- [ ] Deliverable 3: Role-based session gating routes Parent and Child users to correct app capabilities.

## Tasks (Granular Progress)

### Parent authentication flow
- [x] Task 1.1: Wire Google Sign-In to Firebase Auth and persist authenticated parent session.
- [x] Task 1.2: Ensure first-time parent sign-in creates/updates parent user profile record.
- [x] Task 1.3: Implement sign-out and session restore behavior for returning users.

### Family setup + child profiles
- [ ] Task 2.1: Implement family creation with unique family ID owned by primary parent.
- [ ] Task 2.2: Implement add-child flow with required fields (display name, age group, PIN).
- [ ] Task 2.3: Hash child PIN before persistence and store role/family linkage.

### Role-based access gating
- [ ] Task 3.1: Route authenticated users by role (parent vs child) after session resolution.
- [ ] Task 3.2: Block child access to parent-only setup/management actions.
- [ ] Task 3.3: Validate parent can manage multiple child profiles in one family context.

## Acceptance Criteria
- [x] Criterion 1: Parent can authenticate with Google Sign-In and reach authenticated app state without manual token handling.
- [ ] Criterion 2: Parent can create a family and add at least one child profile with valid age group and PIN.
- [ ] Criterion 3: Child PIN is never stored in plaintext (stored value is hashed).
- [ ] Criterion 4: Parent and Child sessions are routed to role-appropriate views/actions.
- [ ] Criterion 5: All auth/family data created in this milestone is family-scoped and linked to correct user roles.

## Explicitly OUT OF SCOPE for this Milestone
- Task creation/assignment workflows.
- Payout requests, approvals, and transaction history.
- Lessons, badges, streak gamification, notifications, and photo evidence flows.
- Web portal, social features, bank/payment integrations, and other PRD future roadmap items.

## Dependencies
- Firebase project configuration for Auth and Firestore is available to the app.
- Core user/family data models and environment config are in place.

## Blockers
- [x] Blocker 1: No active blockers. - **Status**: Resolved

## Technical Notes
- Use Firebase Auth (Google Sign-In) as the primary parent authentication path per PRD.
- Enforce family-scoped data access and role checks at both client flow and backend rule levels.
- Child authentication data uses hashed PIN storage only.

---

## Progress Log

### 2026-02-17
- Completed: Milestone activated and scoped to M1 Authentication + Family Setup with testable deliverables/tasks.
- Next: Implement Deliverable 1 authentication flow, then family setup, then role gating.
- Blockers: None.

### 2026-02-18
- Completed: Authentication foundation landed (Google Sign-In + Firebase session handling + parent profile upsert/sign-out flow).
- Next: Implement family creation/add-child flow and parent/child role-based routing and access gating.
- Blockers: None.
