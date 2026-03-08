import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLessons } from '@/hooks/use-lessons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BADGE_DEFINITIONS } from '@/lib/lesson-catalog';
import { computeLongestStreak } from '@/lib/lesson-service';
import type { Lesson } from '@/src/types';
import type { QuizResult } from '@/lib/lesson-service';

// Badge assets keyed by badge ID
const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  fast_learner: require('@/src/assets/branding/badges/badge_fast_learner.png'),
  quiz_master: require('@/src/assets/branding/badges/badge_quiz_master.png'),
  lesson_legend: require('@/src/assets/branding/badges/badge_lesson_legend.png'),
};

type ScreenView = 'list' | 'content' | 'quiz' | 'results';

export default function LessonsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const { lessons, progress, earnedBadges, streak, loading, error, completeQuiz } = useLessons();

  const [view, setView] = useState<ScreenView>('list');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const completedCount = lessons.filter((l) => progress[l.id]?.completed === true).length;
  const longestStreak = computeLongestStreak(progress);

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setView('content');
  };

  const startQuiz = () => {
    if (!selectedLesson) return;
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setQuizResult(null);
    setView('quiz');
  };

  const selectOption = (index: number) => {
    setSelectedOption(index);
  };

  const nextQuestion = () => {
    if (selectedOption === null || !selectedLesson) return;
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestion < selectedLesson.quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: number[]) => {
    if (!selectedLesson) return;
    setSubmitting(true);
    try {
      const result = await completeQuiz(selectedLesson.id, finalAnswers);
      setQuizResult(result);
      setView('results');
    } catch {
      // Error is handled by context
    } finally {
      setSubmitting(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedLesson(null);
    setQuizResult(null);
    setAnswers([]);
    setCurrentQuestion(0);
    setSelectedOption(null);
  };

  // ─── List View ──────────────────────────────────────────────────

  const renderList = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={[styles.backButton, { color: tintColor }]}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>📚 Lessons</ThemedText>
      </View>

      {/* Streak & Progress Summary */}
      <View style={[styles.summaryCard, { borderColor: tintColor + '44' }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>
              {streak > 0 ? `🔥 ${streak}` : '—'}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Day Streak</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>
              {longestStreak > 0 ? `⭐ ${longestStreak}` : '—'}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Longest Streak</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>
              {completedCount}/{lessons.length}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Completed</ThemedText>
          </View>
        </View>
      </View>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <View style={styles.badgeSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Badges Earned</ThemedText>
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
        </View>
      )}

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      {loading && <ActivityIndicator color={tintColor} style={styles.loader} />}

      <ThemedText type="subtitle" style={styles.sectionTitle}>Your Lessons</ThemedText>

      {lessons.length === 0 && !loading && (
        <ThemedText style={styles.empty}>No lessons available.</ThemedText>
      )}

      {lessons.map((lesson) => {
        const prog = progress[lesson.id];
        const isCompleted = prog?.completed === true;
        return (
          <TouchableOpacity
            key={lesson.id}
            style={[styles.lessonCard, { borderColor: isCompleted ? '#38a169' + '88' : tintColor + '44' }]}
            onPress={() => openLesson(lesson)}
          >
            <View style={styles.lessonHeader}>
              <ThemedText style={styles.lessonTitle}>
                {isCompleted ? '✅ ' : ''}{lesson.title}
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
          </TouchableOpacity>
        );
      })}
    </>
  );

  // ─── Content View ───────────────────────────────────────────────

  const renderContent = () => {
    if (!selectedLesson) return null;
    const isCompleted = progress[selectedLesson.id]?.completed === true;

    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={backToList}>
            <ThemedText style={[styles.backButton, { color: tintColor }]}>← Lessons</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{selectedLesson.title}</ThemedText>
        </View>

        <View style={[styles.contentCard, { borderColor: tintColor + '44' }]}>
          <ThemedText style={styles.contentText}>{selectedLesson.content}</ThemedText>
        </View>

        <View style={[styles.rewardInfo, { borderColor: tintColor + '22' }]}>
          <ThemedText style={styles.rewardText}>
            🏆 Complete the quiz to earn {selectedLesson.pointsReward} points!
          </ThemedText>
          <ThemedText style={styles.rewardSubtext}>
            Answer at least 2 out of {selectedLesson.quiz.length} questions correctly to pass.
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: tintColor }]}
          onPress={startQuiz}
        >
          <ThemedText style={styles.primaryButtonText}>
            {isCompleted ? 'Retake Quiz' : 'Take Quiz'}
          </ThemedText>
        </TouchableOpacity>
      </>
    );
  };

  // ─── Quiz View ──────────────────────────────────────────────────

  const renderQuiz = () => {
    if (!selectedLesson) return null;
    const question = selectedLesson.quiz[currentQuestion];
    const isLast = currentQuestion === selectedLesson.quiz.length - 1;

    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={backToList}>
            <ThemedText style={[styles.backButton, { color: tintColor }]}>← Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.quizProgress}>
            Question {currentQuestion + 1} of {selectedLesson.quiz.length}
          </ThemedText>
        </View>

        <ThemedText style={styles.questionText}>{question.question}</ThemedText>

        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                {
                  borderColor: isSelected ? tintColor : textColor + '33',
                  backgroundColor: isSelected ? tintColor + '15' : 'transparent',
                },
              ]}
              onPress={() => selectOption(index)}
              disabled={submitting}
            >
              <ThemedText
                style={[styles.optionLabel, { color: isSelected ? tintColor : textColor + '88' }]}
              >
                {String.fromCharCode(65 + index)}
              </ThemedText>
              <ThemedText style={styles.optionText}>{option}</ThemedText>
            </TouchableOpacity>
          );
        })}

        {submitting && <ActivityIndicator color={tintColor} style={styles.loader} />}

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: tintColor },
            selectedOption === null && styles.disabledButton,
          ]}
          onPress={nextQuestion}
          disabled={selectedOption === null || submitting}
        >
          <ThemedText style={styles.primaryButtonText}>
            {isLast ? 'Submit Quiz' : 'Next Question'}
          </ThemedText>
        </TouchableOpacity>
      </>
    );
  };

  // ─── Results View ───────────────────────────────────────────────

  const renderResults = () => {
    if (!selectedLesson || !quizResult) return null;

    return (
      <>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Quiz Results</ThemedText>
        </View>

        <View style={[styles.resultsCard, { borderColor: quizResult.passed ? '#38a169' + '88' : '#e53e3e' + '88' }]}>
          <ThemedText style={styles.resultsEmoji}>
            {quizResult.passed ? '🎉' : '📖'}
          </ThemedText>
          <ThemedText style={styles.resultsTitle}>
            {quizResult.passed ? 'Great Job!' : 'Keep Learning!'}
          </ThemedText>
          <ThemedText style={styles.resultsScore}>
            {quizResult.score}/{quizResult.totalQuestions} correct
          </ThemedText>

          {quizResult.passed && !quizResult.alreadyCompleted && (
            <ThemedText style={styles.pointsEarned}>
              +{quizResult.pointsAwarded} points earned! 🏆
            </ThemedText>
          )}
          {quizResult.passed && quizResult.alreadyCompleted && (
            <ThemedText style={styles.alreadyCompleted}>
              Already completed — no additional points
            </ThemedText>
          )}
          {!quizResult.passed && (
            <ThemedText style={styles.tryAgain}>
              You need at least 2 correct answers to pass. Read the lesson again and try once more!
            </ThemedText>
          )}
        </View>

        {/* Show explanations */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>Explanations</ThemedText>
        {selectedLesson.quiz.map((q, i) => {
          const wasCorrect = answers[i] === q.correctIndex;
          return (
            <View
              key={i}
              style={[styles.explanationCard, { borderColor: wasCorrect ? '#38a169' + '66' : '#e53e3e' + '66' }]}
            >
              <ThemedText style={styles.explanationQuestion}>
                {wasCorrect ? '✅' : '❌'} {q.question}
              </ThemedText>
              <ThemedText style={styles.explanationAnswer}>
                Your answer: {q.options[answers[i]] ?? '—'}
              </ThemedText>
              {!wasCorrect && (
                <ThemedText style={styles.explanationCorrect}>
                  Correct: {q.options[q.correctIndex]}
                </ThemedText>
              )}
              <ThemedText style={styles.explanationText}>{q.explanation}</ThemedText>
            </View>
          );
        })}

        <View style={styles.resultsActions}>
          {!quizResult.passed && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tintColor }]}
              onPress={() => {
                setView('content');
                setQuizResult(null);
                setAnswers([]);
              }}
            >
              <ThemedText style={styles.primaryButtonText}>Try Again</ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: tintColor }]}
            onPress={backToList}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: tintColor }]}>
              Back to Lessons
            </ThemedText>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {view === 'list' && renderList()}
        {view === 'content' && renderContent()}
        {view === 'quiz' && renderQuiz()}
        {view === 'results' && renderResults()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: {},
  header: { marginBottom: 16 },
  backButton: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  title: { marginBottom: 4 },

  // Summary
  summaryCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 13, opacity: 0.7, marginTop: 2 },

  // Badges
  badgeSection: { marginBottom: 16 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  badgeItem: { alignItems: 'center', width: 80 },
  badgeImage: { width: 56, height: 56, borderRadius: 28 },
  badgeName: { fontSize: 11, textAlign: 'center', marginTop: 4, fontWeight: '600' },

  // Lessons list
  sectionTitle: { marginTop: 4, marginBottom: 8 },
  lessonCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10 },
  lessonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  lessonPoints: { fontSize: 14, fontWeight: '700' },
  lessonDescription: { marginTop: 4, opacity: 0.8, fontSize: 14 },
  completedLabel: { marginTop: 6, fontSize: 12, opacity: 0.65 },

  // Lesson content
  contentCard: { borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 16 },
  contentText: { fontSize: 16, lineHeight: 26 },
  rewardInfo: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 },
  rewardText: { fontSize: 15, fontWeight: '600' },
  rewardSubtext: { fontSize: 13, opacity: 0.7, marginTop: 4 },

  // Quiz
  quizProgress: { marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: '600', marginBottom: 16, lineHeight: 26 },
  optionButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: { fontSize: 16, fontWeight: '700', marginRight: 12, width: 24 },
  optionText: { fontSize: 15, flex: 1 },

  // Results
  resultsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsEmoji: { fontSize: 48, marginBottom: 8 },
  resultsTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  resultsScore: { fontSize: 16, opacity: 0.8, marginBottom: 8 },
  pointsEarned: { fontSize: 18, fontWeight: '700', color: '#38a169', marginTop: 4 },
  alreadyCompleted: { fontSize: 14, opacity: 0.65, marginTop: 4, textAlign: 'center' },
  tryAgain: { fontSize: 14, opacity: 0.8, marginTop: 8, textAlign: 'center' },

  // Explanations
  explanationCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  explanationQuestion: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  explanationAnswer: { fontSize: 13, opacity: 0.8 },
  explanationCorrect: { fontSize: 13, color: '#38a169', fontWeight: '600', marginTop: 2 },
  explanationText: { fontSize: 13, opacity: 0.7, marginTop: 4, fontStyle: 'italic' },

  // Buttons
  primaryButton: { borderRadius: 10, alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabledButton: { opacity: 0.4 },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  secondaryButtonText: { fontWeight: '600', fontSize: 15 },
  resultsActions: { marginTop: 8 },

  // Shared
  error: { color: '#e53e3e', marginBottom: 8 },
  loader: { marginBottom: 8 },
  empty: { opacity: 0.6, marginBottom: 8 },
});
