import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChildProfile, PointTransaction, Task } from '@/src/types';

// ─── Metric Types ────────────────────────────────────────────────

export interface FamilySpendingMetrics {
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface FamilyTaskMetrics {
  approved: number;
  pending: number;
  submitted: number;
  returned: number;
  assigned: number;
}

export interface ChildSpendingMetrics {
  childId: string;
  earned: number;
  spent: number;
}

export interface ChildTaskTrends {
  childId: string;
  assigned: number;
  submitted: number;
  approved: number;
  returned: number;
  recentApproved7Days: number;
}

// ─── Helpers ────────────────────────────────────────────────────

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : (value as Date);
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

// ─── Subscription ────────────────────────────────────────────────

/**
 * Subscribes to all point transactions for a family (parent view).
 * Sorting is done client-side to avoid composite indexes.
 * Returns an unsubscribe function.
 */
export function subscribeFamilyTransactions(
  familyId: string,
  onUpdate: (transactions: PointTransaction[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, 'pointTransactions'), where('familyId', '==', familyId));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(
        sortByCreatedAtDesc(snap.docs.map((d) => mapTransaction(d.data() as Record<string, unknown>))),
      );
    },
    (error) => onError(error),
  );
}

// ─── Metric Calculators ──────────────────────────────────────────

export function calculateSpendingMetrics(
  children: ChildProfile[],
  transactions: PointTransaction[],
): FamilySpendingMetrics {
  const totalBalance = children.reduce((sum, c) => sum + (c.points ?? 0), 0);

  let totalEarned = 0;
  let totalSpent = 0;
  for (const tx of transactions) {
    if (tx.pointsDelta > 0) {
      totalEarned += tx.pointsDelta;
    } else if (tx.type === 'payout_deduction') {
      totalSpent += Math.abs(tx.pointsDelta);
    }
  }

  return { totalBalance, totalEarned, totalSpent };
}

export function calculateTaskMetrics(tasks: Task[]): FamilyTaskMetrics {
  const metrics: FamilyTaskMetrics = { approved: 0, pending: 0, submitted: 0, returned: 0, assigned: 0 };
  for (const task of tasks) {
    switch (task.status) {
      case 'approved':
        metrics.approved++;
        break;
      case 'submitted':
        metrics.submitted++;
        metrics.pending++; // Submitted tasks are pending parent review
        break;
      case 'returned':
        metrics.returned++;
        break;
      case 'assigned':
        metrics.assigned++;
        break;
    }
  }
  return metrics;
}

export function calculateChildSpending(
  childId: string,
  transactions: PointTransaction[],
): ChildSpendingMetrics {
  let earned = 0;
  let spent = 0;
  for (const tx of transactions) {
    if (tx.childId !== childId) continue;
    if (tx.pointsDelta > 0) {
      earned += tx.pointsDelta;
    } else if (tx.type === 'payout_deduction') {
      spent += Math.abs(tx.pointsDelta);
    }
  }
  return { childId, earned, spent };
}

export function calculateChildTaskTrends(childId: string, tasks: Task[]): ChildTaskTrends {
  const childTasks = tasks.filter((t) => t.assignedToChildId === childId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let assigned = 0;
  let submitted = 0;
  let approved = 0;
  let returned = 0;
  let recentApproved7Days = 0;

  for (const task of childTasks) {
    switch (task.status) {
      case 'assigned':
        assigned++;
        break;
      case 'submitted':
        submitted++;
        break;
      case 'approved':
        approved++;
        if (task.reviewedAt && task.reviewedAt >= sevenDaysAgo) {
          recentApproved7Days++;
        }
        break;
      case 'returned':
        returned++;
        break;
    }
  }

  return { childId, assigned, submitted, approved, returned, recentApproved7Days };
}
