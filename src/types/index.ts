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
  type: 'task_reward' | 'adjustment';
  pointsDelta: number;
  balanceAfter: number;
  relatedTaskId?: string;
  note?: string;
  createdAt: Date;
}
