import { doc, getDoc, collection, query, where, getDocs, onSnapshot, Timestamp, updateDoc, deleteField, writeBatch } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from '@/lib/firebase';
import type { Family, FamilyMember, FamilySettings, UserProfile, ChildProfile, AgeGroup } from '@/src/types';
import { isSupportedCurrency } from '@/lib/currency';

const DEFAULT_SETTINGS: Required<FamilySettings> = {
  pointsConversionRate: 0.1,
  minPayoutAmount: 50,
  requireParentApproval: true,
  currencyCode: 'ZAR',
};

function normalizeFamilySettings(raw: Partial<FamilySettings> | undefined): FamilySettings {
  return {
    pointsConversionRate: raw?.pointsConversionRate ?? DEFAULT_SETTINGS.pointsConversionRate,
    minPayoutAmount: raw?.minPayoutAmount ?? DEFAULT_SETTINGS.minPayoutAmount,
    requireParentApproval: raw?.requireParentApproval ?? DEFAULT_SETTINGS.requireParentApproval,
    currencyCode: raw?.currencyCode ?? DEFAULT_SETTINGS.currencyCode,
  };
}

export async function createFamily(
  ownerId: string,
  ownerEmail: string,
  ownerDisplayName: string,
  familyName: string,
  currencyCode?: string,
): Promise<Family> {
  const familyRef = doc(collection(db, 'families'));
  const now = new Date();
  const family: Family = {
    id: familyRef.id,
    name: familyName,
    ownerId,
    createdAt: now,
    settings: normalizeFamilySettings({
      currencyCode: currencyCode && isSupportedCurrency(currencyCode) ? currencyCode : 'ZAR',
    }),
  };

  const ownerMember: FamilyMember = {
    userId: ownerId,
    role: 'host_parent',
    status: 'active',
    joinedAt: now.toISOString(),
  };

  const batch = writeBatch(db);
  batch.set(familyRef, family);
  batch.set(
    doc(db, 'users', ownerId),
    {
      id: ownerId,
      displayName: ownerDisplayName,
      email: ownerEmail,
      role: 'parent',
      familyId: familyRef.id,
      createdAt: now,
    },
    { merge: true },
  );
  batch.set(doc(db, 'families', familyRef.id, 'members', ownerId), ownerMember);
  await batch.commit();

  return family;
}

export async function updateFamilySettings(
  familyId: string,
  settings: Partial<FamilySettings>,
): Promise<void> {
  if (settings.currencyCode !== undefined && !isSupportedCurrency(settings.currencyCode)) {
    throw new Error(`Unsupported currency: ${settings.currencyCode}`);
  }
  if (
    settings.pointsConversionRate !== undefined &&
    (!Number.isFinite(settings.pointsConversionRate) || settings.pointsConversionRate <= 0)
  ) {
    throw new Error('pointsConversionRate must be a finite number > 0');
  }
  if (
    settings.minPayoutAmount !== undefined &&
    (!Number.isInteger(settings.minPayoutAmount) || settings.minPayoutAmount < 0)
  ) {
    throw new Error('minPayoutAmount must be a non-negative integer');
  }

  const familyRef = doc(db, 'families', familyId);
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    updates[`settings.${key}`] = value;
  }
  await updateDoc(familyRef, updates);
}

export async function addChild(
  familyId: string,
  displayName: string,
  ageGroup: AgeGroup,
  pin: string,
): Promise<ChildProfile> {
  const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
  const childRef = doc(collection(db, 'users'));
  const now = new Date();
  const child: ChildProfile = {
    id: childRef.id,
    displayName,
    email: '',
    role: 'child',
    familyId,
    ageGroup,
    pinHash,
    points: 0,
    createdAt: now,
  };

  const childMember: FamilyMember = {
    userId: childRef.id,
    role: 'child',
    status: 'active',
    joinedAt: now.toISOString(),
  };

  const batch = writeBatch(db);
  batch.set(childRef, child);
  batch.set(doc(db, 'families', familyId, 'members', childRef.id), childMember);
  await batch.commit();

  return child;
}

/**
 * Returns all membership records for a family.
 * Minimal read helper for the next Phase C slice; callers should still
 * fall back to legacy `UserProfile.role` when no record exists.
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const snap = await getDocs(collection(db, 'families', familyId, 'members'));
  return snap.docs.map((d) => d.data() as FamilyMember);
}

/**
 * Subscribes to a single family membership record.
 * Used by FamilyContext to resolve the signed-in user's base role from
 * the members sub-collection before falling back to legacy userProfile.role.
 */
export function subscribeFamilyMember(
  familyId: string,
  userId: string,
  onUpdate: (member: FamilyMember | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'families', familyId, 'members', userId),
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate(snap.data() as FamilyMember);
    },
    (error) => onError(error),
  );
}

/** Hydrates a ChildProfile from a raw Firestore user document snapshot data object. */
function hydrateChildProfile(cd: Record<string, unknown>): ChildProfile {
  return {
    ...(cd as Omit<ChildProfile, 'createdAt'>),
    createdAt: cd.createdAt instanceof Timestamp ? (cd.createdAt as Timestamp).toDate() : (cd.createdAt as Date),
    pendingPayoutPoints: typeof cd.pendingPayoutPoints === 'number' ? cd.pendingPayoutPoints : 0,
    weeklyAllowancePoints: typeof cd.weeklyAllowancePoints === 'number' ? cd.weeklyAllowancePoints : undefined,
  };
}

export async function getFamilyWithChildren(
  familyId: string,
): Promise<{ family: Family; children: ChildProfile[] }> {
  const familySnap = await getDoc(doc(db, 'families', familyId));
  if (!familySnap.exists()) throw new Error('Family not found');

  const data = familySnap.data();
  const family: Family = {
    ...(data as Omit<Family, 'createdAt' | 'settings'>),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt as Date),
    settings: normalizeFamilySettings(data.settings as Partial<FamilySettings> | undefined),
  };

  // Membership-aware child discovery. Fall back to legacy children if member
  // reads are unavailable during rollout before rules/backfill are in place.
  let activeChildIds: string[] = [];
  try {
    const membersSnap = await getDocs(collection(db, 'families', familyId, 'members'));
    activeChildIds = membersSnap.docs
      .map((d) => d.data() as FamilyMember)
      .filter((m) => m.role === 'child' && m.status === 'active')
      .map((m) => m.userId);
  } catch (error) {
    console.warn('[family-service] getFamilyWithChildren members read failed, falling back to legacy:', error);
  }

  // Always fetch both sources for backfill compatibility
  const legacySnap = await getDocs(
    query(collection(db, 'users'), where('familyId', '==', familyId), where('role', '==', 'child')),
  );
  const legacyChildren = legacySnap.docs.map((d) => hydrateChildProfile(d.data() as Record<string, unknown>));
  const legacyById = new Map(legacyChildren.map((c) => [c.id, c]));

  // Fetch user docs for membership children not already covered by legacy query
  const missingIds = activeChildIds.filter((id) => !legacyById.has(id));
  const extraSnaps = await Promise.all(missingIds.map((id) => getDoc(doc(db, 'users', id))));
  const memberOnlyChildren = extraSnaps.reduce<ChildProfile[]>((acc, snap, i) => {
    const childId = missingIds[i];
    if (!snap.exists()) {
      console.warn(`[family-service] member ${childId} has no user doc; skipping`);
      return acc;
    }
    const cd = snap.data() as Record<string, unknown>;
    if (cd.role !== 'child') {
      console.warn(`[family-service] member ${childId} user doc role is "${cd.role}", expected "child"; skipping`);
      return acc;
    }
    acc.push(hydrateChildProfile(cd));
    return acc;
  }, []);

  // Merge: membership-backed children + legacy children not in membership set
  const memberIdSet = new Set(activeChildIds);
  const children = [
    ...legacyChildren.filter((c) => !memberIdSet.has(c.id)),
    ...legacyChildren.filter((c) => memberIdSet.has(c.id)),
    ...memberOnlyChildren,
  ];

  return { family, children };
}

export async function updateChildWeeklyAllowance(
  familyId: string,
  childId: string,
  weeklyAllowancePoints: number,
): Promise<void> {
  const childRef = doc(db, 'users', childId);
  const snap = await getDoc(childRef);
  if (!snap.exists()) throw new Error('Child not found');
  const data = snap.data();
  if (data.role !== 'child') throw new Error('User is not a child');
  if (data.familyId !== familyId) throw new Error('Child does not belong to this family');

  if (weeklyAllowancePoints === 0) {
    await updateDoc(childRef, { weeklyAllowancePoints: deleteField() });
    return;
  }

  if (!Number.isInteger(weeklyAllowancePoints) || weeklyAllowancePoints <= 0) {
    throw new Error('weeklyAllowancePoints must be a positive integer when provided');
  }

  await updateDoc(childRef, { weeklyAllowancePoints });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...(data as Omit<UserProfile, 'createdAt'>),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt as Date),
  };
}

// ─── Real-Time Subscriptions ────────────────────────────────────

/**
 * Subscribes to a single user profile document.
 * Fires immediately on attach (from cache or server), then on every change.
 * Returns an unsubscribe function to be called on cleanup.
 */
export function subscribeUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      onUpdate({
        ...(data as Omit<UserProfile, 'createdAt'>),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt as Date),
      });
    },
    (error) => onError(error),
  );
}

/**
 * Subscribes to the family document and the children collection simultaneously.
 * Emits only once both listeners have produced their first snapshot.
 * Subsequent emissions occur whenever either source changes.
 * Uses membership-aware per-child listeners with a legacy query fallback.
 * Returns an unsubscribe function that tears down all listeners.
 */
export function subscribeFamilyWithChildren(
  familyId: string,
  onUpdate: (result: { family: Family; children: ChildProfile[] }) => void,
  onError: (error: Error) => void,
): () => void {
  let latestFamily: Family | null = null;
  let legacyChildren: ChildProfile[] | null = null;

  // Per-child listener strategy state
  const perChildUnsubs = new Map<string, () => void>();
  const perChildProfiles = new Map<string, ChildProfile>();
  const readyChildIds = new Set<string>();
  let activeChildIds = new Set<string>();

  let unsubLegacy: (() => void) | null = null;

  // Members listener
  let unsubMembers: (() => void) | null = null;

  // unsubFamily is assigned later; used by cleanup
  let unsubFamily!: () => void;

  function mergeAndEmit(): void {
    if (latestFamily === null || legacyChildren === null) return;
    const memberIdSet = new Set(perChildProfiles.keys());
    const merged = [
      ...legacyChildren.filter((c) => !memberIdSet.has(c.id)),
      ...Array.from(perChildProfiles.values()),
    ];
    onUpdate({ family: latestFamily, children: merged });
  }

  function allActiveChildrenReady(): boolean {
    for (const id of activeChildIds) {
      if (!readyChildIds.has(id)) return false;
    }
    return true;
  }

  function emitChildren(): void {
    mergeAndEmit();
  }

  function teardownPerChildListeners(): void {
    for (const unsub of perChildUnsubs.values()) unsub();
    perChildUnsubs.clear();
    perChildProfiles.clear();
    readyChildIds.clear();
    activeChildIds = new Set<string>();
  }

  function reconcileChildListeners(newChildIds: string[]): void {
    const newSet = new Set(newChildIds);

    // Remove listeners for children no longer active
    for (const id of perChildUnsubs.keys()) {
      if (!newSet.has(id)) {
        perChildUnsubs.get(id)!();
        perChildUnsubs.delete(id);
        perChildProfiles.delete(id);
        readyChildIds.delete(id);
      }
    }

    // Add listeners for newly active children
    for (const childId of newChildIds) {
      if (!perChildUnsubs.has(childId)) {
        const unsub = onSnapshot(
          doc(db, 'users', childId),
          (snap) => {
            if (!snap.exists()) {
              console.warn(`[family-service] per-child listener: member ${childId} has no user doc; skipping`);
              perChildProfiles.delete(childId);
            } else {
              const cd = snap.data() as Record<string, unknown>;
              if (cd.role !== 'child') {
                console.warn(`[family-service] per-child listener: member ${childId} user doc role is "${cd.role}", expected "child"; skipping`);
                perChildProfiles.delete(childId);
              } else {
                perChildProfiles.set(childId, hydrateChildProfile(cd));
              }
            }
            readyChildIds.add(childId);
            if (allActiveChildrenReady()) emitChildren();
          },
          (error) => {
            console.warn(`[family-service] per-child listener error for ${childId}:`, error);
            readyChildIds.add(childId); // don't block emission
            if (allActiveChildrenReady()) emitChildren();
          },
        );
        perChildUnsubs.set(childId, unsub);
      }
    }

    activeChildIds = newSet;

    if (newChildIds.length === 0) {
      mergeAndEmit();
    } else if (allActiveChildrenReady()) {
      // Removal-only case: all remaining children already have data
      emitChildren();
    }
  }

  // Always-on legacy listener: runs simultaneously with per-child listeners for backfill compatibility
  unsubLegacy = onSnapshot(
    query(collection(db, 'users'), where('familyId', '==', familyId), where('role', '==', 'child')),
    (snap) => {
      legacyChildren = snap.docs.map((d) => hydrateChildProfile(d.data() as Record<string, unknown>));
      mergeAndEmit();
    },
    (error) => {
      console.warn('[family-service] legacy children listener error:', error);
      if (legacyChildren === null) legacyChildren = [];
      mergeAndEmit();
    },
  );

  unsubMembers = onSnapshot(
    collection(db, 'families', familyId, 'members'),
    (snap) => {
      const childMemberIds = snap.docs
        .map((d) => d.data() as FamilyMember)
        .filter((m) => m.role === 'child' && m.status === 'active')
        .map((m) => m.userId);

      if (childMemberIds.length === 0) {
        teardownPerChildListeners();
        mergeAndEmit();
        return;
      }

      reconcileChildListeners(childMemberIds);
    },
    (error) => {
      console.warn('[family-service] members listener error, falling back to legacy:', error);
      teardownPerChildListeners();
      mergeAndEmit();
    },
  );

  unsubFamily = onSnapshot(
    doc(db, 'families', familyId),
    (snap) => {
      if (!snap.exists()) {
        unsubMembers?.();
        teardownPerChildListeners();
        unsubLegacy?.();
        onError(new Error('Family not found'));
        return;
      }
      const data = snap.data();
      latestFamily = {
        ...(data as Omit<Family, 'createdAt' | 'settings'>),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt as Date),
        settings: normalizeFamilySettings(data.settings as Partial<FamilySettings> | undefined),
      };
      mergeAndEmit();
    },
    (error) => {
      unsubMembers?.();
      teardownPerChildListeners();
      unsubLegacy?.();
      onError(error);
    },
  );

  return () => {
    unsubFamily();
    unsubMembers?.();
    teardownPerChildListeners();
    unsubLegacy?.();
  };
}
