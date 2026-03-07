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
import type { PointTransaction, Task } from '@/src/types';

export interface CreateTaskInput {
  title: string;
  description?: string;
  points: number;
  assignedToChildId: string;
}

interface TaskContextType {
  tasks: Task[];
  transactions: PointTransaction[];
  loading: boolean;
  error: string | null;
  createTask: (input: CreateTaskInput) => Promise<void>;
  submitTask: (taskId: string) => Promise<void>;
  reviewTask: (taskId: string, decision: 'approved' | 'returned', feedback?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { userProfile, effectiveRole, effectiveUserProfile, refreshFamily } = useFamily();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScopedData = useCallback(async (): Promise<{ tasks: Task[]; transactions: PointTransaction[] }> => {
    const scopedProfile = effectiveUserProfile;
    if (!scopedProfile?.familyId) return { tasks: [], transactions: [] };

    if (effectiveRole === 'parent') {
      const familyTasks = await getFamilyTasks(scopedProfile.familyId);
      return { tasks: familyTasks, transactions: [] };
    }

    const childId = scopedProfile.id;
    if (!childId) throw new Error('Child profile not found');

    const [childTasks, childTransactions] = await Promise.all([
      getChildTasks(scopedProfile.familyId, childId),
      getChildTransactions(scopedProfile.familyId, childId, 10),
    ]);

    return {
      tasks: childTasks,
      transactions: childTransactions,
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
      setError(null);
      return;
    }

    await runWithState(async () => {
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
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
    });
  };

  const submitTask = async (taskId: string) => {
    const scopedProfile = effectiveUserProfile;
    if (!scopedProfile?.familyId) throw new Error('Family context is not ready');
    if (!user) throw new Error('Authenticated user not found');
    if (effectiveRole !== 'child') throw new Error('Only children can submit tasks');

    await runWithState(async () => {
      const childId = scopedProfile.id;
      if (!childId) throw new Error('Child profile not found');
      await submitTaskService(taskId, childId);
      const scoped = await loadScopedData();
      setTasks(scoped.tasks);
      setTransactions(scoped.transactions);
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
      await refreshFamily();
    });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        transactions,
        loading,
        error,
        createTask,
        submitTask,
        reviewTask,
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
