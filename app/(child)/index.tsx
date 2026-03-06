import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useAuth } from '@/hooks/use-auth';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChildDashboard() {
  const { signOut } = useAuth();
  const { userProfile, children } = useFamily();
  const { tasks, transactions, submitTask, refresh, loading, error } = useTask();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const currentChild = children.find((child) => child.id === userProfile?.id);
  const currentPoints = currentChild?.points ?? 0;
  const assignedTasks = tasks.filter((task) => task.status === 'assigned');
  const recentTransactions = transactions.slice(0, 5);

  const handleSubmit = async (taskId: string) => {
    try {
      await submitTask(taskId);
    } catch {
      // error state is already managed in context
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>My Tasks</ThemedText>

        <View style={[styles.pointsCard, { borderColor: tintColor + '44' }]}>
          <ThemedText style={styles.pointsLabel}>Current Points</ThemedText>
          <ThemedText style={styles.pointsValue}>{currentPoints}</ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, { borderColor: textColor + '44' }]}
          onPress={() => refresh().catch(() => undefined)}
        >
          <ThemedText style={styles.refreshText}>Refresh</ThemedText>
        </TouchableOpacity>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {loading ? <ActivityIndicator color={tintColor} style={styles.loader} /> : null}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Assigned Tasks</ThemedText>
        {assignedTasks.length > 0 ? (
          assignedTasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, { borderColor: tintColor + '44' }]}>
              <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
              {task.description ? <ThemedText style={styles.taskDescription}>{task.description}</ThemedText> : null}
              <ThemedText style={styles.meta}>{task.points} pts</ThemedText>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: tintColor }]}
                onPress={() => handleSubmit(task.id)}
                disabled={loading}
              >
                <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <ThemedText style={styles.empty}>No assigned tasks right now.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Transactions</ThemedText>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={[styles.transactionRow, { borderColor: textColor + '22' }]}>
              <ThemedText style={styles.transactionTitle}>{transaction.note ?? transaction.type}</ThemedText>
              <ThemedText style={styles.transactionPoints}>+{transaction.pointsDelta}</ThemedText>
            </View>
          ))
        ) : (
          <ThemedText style={styles.empty}>No transactions yet.</ThemedText>
        )}

        <TouchableOpacity style={[styles.signOutButton, { borderColor: textColor + '44' }]} onPress={signOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  content: { paddingBottom: 24 },
  title: { marginBottom: 16 },
  pointsCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  pointsLabel: { opacity: 0.7, fontSize: 14 },
  pointsValue: { fontSize: 30, fontWeight: '700' },
  refreshButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  refreshText: { fontWeight: '600' },
  error: { color: '#e53e3e', marginBottom: 8 },
  loader: { marginBottom: 8 },
  sectionTitle: { marginTop: 12, marginBottom: 8 },
  taskCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  taskDescription: { marginTop: 4, opacity: 0.8 },
  meta: { marginTop: 6, fontSize: 13, opacity: 0.7 },
  submitButton: {
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  submitButtonText: { color: '#fff', fontWeight: '600' },
  transactionRow: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionTitle: { fontSize: 14, flex: 1 },
  transactionPoints: { fontSize: 15, fontWeight: '600' },
  empty: { opacity: 0.6, marginBottom: 8 },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  signOutText: { fontWeight: '600', fontSize: 16 },
});
