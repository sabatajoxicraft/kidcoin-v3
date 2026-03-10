import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import Constants from 'expo-constants';
import { db } from '@/lib/firebase';

const CHANNEL_ID = 'kidcoin-default';

// ─── In-process device-token registry ────────────────────────────────────────
// Tracks profile IDs for whom a direct device push token was successfully
// stored in the current JS process.  "Profile" means the effective user —
// parent UID when in parent mode, child doc ID when in child mode.
// Used as an early-suppression signal in useTaskNotifications to close the
// race window between a successful storePushToken() call and the Firestore
// realtime listener reflecting the new pushTokenType field.
const _deviceTokenStoredIds = new Set<string>();

/**
 * Returns `true` when a direct device push token has been successfully stored
 * for `profileId` during the current app process.
 */
export function hasStoredDeviceToken(profileId: string): boolean {
  return _deviceTokenStoredIds.has(profileId);
}

/**
 * Clears all in-process device-token records.
 * Call this when the authenticated user signs out so a subsequent sign-in
 * starts with a clean slate.
 */
export function clearDeviceTokenRecords(): void {
  _deviceTokenStoredIds.clear();
}

// Configure how notifications are presented while the app is in the foreground.
// Called once at module-load time so the handler is guaranteed to be set before
// any notification can arrive.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Creates the Android notification channel used by all KidCoin notifications. */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'KidCoin',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

/**
 * Requests OS-level notification permission.
 * Returns `true` when permission is (or was already) granted.
 * Always returns `false` on web where the API is not available.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Fires an immediate local notification. Non-throwing — logs on failure. */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default', data: data ?? {} },
    trigger: null,
  });
}

/**
 * Removes push-token fields from every `users/{id}` document that currently
 * holds `tokenValue`, except the document identified by `keepProfileId`.
 * Best-effort — failures are warned but never propagate.
 */
async function clearTokenFromOtherProfiles(
  tokenValue: string,
  keepProfileId: string,
): Promise<void> {
  const q = query(
    collection(db, 'users'),
    where('expoPushToken', '==', tokenValue),
  );
  const snap = await getDocs(q);
  const ops: Promise<void>[] = [];
  for (const d of snap.docs) {
    if (d.id !== keepProfileId) {
      ops.push(
        updateDoc(d.ref, {
          expoPushToken: deleteField(),
          pushTokenType: deleteField(),
          pushTokenPlatform: deleteField(),
          pushTokenUpdatedAt: deleteField(),
        }),
      );
    }
  }
  await Promise.all(ops);
}

/**
 * Best-effort: fetches a push token and persists it to the given profile's
 * Firestore document for future remote-push use.  When the token already
 * exists on a different profile doc (e.g. after a parent ↔ child mode
 * switch), those stale entries are cleared first so one app instance maps
 * to exactly one active profile at a time.
 *
 * `profileId` is the `effectiveUserProfile.id` — the parent UID when in
 * parent mode, or the child's separate Firestore doc ID in child mode.
 *
 * Failures are silently warned — the absence of a token must never block
 * normal app operation.
 *
 * Strategy:
 * - When `extra.eas.projectId` is present in app.json, obtain an Expo push
 *   token (FCM-routed, works with Expo's push service).
 * - Otherwise fall back to the native device push token
 *   (`getDevicePushTokenAsync`), which is still useful for direct FCM/APNs
 *   delivery later and confirms the device is registerable.
 */
export async function storePushToken(profileId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const projectId = (
      Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
    )?.eas?.projectId;

    let tokenValue: string;
    let tokenType: 'expo' | 'device';

    if (projectId) {
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      tokenValue = tokenData.data;
      tokenType = 'expo';
    } else {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      tokenValue = tokenData.data;
      tokenType = 'device';
    }

    // Unbind this token from any other profile doc so one device → one profile.
    try {
      await clearTokenFromOtherProfiles(tokenValue, profileId);
    } catch (cleanupErr) {
      console.warn(
        '[notifications] Token cleanup from other profiles failed (non-fatal):',
        cleanupErr,
      );
    }

    await updateDoc(doc(db, 'users', profileId), {
      expoPushToken: tokenValue,
      pushTokenType: tokenType,
      pushTokenPlatform: Platform.OS,
      pushTokenUpdatedAt: serverTimestamp(),
    });

    // Mark this profileId as having a stored device token in the current
    // process so useTaskNotifications can suppress local duplicates
    // immediately — before the Firestore profile listener propagates the
    // new field.  Clear first to ensure at most one profile is tracked
    // per app instance (handles parent ↔ child rebinding).
    if (tokenType === 'device') {
      _deviceTokenStoredIds.clear();
      _deviceTokenStoredIds.add(profileId);
    }
  } catch (err) {
    console.warn('[notifications] Failed to store push token:', err);
  }
}
