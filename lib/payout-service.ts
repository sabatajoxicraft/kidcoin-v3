import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PayoutRequest, PointTransaction } from '@/src/types';

type UserRole = 'parent' | 'child';

type UserRecord = {
  role?: UserRole;
  familyId?: string | null;
  points?: number;
  pendingPayoutPoints?: number;
};

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function toOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

function mapPayoutRequest(data: Record<string, unknown>): PayoutRequest {
  return {
    ...(data as Omit<PayoutRequest, 'createdAt' | 'reviewedAt'>),
    createdAt: toDate(data.createdAt),
    reviewedAt: toOptionalDate(data.reviewedAt),
  };
}

function sortByCreatedAtDesc<T extends { createdAt: Date }>(items: T[]): T[] {
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    points: data.points as number | undefined,
    pendingPayoutPoints: data.pendingPayoutPoints as number | undefined,
  };
}

function assertUserRoleAndFamily(user: UserRecord, expectedRole: UserRole, familyId: string): void {
  if (user.role !== expectedRole) throw new Error(`User must be a ${expectedRole}`);
  if (user.familyId !== familyId) throw new Error('User does not belong to this family');
}

export async function createPayoutRequest(
  familyId: string,
  childId: string,
  requestedPoints: number,
  requestNote?: string,
): Promise<PayoutRequest> {
  if (!Number.isInteger(requestedPoints) || requestedPoints <= 0) {
    throw new Error('Requested points must be a positive integer');
  }

  const familySnap = await getDoc(doc(db, 'families', familyId));
  if (!familySnap.exists()) throw new Error('Family not found');
  const familyData = familySnap.data();
  const minPayout = typeof familyData.settings?.minPayoutAmount === 'number'
    ? familyData.settings.minPayoutAmount
    : 0;
  if (requestedPoints < minPayout) {
    throw new Error(`Minimum payout amount is ${minPayout} points`);
  }

  const requestRef = doc(collection(db, 'payoutRequests'));
  const now = new Date();
  const trimmedNote = requestNote?.trim();
  let createdRequest: PayoutRequest | undefined;

  await runTransaction(db, async (transaction) => {
    const childRef = doc(db, 'users', childId);
    const childSnap = await transaction.get(childRef);
    if (!childSnap.exists()) throw new Error('User not found');

    const childData = childSnap.data() as UserRecord;
    if (childData.role !== 'child') throw new Error('User must be a child');
    if (childData.familyId !== familyId) throw new Error('User does not belong to this family');

    const currentBalance = typeof childData.points === 'number' ? childData.points : 0;
    const reserved = typeof childData.pendingPayoutPoints === 'number' ? childData.pendingPayoutPoints : 0;
    if (currentBalance - reserved < requestedPoints) {
      throw new Error('Insufficient points for payout request');
    }

    const request: PayoutRequest = {
      id: requestRef.id,
      familyId,
      childId,
      requestedPoints,
      status: 'pending',
      createdAt: now,
      ...(trimmedNote ? { requestNote: trimmedNote } : {}),
    };

    transaction.set(requestRef, request);
    transaction.update(childRef, { pendingPayoutPoints: reserved + requestedPoints });
    createdRequest = request;
  });

  return createdRequest!;
}

export async function getChildPayoutRequests(
  familyId: string,
  childId: string,
): Promise<PayoutRequest[]> {
  await ensureFamilyExists(familyId);
  const child = await getUserRecord(childId);
  assertUserRoleAndFamily(child, 'child', familyId);

  const snap = await getDocs(
    query(
      collection(db, 'payoutRequests'),
      where('familyId', '==', familyId),
      where('childId', '==', childId),
    ),
  );

  const requests = sortByCreatedAtDesc(
    snap.docs.map((d) => mapPayoutRequest(d.data() as Record<string, unknown>)),
  );

  for (const req of requests) {
    if (req.familyId !== familyId || req.childId !== childId) {
      throw new Error('Payout request consistency check failed');
    }
  }

  return requests;
}

export async function getFamilyPayoutRequests(familyId: string): Promise<PayoutRequest[]> {
  await ensureFamilyExists(familyId);

  const snap = await getDocs(
    query(collection(db, 'payoutRequests'), where('familyId', '==', familyId)),
  );

  const requests = sortByCreatedAtDesc(
    snap.docs.map((d) => mapPayoutRequest(d.data() as Record<string, unknown>)),
  );

  for (const req of requests) {
    if (req.familyId !== familyId) {
      throw new Error('Payout request family mismatch detected');
    }
  }

  return requests;
}

export async function reviewPayoutRequest(
  requestId: string,
  parentId: string,
  decision: 'approved' | 'rejected',
  reviewNote?: string,
): Promise<void> {
  if (!requestId) throw new Error('Request ID is required');

  const requestRef = doc(db, 'payoutRequests', requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) throw new Error('Payout request not found');

  const request = mapPayoutRequest(requestSnap.data() as Record<string, unknown>);
  const parent = await getUserRecord(parentId);
  assertUserRoleAndFamily(parent, 'parent', request.familyId);

  if (request.status !== 'pending') {
    throw new Error('Only pending payout requests can be reviewed');
  }

  const trimmedReviewNote = reviewNote?.trim();
  const now = new Date();

  if (decision === 'rejected') {
    await runTransaction(db, async (transaction) => {
      const txRequestSnap = await transaction.get(requestRef);
      if (!txRequestSnap.exists()) throw new Error('Payout request not found');

      const txRequest = mapPayoutRequest(txRequestSnap.data() as Record<string, unknown>);
      if (txRequest.status !== 'pending') {
        throw new Error('Payout request is no longer pending');
      }

      const parentRef = doc(db, 'users', parentId);
      const parentSnap = await transaction.get(parentRef);
      if (!parentSnap.exists()) throw new Error('Parent not found');
      const parentData = parentSnap.data() as UserRecord;
      if (parentData.role !== 'parent') throw new Error('User must be a parent');
      if (parentData.familyId !== txRequest.familyId) {
        throw new Error('Parent does not belong to this family');
      }

      const childRef = doc(db, 'users', txRequest.childId);
      const childSnap = await transaction.get(childRef);
      if (!childSnap.exists()) throw new Error('Child not found');

      const childData = childSnap.data() as UserRecord;
      if (childData.role !== 'child') throw new Error('User must be a child');
      if (childData.familyId !== txRequest.familyId) {
        throw new Error('Child does not belong to this family');
      }

      const reserved = typeof childData.pendingPayoutPoints === 'number' ? childData.pendingPayoutPoints : 0;
      const newReserved = reserved - txRequest.requestedPoints;
      if (newReserved < 0) {
        throw new Error('pendingPayoutPoints would go negative; reservation data is inconsistent');
      }

      transaction.update(requestRef, {
        status: 'rejected',
        reviewedByParentId: parentId,
        reviewedAt: now,
        reviewNote: trimmedReviewNote ? trimmedReviewNote : deleteField(),
      });
      transaction.update(childRef, {
        pendingPayoutPoints: newReserved === 0 ? deleteField() : newReserved,
      });
    });
    return;
  }

  await runTransaction(db, async (transaction) => {
    const txRequestSnap = await transaction.get(requestRef);
    if (!txRequestSnap.exists()) throw new Error('Payout request not found');

    const txRequest = mapPayoutRequest(txRequestSnap.data() as Record<string, unknown>);
    if (txRequest.status !== 'pending') {
      throw new Error('Payout request is no longer pending');
    }

    const parentRef = doc(db, 'users', parentId);
    const parentSnap = await transaction.get(parentRef);
    if (!parentSnap.exists()) throw new Error('Parent not found');
    const parentData = parentSnap.data() as UserRecord;
    if (parentData.role !== 'parent') throw new Error('User must be a parent');
    if (parentData.familyId !== txRequest.familyId) {
      throw new Error('Parent does not belong to this family');
    }

    const childRef = doc(db, 'users', txRequest.childId);
    const childSnap = await transaction.get(childRef);
    if (!childSnap.exists()) throw new Error('Child not found');

    const childData = childSnap.data() as UserRecord;
    if (childData.role !== 'child') throw new Error('User must be a child');
    if (childData.familyId !== txRequest.familyId) {
      throw new Error('Child does not belong to this family');
    }

    const currentBalance = typeof childData.points === 'number' ? childData.points : 0;
    if (currentBalance < txRequest.requestedPoints) {
      throw new Error('Child no longer has sufficient points');
    }

    const reserved = typeof childData.pendingPayoutPoints === 'number' ? childData.pendingPayoutPoints : 0;
    const newReserved = reserved - txRequest.requestedPoints;
    if (newReserved < 0) {
      throw new Error('pendingPayoutPoints would go negative; reservation data is inconsistent');
    }

    const balanceAfter = currentBalance - txRequest.requestedPoints;
    transaction.update(childRef, {
      points: balanceAfter,
      pendingPayoutPoints: newReserved === 0 ? deleteField() : newReserved,
    });

    transaction.update(requestRef, {
      status: 'approved',
      reviewedByParentId: parentId,
      reviewedAt: now,
      reviewNote: trimmedReviewNote ? trimmedReviewNote : deleteField(),
    });

    const transactionRef = doc(collection(db, 'pointTransactions'));
    const pointTransaction: PointTransaction = {
      id: transactionRef.id,
      familyId: txRequest.familyId,
      childId: txRequest.childId,
      type: 'payout_deduction',
      pointsDelta: -txRequest.requestedPoints,
      balanceAfter,
      relatedPayoutRequestId: txRequest.id,
      createdAt: now,
      ...(trimmedReviewNote ? { note: trimmedReviewNote } : {}),
    };

    transaction.set(transactionRef, pointTransaction);
  });
}
