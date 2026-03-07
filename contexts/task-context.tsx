import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFamily } from '@/contexts/family-context';
import {
  createTask as createTaskService,
  getChildTasks,
  getChildTransactions,
  getFamilyTasks,
  reviewTask as reviewTaskService,
  submitTask as submitTaskService,
} from '@/lib/task-service';
import {
  createPayoutRequest as createPayoutRequestService,
  getChildPayoutRequests,
  getFamilyPayoutRequests,
  reviewPayoutRequest as reviewPayoutRequestService,
} from '@/lib/payout-service';
import type { EvidenceDraft, PayoutRequest, PointTransaction, Task, TaskEvidence } from '@/src/types';
import { deleteTaskEvidence, uploadTaskEvidence } from '@/lib/evidence-service';

export interface CreateTaskInput {
  title: string;
  description?: string;
  points: number;
  assignedToChildId: string;
}

interface TaskContextType {
  tasks: Task[];
  transactions: PointTransaction[];
  payoutRequests: PayoutRequest[];
  loading: boolean;
  error: string | null;
  createTask: (input: CreateTaskInput) => Promise<void>;
  submitTask: (taskId: string, evidenceDraft?: EvidenceDraft) => Promise<void>;
  reviewTask: (taskId: string, decision: 'approved' | 'returned', feedback?: string) => Promise<void>;
  requestPayout: (requestedPoints: number, requestNote?: string) => Promise<void>;
  reviewPayoutRequest: (requestId: string, decision: 'approved' | 'rejected', reviewNote?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { userProfile, effectiveRole, effectiveUserProfile, refreshFamily } = useFamily();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScopedData = useCallback(async (): Promise<{
    tasks: Task[];
    transactions: PointTransaction[];
    payoutRequests: PayoutRequest[];
  }> => {
    const scopedProfile = effectiveUserProfile;
    if (!scopedProfile?.familyId) return { tasks: [], transactions: [], payoutRequests: [] };

    if (effectiveRole === 'parent') {
      const [familyTasks, familyPayoutRequests] = await Promise.all([
        getFamilyTasks(scopedProfile.familyId),
        getFamilyPayoutRequests(scopedProfile.familyId),
      ]);
      return { tasks: familyTasks, transactions: [], payoutRequests: familyPayoutRequests };
    }

    const childId = scopedProfile.id;
    if (!childId) throw new Error('Child profile not found');

    const [childTasks, childTransactions, childPayoutRequests] = await Promise.all([
      getChildTasks(scopedProfile.familyId, childId),
      getChildTransactions(scopedProfile.familyId, childId, 10),
      getChildPayoutRequests(scopedProfile.familyId, childId),
    ]);

    return {
      tasks: childTasks,
      transactions: childTransactions,
      payoutRequests: childPayoutRequests,
    };
  }, [effectiveRole, effectiveUserProfile]);

  const runWithState = useCallback(async (work: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      console.error('[TaskContext] operation failed:', e);
      const message = e instanceof Error ? e.message : 'Task operation failed.';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user || !effectiveUserProfile?.familyId) {
      setTasks([]);
      setTransactions([]);
      setPayoutRequests([]);
      setError(null);
      return;
    }

    await runWithState(async () => {
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
      setPayoutRequests(scoped.payoutRequests);
    });
  }, [effectiveUserProfile?.familyId, loadScopedData, runWithState, user]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const createTask = async (input: CreateTaskInput) => {
    if (!user || !userProfile?.familyId) throw new Error('Family context is not ready');
    if (userProfile.role !== 'parent' || effectiveRole !== 'parent') {
      throw new Error('Only parents can create tasks');
    }
    const familyId = userProfile.familyId;

    await runWithState(async () => {
      await createTaskService(
        familyId,
        user.uid,
        input.title,
        input.description,
        input.points,
        input.assignedToChildId,
      );
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
      setPayoutRequests(scoped.payoutRequests);
    });
  };

  const submitTask = async (taskId: string, evidenceDraft?: EvidenceDraft) => {
    const scopedProfile = effectiveUserProfile;
    if (!scopedProfile?.familyId) throw new Error('Family context is not ready');
    if (!user) throw new Error('Authenticated user not found');
    if (effectiveRole !== 'child') throw new Error('Only children can submit tasks');

    await runWithState(async () => {
      const childId = scopedProfile.id;
      if (!childId) throw new Error('Child profile not found');
      const familyId = scopedProfile.familyId;
      if (!familyId) throw new Error('Family context is not ready');

      // Snapshot any existing evidence path before upload so we can clean it up
      // after a successful resubmission with a new draft (returned-task flow).
      const priorStoragePath = evidenceDraft
        ? tasks.find((t) => t.id === taskId)?.evidence?.storagePath
        : undefined;

      let evidence: TaskEvidence | undefined;
      if (evidenceDraft) {
        evidence = await uploadTaskEvidence(
          familyId,
          taskId,
          childId,
          evidenceDraft,
        );
      }

      try {
        await submitTaskService(taskId, childId, evidence);
      } catch (submitError) {
        // Upload succeeded but Firestore write failed — delete the orphaned object.
        if (evidence) {
          try {
            await deleteTaskEvidence(evidence.storagePath);
          } catch (cleanupError) {
            throw new Error(
              `Task submission failed: ${submitError instanceof Error ? submitError.message : String(submitError)}. ` +
              `Evidence cleanup also failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
            );
          }
        }
        throw submitError;
      }

      // Firestore write succeeded. Delete the prior evidence object when a new
      // photo replaced it. Non-critical: log failures but do not surface them.
      if (priorStoragePath && evidence && priorStoragePath !== evidence.storagePath) {
        try {
          await deleteTaskEvidence(priorStoragePath);
        } catch (cleanupError) {
          console.warn('[TaskContext] Failed to delete prior evidence after resubmission:', cleanupError);
        }
      }
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
      setPayoutRequests(scoped.payoutRequests);
    });
  };

  const reviewTask = async (taskId: string, decision: 'approved' | 'returned', feedback?: string) => {
    if (!user || !userProfile?.familyId) throw new Error('Family context is not ready');
    if (userProfile.role !== 'parent' || effectiveRole !== 'parent') {
      throw new Error('Only parents can review tasks');
    }

    await runWithState(async () => {
      await reviewTaskService(taskId, user.uid, decision, feedback);
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
      setPayoutRequests(scoped.payoutRequests);
      await refreshFamily();
    });
  };

  const requestPayout = async (requestedPoints: number, requestNote?: string) => {
    const scopedProfile = effectiveUserProfile;
    if (!scopedProfile?.familyId) throw new Error('Family context is not ready');
    if (!user) throw new Error('Authenticated user not found');
    if (effectiveRole !== 'child') throw new Error('Only children can request payouts');

    const familyId = scopedProfile.familyId;
    await runWithState(async () => {
      const childId = scopedProfile.id;
      if (!childId) throw new Error('Child profile not found');
      await createPayoutRequestService(familyId, childId, requestedPoints, requestNote);
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
      setPayoutRequests(scoped.payoutRequests);
    });
  };

  const reviewPayoutRequest = async (
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewNote?: string,
  ) => {
    if (!user || !userProfile?.familyId) throw new Error('Family context is not ready');
    if (userProfile.role !== 'parent' || effectiveRole !== 'parent') {
      throw new Error('Only parents can review payout requests');
    }

    await runWithState(async () => {
      await reviewPayoutRequestService(requestId, user.uid, decision, reviewNote);
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
      setPayoutRequests(scoped.payoutRequests);
      await refreshFamily();
    });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        transactions,
        payoutRequests,
        loading,
        error,
        createTask,
        submitTask,
        reviewTask,
        requestPayout,
        reviewPayoutRequest,
        refresh,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}
