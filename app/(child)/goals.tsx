import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  archiveSavingsGoal,
  createSavingsGoal,
  goalReached,
  safeGoalPct,
  safeTargetDisplay,
  subscribeChildSavingsGoals,
} from '@/lib/goal-service';
import type { SavingsGoal } from '@/src/types';

function isPositiveIntegerString(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

function GoalProgressBar({
  pct,
  reached,
  tintColor,
}: {
  pct: number;
  reached: boolean;
  tintColor: string;
}) {
  const fillColor = reached ? '#38a169' : tintColor;
  return (
    <View style={styles.progressTrack}>
      {pct > 0 ? (
        <View style={[styles.progressFill, { flex: pct, backgroundColor: fillColor }]} />
      ) : null}
      {pct < 100 ? <View style={{ flex: 100 - pct }} /> : null}
    </View>
  );
}

export default function GoalsScreen() {
  const { userProfile, family, children, activeChild } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const displayChild = activeChild ?? children.find((c) => c.id === userProfile?.id);
  const currentPoints = displayChild?.points ?? 0;
  const familyId = displayChild?.familyId ?? family?.id ?? '';
  const childId = displayChild?.id ?? '';

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeChildSavingsGoals(
      familyId,
      childId,
      (updated) => {
        setGoals(updated);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Failed to load savings goals.');
        setLoading(false);
      },
    );
    return unsub;
  }, [familyId, childId]);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title || !isPositiveIntegerString(newTarget)) return;
    const target = Number(newTarget);
    setCreating(true);
    setCreateError(null);
    try {
      await createSavingsGoal(familyId, childId, title, target);
      setNewTitle('');
      setNewTarget('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create goal.');
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (goal: SavingsGoal) => {
    try {
      await archiveSavingsGoal(goal.id, familyId, childId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive goal.');
    }
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const archivedGoals = goals.filter((g) => g.status === 'archived');
  const isFormValid = newTitle.trim().length > 0 && isPositiveIntegerString(newTarget);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={[styles.backButton, { color: tintColor }]}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>My Savings Goals</ThemedText>
          <ThemedText style={styles.subtitle}>{currentPoints} pts available</ThemedText>
        </View>

        {/* Create Goal Form */}
        <View style={[styles.formCard, { borderColor: tintColor + '44' }]}>
          <ThemedText type="defaultSemiBold" style={styles.formTitle}>New Goal</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor + '44' }]}
            placeholder="Goal title (e.g. New Bike)"
            placeholderTextColor={textColor + '66'}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor + '44' }]}
            placeholder="Target points (e.g. 500)"
            placeholderTextColor={textColor + '66'}
            keyboardType="numeric"
            value={newTarget}
            onChangeText={setNewTarget}
          />
          {createError ? <ThemedText style={styles.error}>{createError}</ThemedText> : null}
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: tintColor },
              (!isFormValid || creating) && { opacity: 0.4 },
            ]}
            onPress={handleCreate}
            disabled={!isFormValid || creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.createButtonText}>Add Goal</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {loading ? <ActivityIndicator color={tintColor} style={styles.loader} /> : null}

        {/* Active Goals */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>Active Goals</ThemedText>
        {!loading && activeGoals.length === 0 ? (
          <ThemedText style={styles.empty}>No active goals yet. Create one above!</ThemedText>
        ) : null}
        {activeGoals.map((goal) => {
          const pct = safeGoalPct(currentPoints, goal.targetPoints);
          const reached = goalReached(currentPoints, goal.targetPoints);
          return (
            <View
              key={goal.id}
              style={[
                styles.goalCard,
                { borderColor: reached ? '#38a16988' : tintColor + '44' },
              ]}
            >
              <View style={styles.goalHeader}>
                <ThemedText style={styles.goalTitle}>
                  {reached ? '🎉 ' : '🎯 '}
                  {goal.title}
                </ThemedText>
                <ThemedText style={[styles.goalPct, { color: reached ? '#38a169' : tintColor }]}>
                  {pct}%
                </ThemedText>
              </View>
              <ThemedText style={styles.goalMeta}>
                {currentPoints} / {safeTargetDisplay(goal.targetPoints)}
              </ThemedText>
              <GoalProgressBar pct={pct} reached={reached} tintColor={tintColor} />
              {reached ? (
                <ThemedText style={styles.reachedLabel}>Goal reached! 🎊</ThemedText>
              ) : null}
              <TouchableOpacity
                style={[styles.archiveButton, { borderColor: textColor + '44' }]}
                onPress={() => handleArchive(goal)}
              >
                <ThemedText style={styles.archiveButtonText}>Archive</ThemedText>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Archived Goals */}
        {archivedGoals.length > 0 ? (
          <>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 16 }]}>
              Archived Goals
            </ThemedText>
            {archivedGoals.map((goal) => (
              <View
                key={goal.id}
                style={[styles.goalCard, styles.archivedCard, { borderColor: textColor + '22' }]}
              >
                <View style={styles.goalHeader}>
                  <ThemedText style={[styles.goalTitle, styles.dimText]}>{goal.title}</ThemedText>
                  <ThemedText style={[styles.goalPct, styles.dimText]}>
                    {safeTargetDisplay(goal.targetPoints)}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.goalMeta, styles.dimText]}>Archived</ThemedText>
              </View>
            ))}
          </>
        ) : null}
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
  subtitle: { fontSize: 14, opacity: 0.7 },

  formCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 15,
  },
  createButton: {
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  error: { color: '#e53e3e', marginBottom: 8 },
  loader: { marginBottom: 8 },
  sectionTitle: { marginBottom: 8 },
  empty: { opacity: 0.6, marginBottom: 8 },

  goalCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  archivedCard: { opacity: 0.6 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  goalPct: { fontSize: 14, fontWeight: '700' },
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

  archiveButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 10,
  },
  archiveButtonText: { fontSize: 13, fontWeight: '600', opacity: 0.7 },

  dimText: { opacity: 0.5 },
});
