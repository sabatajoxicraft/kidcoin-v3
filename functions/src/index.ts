import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
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
