import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PointTransaction, Task, TaskEvidence } from '@/src/types';

type UserRole = 'parent' | 'child';

type UserRecord = {
  role?: UserRole;
  familyId?: string | null;
  points?: number;
};

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function toOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function mapEvidence(raw: Record<string, unknown> | undefined): TaskEvidence | undefined {
  if (!raw || !raw.downloadUrl) return undefined;
  return {
    ...(raw as Omit<TaskEvidence, 'uploadedAt'>),
    uploadedAt: toDate(raw.uploadedAt),
  };
}

function mapTask(data: Record<string, unknown>): Task {
  return {
    ...(data as Omit<Task, 'createdAt' | 'updatedAt' | 'submittedAt' | 'reviewedAt' | 'evidence'>),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    submittedAt: toOptionalDate(data.submittedAt),
    reviewedAt: toOptionalDate(data.reviewedAt),
    ...(data.evidence ? { evidence: mapEvidence(data.evidence as Record<string, unknown>) } : {}),
  };
}

function mapTransaction(data: Record<string, unknown>): PointTransaction {
  return {
    ...(data as Omit<PointTransaction, 'createdAt'>),
    createdAt: toDate(data.createdAt),
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
    points: data.points as number | undefined,
  };
}

function assertUserRoleAndFamily(user: UserRecord, expectedRole: UserRole, familyId: string): void {
  if (user.role !== expectedRole) throw new Error(`User must be a ${expectedRole}`);
  if (user.familyId !== familyId) throw new Error('User does not belong to this family');
}

export async function createTask(
  familyId: string,
  parentId: string,
  title: string,
  description: string | undefined,
  points: number,
  assignedToChildId: string,
): Promise<Task> {
  const trimmedTitle = title.trim();
  const trimmedDescription = description?.trim();
  const normalizedPoints = Math.floor(points);

  if (!trimmedTitle) throw new Error('Task title is required');
  if (!Number.isFinite(points) || normalizedPoints <= 0) {
    throw new Error('Points must be greater than zero');
  }

  await ensureFamilyExists(familyId);
  const [parent, child] = await Promise.all([getUserRecord(parentId), getUserRecord(assignedToChildId)]);

  assertUserRoleAndFamily(parent, 'parent', familyId);
  assertUserRoleAndFamily(child, 'child', familyId);

  const taskRef = doc(collection(db, 'tasks'));
  const now = new Date();
  const task: Task = {
    id: taskRef.id,
    familyId,
    title: trimmedTitle,
    points: normalizedPoints,
    assignedToChildId,
    createdByParentId: parentId,
    status: 'assigned',
    createdAt: now,
    updatedAt: now,
    ...(trimmedDescription ? { description: trimmedDescription } : {}),
  };

  await setDoc(taskRef, task);
  return task;
}

export async function getFamilyTasks(familyId: string): Promise<Task[]> {
  await ensureFamilyExists(familyId);

  const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('familyId', '==', familyId)));
  const tasks = sortByCreatedAtDesc(
    tasksSnap.docs.map((taskDoc) => mapTask(taskDoc.data() as Record<string, unknown>)),
  );

  for (const task of tasks) {
    if (task.familyId !== familyId) {
      throw new Error('Task family mismatch detected');
    }
  }

  return tasks;
}

export async function getChildTasks(familyId: string, childId: string): Promise<Task[]> {
  await ensureFamilyExists(familyId);
  const child = await getUserRecord(childId);
  assertUserRoleAndFamily(child, 'child', familyId);

  const tasksSnap = await getDocs(
    query(
      collection(db, 'tasks'),
      where('familyId', '==', familyId),
      where('assignedToChildId', '==', childId),
    ),
  );

  const tasks = sortByCreatedAtDesc(
    tasksSnap.docs.map((taskDoc) => mapTask(taskDoc.data() as Record<string, unknown>)),
  );

  for (const task of tasks) {
    if (task.familyId !== familyId || task.assignedToChildId !== childId) {
      throw new Error('Child task consistency check failed');
    }
  }

  return tasks;
}

export async function submitTask(taskId: string, childId: string, evidence?: TaskEvidence): Promise<void> {
  if (!taskId) throw new Error('Task ID is required');
  const taskRef = doc(db, 'tasks', taskId);

  const [taskSnap, child] = await Promise.all([getDoc(taskRef), getUserRecord(childId)]);
  if (!taskSnap.exists()) throw new Error('Task not found');

  const task = mapTask(taskSnap.data() as Record<string, unknown>);
  assertUserRoleAndFamily(child, 'child', task.familyId);

  if (task.assignedToChildId !== childId) {
    throw new Error('Task does not belong to this child');
  }
  if (task.status !== 'assigned' && task.status !== 'returned') {
    throw new Error('Task cannot be submitted');
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: 'submitted',
    submittedAt: now,
    reviewedAt: deleteField(),
    feedback: deleteField(),
    updatedAt: now,
  };
  if (evidence) {
    updateData.evidence = evidence;
  }
  await updateDoc(taskRef, updateData);
}

export async function reviewTask(
  taskId: string,
  parentId: string,
  decision: 'approved' | 'returned',
  feedback?: string,
): Promise<void> {
  if (!taskId) throw new Error('Task ID is required');
  const taskRef = doc(db, 'tasks', taskId);
  const taskSnap = await getDoc(taskRef);
  if (!taskSnap.exists()) throw new Error('Task not found');

  const currentTask = mapTask(taskSnap.data() as Record<string, unknown>);
  const [parent, assignedChild] = await Promise.all([
    getUserRecord(parentId),
    getUserRecord(currentTask.assignedToChildId),
  ]);

  assertUserRoleAndFamily(parent, 'parent', currentTask.familyId);
  assertUserRoleAndFamily(assignedChild, 'child', currentTask.familyId);

  if (currentTask.status !== 'submitted') {
    throw new Error('Only submitted tasks can be reviewed');
  }

  const trimmedFeedback = feedback?.trim();

  await runTransaction(db, async (transaction) => {
    const transactionTaskSnap = await transaction.get(taskRef);
    if (!transactionTaskSnap.exists()) throw new Error('Task not found');

    const task = mapTask(transactionTaskSnap.data() as Record<string, unknown>);
    if (task.familyId !== currentTask.familyId) throw new Error('Task family mismatch');
    if (task.status !== 'submitted') throw new Error('Task is no longer submitted');

    const childRef = doc(db, 'users', task.assignedToChildId);
    const childSnap = await transaction.get(childRef);
    if (!childSnap.exists()) throw new Error('Assigned child not found');

    const childData = childSnap.data() as UserRecord;
    if (childData.role !== 'child') throw new Error('Assigned user must be a child');
    if (childData.familyId !== task.familyId) {
      throw new Error('Assigned child does not belong to the task family');
    }

    const now = new Date();
    const taskUpdate: Record<string, unknown> = {
      status: decision,
      reviewedAt: now,
      updatedAt: now,
      feedback: trimmedFeedback ? trimmedFeedback : deleteField(),
    };

    transaction.update(taskRef, taskUpdate);

    if (decision === 'approved') {
      const currentBalance = typeof childData.points === 'number' ? childData.points : 0;
      const balanceAfter = currentBalance + task.points;
      transaction.update(childRef, { points: balanceAfter });

      // Deterministic ID keyed to the task prevents duplicate reward
      // documents when Firestore retries the transaction callback.
      const transactionRef = doc(db, 'pointTransactions', `reward_${task.id}`);
      const pointTransaction: PointTransaction = {
        id: transactionRef.id,
        familyId: task.familyId,
        childId: task.assignedToChildId,
        type: 'task_reward',
        pointsDelta: task.points,
        balanceAfter,
        relatedTaskId: task.id,
        createdAt: now,
        ...(trimmedFeedback ? { note: trimmedFeedback } : {}),
      };

      transaction.set(transactionRef, pointTransaction);
    }
  });
}

export async function getChildTransactions(
  familyId: string,
  childId: string,
  limit?: number,
): Promise<PointTransaction[]> {
  await ensureFamilyExists(familyId);
  const child = await getUserRecord(childId);
  assertUserRoleAndFamily(child, 'child', familyId);

  const transactionsSnap = await getDocs(
    query(
      collection(db, 'pointTransactions'),
      where('familyId', '==', familyId),
      where('childId', '==', childId),
    ),
  );

  const transactions = sortByCreatedAtDesc(
    transactionsSnap.docs.map((txDoc) => mapTransaction(txDoc.data() as Record<string, unknown>)),
  );

  for (const transaction of transactions) {
    if (transaction.familyId !== familyId || transaction.childId !== childId) {
      throw new Error('Point transaction consistency check failed');
    }
  }

  if (limit == null) return transactions;
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error('Limit must be greater than zero');
  }

  return transactions.slice(0, Math.floor(limit));
}

// ─── Real-Time Subscriptions ────────────────────────────────────

/**
 * Subscribes to all tasks belonging to a family (parent view).
 * Returns an unsubscribe function.
 */
export function subscribeFamilyTasks(
  familyId: string,
  onUpdate: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, 'tasks'), where('familyId', '==', familyId));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(sortByCreatedAtDesc(snap.docs.map((d) => mapTask(d.data() as Record<string, unknown>))));
    },
    (error) => onError(error),
  );
}

/**
 * Subscribes to tasks assigned to a specific child.
 * Returns an unsubscribe function.
 */
export function subscribeChildTasks(
  familyId: string,
  childId: string,
  onUpdate: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'tasks'),
    where('familyId', '==', familyId),
    where('assignedToChildId', '==', childId),
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(sortByCreatedAtDesc(snap.docs.map((d) => mapTask(d.data() as Record<string, unknown>))));
    },
    (error) => onError(error),
  );
}

/**
 * Subscribes to point transactions for a child, returning the most recent `resultLimit` entries.
 * Sorting and slicing are done client-side to avoid requiring a composite index.
 * Returns an unsubscribe function.
 */
export function subscribeChildTransactions(
  familyId: string,
  childId: string,
  resultLimit: number,
  onUpdate: (transactions: PointTransaction[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'pointTransactions'),
    where('familyId', '==', familyId),
    where('childId', '==', childId),
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(
        sortByCreatedAtDesc(snap.docs.map((d) => mapTransaction(d.data() as Record<string, unknown>))).slice(
          0,
          resultLimit,
        ),
      );
    },
    (error) => onError(error),
  );
}
