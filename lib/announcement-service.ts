import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Announcement } from '@/src/types';

type UserRole = 'parent' | 'child';

type UserRecord = {
  role?: UserRole;
  familyId?: string | null;
};

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function toOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function mapAnnouncement(data: Record<string, unknown>): Announcement {
  return {
    ...(data as Omit<Announcement, 'createdAt' | 'updatedAt' | 'archivedAt'>),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    archivedAt: toOptionalDate(data.archivedAt),
  };
}

function sortByCreatedAtDesc<T extends { createdAt: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function ensureFamilyExists(familyId: string): Promise<void> {
  if (!familyId) throw new Error('Family ID is required');
  const familySnap = await getDoc(doc(db, 'families', familyId));
  if (!familySnap.exists()) throw new Error('Family not found');
}

async function getUserRecord(userId: string): Promise<UserRecord> {
  if (!userId) throw new Error('User ID is required');
  const userSnap = await getDoc(doc(db, 'users', userId));
  if (!userSnap.exists()) throw new Error('User not found');
  const data = userSnap.data();
  return {
    role: data.role as UserRole | undefined,
    familyId: data.familyId as string | null | undefined,
  };
}

function assertUserRoleAndFamily(user: UserRecord, expectedRole: UserRole, familyId: string): void {
  if (user.role !== expectedRole) throw new Error(`User must be a ${expectedRole}`);
  if (user.familyId !== familyId) throw new Error('User does not belong to this family');
}

export async function createAnnouncement(
  familyId: string,
  parentId: string,
  title: string,
  body: string,
): Promise<Announcement> {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();

  if (!trimmedTitle) throw new Error('Announcement title is required');
  if (!trimmedBody) throw new Error('Announcement message is required');

  await ensureFamilyExists(familyId);
  const parent = await getUserRecord(parentId);
  assertUserRoleAndFamily(parent, 'parent', familyId);

  const announcementRef = doc(collection(db, 'announcements'));
  const now = new Date();

  const announcement: Announcement = {
    id: announcementRef.id,
    familyId,
    title: trimmedTitle,
    body: trimmedBody,
    status: 'active',
    createdByParentId: parentId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(announcementRef, announcement);
  return announcement;
}

export async function archiveAnnouncement(
  announcementId: string,
  parentId: string,
): Promise<void> {
  if (!announcementId) throw new Error('Announcement ID is required');

  const announcementRef = doc(db, 'announcements', announcementId);
  const snap = await getDoc(announcementRef);
  if (!snap.exists()) throw new Error('Announcement not found');

  const announcement = mapAnnouncement(snap.data() as Record<string, unknown>);
  const parent = await getUserRecord(parentId);
  assertUserRoleAndFamily(parent, 'parent', announcement.familyId);

  if (announcement.status === 'archived') return;

  const now = new Date();
  await updateDoc(announcementRef, {
    status: 'archived',
    archivedAt: now,
    updatedAt: now,
  });
}

// ─── Real-Time Subscriptions ────────────────────────────────────

/**
 * Subscribes to ALL announcements for a family (parent view: active + archived).
 * Returns an unsubscribe function.
 */
export function subscribeFamilyAnnouncements(
  familyId: string,
  onUpdate: (announcements: Announcement[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, 'announcements'), where('familyId', '==', familyId));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(
        sortByCreatedAtDesc(
          snap.docs.map((d) => mapAnnouncement(d.data() as Record<string, unknown>)),
        ),
      );
    },
    (error) => onError(error),
  );
}

/**
 * Subscribes to ACTIVE announcements for a family (child read-only view).
 * Returns an unsubscribe function.
 */
export function subscribeActiveAnnouncements(
  familyId: string,
  onUpdate: (announcements: Announcement[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, 'announcements'), where('familyId', '==', familyId));
  return onSnapshot(
    q,
    (snap) => {
      const active = snap.docs
        .map((d) => mapAnnouncement(d.data() as Record<string, unknown>))
        .filter((a) => a.status === 'active');
      onUpdate(sortByCreatedAtDesc(active));
    },
    (error) => onError(error),
  );
}
