import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, Timestamp, updateDoc, deleteField } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from '@/lib/firebase';
import type { Family, UserProfile, ChildProfile, AgeGroup } from '@/src/types';

export async function createFamily(
  ownerId: string,
  ownerEmail: string,
  ownerDisplayName: string,
  familyName: string,
): Promise<Family> {
  const familyRef = doc(collection(db, 'families'));
  const family: Family = {
    id: familyRef.id,
    name: familyName,
    ownerId,
    createdAt: new Date(),
    settings: {
      pointsConversionRate: 0.1,
      minPayoutAmount: 50,
      requireParentApproval: true,
    },
  };
  await setDoc(familyRef, family);
  await setDoc(
    doc(db, 'users', ownerId),
    {
      id: ownerId,
      displayName: ownerDisplayName,
      email: ownerEmail,
      role: 'parent',
      familyId: familyRef.id,
      createdAt: new Date(),
    },
    { merge: true },
  );
  return family;
}

export async function addChild(
  familyId: string,
  displayName: string,
  ageGroup: AgeGroup,
  pin: string,
): Promise<ChildProfile> {
  const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
  const childRef = doc(collection(db, 'users'));
  const child: ChildProfile = {
    id: childRef.id,
    displayName,
    email: '',
    role: 'child',
    familyId,
    ageGroup,
    pinHash,
    points: 0,
    createdAt: new Date(),
  };
  await setDoc(childRef, child);
  return child;
}

export async function getFamilyWithChildren(
  familyId: string,
): Promise<{ family: Family; children: ChildProfile[] }> {
  const familySnap = await getDoc(doc(db, 'families', familyId));
  if (!familySnap.exists()) throw new Error('Family not found');

  const data = familySnap.data();
  const family: Family = {
    ...(data as Omit<Family, 'createdAt'>),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt as Date),
  };

  const childrenSnap = await getDocs(
    query(collection(db, 'users'), where('familyId', '==', familyId), where('role', '==', 'child')),
  );
  const children: ChildProfile[] = childrenSnap.docs.map((d) => {
    const cd = d.data();
    return {
      ...(cd as Omit<ChildProfile, 'createdAt'>),
      createdAt: cd.createdAt instanceof Timestamp ? cd.createdAt.toDate() : (cd.createdAt as Date),
      pendingPayoutPoints: typeof cd.pendingPayoutPoints === 'number' ? cd.pendingPayoutPoints : 0,
      weeklyAllowancePoints: typeof cd.weeklyAllowancePoints === 'number' ? cd.weeklyAllowancePoints : undefined,
    };
  });

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
 * Returns an unsubscribe function that tears down both listeners.
 */
export function subscribeFamilyWithChildren(
  familyId: string,
  onUpdate: (result: { family: Family; children: ChildProfile[] }) => void,
  onError: (error: Error) => void,
): () => void {
  let latestFamily: Family | null = null;
  let latestChildren: ChildProfile[] | null = null;

  function tryEmit(): void {
    if (latestFamily !== null && latestChildren !== null) {
      onUpdate({ family: latestFamily, children: latestChildren });
    }
  }

  // Declared before the family listener so the family callbacks can tear it down
  // immediately on family-not-found or family-listener error.
  let unsubChildren: (() => void) | null = null;

  const unsubFamily = onSnapshot(
    doc(db, 'families', familyId),
    (snap) => {
      if (!snap.exists()) {
        unsubChildren?.();
        onError(new Error('Family not found'));
        return;
      }
      const data = snap.data();
      latestFamily = {
        ...(data as Omit<Family, 'createdAt'>),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt as Date),
      };
      tryEmit();
    },
    (error) => {
      unsubChildren?.();
      onError(error);
    },
  );

  unsubChildren = onSnapshot(
    query(collection(db, 'users'), where('familyId', '==', familyId), where('role', '==', 'child')),
    (snap) => {
      latestChildren = snap.docs.map((d) => {
        const cd = d.data();
        return {
          ...(cd as Omit<ChildProfile, 'createdAt'>),
          createdAt: cd.createdAt instanceof Timestamp ? cd.createdAt.toDate() : (cd.createdAt as Date),
          pendingPayoutPoints: typeof cd.pendingPayoutPoints === 'number' ? cd.pendingPayoutPoints : 0,
          weeklyAllowancePoints: typeof cd.weeklyAllowancePoints === 'number' ? cd.weeklyAllowancePoints : undefined,
        };
      });
      tryEmit();
    },
    (error) => {
      unsubFamily();
      onError(error);
    },
  );

  return () => {
    unsubFamily();
    unsubChildren?.();
  };
}
