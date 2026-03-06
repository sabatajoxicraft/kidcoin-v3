import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Task } from '@/src/types';

export default function ParentTasksScreen() {
  const { tasks, loading, error, reviewTask, refresh } = useTask();
  const { children } = useFamily();
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const submittedTasks = tasks.filter((task) => task.status === 'submitted');
  const otherTasks = tasks.filter((task) => task.status !== 'submitted');

  const childNames = children.reduce<Record<string, string>>((acc, child) => {
    acc[child.id] = child.displayName;
    return acc;
  }, {});

  const handleReview = async (taskId: string, decision: 'approved' | 'returned') => {
    try {
      await reviewTask(taskId, decision);
    } catch {
      // error state is already managed in context
    }
  };

  const renderTask = (task: Task, showActions: boolean) => (
    <View key={task.id} style={[styles.card, { borderColor: tintColor + '44' }]}>
      <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
      {task.description ? <ThemedText style={styles.taskDescription}>{task.description}</ThemedText> : null}
      <ThemedText style={styles.meta}>
        {childNames[task.assignedToChildId] ?? 'Unknown child'} • {task.points} pts
      </ThemedText>
      <ThemedText style={styles.meta}>Status: {task.status}</ThemedText>
      {task.feedback ? <ThemedText style={styles.feedback}>Feedback: {task.feedback}</ThemedText> : null}

      {showActions ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tintColor }]}
            onPress={() => handleReview(task.id, 'approved')}
            disabled={loading}
          >
            <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: tintColor }]}
            onPress={() => handleReview(task.id, 'returned')}
            disabled={loading}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: tintColor }]}>Return</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Tasks</ThemedText>

      <View style={styles.topActions}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: textColor + '44' }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.secondaryButtonText}>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: textColor + '44' }]}
          onPress={() => router.push('/(parent)/task-create')}
        >
          <ThemedText style={styles.secondaryButtonText}>Create</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: textColor + '44' }]}
          onPress={() => refresh().catch(() => undefined)}
        >
          <ThemedText style={styles.secondaryButtonText}>Refresh</ThemedText>
        </TouchableOpacity>
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {loading ? <ActivityIndicator style={styles.loading} color={tintColor} /> : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Submitted</ThemedText>
        {submittedTasks.length > 0 ? (
          submittedTasks.map((task) => renderTask(task, true))
        ) : (
          <ThemedText style={styles.empty}>No submitted tasks.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Other Tasks</ThemedText>
        {otherTasks.length > 0 ? (
          otherTasks.map((task) => renderTask(task, false))
        ) : (
          <ThemedText style={styles.empty}>No other tasks yet.</ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  title: { marginBottom: 16 },
  topActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  sectionTitle: { marginTop: 12, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  taskDescription: { marginTop: 4, opacity: 0.8 },
  meta: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  feedback: { marginTop: 6, fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '600' },
  empty: { opacity: 0.6, marginBottom: 8 },
  error: { color: '#e53e3e', marginBottom: 8 },
  loading: { marginBottom: 8 },
});
