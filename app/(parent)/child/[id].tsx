import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BADGE_DEFINITIONS, getLessonsForAgeGroup } from '@/lib/lesson-catalog';
import {
  computeEarnedBadges,
  computeLessonStreak,
  computeLongestStreak,
  getChildLessonProgress,
} from '@/lib/lesson-service';
import { goalReached, safeGoalPct, safeTargetDisplay, subscribeChildSavingsGoals } from '@/lib/goal-service';
import type { EarnedBadge, LessonProgressRecord, SavingsGoal } from '@/src/types';

const AGE_GROUP_LABELS: Record<string, string> = {
  junior: 'Junior',
  standard: 'Standard',
  teen: 'Teen',
};

const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  fast_learner: require('@/src/assets/branding/badges/badge_fast_learner.png'),
  quiz_master: require('@/src/assets/branding/badges/badge_quiz_master.png'),
  lesson_legend: require('@/src/assets/branding/badges/badge_lesson_legend.png'),
};

export default function ChildProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const { children, updateChildWeeklyAllowance } = useFamily();

  const child = children.find((c) => c.id === id);
  const childFamilyId = child?.familyId ?? '';

  const [progress, setProgress] = useState<Record<string, LessonProgressRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allowanceInput, setAllowanceInput] = useState('');
  const [allowanceSaving, setAllowanceSaving] = useState(false);
  const [allowanceError, setAllowanceError] = useState<string | null>(null);
  const [allowanceSuccess, setAllowanceSuccess] = useState(false);

  const [childGoals, setChildGoals] = useState<SavingsGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getChildLessonProgress(id)
      .then(setProgress)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load lesson progress.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (child?.weeklyAllowancePoints) {
      setAllowanceInput(String(child.weeklyAllowancePoints));
    } else {
      setAllowanceInput('');
    }
  }, [child?.weeklyAllowancePoints]);

  useEffect(() => {
    if (!id || !childFamilyId) {
      setGoalsLoading(false);
      return;
    }
    setGoalsLoading(true);
    setGoalsError(null);
    const unsub = subscribeChildSavingsGoals(
      childFamilyId,
      id,
      (goals) => {
        setChildGoals(goals);
        setGoalsLoading(false);
      },
      (err) => {
        setGoalsError(err instanceof Error ? err.message : 'Failed to load savings goals.');
        setGoalsLoading(false);
      },
    );
    return unsub;
  }, [id, childFamilyId]);

  const handleSaveAllowance = async () => {
    Keyboard.dismiss();
    setAllowanceError(null);
    setAllowanceSuccess(false);
    const trimmed = allowanceInput.trim();
    const value = trimmed === '' ? 0 : Number(trimmed);
    if (trimmed !== '' && (!Number.isInteger(value) || value < 0)) {
      setAllowanceError('Enter a whole number of points (or leave blank to disable).');
      return;
    }
    setAllowanceSaving(true);
    try {
      await updateChildWeeklyAllowance(child!.id, value);
      setAllowanceSuccess(true);
      setTimeout(() => setAllowanceSuccess(false), 2000);
    } catch (err: unknown) {
      setAllowanceError(err instanceof Error ? err.message : 'Failed to save allowance.');
    } finally {
      setAllowanceSaving(false);
    }
  };

  if (!child) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={[styles.backButton, { color: tintColor }]}>← Back</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.empty}>Child not found.</ThemedText>
      </ThemedView>
    );
  }

  const lessons = getLessonsForAgeGroup(child.ageGroup);
  const ageGroupLessonIds = lessons.map((l) => l.id);
  const earnedBadges: EarnedBadge[] = loading
    ? []
    : computeEarnedBadges(progress, ageGroupLessonIds);
  const currentStreak = loading ? 0 : computeLessonStreak(progress);
  const longestStreak = loading ? 0 : computeLongestStreak(progress);
  const completedCount = loading
    ? 0
    : lessons.filter((l) => progress[l.id]?.completed === true).length;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={[styles.backButton, { color: tintColor }]}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{child.displayName}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {AGE_GROUP_LABELS[child.ageGroup] ?? child.ageGroup} · {child.points} pts
          </ThemedText>
        </View>

        {loading && <ActivityIndicator color={tintColor} style={styles.loader} />}
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {!loading && (
          <>
            {/* Summary Card */}
            <View style={[styles.summaryCard, { borderColor: tintColor + '44' }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryValue}>
                    {completedCount}/{lessons.length}
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>Completed</ThemedText>
                </View>
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryValue}>
                    {currentStreak > 0 ? `🔥 ${currentStreak}` : '—'}
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>Day Streak</ThemedText>
                </View>
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryValue}>
                    {longestStreak > 0 ? `⭐ ${longestStreak}` : '—'}
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>Longest Streak</ThemedText>
                </View>
              </View>
            </View>

            {/* Weekly Allowance */}
            <View style={[styles.summaryCard, { borderColor: tintColor + '44' }]}>
              <ThemedText type="defaultSemiBold" style={styles.allowanceTitle}>Weekly Allowance</ThemedText>
              <ThemedText style={styles.allowanceHint}>
                Points deposited automatically every Monday at 06:00 (SAST). Set to 0 or leave blank to disable.
              </ThemedText>
              <TextInput
                style={[styles.allowanceInput, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
                placeholder="e.g. 50"
                placeholderTextColor={textColor + '88'}
                value={allowanceInput}
                onChangeText={(text) => {
                  setAllowanceSuccess(false);
                  setAllowanceError(null);
                  setAllowanceInput(text);
                }}
                keyboardType="numeric"
                editable={!allowanceSaving}
                returnKeyType="done"
                onSubmitEditing={handleSaveAllowance}
              />
              {allowanceError && (
                <ThemedText style={styles.error}>{allowanceError}</ThemedText>
              )}
              {allowanceSuccess && (
                <ThemedText style={styles.allowanceSuccess}>✓ Saved</ThemedText>
              )}
              <TouchableOpacity
                style={[styles.allowanceButton, { backgroundColor: tintColor }, allowanceSaving && styles.allowanceButtonDisabled]}
                onPress={handleSaveAllowance}
                disabled={allowanceSaving}
              >
                {allowanceSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.allowanceButtonText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>

            {/* Earned Badges */}
            <ThemedText type="subtitle" style={styles.sectionTitle}>Badges Earned</ThemedText>
            {earnedBadges.length === 0 ? (
              <ThemedText style={styles.empty}>No badges earned yet.</ThemedText>
            ) : (
              <View style={styles.badgeRow}>
                {earnedBadges.map((badge) => {
                  const def = BADGE_DEFINITIONS.find((b) => b.id === badge.badgeId);
                  const img = BADGE_IMAGES[badge.badgeId];
                  return (
                    <View key={badge.badgeId} style={styles.badgeItem}>
                      {img && (
                        <Image source={img} style={styles.badgeImage} contentFit="contain" />
                      )}
                      <ThemedText style={styles.badgeName}>{def?.name ?? badge.badgeId}</ThemedText>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Savings Goals */}
            <ThemedText type="subtitle" style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              Savings Goals
            </ThemedText>
            {goalsError && (
              <ThemedText style={styles.error}>{goalsError}</ThemedText>
            )}
            {goalsLoading ? (
              <ActivityIndicator color={tintColor} style={styles.loader} />
            ) : childGoals.length === 0 ? (
              <ThemedText style={styles.empty}>No savings goals set.</ThemedText>
            ) : (
              childGoals.map((goal) => {
                const pct = safeGoalPct(child.points, goal.targetPoints);
                const reached = goalReached(child.points, goal.targetPoints);
                const isArchived = goal.status === 'archived';
                return (
                  <View
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      isArchived && styles.goalCardArchived,
                      {
                        borderColor: isArchived
                          ? textColor + '22'
                          : reached
                            ? '#38a16988'
                            : tintColor + '44',
                      },
                    ]}
                  >
                    <View style={styles.goalHeader}>
                      <ThemedText style={[styles.goalTitle, isArchived && styles.dimText]}>
                        {reached && !isArchived ? '🎉 ' : isArchived ? '' : '🎯 '}
                        {goal.title}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.goalPct,
                          isArchived && styles.dimText,
                          { color: isArchived ? undefined : reached ? '#38a169' : tintColor },
                        ]}
                      >
                        {isArchived ? safeTargetDisplay(goal.targetPoints) : `${pct}%`}
                      </ThemedText>
                    </View>
                    {!isArchived ? (
                      <>
                        <ThemedText style={styles.goalMeta}>
                          {child.points} / {safeTargetDisplay(goal.targetPoints)}
                        </ThemedText>
                        <View style={styles.progressTrack}>
                          {pct > 0 ? (
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  flex: pct,
                                  backgroundColor: reached ? '#38a169' : tintColor,
                                },
                              ]}
                            />
                          ) : null}
                          {pct < 100 ? <View style={{ flex: 100 - pct }} /> : null}
                        </View>
                        {reached ? (
                          <ThemedText style={styles.reachedLabel}>Goal reached! 🎊</ThemedText>
                        ) : null}
                      </>
                    ) : (
                      <ThemedText style={[styles.goalMeta, styles.dimText]}>Archived</ThemedText>
                    )}
                  </View>
                );
              })
            )}

            {/* Lesson Progress */}
            <ThemedText type="subtitle" style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              Lesson Progress
            </ThemedText>
            {lessons.length === 0 ? (
              <ThemedText style={styles.empty}>No lessons for this age group.</ThemedText>
            ) : (
              lessons.map((lesson) => {
                const prog = progress[lesson.id];
                const isCompleted = prog?.completed === true;
                return (
                  <View
                    key={lesson.id}
                    style={[
                      styles.lessonCard,
                      { borderColor: isCompleted ? '#38a169' + '88' : tintColor + '44' },
                    ]}
                  >
                    <View style={styles.lessonHeader}>
                      <ThemedText style={styles.lessonTitle}>
                        {isCompleted ? '✅ ' : '○ '}{lesson.title}
                      </ThemedText>
                      <ThemedText style={[styles.lessonPoints, { color: tintColor }]}>
                        {lesson.pointsReward} pts
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.lessonDescription}>{lesson.description}</ThemedText>
                    {isCompleted && (
                      <ThemedText style={styles.completedLabel}>
                        Score: {prog.quizScore}/{lesson.quiz.length} · {prog.pointsAwarded} pts earned
                      </ThemedText>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: {},
  header: { marginBottom: 16 },
  backButton: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  title: { marginBottom: 2 },
  subtitle: { fontSize: 14, opacity: 0.7, marginBottom: 4 },

  // Summary
  summaryCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 12, opacity: 0.7, marginTop: 2 },

  // Badges
  sectionTitle: { marginBottom: 8 },
  sectionTitleSpaced: { marginTop: 16 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  badgeItem: { alignItems: 'center', width: 80 },
  badgeImage: { width: 56, height: 56, borderRadius: 28 },
  badgeName: { fontSize: 11, textAlign: 'center', marginTop: 4, fontWeight: '600' },

  // Lessons
  lessonCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10 },
  lessonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonTitle: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  lessonPoints: { fontSize: 13, fontWeight: '700' },
  lessonDescription: { marginTop: 4, opacity: 0.75, fontSize: 13 },
  completedLabel: { marginTop: 6, fontSize: 12, opacity: 0.65 },

  // Allowance
  allowanceTitle: { fontSize: 16, marginBottom: 4 },
  allowanceHint: { fontSize: 12, opacity: 0.6, marginBottom: 10 },
  allowanceInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 8 },
  allowanceSuccess: { color: '#38a169', fontSize: 13, marginBottom: 6 },
  allowanceButton: { borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  allowanceButtonDisabled: { opacity: 0.6 },
  allowanceButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  // Shared
  error: { color: '#e53e3e', marginBottom: 8 },
  loader: { marginVertical: 24 },
  empty: { opacity: 0.6, marginBottom: 12 },

  // Goals
  goalCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10 },
  goalCardArchived: { opacity: 0.6 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  goalPct: { fontSize: 13, fontWeight: '700' },
  goalMeta: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 4,
  },
  progressFill: { borderRadius: 4 },
  reachedLabel: { color: '#38a169', fontSize: 13, fontWeight: '600', marginTop: 4 },
  dimText: { opacity: 0.5 },
});
