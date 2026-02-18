# M0-T4: API/Data Strategy (Firebase + Firestore)

Backend/data approach:
- Firebase Auth for parent sign-in (Google provider).
- Firestore as primary real-time datastore.
- Firebase Storage for task evidence images.

Core Firestore contracts (collections/doc shape):
- `families/{familyId}`: household profile + settings (including points ratio/min payout).
- `users/{userId}`: role (`parent`/`child`), family linkage, child PIN metadata.
- `tasks/{taskId}`: assignment, recurrence/team flags, status, points, evidence refs.
- `transactions/{txnId}`: points ledger entries and payout request/approval history.
- `lessons/{lessonId}` + progress docs: age-band content, quiz outcomes, rewards.

TypeScript interface baseline:
- `UserProfile`, `Family`, `ChildProfile`
- `Task`, `TaskEvidence`, `TaskReview`
- `PointsTransaction`, `PayoutRequest`
- `Lesson`, `LessonProgress`

Rules:
- Keep interfaces in `src/types/`.
- Prefer explicit status unions (e.g., `'pending' | 'approved' | 'returned'`).
- Validate Firestore payloads at service boundaries before UI consumption.
