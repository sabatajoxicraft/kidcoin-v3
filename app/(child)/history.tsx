import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatPointsAsMoney, useDeviceCurrency } from '@/lib/currency';
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader } from '@/components/dashboard';

const TRANSACTION_LABELS: Record<string, string> = {
  task_reward: '✅ Task Completed',
  lesson_reward: '📚 Lesson Completed',
  weekly_allowance: '🌟 Weekly Allowance',
  payout_deduction: '🎉 Points Redeemed',
  adjustment: '⚖️ Points Adjustment',
};

function friendlyTransactionLabel(type: string): string {
  return TRANSACTION_LABELS[type] ?? '💰 Activity';
}

export default function HistoryScreen() {
  const { family, children, activeChild, userProfile } = useFamily();
  const { transactions, payoutRequests } = useTask();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const displayChild = activeChild ?? children.find((c) => c.id === userProfile?.id);
  const currencyCode = useDeviceCurrency();
  const conversionRate = family?.settings?.pointsConversionRate ?? 0.1;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={[styles.backButton, { color: tintColor }]}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>My Recent Activity</ThemedText>
          {displayChild?.displayName ? (
            <ThemedText style={styles.subtitle}>{displayChild.displayName}&apos;s latest activity</ThemedText>
          ) : null}
        </View>

        <DashboardSectionHeader
          title="Recent Activity"
          meta={transactions.length > 0 ? `Latest ${transactions.length}` : undefined}
        />

        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <View key={tx.id} style={[styles.transactionRow, { borderColor: textColor + '22' }]}>
              <View style={styles.transactionInfo}>
                <ThemedText style={styles.transactionTitle}>{friendlyTransactionLabel(tx.type)}</ThemedText>
                {tx.note ? (
                  <ThemedText style={styles.transactionNote}>{tx.note}</ThemedText>
                ) : null}
              </View>
              <ThemedText style={styles.transactionPoints}>
                {tx.pointsDelta > 0 ? '+' : ''}{tx.pointsDelta}
              </ThemedText>
            </View>
          ))
        ) : (
          <DashboardEmptyState message="No transactions yet — complete tasks to earn points! 🌟" />
        )}

        <DashboardSectionHeader
          title="Payout History"
          meta={payoutRequests.length > 0 ? `${payoutRequests.length}` : undefined}
          style={styles.payoutHistoryHeader}
        />

        {payoutRequests.length > 0 ? (
          payoutRequests.map((req) => (
            <DashboardCard key={req.id} borderColor={textColor + '22'}>
              <ThemedText style={styles.reqPoints}>{req.requestedPoints} pts</ThemedText>
              <ThemedText style={styles.reqMeta}>
                {formatPointsAsMoney(req.requestedPoints, conversionRate, currencyCode)} · {req.status}
              </ThemedText>
              {req.requestNote ? <ThemedText style={styles.reqNote}>Your note: {req.requestNote}</ThemedText> : null}
              {req.reviewNote ? <ThemedText style={styles.reqNote}>Parent&apos;s note: {req.reviewNote}</ThemedText> : null}
            </DashboardCard>
          ))
        ) : (
          <DashboardEmptyState message="No payout requests yet — request your first reward when you're ready! 💰" />
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
  title: { marginBottom: 4 },
  subtitle: { fontSize: 14, opacity: 0.65 },
  payoutHistoryHeader: { marginTop: 12 },
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
  transactionInfo: { flex: 1, marginRight: 8 },
  transactionTitle: { fontSize: 14 },
  transactionNote: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  transactionPoints: { fontSize: 15, fontWeight: '600' },
  reqPoints: { fontSize: 16, fontWeight: '600' },
  reqMeta: { marginTop: 4, fontSize: 13, opacity: 0.7 },
  reqNote: { marginTop: 6, fontSize: 13 },
});
