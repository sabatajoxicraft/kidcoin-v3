import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import type { EarnedBadge, LessonProgressRecord } from '@/src/types';

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
  const { children } = useFamily();

  const child = children.find((c) => c.id === id);

  const [progress, setProgress] = useState<Record<string, LessonProgressRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Shared
  error: { color: '#e53e3e', marginBottom: 8 },
  loader: { marginVertical: 24 },
  empty: { opacity: 0.6, marginBottom: 12 },
});
