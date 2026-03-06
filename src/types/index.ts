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
