import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { normalizeEvidenceSet } from '@/lib/evidence-service';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Task, TaskEvidence } from '@/src/types';

export default function ParentTasksScreen() {
  const { tasks, loading, error, reviewTask, refresh } = useTask();
  const { children } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const submittedTasks = tasks.filter((task) => task.status === 'submitted');
  const returnedTasks = tasks.filter((task) => task.status === 'returned');
  const assignedTasks = tasks.filter((task) => task.status === 'assigned');
  const approvedTasks = tasks.filter((task) => task.status === 'approved');

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

      {(() => {
        const normalized = normalizeEvidenceSet(task);
        if (!normalized) return null;

        const isLegacyOnly = !task.evidenceSet;
        const renderItem = (item: TaskEvidence, isStale: boolean) => (
          <View key={item.storagePath} style={styles.evidenceContainer}>
            <Image source={{ uri: item.downloadUrl }} style={styles.evidenceImage} contentFit="cover" />
            <ThemedText style={styles.evidenceMeta}>
              {item.fileName ?? 'file'}
              {item.fileSize != null ? ` · ${(item.fileSize / 1024).toFixed(0)} KB` : ''}
              {item.uploadedAt instanceof Date ? ` · ${item.uploadedAt.toLocaleDateString()}` : ''}
            </ThemedText>
            {isStale ? (
              <ThemedText style={styles.staleEvidenceNote}>
                ⚠️ Previous evidence — uploaded before this submission
              </ThemedText>
            ) : null}
          </View>
        );

        if (isLegacyOnly) {
          // v1 legacy path — single evidence item, preserve stale warning
          const item = normalized.after[0];
          if (!item) return null;
          const isStale =
            task.submittedAt instanceof Date &&
            item.uploadedAt instanceof Date &&
            item.uploadedAt.getTime() < task.submittedAt.getTime() - 60_000;
          return renderItem(item, isStale);
        }

        // v2 path — render before/after buckets
        return (
          <>
            {normalized.before.length > 0 ? (
              <>
                <ThemedText style={styles.evidenceBucketLabel}>Before</ThemedText>
                {normalized.before.map((item) => renderItem(item, false))}
              </>
            ) : null}
            {normalized.after.length > 0 ? (
              <>
                <ThemedText style={styles.evidenceBucketLabel}>After</ThemedText>
                {normalized.after.map((item) => renderItem(item, false))}
              </>
            ) : null}
          </>
        );
      })()}

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
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
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

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Submitted (Awaiting Review)</ThemedText>
        {submittedTasks.length > 0 ? (
          submittedTasks.map((task) => renderTask(task, true))
        ) : (
          <ThemedText style={styles.empty}>No submitted tasks awaiting review.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Returned (Awaiting Child Resubmission)</ThemedText>
        {returnedTasks.length > 0 ? (
          returnedTasks.map((task) => renderTask(task, false))
        ) : (
          <ThemedText style={styles.empty}>No returned tasks awaiting resubmission.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Assigned</ThemedText>
        {assignedTasks.length > 0 ? (
          assignedTasks.map((task) => renderTask(task, false))
        ) : (
          <ThemedText style={styles.empty}>No assigned tasks yet.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Approved</ThemedText>
        {approvedTasks.length > 0 ? (
          approvedTasks.map((task) => renderTask(task, false))
        ) : (
          <ThemedText style={styles.empty}>No approved tasks yet.</ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  title: { marginBottom: 16 },
  topActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  scroll: { flex: 1 },
  content: {},
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
  evidenceContainer: { marginTop: 8, borderRadius: 8, overflow: 'hidden' },
  evidenceImage: { width: '100%', height: 200, borderRadius: 8 },
  evidenceMeta: { fontSize: 12, opacity: 0.6, marginTop: 4 },
  evidenceBucketLabel: { fontSize: 12, fontWeight: '600', opacity: 0.7, marginTop: 8, marginBottom: 2 },
  staleEvidenceNote: { fontSize: 12, color: '#b7791f', marginTop: 2 },
});
