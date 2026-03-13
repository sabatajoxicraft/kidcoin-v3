import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { subscribeFamilyTasks } from '@/lib/task-service';
import { subscribeFamilyPayoutRequests } from '@/lib/payout-service';
import { formatPointsAsMoney, useDeviceCurrency } from '@/lib/currency';
import {
  subscribeFamilyTransactions,
  calculateSpendingMetrics,
  calculateTaskMetrics,
  calculateChildSpending,
  calculateChildTaskTrends,
  type FamilySpendingMetrics,
  type FamilyTaskMetrics,
  type ChildSpendingMetrics,
  type ChildTaskTrends,
} from '@/lib/reporting-service';
import type { PointTransaction, Task, PayoutRequest } from '@/src/types';

export default function ReportingScreen() {
  const { family, children } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');

  const currencyCode = useDeviceCurrency();
  const conversionRate = family?.settings?.pointsConversionRate ?? 0.1;

  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

  const [txLoaded, setTxLoaded] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [payoutsLoaded, setPayoutsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const familyId = family?.id ?? '';

  const appendError = (msg: string) =>
    setError((prev) => {
      if (!prev) return msg;
      return prev.split('\n').includes(msg) ? prev : `${prev}\n${msg}`;
    });

  useEffect(() => {
    if (!familyId) {
      setError('No family found. Please set up your family first.');
      setTxLoaded(true);
      setTasksLoaded(true);
      setPayoutsLoaded(true);
      return;
    }

    const unsubTx = subscribeFamilyTransactions(
      familyId,
      (data) => { setTransactions(data); setTxLoaded(true); },
      (err) => { appendError(err.message); setTxLoaded(true); },
    );

    const unsubTasks = subscribeFamilyTasks(
      familyId,
      (data) => { setTasks(data); setTasksLoaded(true); },
      (err) => { appendError(err.message); setTasksLoaded(true); },
    );

    const unsubPayouts = subscribeFamilyPayoutRequests(
      familyId,
      (data) => { setPayouts(data); setPayoutsLoaded(true); },
      (err) => { appendError(err.message); setPayoutsLoaded(true); },
    );

    return () => { unsubTx(); unsubTasks(); unsubPayouts(); };
  }, [familyId]);

  const loading = !txLoaded || !tasksLoaded || !payoutsLoaded;

  const spending: FamilySpendingMetrics = calculateSpendingMetrics(children, transactions);
  const taskMetrics: FamilyTaskMetrics = calculateTaskMetrics(tasks);
  const pendingPayoutPoints = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.requestedPoints, 0);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backText, { color: tintColor }]}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Family Analytics</ThemedText>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.spinner} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : (
          <>
            {/* Family Overview */}
            <ThemedText style={styles.sectionLabel}>Family Overview</ThemedText>
            <View style={[styles.card, { borderColor: tintColor + '44' }]}>
              <Row label="Total Family Balance" value={`${spending.totalBalance} pts`} subValue={formatPointsAsMoney(spending.totalBalance, conversionRate, currencyCode)} />
              <Row label="Total Earned" value={`${spending.totalEarned} pts`} subValue={formatPointsAsMoney(spending.totalEarned, conversionRate, currencyCode)} />
              <Row label="Total Spent (Payouts)" value={`${spending.totalSpent} pts`} subValue={formatPointsAsMoney(spending.totalSpent, conversionRate, currencyCode)} />
              <Row label="Pending Payout Points" value={`${pendingPayoutPoints} pts`} subValue={formatPointsAsMoney(pendingPayoutPoints, conversionRate, currencyCode)} />
              <View style={styles.divider} />
              <ThemedText style={styles.subLabel}>Task Summary</ThemedText>
              <Row label="Approved" value={String(taskMetrics.approved)} />
              <Row label="Awaiting Review" value={String(taskMetrics.pending)} />
              <Row label="Assigned" value={String(taskMetrics.assigned)} />
              <Row label="Returned" value={String(taskMetrics.returned)} />
            </View>

            {/* Per-Child Spending */}
            {children.length > 0 && (
              <>
                <ThemedText style={[styles.sectionLabel, styles.sectionSpacing]}>
                  Spending by Child
                </ThemedText>
                {children.map((child) => {
                  const s: ChildSpendingMetrics = calculateChildSpending(child.id, transactions);
                  return (
                    <View key={child.id} style={[styles.card, { borderColor: tintColor + '44' }]}>
                      <ThemedText style={styles.cardTitle}>{child.displayName}</ThemedText>
                      <Row label="Current Balance" value={`${child.points ?? 0} pts`} subValue={formatPointsAsMoney(child.points ?? 0, conversionRate, currencyCode)} />
                      <Row label="Total Earned" value={`${s.earned} pts`} subValue={formatPointsAsMoney(s.earned, conversionRate, currencyCode)} />
                      <Row label="Total Spent" value={`${s.spent} pts`} subValue={formatPointsAsMoney(s.spent, conversionRate, currencyCode)} />
                    </View>
                  );
                })}
              </>
            )}

            {/* Per-Child Task Trends */}
            {children.length > 0 && (
              <>
                <ThemedText style={[styles.sectionLabel, styles.sectionSpacing]}>
                  Task Trends by Child
                </ThemedText>
                {children.map((child) => {
                  const t: ChildTaskTrends = calculateChildTaskTrends(child.id, tasks);
                  return (
                    <View key={child.id} style={[styles.card, { borderColor: tintColor + '44' }]}>
                      <ThemedText style={styles.cardTitle}>{child.displayName}</ThemedText>
                      <Row label="Assigned" value={String(t.assigned)} />
                      <Row label="Submitted" value={String(t.submitted)} />
                      <Row label="Approved" value={String(t.approved)} />
                      <Row label="Returned" value={String(t.returned)} />
                      <View style={styles.divider} />
                      <Row label="Recent 7-day Approvals" value={String(t.recentApproved7Days)} />
                    </View>
                  );
                })}
              </>
            )}

            {children.length === 0 && (
              <ThemedText style={styles.empty}>No children added yet.</ThemedText>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function Row({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <View style={styles.rowRight}>
        <ThemedText style={styles.rowValue}>{value}</ThemedText>
        {subValue ? <ThemedText style={styles.rowSubValue}>{subValue}</ThemedText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 17 },
  title: {},
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionSpacing: { marginTop: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  subLabel: { fontSize: 12, fontWeight: '600', opacity: 0.5, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  rowLabel: { fontSize: 14, opacity: 0.75, flex: 1 },
  rowRight: { alignItems: 'flex-end' },
  rowValue: { fontSize: 14, fontWeight: '600' },
  rowSubValue: { fontSize: 11, opacity: 0.55, marginTop: 1 },
  divider: { height: 1, opacity: 0.15, backgroundColor: '#888', marginVertical: 8 },
  errorText: { color: '#E53E3E', marginBottom: 12, fontSize: 14 },
  empty: { opacity: 0.5, textAlign: 'center', marginTop: 24 },
  spinner: { marginVertical: 40 },
});
