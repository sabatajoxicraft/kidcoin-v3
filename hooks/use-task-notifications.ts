import { useEffect, useRef } from 'react';
import { useFamily } from '@/contexts/family-context';
import { useTask } from '@/contexts/task-context';
import { scheduleLocalNotification } from '@/lib/notification-service';
import type { PayoutRequest, Task } from '@/src/types';

/**
 * Watches the real-time task and payout streams and fires a local notification
 * on each meaningful state transition.
 *
 * Rules:
 * - The FIRST data snapshot after subscribing is silently captured as the
 *   baseline, so existing tasks/payouts at launch never generate noise.
 * - Only transitions that matter to the current effective role are notified.
 * - The baseline resets whenever the effective role or active profile changes
 *   (child-mode enter/exit), so the newly-scoped view is also silent on first
 *   load.
 *
 * Must be rendered inside both `FamilyProvider` and `TaskProvider`.
 */
export function useTaskNotifications(): void {
  const { effectiveRole, effectiveUserProfile, children } = useFamily();
  const { tasks, payoutRequests, loading } = useTask();

  const prevTasksRef = useRef<Task[] | null>(null);
  const prevPayoutsRef = useRef<PayoutRequest[] | null>(null);
  const initializedRef = useRef(false);

  // Reset the baseline whenever the effective scope changes so the first
  // snapshot in the new scope is always silent.
  useEffect(() => {
    initializedRef.current = false;
    prevTasksRef.current = null;
    prevPayoutsRef.current = null;
  }, [effectiveRole, effectiveUserProfile?.id]);

  useEffect(() => {
    // Still performing the initial load — nothing to diff yet.
    if (loading) return;

    // First snapshot after (re-)subscribing: capture state without notifying.
    if (!initializedRef.current) {
      prevTasksRef.current = tasks;
      prevPayoutsRef.current = payoutRequests;
      initializedRef.current = true;
      return;
    }

    const prevTasks = prevTasksRef.current ?? [];
    const prevPayouts = prevPayoutsRef.current ?? [];

    if (effectiveRole === 'child') {
      notifyChildTransitions(tasks, prevTasks, payoutRequests, prevPayouts);
    } else {
      notifyParentTransitions(tasks, prevTasks, payoutRequests, prevPayouts, children);
    }

    prevTasksRef.current = tasks;
    prevPayoutsRef.current = payoutRequests;
  }, [tasks, payoutRequests, loading, effectiveRole, children]);
}

// ─── Role-specific diff helpers ──────────────────────────────────────────────

function notifyChildTransitions(
  tasks: Task[],
  prevTasks: Task[],
  payouts: PayoutRequest[],
  prevPayouts: PayoutRequest[],
): void {
  for (const task of tasks) {
    const prev = prevTasks.find((t) => t.id === task.id);

    // Newly assigned task (not in previous snapshot)
    if (!prev && task.status === 'assigned') {
      fire('📋 New Task Assigned', `"${task.title}" has been assigned to you!`);
      continue;
    }

    // Parent reviewed a submitted task
    if (prev?.status === 'submitted') {
      if (task.status === 'approved') {
        fire('✅ Task Approved!', `"${task.title}" was approved — you earned ${task.points} pts!`);
      } else if (task.status === 'returned') {
        const detail = task.feedback ? `: ${task.feedback}` : '.';
        fire('↩️ Task Returned', `"${task.title}" needs changes${detail}`);
      }
    }
  }

  for (const payout of payouts) {
    const prev = prevPayouts.find((p) => p.id === payout.id);
    if (prev?.status === 'pending') {
      if (payout.status === 'approved') {
        fire('💰 Payout Approved!', `Your request for ${payout.requestedPoints} pts was approved!`);
      } else if (payout.status === 'rejected') {
        fire('❌ Payout Not Approved', `Your request for ${payout.requestedPoints} pts was declined.`);
      }
    }
  }
}

function notifyParentTransitions(
  tasks: Task[],
  prevTasks: Task[],
  payouts: PayoutRequest[],
  prevPayouts: PayoutRequest[],
  children: ReturnType<typeof useFamily>['children'],
): void {
  for (const task of tasks) {
    const prev = prevTasks.find((t) => t.id === task.id);

    // Task was just submitted — covers first submission (assigned→submitted)
    // and resubmission after parent feedback (returned→submitted).
    const justSubmitted =
      (!prev && task.status === 'submitted') ||
      (prev?.status === 'assigned' && task.status === 'submitted') ||
      (prev?.status === 'returned' && task.status === 'submitted');

    if (justSubmitted) {
      fire('📸 Task Ready for Review', `"${task.title}" has been submitted.`);
    }
  }

  for (const payout of payouts) {
    const prev = prevPayouts.find((p) => p.id === payout.id);

    // New pending payout request
    if (!prev && payout.status === 'pending') {
      const child = children.find((c) => c.id === payout.childId);
      const childName = child?.displayName ?? 'Your child';
      fire('💳 Payout Request', `${childName} is requesting ${payout.requestedPoints} pts.`);
    }
  }
}

function fire(title: string, body: string): void {
  scheduleLocalNotification(title, body).catch((err) =>
    console.warn('[notifications] Failed to schedule:', err),
  );
}
