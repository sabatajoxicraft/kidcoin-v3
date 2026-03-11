import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SavingsGoal } from '@/src/types';

type UserRole = 'parent' | 'child';

type UserRecord = {
  role?: UserRole;
  familyId?: string | null;
};

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function toOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function mapSavingsGoal(data: Record<string, unknown>): SavingsGoal {
  return {
    ...(data as Omit<SavingsGoal, 'createdAt' | 'updatedAt' | 'archivedAt'>),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    archivedAt: toOptionalDate(data.archivedAt),
  };
}

function sortByCreatedAtDesc<T extends { createdAt: Date }>(items: T[]): T[] {
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function ensureFamilyExists(familyId: string): Promise<void> {
  if (!familyId) throw new Error('Family ID is required');
  const familySnap = await getDoc(doc(db, 'families', familyId));
  if (!familySnap.exists()) throw new Error('Family not found');
}

async function getUserRecord(userId: string): Promise<UserRecord> {
  if (!userId) throw new Error('User ID is required');
  const userSnap = await getDoc(doc(db, 'users', userId));
  if (!userSnap.exists()) throw new Error('User not found');
  const data = userSnap.data();
  return {
    role: data.role as UserRole | undefined,
    familyId: data.familyId as string | null | undefined,
  };
}

function assertUserRoleAndFamily(user: UserRecord, expectedRole: UserRole, familyId: string): void {
  if (user.role !== expectedRole) throw new Error(`User must be a ${expectedRole}`);
  if (user.familyId !== familyId) throw new Error('User does not belong to this family');
}

export async function createSavingsGoal(
  familyId: string,
  childId: string,
  title: string,
  targetPoints: number,
): Promise<SavingsGoal> {
  const trimmedTitle = title.trim();
  const normalizedTarget = Math.floor(targetPoints);

  if (!trimmedTitle) throw new Error('Goal title is required');
  if (!Number.isFinite(targetPoints) || normalizedTarget <= 0) {
    throw new Error('Target points must be greater than zero');
  }

  await ensureFamilyExists(familyId);
  const child = await getUserRecord(childId);
  assertUserRoleAndFamily(child, 'child', familyId);

  const goalRef = doc(collection(db, 'savingsGoals'));
  const now = new Date();
  const goal: SavingsGoal = {
    id: goalRef.id,
    familyId,
    childId,
    title: trimmedTitle,
    targetPoints: normalizedTarget,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(goalRef, goal);
  return goal;
}

export async function archiveSavingsGoal(
  goalId: string,
  familyId: string,
  childId: string,
): Promise<void> {
  if (!goalId) throw new Error('Goal ID is required');

  // Validate the child record belongs to this family before touching the goal.
  const child = await getUserRecord(childId);
  assertUserRoleAndFamily(child, 'child', familyId);

  const goalRef = doc(db, 'savingsGoals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) throw new Error('Goal not found');

  const goal = mapSavingsGoal(goalSnap.data() as Record<string, unknown>);
  if (goal.familyId !== familyId) throw new Error('Goal does not belong to this family');
  if (goal.childId !== childId) throw new Error('Goal does not belong to this child');
  if (goal.status === 'archived') throw new Error('Goal is already archived');

  const now = new Date();
  await updateDoc(goalRef, {
    status: 'archived',
    archivedAt: now,
    updatedAt: now,
  });
}

/**
 * Returns a clamped 0-100 integer progress percentage.
 * Returns 0 for any goal whose targetPoints is not a positive finite number,
 * preventing division-by-zero or NaN/Infinity from reaching the UI.
 */
export function safeGoalPct(currentPoints: number, targetPoints: number): number {
  if (!Number.isFinite(targetPoints) || targetPoints <= 0) return 0;
  return Math.min(100, Math.floor((currentPoints / targetPoints) * 100));
}

/**
 * Returns true only when currentPoints meets or exceeds a valid targetPoints.
 * Always returns false when targetPoints is invalid (<=0 or non-finite).
 */
export function goalReached(currentPoints: number, targetPoints: number): boolean {
  if (!Number.isFinite(targetPoints) || targetPoints <= 0) return false;
  return currentPoints >= targetPoints;
}

/**
 * Returns a safe displayable string for a goal's target.
 * Returns "? pts" when targetPoints is invalid (non-finite or ≤ 0).
 * Valid targets are formatted as "<N> pts" (floored to integer).
 */
export function safeTargetDisplay(targetPoints: number): string {
  if (!Number.isFinite(targetPoints) || targetPoints <= 0) return '? pts';
  return `${Math.floor(targetPoints)} pts`;
}

/**
 * Subscribes to savings goals for a specific child.
 * Returns an unsubscribe function.
 */
export function subscribeChildSavingsGoals(
  familyId: string,
  childId: string,
  onUpdate: (goals: SavingsGoal[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'savingsGoals'),
    where('familyId', '==', familyId),
    where('childId', '==', childId),
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(sortByCreatedAtDesc(snap.docs.map((d) => mapSavingsGoal(d.data() as Record<string, unknown>))));
    },
    (error) => onError(error),
  );
}

/**
 * Subscribes to all savings goals for a family (parent view).
 * Returns an unsubscribe function.
 */
export function subscribeFamilySavingsGoals(
  familyId: string,
  onUpdate: (goals: SavingsGoal[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, 'savingsGoals'), where('familyId', '==', familyId));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(sortByCreatedAtDesc(snap.docs.map((d) => mapSavingsGoal(d.data() as Record<string, unknown>))));
    },
    (error) => onError(error),
  );
}
