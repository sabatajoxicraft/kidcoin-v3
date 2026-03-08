export type AgeGroup = 'junior' | 'standard' | 'teen'; // junior=6-9, standard=10-13, teen=14+

export interface Family {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  settings: {
    pointsConversionRate: number;
    minPayoutAmount: number;
    requireParentApproval: boolean;
  };
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: 'parent' | 'child';
  familyId: string | null;
  photoURL?: string;
  createdAt: Date;
}

export interface ChildProfile extends UserProfile {
  role: 'child';
  ageGroup: AgeGroup;
  pinHash: string;
  points: number;
  familyId: string;
  pendingPayoutPoints?: number;
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

export interface PointTransaction {
  id: string;
  familyId: string;
  childId: string;
  type: 'task_reward' | 'adjustment' | 'payout_deduction' | 'lesson_reward';
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
