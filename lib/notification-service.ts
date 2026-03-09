import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Constants from 'expo-constants';
import { db } from '@/lib/firebase';

const CHANNEL_ID = 'kidcoin-default';

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
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default', data: {} },
    trigger: null,
  });
}

/**
 * Best-effort: fetches a push token and persists it to the user's Firestore
 * document for future remote-push use. Failures are silently warned — the
 * absence of a token must never block normal app operation.
 *
 * Strategy:
 * - When `extra.eas.projectId` is present in app.json, obtain an Expo push
 *   token (FCM-routed, works with Expo's push service).
 * - Otherwise fall back to the native device push token
 *   (`getDevicePushTokenAsync`), which is still useful for direct FCM/APNs
 *   delivery later and confirms the device is registerable.
 */
export async function storePushToken(userId: string): Promise<void> {
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

    await updateDoc(doc(db, 'users', userId), {
      expoPushToken: tokenValue,
      pushTokenType: tokenType,
      pushTokenUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[notifications] Failed to store push token:', err);
  }
}
