import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatPointsAsMoney, useDeviceCurrency } from '@/lib/currency';
import type { PayoutRequest } from '@/src/types';

export default function ParentPayoutsScreen() {
  const { payoutRequests, loading, error, reviewPayoutRequest, refresh } = useTask();
  const { children, family } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const currencyCode = useDeviceCurrency();
  const conversionRate = family?.settings?.pointsConversionRate ?? 0.1;

  const childNames = children.reduce<Record<string, string>>((acc, child) => {
    acc[child.id] = child.displayName;
    return acc;
  }, {});

  const pendingRequests = payoutRequests.filter((r) => r.status === 'pending');
  const approvedRequests = payoutRequests.filter((r) => r.status === 'approved');
  const rejectedRequests = payoutRequests.filter((r) => r.status === 'rejected');

  const handleReview = async (requestId: string, decision: 'approved' | 'rejected') => {
    try {
      await reviewPayoutRequest(requestId, decision, reviewNotes[requestId]);
      setReviewNotes((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch {
      // error state is already managed in context
    }
  };

  const renderPendingCard = (request: PayoutRequest) => (
    <View key={request.id} style={[styles.card, { borderColor: tintColor + '44' }]}>
      <ThemedText style={styles.cardTitle}>
        {childNames[request.childId] ?? 'Unknown child'}
      </ThemedText>
      <ThemedText style={styles.meta}>
        {request.requestedPoints} pts · {formatPointsAsMoney(request.requestedPoints, conversionRate, currencyCode)}
      </ThemedText>
      {request.requestNote ? (
        <ThemedText style={styles.note}>Note: {request.requestNote}</ThemedText>
      ) : null}
      <TextInput
        style={[styles.input, { color: textColor, borderColor: textColor + '44' }]}
        placeholder="Review note (optional)"
        placeholderTextColor={textColor + '66'}
        value={reviewNotes[request.id] ?? ''}
        onChangeText={(text) => setReviewNotes((prev) => ({ ...prev, [request.id]: text }))}
      />
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: tintColor }]}
          onPress={() => handleReview(request.id, 'approved')}
          disabled={loading}
        >
          <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: tintColor }]}
          onPress={() => handleReview(request.id, 'rejected')}
          disabled={loading}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: tintColor }]}>Reject</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInfoCard = (request: PayoutRequest) => (
    <View key={request.id} style={[styles.card, { borderColor: textColor + '22' }]}>
      <ThemedText style={styles.cardTitle}>
        {childNames[request.childId] ?? 'Unknown child'}
      </ThemedText>
      <ThemedText style={styles.meta}>
        {request.requestedPoints} pts · {formatPointsAsMoney(request.requestedPoints, conversionRate, currencyCode)} · {request.status}
      </ThemedText>
      {request.requestNote ? (
        <ThemedText style={styles.note}>Request note: {request.requestNote}</ThemedText>
      ) : null}
      {request.reviewNote ? (
        <ThemedText style={styles.note}>Review note: {request.reviewNote}</ThemedText>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText type="title" style={styles.title}>Payout Requests</ThemedText>

      <View style={styles.topActions}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: textColor + '44' }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.secondaryButtonText}>Back</ThemedText>
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
        <ThemedText type="subtitle" style={styles.sectionTitle}>Pending</ThemedText>
        {pendingRequests.length > 0 ? (
          pendingRequests.map(renderPendingCard)
        ) : (
          <ThemedText style={styles.empty}>No pending payout requests.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Approved</ThemedText>
        {approvedRequests.length > 0 ? (
          approvedRequests.map(renderInfoCard)
        ) : (
          <ThemedText style={styles.empty}>No approved payout requests yet.</ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Rejected</ThemedText>
        {rejectedRequests.length > 0 ? (
          rejectedRequests.map(renderInfoCard)
        ) : (
          <ThemedText style={styles.empty}>No rejected payout requests yet.</ThemedText>
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
  cardTitle: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  note: { marginTop: 6, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 15,
  },
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
