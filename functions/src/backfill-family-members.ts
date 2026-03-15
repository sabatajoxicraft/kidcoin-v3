import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();
const dryRun = process.argv.includes('--dry-run');

type FamilyMemberRole = 'host_parent' | 'child';
type FamilyMemberStatus = 'active';

interface FamilyRecord {
  ownerId?: unknown;
  createdAt?: unknown;
}

interface ChildRecord {
  createdAt?: unknown;
}

interface FamilyMemberRecord {
  userId: string;
  role: FamilyMemberRole;
  status: FamilyMemberStatus;
  joinedAt: string;
}

interface BackfillSummary {
  familiesScanned: number;
  familiesUpdated: number;
  familiesSkipped: number;
  ownerMembersCreated: number;
  childMembersCreated: number;
  membersAlreadyPresent: number;
  mismatchedFamilies: number;
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function';
}

function toIsoString(value: unknown, fallback: Date): string {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  return fallback.toISOString();
}

function buildMemberRecord(
  userId: string,
  role: FamilyMemberRole,
  joinedAt: string,
): FamilyMemberRecord {
  return {
    userId,
    role,
    status: 'active',
    joinedAt,
  };
}

async function backfillFamilyMembers(): Promise<void> {
  const summary: BackfillSummary = {
    familiesScanned: 0,
    familiesUpdated: 0,
    familiesSkipped: 0,
    ownerMembersCreated: 0,
    childMembersCreated: 0,
    membersAlreadyPresent: 0,
    mismatchedFamilies: 0,
  };

  const familiesSnap = await firestore.collection('families').get();
  summary.familiesScanned = familiesSnap.size;

  console.log(`[backfill-family-members] starting ${dryRun ? 'dry run' : 'write run'} for ${familiesSnap.size} family(ies)`);

  for (const familyDoc of familiesSnap.docs) {
    const familyId = familyDoc.id;
    const familyData = familyDoc.data() as FamilyRecord;
    const ownerId = typeof familyData.ownerId === 'string' ? familyData.ownerId : null;

    if (!ownerId) {
      summary.familiesSkipped += 1;
      console.warn(`[backfill-family-members] skipping family ${familyId}: missing ownerId`);
      continue;
    }

    const familyJoinedAt = toIsoString(familyData.createdAt, new Date());
    const membersCollection = familyDoc.ref.collection('members');

    const [membersSnap, childrenSnap] = await Promise.all([
      membersCollection.get(),
      firestore.collection('users').where('familyId', '==', familyId).where('role', '==', 'child').get(),
    ]);

    const existingMemberIds = new Set(membersSnap.docs.map((memberDoc) => memberDoc.id));
    const batch = firestore.batch();
    let writesForFamily = 0;

    if (!existingMemberIds.has(ownerId)) {
      batch.set(
        membersCollection.doc(ownerId),
        buildMemberRecord(ownerId, 'host_parent', familyJoinedAt),
      );
      writesForFamily += 1;
      summary.ownerMembersCreated += 1;
    } else {
      summary.membersAlreadyPresent += 1;
    }

    for (const childDoc of childrenSnap.docs) {
      const childId = childDoc.id;
      if (existingMemberIds.has(childId)) {
        summary.membersAlreadyPresent += 1;
        continue;
      }

      const childData = childDoc.data() as ChildRecord;
      const childJoinedAt = toIsoString(childData.createdAt, new Date(familyJoinedAt));

      batch.set(
        membersCollection.doc(childId),
        buildMemberRecord(childId, 'child', childJoinedAt),
      );
      writesForFamily += 1;
      summary.childMembersCreated += 1;
    }

    if (writesForFamily > 0) {
      summary.familiesUpdated += 1;
      if (!dryRun) {
        await batch.commit();
      }
      console.log(
        `[backfill-family-members] ${dryRun ? 'would seed' : 'seeded'} ${writesForFamily} member record(s) for family ${familyId}`,
      );
    }

    const expectedMembers = childrenSnap.size + 1;
    const finalMembers = existingMemberIds.size + writesForFamily;
    if (finalMembers !== expectedMembers) {
      summary.mismatchedFamilies += 1;
      console.warn(
        `[backfill-family-members] family ${familyId} member count mismatch: expected ${expectedMembers}, got ${finalMembers}`,
      );
    }
  }

  console.log('[backfill-family-members] complete', summary);
}

backfillFamilyMembers().catch((error: unknown) => {
  console.error('[backfill-family-members] failed:', error);
  process.exitCode = 1;
});
