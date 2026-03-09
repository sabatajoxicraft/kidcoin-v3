import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFamily } from '@/contexts/family-context';
import {
  requestNotificationPermission,
  setupNotificationChannel,
  storePushToken,
  clearDeviceTokenRecords,
} from '@/lib/notification-service';

/**
 * Initializes the notification infrastructure once the user is authenticated
 * and an effective profile has been resolved:
 * - creates the Android channel,
 * - requests OS permission,
 * - stores the Expo push token on the **effective** user profile (parent UID
 *   in parent mode, child doc ID in child mode) so Cloud Functions can
 *   deliver remote push to whoever is actively using the device.
 *
 * When the effective profile changes (e.g. entering/exiting child mode), the
 * token is re-registered on the new profile and cleared from the old one.
 *
 * Must be rendered inside both `AuthProvider` and `FamilyProvider`.
 */
export function useNotificationSetup(): void {
  const { user } = useAuth();
  const { effectiveUserProfile } = useFamily();

  useEffect(() => {
    if (!user) {
      // Clear in-process records so a subsequent sign-in starts fresh.
      clearDeviceTokenRecords();
      return;
    }

    // Wait for FamilyContext to resolve the active profile.
    if (!effectiveUserProfile?.id) return;

    const profileId = effectiveUserProfile.id;

    async function initialize() {
      await setupNotificationChannel();
      const granted = await requestNotificationPermission();
      if (granted) {
        await storePushToken(profileId);
      }
    }

    initialize().catch((err) =>
      console.warn('[notifications] Setup failed:', err),
    );
  }, [user?.uid, effectiveUserProfile?.id]); // re-run on auth change or profile switch
}
