import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getLessonById, QUIZ_PASS_THRESHOLD } from '@/lib/lesson-catalog';
import type { EarnedBadge, LessonProgressRecord, PointTransaction } from '@/src/types';

// ─── Firestore Helpers ──────────────────────────────────────────

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : (value as Date);
}

// ─── Read Progress ──────────────────────────────────────────────

export async function getChildLessonProgress(
  childId: string,
): Promise<Record<string, LessonProgressRecord>> {
  if (!childId) throw new Error('Child ID is required');

  const childSnap = await getDoc(doc(db, 'users', childId));
  if (!childSnap.exists()) return {};

  const raw = childSnap.data().lessonProgress as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!raw) return {};

  const result: Record<string, LessonProgressRecord> = {};
  for (const [key, value] of Object.entries(raw)) {
    result[key] = {
      lessonId: value.lessonId as string,
      completed: value.completed as boolean,
      quizScore: value.quizScore as number,
      pointsAwarded: value.pointsAwarded as number,
      completedAt: toDate(value.completedAt),
    };
  }

  return result;
}

// ─── Complete Quiz (Idempotent) ─────────────────────────────────

export interface QuizResult {
  passed: boolean;
  score: number;
  totalQuestions: number;
  pointsAwarded: number;
  alreadyCompleted: boolean;
}

export async function completeLessonQuiz(
  familyId: string,
  childId: string,
  lessonId: string,
  answers: number[],
): Promise<QuizResult> {
  if (!familyId) throw new Error('Family ID is required');
  if (!childId) throw new Error('Child ID is required');

  const lesson = getLessonById(lessonId);
  if (!lesson) throw new Error('Lesson not found');

  if (answers.length !== lesson.quiz.length) {
    throw new Error('Answer count must match quiz question count');
  }

  const correctCount = answers.filter(
    (answer, index) => answer === lesson.quiz[index].correctIndex,
  ).length;
  const passed = correctCount >= Math.ceil(lesson.quiz.length * QUIZ_PASS_THRESHOLD);

  if (!passed) {
    return {
      passed: false,
      score: correctCount,
      totalQuestions: lesson.quiz.length,
      pointsAwarded: 0,
      alreadyCompleted: false,
    };
  }

  // Atomic transaction for idempotent reward
  let alreadyCompleted = false;

  await runTransaction(db, async (transaction) => {
    const childRef = doc(db, 'users', childId);
    const childSnap = await transaction.get(childRef);
    if (!childSnap.exists()) throw new Error('Child not found');

    const childData = childSnap.data();
    if (childData.role !== 'child') throw new Error('User must be a child');
    if (childData.familyId !== familyId) throw new Error('Child does not belong to this family');
    // Integrity guard: reject completion if the lesson is not from the child's
    // current age group to prevent mismatched rewards after an age-group change.
    if (lesson.ageGroup !== childData.ageGroup) {
      throw new Error('Lesson does not belong to your current age group');
    }

    // Idempotency check: skip reward if already completed
    const existingProgress = childData.lessonProgress as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (existingProgress?.[lessonId]?.completed) {
      alreadyCompleted = true;
      return;
    }

    const currentBalance = typeof childData.points === 'number' ? childData.points : 0;
    const balanceAfter = currentBalance + lesson.pointsReward;
    const now = new Date();

    // Update child: points balance + lesson progress
    transaction.update(childRef, {
      points: balanceAfter,
      [`lessonProgress.${lessonId}`]: {
        lessonId,
        completed: true,
        quizScore: correctCount,
        pointsAwarded: lesson.pointsReward,
        completedAt: now,
      },
    });

    // Deterministic ID prevents duplicate reward documents on transaction retry
    const transactionRef = doc(
      db,
      'pointTransactions',
      `lesson_reward_${lessonId}_${childId}`,
    );
    const pointTransaction: PointTransaction = {
      id: transactionRef.id,
      familyId,
      childId,
      type: 'lesson_reward',
      pointsDelta: lesson.pointsReward,
      balanceAfter,
      relatedLessonId: lessonId,
      createdAt: now,
      note: `Completed lesson: ${lesson.title}`,
    };

    transaction.set(transactionRef, pointTransaction);
  });

  return {
    passed: true,
    score: correctCount,
    totalQuestions: lesson.quiz.length,
    pointsAwarded: alreadyCompleted ? 0 : lesson.pointsReward,
    alreadyCompleted,
  };
}

// ─── Badge Derivation (computed, not persisted) ─────────────────

export function computeEarnedBadges(
  progress: Record<string, LessonProgressRecord>,
  ageGroupLessonIds: string[],
): EarnedBadge[] {
  const badges: EarnedBadge[] = [];
  // Only consider lessons that belong to the current age group so that
  // completing lessons from a previous age group cannot incorrectly award
  // age-group-specific badges (e.g. lesson_legend) after an age-group change.
  const ageGroupSet = new Set(ageGroupLessonIds);
  const completed = Object.values(progress).filter(
    (p) => p.completed && ageGroupSet.has(p.lessonId),
  );

  if (completed.length === 0) return badges;

  const sorted = [...completed].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
  );

  // Fast Learner: complete first lesson
  badges.push({ badgeId: 'fast_learner', earnedAt: sorted[0].completedAt });

  // Quiz Master: complete 3+ lessons
  if (sorted.length >= 3) {
    badges.push({ badgeId: 'quiz_master', earnedAt: sorted[2].completedAt });
  }

  // Lesson Legend: complete all lessons for age group
  if (ageGroupLessonIds.length > 0 && sorted.length >= ageGroupLessonIds.length) {
    badges.push({
      badgeId: 'lesson_legend',
      earnedAt: sorted[sorted.length - 1].completedAt,
    });
  }

  return badges;
}

// ─── Longest Streak (computed, not persisted) ──────────────────

/**
 * Returns the longest consecutive-day run ever recorded across all completions.
 * Unlike computeLessonStreak (which measures the current active streak from
 * today/yesterday), this scans the full history to find the all-time peak.
 */
export function computeLongestStreak(
  progress: Record<string, LessonProgressRecord>,
): number {
  const completed = Object.values(progress).filter((p) => p.completed);
  if (completed.length === 0) return 0;

  // Normalise each completion to a local-calendar day key (same basis as
  // computeLessonStreak) then convert to a sortable epoch-day integer so
  // consecutive-day arithmetic stays simple.
  const toLocalDayKey = (d: Date): string =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const toLocalEpochDay = (d: Date): number => {
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round(midnight.getTime() / (24 * 60 * 60 * 1000));
  };

  const uniqueKeys = [...new Set(completed.map((p) => toLocalDayKey(p.completedAt)))];
  const dayNumbers = uniqueKeys
    .map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      return toLocalEpochDay(new Date(y, m, d));
    })
    .sort((a, b) => a - b);

  let longest = 1;
  let current = 1;
  for (let i = 1; i < dayNumbers.length; i++) {
    if (dayNumbers[i] === dayNumbers[i - 1] + 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

// ─── Streak Derivation (computed from progress timestamps) ──────

export function computeLessonStreak(
  progress: Record<string, LessonProgressRecord>,
): number {
  const completed = Object.values(progress).filter((p) => p.completed);
  if (completed.length === 0) return 0;

  const completedDays = new Set(
    completed.map((p) => {
      const d = p.completedAt;
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const check = new Date();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (completedDays.has(key)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (streak === 0) {
      // Allow checking yesterday if nothing today
      check.setDate(check.getDate() - 1);
      const yesterdayKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (completedDays.has(yesterdayKey)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}
