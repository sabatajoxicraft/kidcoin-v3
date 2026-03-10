import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

initializeApp();
const firestore = getFirestore();

// ─── Helpers ────────────────────────────────────────────────────────────────

interface PushTarget {
  token: string;
  platform: string;
}

/**
 * Looks up the user's stored FCM device token.
 * Returns null if the user has no token or only an Expo token (not direct-FCM).
 */
async function getDeviceToken(userId: string): Promise<PushTarget | null> {
  const snap = await firestore.doc(`users/${userId}`).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.pushTokenType !== 'device' || !data.expoPushToken) return null;
  return {
    token: data.expoPushToken,
    platform: data.pushTokenPlatform ?? 'android',
  };
}

/** Sends an FCM notification. Returns true on success, false on failure. */
async function sendPush(
  target: PushTarget,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<boolean> {
  try {
    await getMessaging().send({
      token: target.token,
      notification: { title, body },
      data: data ?? {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'kidcoin-default',
          sound: 'default',
          priority: 'high',
        },
      },
    });
    logger.info('FCM sent', { title, platform: target.platform });
    return true;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    // Token is stale/invalid — could clean up, but log for now
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      logger.warn('Stale FCM token', { code });
    } else {
      logger.error('FCM send failed', { err });
    }
    return false;
  }
}

// ─── Task triggers ──────────────────────────────────────────────────────────

/** New task created with status "assigned" → notify child */
export const onTaskCreated = onDocumentCreated('tasks/{taskId}', async (event) => {
  const data = event.data?.data();
  if (!data || data.status !== 'assigned') return;

  const target = await getDeviceToken(data.assignedToChildId);
  if (!target) return;

  await sendPush(
    target,
    '📋 New Task Assigned',
    `"${data.title}" has been assigned to you!`,
    { type: 'task_assigned', taskId: event.params.taskId },
  );
});

/** Task status transitions → notify appropriate party */
export const onTaskUpdated = onDocumentUpdated('tasks/{taskId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  const oldStatus = before.status as string;
  const newStatus = after.status as string;
  if (oldStatus === newStatus) return;

  const taskId = event.params.taskId;

  // submitted → approved: notify child
  if (oldStatus === 'submitted' && newStatus === 'approved') {
    const target = await getDeviceToken(after.assignedToChildId);
    if (target) {
      await sendPush(
        target,
        '✅ Task Approved!',
        `"${after.title}" was approved — you earned ${after.points} pts!`,
        { type: 'task_approved', taskId },
      );
    }
    return;
  }

  // submitted → returned: notify child
  if (oldStatus === 'submitted' && newStatus === 'returned') {
    const detail = after.feedback ? `: ${after.feedback}` : '.';
    const target = await getDeviceToken(after.assignedToChildId);
    if (target) {
      await sendPush(
        target,
        '↩️ Task Returned',
        `"${after.title}" needs changes${detail}`,
        { type: 'task_returned', taskId },
      );
    }
    return;
  }

  // assigned/returned → submitted: notify parent
  if (
    (oldStatus === 'assigned' || oldStatus === 'returned') &&
    newStatus === 'submitted'
  ) {
    const target = await getDeviceToken(after.createdByParentId);
    if (target) {
      await sendPush(
        target,
        '📸 Task Ready for Review',
        `"${after.title}" has been submitted.`,
        { type: 'task_submitted', taskId },
      );
    }
  }
});

// ─── Payout triggers ────────────────────────────────────────────────────────

/** New payout request created → notify family owner (parent) */
export const onPayoutCreated = onDocumentCreated(
  'payoutRequests/{requestId}',
  async (event) => {
    const data = event.data?.data();
    if (!data || data.status !== 'pending') return;

    // Look up child name for the notification body
    const childSnap = await firestore.doc(`users/${data.childId}`).get();
    const childName = childSnap.data()?.displayName ?? 'Your child';

    // Look up family owner to find who to notify
    const familySnap = await firestore.doc(`families/${data.familyId}`).get();
    const ownerId = familySnap.data()?.ownerId;
    if (!ownerId) return;

    const target = await getDeviceToken(ownerId);
    if (!target) return;

    await sendPush(
      target,
      '💳 Payout Request',
      `${childName} is requesting ${data.requestedPoints} pts.`,
      { type: 'payout_created', requestId: event.params.requestId },
    );
  },
);

/** Payout status transitions → notify child */
export const onPayoutUpdated = onDocumentUpdated(
  'payoutRequests/{requestId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const oldStatus = before.status as string;
    const newStatus = after.status as string;
    if (oldStatus !== 'pending') return;

    const requestId = event.params.requestId;

    if (newStatus === 'approved') {
      const target = await getDeviceToken(after.childId);
      if (target) {
        await sendPush(
          target,
          '💰 Payout Approved!',
          `Your request for ${after.requestedPoints} pts was approved!`,
          { type: 'payout_approved', requestId },
        );
      }
    } else if (newStatus === 'rejected') {
      const target = await getDeviceToken(after.childId);
      if (target) {
        await sendPush(
          target,
          '❌ Payout Not Approved',
          `Your request for ${after.requestedPoints} pts was declined.`,
          { type: 'payout_rejected', requestId },
        );
      }
    }
  },
);

// ─── Weekly Allowance ────────────────────────────────────────────────────────

/** Returns the current date key (YYYY-MM-DD) in the given IANA timezone. */
function localDateKey(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const p: Record<string, string> = {};
  for (const { type, value } of parts) p[type] = value;
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Deposits weekly allowance points for every child with a positive
 * weeklyAllowancePoints value.  Runs every Monday at 06:00 SAST.
 *
 * Idempotency: each deposit uses a deterministic document ID based on the
 * child ID and the Monday date key (YYYY-MM-DD), so re-runs within the same
 * week are no-ops.
 */
export const weeklyAllowanceDeposit = onSchedule(
  {
    schedule: 'every monday 06:00',
    timeZone: 'Africa/Johannesburg',
    retryCount: 3,
  },
  async () => {
    // Compute the current date key in SAST for idempotency
    const mondayKey = localDateKey('Africa/Johannesburg');

    logger.info('weeklyAllowanceDeposit starting', { mondayKey });

    // Query all child users; positive-allowance check is done inside the loop
    const childrenSnap = await firestore
      .collection('users')
      .where('role', '==', 'child')
      .get();

    if (childrenSnap.empty) {
      logger.info('No children found');
      return;
    }

    let deposited = 0;
    let skipped = 0;

    for (const childDoc of childrenSnap.docs) {
      const childData = childDoc.data();
      const childId = childDoc.id;
      const familyId = childData.familyId as string | undefined;

      // Guard: must be a valid child with a family and a positive allowance
      if (childData.role !== 'child' || !familyId) {
        skipped++;
        continue;
      }
      if (!childData.weeklyAllowancePoints || childData.weeklyAllowancePoints <= 0) {
        continue;
      }

      const txDocId = `weekly_allowance_${childId}_${mondayKey}`;
      const txRef = firestore.doc(`pointTransactions/${txDocId}`);

      try {
        const txResult = await firestore.runTransaction(async (transaction) => {
          // Check idempotency — if this week's deposit already exists, skip
          const existingTx = await transaction.get(txRef);
          if (existingTx.exists) {
            return 'already_done' as const;
          }

          // Re-read the child doc inside the transaction for consistency
          const freshChildSnap = await transaction.get(childDoc.ref);
          const freshChild = freshChildSnap.data();
          if (!freshChild || freshChild.role !== 'child' || !freshChild.familyId) {
            return 'skipped' as const;
          }

          const freshAllowance =
            typeof freshChild.weeklyAllowancePoints === 'number'
              ? freshChild.weeklyAllowancePoints
              : 0;
          if (freshAllowance <= 0) {
            return 'skipped' as const;
          }

          const currentPoints = typeof freshChild.points === 'number' ? freshChild.points : 0;
          const balanceAfter = currentPoints + freshAllowance;

          // Update child's point balance
          transaction.update(childDoc.ref, { points: balanceAfter });

          // Write the point transaction
          transaction.set(txRef, {
            id: txDocId,
            familyId: freshChild.familyId,
            childId,
            type: 'weekly_allowance',
            pointsDelta: freshAllowance,
            balanceAfter,
            note: `Weekly allowance deposit (${mondayKey})`,
            createdAt: new Date(),
          });

          return 'deposited' as const;
        });

        if (txResult === 'deposited') {
          deposited++;
        } else {
          skipped++;
        }
      } catch (err) {
        logger.error('Weekly allowance deposit failed for child', {
          childId,
          error: err,
        });
      }
    }

    logger.info('weeklyAllowanceDeposit complete', { deposited, skipped });
  },
);
