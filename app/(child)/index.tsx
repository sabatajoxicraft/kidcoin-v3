import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useAuth } from '@/hooks/use-auth';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';

function isPositiveIntegerString(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

export default function ChildDashboard() {
  const { signOut } = useAuth();
  const { userProfile, family, children, activeChild, exitChildMode } = useFamily();
  const { tasks, transactions, payoutRequests, submitTask, requestPayout, refresh, loading, error } = useTask();
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [payoutPoints, setPayoutPoints] = useState('');
  const [payoutNote, setPayoutNote] = useState('');

  const displayChild = activeChild ?? children.find((child) => child.id === userProfile?.id);
  const currentPoints = displayChild?.points ?? 0;
  const pendingPayoutPoints = displayChild?.pendingPayoutPoints ?? 0;
  const availablePayoutPoints = Math.max(0, currentPoints - pendingPayoutPoints);
  const minPayoutAmount = family?.settings?.minPayoutAmount ?? 0;
  const assignedTasks = tasks.filter((task) => task.status === 'assigned');
  const returnedTasks = tasks.filter((task) => task.status === 'returned');
  const recentTransactions = transactions.slice(0, 5);

  const parsedPayoutPoints = isPositiveIntegerString(payoutPoints) ? Number(payoutPoints) : NaN;
  const isPayoutFormInvalid =
    !Number.isFinite(parsedPayoutPoints) ||
    parsedPayoutPoints <= 0 ||
    parsedPayoutPoints < minPayoutAmount ||
    parsedPayoutPoints > availablePayoutPoints;

  const handleSubmit = async (taskId: string) => {
    try {
      await submitTask(taskId);
    } catch {
      // error state is already managed in context
    }
  };

  const handleRequestPayout = async () => {
    if (!isPositiveIntegerString(payoutPoints)) return;
    const parsed = Number(payoutPoints);
    if (parsed <= 0 || parsed < minPayoutAmount) return;
    if (parsed > availablePayoutPoints) return;
    try {
      await requestPayout(parsed, payoutNote || undefined);
      setPayoutPoints('');
      setPayoutNote('');
    } catch {
      // error state is already managed in context
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>My Tasks</ThemedText>

        <View style={[styles.pointsCard, { borderColor: tintColor + '44' }]}>
          <ThemedText style={styles.pointsLabel}>
            {displayChild ? `${displayChild.displayName}'s Points` : 'Current Points'}
          </ThemedText>
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

        <ThemedText type="subtitle" style={styles.sectionTitle}>Returned Tasks</ThemedText>
        {returnedTasks.length > 0 ? (
          returnedTasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, { borderColor: tintColor + '44' }]}>
              <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
              {task.description ? <ThemedText style={styles.taskDescription}>{task.description}</ThemedText> : null}
              <ThemedText style={styles.meta}>{task.points} pts</ThemedText>
              {task.feedback ? <ThemedText style={styles.feedback}>Feedback: {task.feedback}</ThemedText> : null}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: tintColor }]}
                onPress={() => handleSubmit(task.id)}
                disabled={loading}
              >
                <ThemedText style={styles.submitButtonText}>Resubmit</ThemedText>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <ThemedText style={styles.empty}>No returned tasks right now.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Transactions</ThemedText>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={[styles.transactionRow, { borderColor: textColor + '22' }]}>
              <ThemedText style={styles.transactionTitle}>{transaction.note ?? transaction.type}</ThemedText>
              <ThemedText style={styles.transactionPoints}>
                {transaction.pointsDelta > 0 ? '+' : ''}{transaction.pointsDelta}
              </ThemedText>
            </View>
          ))
        ) : (
          <ThemedText style={styles.empty}>No transactions yet.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Request Payout</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor + '44' }]}
          placeholder="Points to redeem"
          placeholderTextColor={textColor + '66'}
          keyboardType="numeric"
          value={payoutPoints}
          onChangeText={setPayoutPoints}
        />
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor + '44' }]}
          placeholder="Note (optional)"
          placeholderTextColor={textColor + '66'}
          value={payoutNote}
          onChangeText={setPayoutNote}
        />
        <ThemedText style={styles.payoutMeta}>
          Available: {availablePayoutPoints} pts{pendingPayoutPoints > 0 ? ` · ${pendingPayoutPoints} pts pending` : ''}
          {minPayoutAmount > 0 ? ` · Min: ${minPayoutAmount} pts` : ''}
        </ThemedText>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: tintColor }, (isPayoutFormInvalid || loading) ? { opacity: 0.4 } : undefined]}
          onPress={handleRequestPayout}
          disabled={isPayoutFormInvalid || loading}
        >
          <ThemedText style={styles.submitButtonText}>Submit Payout Request</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Payout Requests</ThemedText>
        {payoutRequests.length > 0 ? (
          payoutRequests.map((req) => (
            <View key={req.id} style={[styles.taskCard, { borderColor: textColor + '22' }]}>
              <ThemedText style={styles.taskTitle}>{req.requestedPoints} pts</ThemedText>
              <ThemedText style={styles.meta}>Status: {req.status}</ThemedText>
              {req.requestNote ? <ThemedText style={styles.feedback}>Note: {req.requestNote}</ThemedText> : null}
              {req.reviewNote ? <ThemedText style={styles.feedback}>Review: {req.reviewNote}</ThemedText> : null}
            </View>
          ))
        ) : (
          <ThemedText style={styles.empty}>No payout requests yet.</ThemedText>
        )}

        {activeChild ? (
          <TouchableOpacity
            style={[styles.switchButton, { borderColor: textColor + '44' }]}
            onPress={() => {
              exitChildMode();
              router.replace('/(parent)');
            }}
          >
            <ThemedText style={styles.switchButtonText}>Switch to Parent</ThemedText>
          </TouchableOpacity>
        ) : null}

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
  feedback: { marginTop: 6, fontSize: 13 },
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 15,
  },
  empty: { opacity: 0.6, marginBottom: 8 },
  payoutMeta: { fontSize: 13, opacity: 0.65, marginBottom: 8 },
  switchButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  switchButtonText: { fontWeight: '600', fontSize: 16 },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  signOutText: { fontWeight: '600', fontSize: 16 },
});
