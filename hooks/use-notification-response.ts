import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

interface NotificationData {
  type?: string;
  taskId?: string;
  requestId?: string;
}

/**
 * Maps a notification data payload to the best existing screen route.
 * Returns null for unrecognised types so they are silently ignored.
 *
 * Route mapping:
 *   task_submitted   → /(parent)/tasks    (parent sees submitted tasks)
 *   payout_created   → /(parent)/payouts  (parent sees payout requests)
 *   task_assigned    → /(child)           (child's home shows pending tasks)
 *   task_approved    → /(child)
 *   task_returned    → /(child)
 *   payout_approved  → /(child)
 *   payout_rejected  → /(child)
 */
function resolveRoute(data: NotificationData): string | null {
  switch (data?.type) {
    case 'task_submitted':
      return '/(parent)/tasks';
    case 'payout_created':
      return '/(parent)/payouts';
    case 'task_assigned':
    case 'task_approved':
    case 'task_returned':
    case 'payout_approved':
    case 'payout_rejected':
      return '/(child)';
    default:
      return null;
  }
}

/**
 * Handles notification-tap deep-link routing for both warm-app taps and
 * cold-start (app launched from a notification).
 *
 * @param isReady - Pass `true` once auth and family context are fully
 *   initialised and the base route has been set. Navigation is deferred
 *   until this is true, so a cold-start notification never races the auth
 *   redirect in `_layout.tsx`.
 *
 * Duplicate-handling: tracks the last-routed notification identifier so
 * cold-start and warm-tap listeners never navigate for the same tap twice.
 *
 * Must be rendered inside an `expo-router` navigator (requires `useRouter`).
 */
export function useNotificationResponse(isReady: boolean): void {
  const router = useRouter();

  // Identifier of the last notification we already navigated for.
  const handledIdRef = useRef<string | null>(null);
  // Queue of pre-ready responses (cold-start + warm-taps before isReady).
  // Deduplicated by notification identifier; latest entry per id wins.
  // On drain the last item (most-recent tap) is routed.
  const pendingQueueRef = useRef<Notifications.NotificationResponse[]>([]);
  // Mirror of isReady in a ref so the stable listener closure can read it.
  const isReadyRef = useRef(isReady);
  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  // Ref-stable wrapper around the navigate logic so effects with `[]` deps
  // always call the latest version without needing to re-subscribe.
  const navigateRef = useRef(
    (_response: Notifications.NotificationResponse | null | undefined): void => { /* set below */ },
  );
  navigateRef.current = (response: Notifications.NotificationResponse | null | undefined): void => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handledIdRef.current === id) return; // already handled
    const data = response.notification.request.content.data as NotificationData;
    const route = resolveRoute(data);
    if (!route) return;
    handledIdRef.current = id;
    router.push(route as Parameters<typeof router.push>[0]);
  };

  /** Enqueue a response, keeping the latest tap at the tail so drain always wins with the newest. */
  const enqueueRef = useRef((response: Notifications.NotificationResponse): void => {
    const id = response.notification.request.identifier;
    const queue = pendingQueueRef.current;
    const existing = queue.findIndex((r) => r.notification.request.identifier === id);
    if (existing !== -1) {
      queue.splice(existing, 1); // remove from old position; re-append below
    }
    queue.push(response); // always the tail so drain picks the most-recent tap
  });

  // ── Cold-start: fetch the response that launched the app ─────────────────
  // getLastNotificationResponseAsync resolves with the tapped notification
  // when the app was opened from a killed state. Enqueue immediately; it
  // will be drained once isReady flips to true.
  useEffect(() => {
    let active = true;
    Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (active && resp) {
          enqueueRef.current(resp);
        }
      })
      .catch((err) => console.warn('[notifications] getLastNotificationResponseAsync failed:', err));
    return () => {
      active = false;
    };
  }, []); // run once on mount

  // ── Drain pending queue once the app is ready ────────────────────────────
  // Route using the last (most-recent) queued response so a newer human tap
  // always wins over an earlier cold-start or stale pending response.
  useEffect(() => {
    const queue = pendingQueueRef.current;
    if (!isReady || queue.length === 0) return;
    navigateRef.current(queue[queue.length - 1]);
    pendingQueueRef.current = [];
  }, [isReady]);

  // ── Warm-tap: stable listener for notifications tapped while app is open ─
  // Added once on mount so there is no gap where a tap could be missed during
  // a re-render caused by isReady changing. Uses isReadyRef/navigateRef for
  // current values without needing to re-subscribe.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isReadyRef.current) {
        navigateRef.current(response);
      } else {
        // Enqueue; will be drained by the drain effect above.
        enqueueRef.current(response);
      }
    });
    return () => sub.remove();
  }, []); // run once on mount
}
