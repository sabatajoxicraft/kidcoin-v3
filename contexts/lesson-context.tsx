import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useFamily } from '@/contexts/family-context';
import { useTask } from '@/contexts/task-context';
import { useAuth } from '@/hooks/use-auth';
import { getLessonsForAgeGroup } from '@/lib/lesson-catalog';
import {
  completeLessonQuiz as completeLessonQuizService,
  computeEarnedBadges,
  computeLessonStreak,
  getChildLessonProgress,
  type QuizResult,
} from '@/lib/lesson-service';
import type { ChildProfile, EarnedBadge, Lesson, LessonProgressRecord } from '@/src/types';

interface LessonContextType {
  lessons: Lesson[];
  progress: Record<string, LessonProgressRecord>;
  earnedBadges: EarnedBadge[];
  streak: number;
  loading: boolean;
  error: string | null;
  completeQuiz: (lessonId: string, answers: number[]) => Promise<QuizResult>;
  refresh: () => Promise<void>;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

export function LessonProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { effectiveRole, effectiveUserProfile, refreshFamily } = useFamily();
  const { refresh: refreshTasks } = useTask();
  const [progress, setProgress] = useState<Record<string, LessonProgressRecord>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childProfile =
    effectiveRole === 'child' ? (effectiveUserProfile as ChildProfile | null) : null;

  const lessons = useMemo(
    () => (childProfile?.ageGroup ? getLessonsForAgeGroup(childProfile.ageGroup) : []),
    [childProfile?.ageGroup],
  );

  const earnedBadges = useMemo(
    () => computeEarnedBadges(progress, lessons.map((l) => l.id)),
    [progress, lessons],
  );

  const streak = useMemo(() => computeLessonStreak(progress), [progress]);

  const refresh = useCallback(async () => {
    if (!user || !childProfile?.id) {
      setProgress({});
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getChildLessonProgress(childProfile.id);
      setProgress(data);
    } catch (e) {
      console.error('[LessonContext] refresh failed:', e);
      setError(e instanceof Error ? e.message : 'Failed to load lesson progress.');
    } finally {
      setLoading(false);
    }
  }, [user, childProfile?.id]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const completeQuiz = async (lessonId: string, answers: number[]): Promise<QuizResult> => {
    if (!childProfile?.familyId || !childProfile.id) {
      throw new Error('Child context is not ready');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await completeLessonQuizService(
        childProfile.familyId,
        childProfile.id,
        lessonId,
        answers,
      );

      if (result.passed) {
        // Refresh lesson progress, family points balance, and transaction list in parallel
        const [data] = await Promise.all([
          getChildLessonProgress(childProfile.id),
          result.alreadyCompleted ? Promise.resolve() : refreshFamily(),
          result.alreadyCompleted ? Promise.resolve() : refreshTasks(),
        ]);
        setProgress(data);
      }

      return result;
    } catch (e) {
      console.error('[LessonContext] completeQuiz failed:', e);
      const message = e instanceof Error ? e.message : 'Quiz submission failed.';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <LessonContext.Provider
      value={{
        lessons,
        progress,
        earnedBadges,
        streak,
        loading,
        error,
        completeQuiz,
        refresh,
      }}
    >
      {children}
    </LessonContext.Provider>
  );
}

export function useLessons() {
  const context = useContext(LessonContext);
  if (context === undefined) {
    throw new Error('useLessons must be used within a LessonProvider');
  }
  return context;
}
