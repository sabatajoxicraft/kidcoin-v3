export type AgeGroup = 'junior' | 'standard' | 'teen'; // junior=6-9, standard=10-13, teen=14+

export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP';

export interface FamilySettings {
  pointsConversionRate: number;
  minPayoutAmount: number;
  requireParentApproval: boolean;
  currencyCode?: CurrencyCode;
}

export interface Family {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  settings: FamilySettings;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: 'parent' | 'child';
  familyId: string | null;
  photoURL?: string;
  createdAt: Date;
  /** Push token stored after permission is granted. Used for future remote push delivery. */
  expoPushToken?: string;
  /**
   * Indicates the flavour of token stored in `expoPushToken`.
   * - `'expo'`   – Expo push token (requires EAS projectId; routed via Expo's push service).
   * - `'device'` – Native FCM/APNs token obtained when no EAS projectId is configured.
   */
  pushTokenType?: 'expo' | 'device';
  /** Platform that registered the push token (e.g. 'android', 'ios'). */
  pushTokenPlatform?: string;
  /** Timestamp of the last successful push token write. */
  pushTokenUpdatedAt?: Date;
}

export interface ChildProfile extends UserProfile {
  role: 'child';
  ageGroup: AgeGroup;
  pinHash: string;
  points: number;
  familyId: string;
  pendingPayoutPoints?: number;
  weeklyAllowancePoints?: number;
}

export interface TaskEvidence {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface EvidenceDraft {
  localUri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export type TaskStatus = 'assigned' | 'submitted' | 'approved' | 'returned';

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  points: number;
  assignedToChildId: string;
  createdByParentId: string;
  status: TaskStatus;
  evidence?: TaskEvidence;
  feedback?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTemplate {
  id: string;
  ageGroup: AgeGroup;
  category: string;
  title: string;
  description: string;
  suggestedPoints: number;
  estimatedTime: string;
  parentTip: string;
}

export interface PointTransaction {
  id: string;
  familyId: string;
  childId: string;
  type: 'task_reward' | 'adjustment' | 'payout_deduction' | 'lesson_reward' | 'weekly_allowance';
  pointsDelta: number;
  balanceAfter: number;
  relatedTaskId?: string;
  relatedPayoutRequestId?: string;
  relatedLessonId?: string;
  note?: string;
  createdAt: Date;
}

// ─── Lesson & Gamification Types ─────────────────────────────────

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  ageGroup: AgeGroup;
  pointsReward: number;
  quiz: QuizQuestion[];
}

export interface LessonProgressRecord {
  lessonId: string;
  completed: boolean;
  quizScore: number;
  pointsAwarded: number;
  completedAt: Date;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: Date;
}

// ─── Savings Goals ────────────────────────────────────────────

export type SavingsGoalStatus = 'active' | 'archived';

export interface SavingsGoal {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  targetPoints: number;
  status: SavingsGoalStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

// ─── Family Announcements ─────────────────────────────────────

export type AnnouncementStatus = 'active' | 'archived';

export interface Announcement {
  id: string;
  familyId: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  createdByParentId: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export type PayoutRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PayoutRequest {
  id: string;
  familyId: string;
  childId: string;
  requestedPoints: number;
  status: PayoutRequestStatus;
  requestNote?: string;
  reviewNote?: string;
  reviewedByParentId?: string;
  reviewedAt?: Date;
  createdAt: Date;
}
