# Product Requirements Document (PRD)
## KidCoin - Family Financial Education Platform

**Version:** 1.0.0  
**Document Owner:** Product Team  
**Last Updated:** January 2026  
**Status:** Active Development

---

## 1. Problem Statement

### The Challenge
Children today grow up in an increasingly cashless society, missing critical opportunities to learn financial literacy through tangible experiences. Parents struggle to:
- Teach children the value of money and work ethic in meaningful ways
- Create consistent, age-appropriate financial education experiences
- Track and manage family task assignments and completion verification
- Convert abstract concepts like "earning" and "saving" into concrete lessons

### The Solution
**KidCoin** transforms everyday family chores and educational activities into an engaging financial education platform. By gamifying task completion with a transparent points-to-cash system (10 points = R1 ZAR), KidCoin bridges the gap between digital engagement and real-world financial literacy, teaching children responsibility while giving parents powerful tools for family management.

---

## 2. Target Users

### Primary Users

#### Parents (Primary Guardian)
- **Age Range:** 25-50 years old
- **Profile:** Tech-comfortable adults managing household activities
- **Needs:**
  - Create and assign age-appropriate tasks to children
  - Verify task completion with evidence (photos)
  - Approve payout requests and track spending
  - Monitor child progress and engagement
  - Manage multiple children with different age groups
- **Pain Points:** 
  - Difficulty maintaining consistency in chore assignments
  - Lack of transparency in allowance systems
  - Limited tools to teach financial concepts effectively

#### Children (Earners)
- **Age Range:** 5-17 years old, segmented into:
  - **Junior (5-9):** Simple tasks, basic financial concepts
  - **Standard (10-13):** Moderate complexity tasks, intermediate lessons
  - **Teen (14-17):** Advanced tasks, sophisticated financial education
- **Needs:**
  - Clear understanding of available tasks and point values
  - Easy submission of task evidence (photos)
  - Ability to request payouts and track earnings
  - Engaging lessons teaching money management
  - Visual progress tracking and achievements
- **Pain Points:**
  - Unclear expectations around chores and rewards
  - Delayed or inconsistent payments
  - Boring financial education content

### Secondary Users

#### Secondary Parents/Guardians
- Can assist with task management and approvals
- Share family oversight responsibilities
- Support consistency across multiple caregivers

---

## 3. Core Features (MVP)

### 3.1 Authentication & Family Management
- **Google Sign-In Integration:** Secure, familiar authentication via Firebase Auth
- **Family Setup:** Primary parent creates family account with unique family ID
- **Multi-Child Profiles:** 
  - Add unlimited children with age group selection (Junior/Standard/Teen)
  - PIN-based child authentication for secure kiosk mode
  - Role-based permissions (Parent vs Child access)
- **Profile Management:** 
  - Avatars, display names, date of birth
  - Individual points balance tracking
  - Streak tracking (current and longest)

### 3.2 Task Management System
- **Task Creation (Parents):**
  - Title, description, category
  - Point value assignment
  - Optional due date/time
  - Recurring task scheduling (daily, weekly, monthly)
  - Single or team task assignment
  - Photo evidence requirement toggle
- **Task Assignment:**
  - Assign to one or multiple children
  - Team tasks for collaborative work
- **Task Workflow:**
  - Status tracking: Pending → Assigned → In Progress → Submitted → Approved/Returned → Completed
  - Photo evidence submission by children via camera or gallery
  - Parent review with approval/rejection and feedback
- **Task Types:** Household chores, educational activities, personal responsibilities

### 3.3 Points & Rewards System
- **Points Economy:**
  - 10 points = R1 ZAR (South African Rand)
  - Configurable conversion rate per family
  - Real-time balance updates
  - Transaction history tracking
- **Earning Points:**
  - Task completion rewards
  - Lesson completion bonuses
  - Streak bonuses (optional, configurable)
  - Badge unlock rewards
- **Payout System:**
  - Child-initiated payout requests
  - Parent approval workflow
  - Minimum payout threshold (configurable, default: R10)
  - Payment methods tracked (cash, bank transfer, in-app note)
  - Complete payout history with timestamps

### 3.4 Financial Lessons Module
- **Age-Appropriate Content:**
  - Lessons segmented by age group (Junior/Standard/Teen)
  - Progressive difficulty and concepts
- **Lesson Structure:**
  - Educational content (text, examples)
  - Interactive quizzes for comprehension
  - Point rewards for completion
- **Topics Covered:**
  - Earning and work value
  - Saving strategies
  - Budgeting basics
  - Needs vs wants
  - Goal setting
  - (Teen) Banking, interest, credit concepts
- **Progress Tracking:**
  - Completion status per lesson
  - Quiz scores and attempts
  - Unlocked next lessons

### 3.5 Gamification & Engagement
- **Badge System:**
  - Achievement badges for milestones
  - Categories: Tasks, Earnings, Savings, Lessons, Streaks
  - Visual badge collection display
  - Unlock notifications with sound effects
- **Streaks:**
  - Daily task completion tracking
  - Current streak and longest streak display
  - Optional bonus points for maintaining streaks
- **Progress Dashboards:**
  - Parent view: Family overview, individual child performance
  - Child view: Personal stats, available tasks, upcoming goals

### 3.6 Notifications & Real-Time Updates
- **Push Notifications:**
  - Task assignments (to children)
  - Task submission alerts (to parents)
  - Approval/rejection notifications (to children)
  - Payout request alerts (to parents)
  - Lesson completions and badge unlocks
- **Real-Time Sync:**
  - Firestore listeners for instant data updates
  - Cross-device synchronization
  - Offline support with async storage

### 3.7 Photo Evidence & Storage
- **Camera Integration:**
  - Native camera access for task evidence
  - Gallery/photo library selection option
- **Image Storage:**
  - Firebase Storage for secure cloud storage
  - Compressed uploads to optimize storage
  - Access control tied to family permissions

### 3.8 Kiosk Mode (Child-Friendly Interface)
- **Secure Access:**
  - PIN-based login for children (no email required)
  - Restricted permissions (can't modify tasks or approve payouts)
- **Simplified UI:**
  - Child-focused task view
  - Easy photo submission
  - Clear point balance display
- **Device Sharing:**
  - Multiple children can use shared family tablet/device
  - Quick profile switching with PIN

### 3.9 Themes & Accessibility
- **Dark Mode Support:**
  - Automatic system theme detection
  - Manual toggle option
- **Responsive Design:**
  - Optimized for phones and tablets
  - Portrait orientation primary
- **Visual Feedback:**
  - Loading states, error messages
  - Success confirmations with animations

---

## 4. Out of Scope (V1.0)

The following features are **not included** in the initial MVP release:

### 4.1 Advanced Features (Future Roadmap)
- **Social Features:**
  - Inter-family challenges or leaderboards
  - Friend connections or social sharing
- **Advanced Gamification:**
  - Levels, XP systems beyond badges
  - Virtual rewards/avatar customization
- **Payment Integration:**
  - Direct bank transfers or digital wallet integration
  - In-app payment processing (parents track manually)
- **AI/Smart Features:**
  - AI-generated task suggestions
  - Predictive analytics or insights
- **Multi-Currency:**
  - Support beyond ZAR (currently South Africa-focused)
- **Web Portal:**
  - Desktop/web interface (mobile-first only)

### 4.2 Enterprise Features
- Schools or organizations as customers (family-focused only)
- Bulk user management or admin panels
- White-labeling or multi-tenancy

### 4.3 Content Management
- User-generated lesson content marketplace
- Community-contributed tasks or templates
- Third-party integrations (educational platforms, banks)

### 4.4 Advanced Security
- Biometric authentication (beyond PIN for children)
- End-to-end encryption for messages
- Parental control integration with OS-level features

---

## 5. Success Criteria

### 5.1 User Adoption Metrics
- **Target:** 100 active families within first 3 months post-launch
- **Retention:** 60% monthly active users (MAU) after onboarding
- **Engagement:** Average 3+ task completions per child per week

### 5.2 Feature Usage
- **Task Completion Rate:** 70% of assigned tasks completed within due date
- **Photo Evidence:** 80%+ of completed tasks include photo verification
- **Lesson Completion:** 40% of children complete at least one lesson per month
- **Payout Requests:** Average 2 payout requests per family per month

### 5.3 User Satisfaction
- **App Store Rating:** 4.0+ stars on Google Play and iOS App Store
- **NPS Score:** 40+ (Net Promoter Score from parent survey)
- **Support Tickets:** <5% of active users submit support requests per month

### 5.4 Technical Performance
- **Crash-Free Rate:** 99.5%+ (measured via Firebase Crashlytics)
- **API Response Time:** <500ms for 95th percentile of Firestore queries
- **App Load Time:** <3 seconds to authenticated home screen
- **Build Success:** CI/CD pipeline maintains 95%+ successful build rate

### 5.5 Financial Viability (Future Monetization)
- **Conversion Funnel:** Establish baseline for freemium to premium conversion
- **CAC (Customer Acquisition Cost):** Track organic vs paid user acquisition
- **Churn Rate:** <10% monthly churn after 90 days

---

## 6. Technical Stack

### 6.1 Mobile Framework
- **React Native:** 0.75.5 (cross-platform iOS and Android)
- **Language:** TypeScript 5.3 (type-safe development)
- **Build System:** React Native CLI (not Expo managed workflow)

### 6.2 Navigation & Routing
- **React Navigation:** 7.x
  - Bottom Tabs Navigator for main app structure
  - Native Stack Navigator for deep navigation
- **Routing Structure:**
  - Tab-based navigation (Home, Tasks, Lessons, Badges, Profile)
  - Nested stacks for auth, family management, task details, payouts

### 6.3 State Management
- **Zustand:** 4.5.x (lightweight global state)
- **Stores:**
  - `authStore`: User authentication state, current user profile
  - `taskStore`: Task lists, filters, active task state
  - `pointsStore`: Points balance, transaction history
- **Local Persistence:** Async Storage for offline data caching

### 6.4 Backend & Services (Firebase)
- **Firebase Authentication:** 10.12.x
  - Google Sign-In provider via `@react-native-google-signin/google-signin`
  - Custom email/password for secondary accounts
- **Firestore Database:** NoSQL document database
  - Collections: `users`, `tasks`, `lessons`, `lessonProgress`, `transactions`, `payout_requests`, `badges`
  - Real-time listeners for live updates
  - Security rules enforcing family-scoped access
- **Firebase Storage:** Image storage for task evidence photos
- **Firebase Cloud Messaging:** Push notifications (via `@react-native-firebase/messaging`)
- **Firebase Region:** africa-south1 (South Africa region for low latency)

### 6.5 Data Layer (Hybrid Architecture)
- **Prisma:** 7.3.x (experimental)
  - SQLite local database for offline-first features
  - Schema mirrors Firestore structure for consistency
- **Firebase Data Connect:** GraphQL API layer (experimental)
  - GraphQL schema via `codegen.yml`
  - Apollo Client 4.1.2 for GraphQL queries
- **TanStack Query:** 5.x (formerly React Query)
  - Data fetching, caching, synchronization
  - Optimistic updates and retry logic

### 6.6 UI & Styling
- **NativeWind:** 4.2.1 (Tailwind CSS for React Native)
- **Tailwind CSS:** 4.1.18
- **Component Library:** Custom components (no third-party UI kit)
- **Icons:** `react-native-vector-icons` 10.3.x
- **Animations:** `react-native-reanimated` 3.16.x

### 6.7 Media & Device Features
- **Camera:** `react-native-vision-camera` 4.7.x
- **Image Picker:** `react-native-image-picker` 8.2.x
- **Sound Effects:** `react-native-sound` 0.13.x (badge unlocks, achievements)
- **Notifications:** `@notifee/react-native` 9.1.x (local notifications)
- **Splash Screen:** `react-native-splash-screen` 3.3.0

### 6.8 Networking & Utilities
- **Network Detection:** `@react-native-community/netinfo` 11.4.x
- **Validation:** Zod 4.3.x (schema validation)
- **Password Hashing:** bcryptjs 3.0.x (PIN hashing for child accounts)
- **In-App Browser:** `react-native-inappbrowser-reborn` 3.7.x (lesson external links)

### 6.9 Testing & Quality
- **Testing Framework:** Jest 29.x
  - `@testing-library/react-native` 12.9.x
  - `@testing-library/jest-native` 5.4.x
- **Coverage Target:** 70%+ (branches, functions, lines, statements)
- **Mocking:** Custom mocks for Firebase, native modules in `__mocks__/`
- **Linting:** ESLint 8.57 with TypeScript and Prettier plugins
- **Formatting:** Prettier 3.2.5
- **Type Checking:** TypeScript compiler (strict mode)

### 6.10 CI/CD & DevOps
- **Version Control:** Git (GitHub repository)
- **CI/CD:** GitHub Actions
  - `.github/workflows/android.yml`: Android APK builds
  - `.github/workflows/ios.yml`: iOS builds
  - `.github/workflows/copilot-autofix.yml`: Automated error resolution
- **Build Artifacts:** APK uploads for download and distribution
- **Monitoring:** Firebase Crashlytics (crash reporting)

### 6.11 Development Tools
- **Package Manager:** Yarn 1.22.22
- **Node.js:** 18.x or higher
- **IDE:** VS Code with React Native extensions recommended
- **Debugging:** React Native Debugger, Flipper (optional)

### 6.12 Platform Support
- **Android:** Minimum SDK 24 (Android 7.0), Target SDK 34
- **iOS:** Minimum iOS 13.0, targeting iOS 15+
- **Bundle Identifier:**
  - Android: `com.sabata.kidcoin`
  - iOS: `com.sabata.kidcoin`

### 6.13 Architecture Patterns
- **Service Layer:** Business logic encapsulated in `services/` directory
  - `auth.service.ts`: Authentication workflows
  - `task.service.ts`: Task CRUD and subscriptions
  - `family.service.ts`: Family member management
  - `payout.service.ts`: Payout request processing
  - `lesson.service.ts`: Lesson fetching and progress tracking
  - `badge.service.ts`: Badge unlocking and retrieval
  - `storage.service.ts`: File upload/download
  - `notification.service.ts`: Push notification handling
- **Error Handling:** Centralized error utilities (`utils/error.utils.ts`)
- **Type Safety:** Comprehensive TypeScript interfaces in `types/` directory
- **Component Structure:** Reusable components in `components/`, screen-specific in `src/screens/`

---

## 7. Security & Compliance

### 7.1 Data Security
- **Firebase Security Rules:** Enforced at Firestore and Storage levels
  - Family-scoped data access (users can only access their family's data)
  - Role-based permissions (parents vs children)
- **PIN Hashing:** Child PINs hashed with bcryptjs before storage
- **Authentication:** OAuth 2.0 via Google Sign-In, no plain-text passwords

### 7.2 Privacy
- **Data Collection:** Minimal personal data (email, display name, photos only for task evidence)
- **No Third-Party Sharing:** All data remains within Firebase/Google Cloud
- **Parental Control:** Parents have full visibility and control over child data
- **Photo Storage:** Access-controlled, auto-deletion policy (TBD for retention)

### 7.3 Compliance
- **COPPA Considerations:** Children's accounts managed by parents (no direct child registration)
- **GDPR (if applicable):** Right to data export/deletion (manual process via support)
- **Terms of Service & Privacy Policy:** Required before launch (not in scope for development)

---

## 8. Constraints & Assumptions

### 8.1 Technical Constraints
- Mobile-only (no web version in V1)
- Requires internet for task sync and payout approvals (offline task viewing supported)
- Firebase free tier limits (may require Blaze plan for scaling)

### 8.2 User Assumptions
- Parents have smartphones (Android/iOS)
- Families speak English (no internationalization in V1)
- Users comfortable with Google account sign-in
- South African currency context (ZAR) is acceptable for initial market

### 8.3 Business Assumptions
- **Monetization Strategy:** Not required for MVP (freemium model planned for V2)
- **Support:** Community-based support via GitHub Issues initially
- **Distribution:** Direct APK download and/or Google Play Store listing

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Low user adoption due to market competition | High | Medium | Focus on unique photo evidence and financial education angle; targeted marketing to parent communities |
| Firebase costs exceed budget at scale | Medium | Medium | Monitor usage; implement data retention policies; plan migration to Blaze plan |
| Children bypass PIN security on shared devices | Medium | Low | Educate parents on device security best practices; consider device-level parental controls |
| Task verification becomes burdensome for parents | High | Medium | Streamline approval UI; consider auto-approval for trusted children after streak milestones |
| Lesson content becomes stale or insufficient | Medium | Medium | Plan content update cadence; collect user feedback for new lesson requests |
| Technical debt from hybrid architecture (Firebase + Prisma + GraphQL) | Medium | High | Document architecture decisions; prioritize simplification in V1.1; remove unused layers |

---

## 10. Roadmap & Future Enhancements

### 10.1 Post-MVP Features (V1.1-V1.5)
- **Allowance Automation:** Scheduled recurring allowance deposits
- **Goal Setting:** Children set savings goals with progress tracking
- **Task Templates:** Library of pre-built task templates by age group
- **Family Announcements:** Broadcast messages from parents to children
- **Improved Reporting:** Detailed analytics for parents (spending patterns, task completion trends)

### 10.2 Major Enhancements (V2.0+)
- **Multi-Currency Support:** Expand beyond ZAR
- **Bank Integration:** Direct deposit of payouts to child savings accounts
- **Web Dashboard:** Parent portal for task management from desktop
- **Community Marketplace:** Share/download lesson content and task templates
- **Advanced Gamification:** Levels, avatars, virtual rewards

---

## 11. Open Questions & Decisions Needed

| Question | Status | Owner | Decision Deadline |
|----------|--------|-------|-------------------|
| Should we support email/password auth in addition to Google Sign-In? | Open | Product Team | Pre-launch |
| What is the data retention policy for completed tasks and photos? | Open | Legal/Product | Pre-launch |
| Should badge unlocking trigger automatic point bonuses? | Open | Product Team | Sprint 2 |
| How to handle payout disputes (child claims task done, parent disagrees)? | Open | Product Team | Sprint 3 |
| Is the hybrid architecture (Firebase + Prisma + GraphQL) necessary, or can we simplify? | Open | Tech Lead | Sprint 1 |

---

## 12. Success Metrics Dashboard (Post-Launch)

Track these metrics weekly for the first 3 months:

- **MAU (Monthly Active Users):** Total families with at least one session
- **Task Completion Rate:** (Completed Tasks / Assigned Tasks) × 100
- **Payout Request Frequency:** Average requests per family per month
- **Lesson Engagement:** % of children who complete at least one lesson
- **App Crashes:** Crash-free rate %
- **User Feedback:** App store reviews and support tickets

---

## 13. Stakeholder Sign-Off

| Role | Name | Approval Date | Signature |
|------|------|---------------|-----------|
| Product Owner | [TBD] | Pending | |
| Tech Lead | [TBD] | Pending | |
| UX/UI Lead | [TBD] | Pending | |
| QA Lead | [TBD] | Pending | |

---

## Appendix A: Key Screen Flows

### Parent Onboarding Flow
1. Launch app → Google Sign-In
2. Create family profile (family name, currency)
3. Add first child (name, age group, PIN setup)
4. Tutorial walkthrough (create task, assign, approve)
5. Dashboard home screen

### Child Task Completion Flow
1. Child logs in with PIN
2. Views assigned tasks
3. Selects task → Marks "In Progress"
4. Completes task → Takes photo evidence
5. Submits for review
6. Receives notification on approval → Points added

### Payout Request Flow
1. Child checks points balance
2. Requests payout (enter ZAR amount)
3. System calculates required points
4. Parent receives notification
5. Parent approves/rejects with note
6. Points deducted (if approved), transaction recorded

---

## Appendix B: Data Models (Summary)

### Firestore Collections

**users**
```
{
  id: string
  email: string (parent only)
  displayName: string
  role: 'parent' | 'child'
  familyId: string
  ageGroup?: 'junior' | 'standard' | 'teen'
  points: number
  currentStreak: number
  longestStreak: number
  pinHash?: string (child only)
  createdAt: timestamp
}
```

**tasks**
```
{
  id: string
  familyId: string
  title: string
  description?: string
  category: string
  points: number
  createdBy: string (userId)
  assignees: string[] (userIds)
  isTeamTask: boolean
  recurring: { type, daysOfWeek?, dayOfMonth? }
  dueDate?: timestamp
  status: TaskStatus
  evidence?: { photoUrl, note, submittedAt, submittedBy }
  reviewFeedback?: string
  completedAt?: timestamp
  createdAt: timestamp
}
```

**payout_requests**
```
{
  id: string
  familyId: string
  childId: string
  amountPoints: number
  amountZar: number
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: timestamp
  reviewedBy?: string (userId)
  reviewedAt?: timestamp
  paymentNote?: string
  paymentMethod?: 'cash' | 'transfer' | 'other'
}
```

**lessons**
```
{
  id: string
  title: string
  description: string
  content: string
  ageGroup: AgeGroup
  pointsReward: number
  quiz: [{ question, options[], correctIndex, explanation }]
}
```

**badges**
```
{
  userId: string (document ID)
  unlocked: BadgeId[]
  unlockedAt: { [badgeId]: timestamp }
}
```

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Jan 2026 | Architect Agent | Initial PRD creation based on codebase analysis |

---

**End of Document**
