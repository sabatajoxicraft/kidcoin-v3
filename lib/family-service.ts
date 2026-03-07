import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
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
    };
  });

  return { family, children };
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
