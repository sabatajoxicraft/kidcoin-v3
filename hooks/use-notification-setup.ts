import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  requestNotificationPermission,
  setupNotificationChannel,
  storePushToken,
} from '@/lib/notification-service';

/**
 * Initializes the notification infrastructure once the user is authenticated:
 * - creates the Android channel,
 * - requests OS permission,
 * - stores the Expo push token in the user's profile (best-effort).
 *
 * Must be rendered inside `AuthProvider`.
 */
export function useNotificationSetup(): void {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    async function initialize() {
      await setupNotificationChannel();
      const granted = await requestNotificationPermission();
      if (granted && user) {
        await storePushToken(user.uid);
      }
    }

    initialize().catch((err) =>
      console.warn('[notifications] Setup failed:', err),
    );
  }, [user?.uid]); // re-run if the signed-in user changes
}
