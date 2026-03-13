import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useAuth } from '@/hooks/use-auth';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';
import { safeGoalPct, subscribeChildSavingsGoals } from '@/lib/goal-service';
import { subscribeActiveAnnouncements } from '@/lib/announcement-service';
import { formatPointsAsMoney } from '@/lib/currency';
import type { Announcement, CurrencyCode, EvidenceDraft, SavingsGoal } from '@/src/types';

function isPositiveIntegerString(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

// Native crop UI clips under system bars on Android, so we only enable it on iOS.
const EVIDENCE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.7,
  allowsEditing: Platform.OS === 'ios',
};

export default function ChildDashboard() {
  const { signOut } = useAuth();
  const { userProfile, family, children, activeChild, exitChildMode } = useFamily();
  const { tasks, transactions, payoutRequests, submitTask, requestPayout, refresh, loading, error } = useTask();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [payoutPoints, setPayoutPoints] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [evidenceDrafts, setEvidenceDrafts] = useState<Record<string, EvidenceDraft>>({});
  const [pickerErrors, setPickerErrors] = useState<Record<string, string>>({});
  const [activeGoals, setActiveGoals] = useState<SavingsGoal[]>([]);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);

  const displayChild = activeChild ?? children.find((child) => child.id === userProfile?.id);
  const currentPoints = displayChild?.points ?? 0;
  const pendingPayoutPoints = displayChild?.pendingPayoutPoints ?? 0;
  const availablePayoutPoints = Math.max(0, currentPoints - pendingPayoutPoints);
  const minPayoutAmount = family?.settings?.minPayoutAmount ?? 0;
  const currencyCode: CurrencyCode = family?.settings?.currencyCode ?? 'ZAR';
  const conversionRate = family?.settings?.pointsConversionRate ?? 0.1;
  const assignedTasks = tasks.filter((task) => task.status === 'assigned');
  const returnedTasks = tasks.filter((task) => task.status === 'returned');
  const recentTransactions = transactions.slice(0, 5);

  const familyId = displayChild?.familyId ?? family?.id ?? '';
  const childId = displayChild?.id ?? '';

  useEffect(() => {
    if (!familyId || !childId) return;
    const unsub = subscribeChildSavingsGoals(
      familyId,
      childId,
      (goals) => setActiveGoals(goals.filter((g) => g.status === 'active')),
      () => undefined,
    );
    return unsub;
  }, [familyId, childId]);

  useEffect(() => {
    if (!familyId) return;
    const unsub = subscribeActiveAnnouncements(
      familyId,
      (data) => setActiveAnnouncements(data),
      () => undefined,
    );
    return unsub;
  }, [familyId]);

  const parsedPayoutPoints = isPositiveIntegerString(payoutPoints) ? Number(payoutPoints) : NaN;
  const isPayoutFormInvalid =
    !Number.isFinite(parsedPayoutPoints) ||
    parsedPayoutPoints <= 0 ||
    parsedPayoutPoints < minPayoutAmount ||
    parsedPayoutPoints > availablePayoutPoints;

  const clearPickerError = (taskId: string) => {
    setPickerErrors((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const pickImage = async (taskId: string, source: 'camera' | 'gallery') => {
    try {
      const permResult = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permResult.granted) {
        setPickerErrors((prev) => ({
          ...prev,
          [taskId]: `Please allow ${source} access to attach evidence.`,
        }));
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(EVIDENCE_PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(EVIDENCE_PICKER_OPTIONS);

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = asset.fileName ?? uri.split('/').pop() ?? 'evidence.jpg';
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const fileSize = asset.fileSize ?? 0;

      setEvidenceDrafts((prev) => ({ ...prev, [taskId]: { localUri: uri, fileName, mimeType, fileSize } }));
      clearPickerError(taskId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to pick image.';
      setPickerErrors((prev) => ({ ...prev, [taskId]: message }));
    }
  };

  const clearDraft = (taskId: string) => {
    setEvidenceDrafts((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const handleSubmit = async (taskId: string) => {
    try {
      await submitTask(taskId, evidenceDrafts[taskId]);
      clearDraft(taskId);
      clearPickerError(taskId);
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
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
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

        <TouchableOpacity
          style={[styles.lessonsButton, { backgroundColor: tintColor }]}
          onPress={() => router.push('/(child)/lessons')}
        >
          <ThemedText style={styles.lessonsButtonText}>📚 Financial Lessons</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.goalsButton, { backgroundColor: tintColor }]}
          onPress={() => router.push('/(child)/goals')}
        >
          <ThemedText style={styles.goalsButtonText}>🎯 My Savings Goals</ThemedText>
        </TouchableOpacity>

        <View style={[styles.goalsCompact, { borderColor: tintColor + '44' }]}>
          {activeGoals.length > 0 ? (
            <>
              <ThemedText style={styles.goalsCompactLabel}>
                {activeGoals.length} active {activeGoals.length === 1 ? 'goal' : 'goals'}
              </ThemedText>
              {(() => {
                const top = activeGoals.reduce((best, g) =>
                  safeGoalPct(currentPoints, g.targetPoints) > safeGoalPct(currentPoints, best.targetPoints) ? g : best,
                activeGoals[0]);
                const pct = safeGoalPct(currentPoints, top.targetPoints);
                return (
                  <ThemedText style={styles.goalsCompactProgress}>
                    {top.title}: {pct}%
                  </ThemedText>
                );
              })()}
            </>
          ) : (
            <>
              <ThemedText style={styles.goalsCompactLabel}>No active goals yet</ThemedText>
              <ThemedText style={styles.goalsCompactProgress}>
                Tap &quot;My Savings Goals&quot; to set your first goal 🎯
              </ThemedText>
            </>
          )}
        </View>

        {/* Announcements compact card */}
        <TouchableOpacity
          style={[styles.announcementsCompact, { borderColor: tintColor + '44' }]}
          onPress={() => router.push('/(child)/announcements')}
        >
          {activeAnnouncements.length > 0 ? (
            <>
              <ThemedText style={styles.announcementsCompactLabel}>
                📢 {activeAnnouncements[0].title}
              </ThemedText>
              <ThemedText style={styles.announcementsCompactBody} numberOfLines={2}>
                {activeAnnouncements[0].body}
              </ThemedText>
              {activeAnnouncements.length > 1 && (
                <ThemedText style={styles.announcementsCompactMore}>
                  +{activeAnnouncements.length - 1} more announcement{activeAnnouncements.length > 2 ? 's' : ''}
                </ThemedText>
              )}
            </>
          ) : (
            <>
              <ThemedText style={styles.announcementsCompactLabel}>📢 Announcements</ThemedText>
              <ThemedText style={styles.announcementsCompactBody}>No announcements yet.</ThemedText>
            </>
          )}
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

              <View style={styles.evidenceRow}>
                <TouchableOpacity
                  style={[styles.evidenceButton, { borderColor: tintColor }]}
                  onPress={() => pickImage(task.id, 'camera')}
                  disabled={loading}
                >
                  <ThemedText style={styles.evidenceButtonText}>📷 Camera</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.evidenceButton, { borderColor: tintColor }]}
                  onPress={() => pickImage(task.id, 'gallery')}
                  disabled={loading}
                >
                  <ThemedText style={styles.evidenceButtonText}>🖼 Gallery</ThemedText>
                </TouchableOpacity>
              </View>

              {evidenceDrafts[task.id] ? (
                <View style={styles.evidencePreview}>
                  <Image source={{ uri: evidenceDrafts[task.id].localUri }} style={styles.evidenceImage} contentFit="cover" />
                  <TouchableOpacity style={styles.removeButton} onPress={() => clearDraft(task.id)}>
                    <ThemedText style={styles.removeButtonText}>✕</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.evidenceLabel}>Evidence attached</ThemedText>
                </View>
              ) : null}

              {pickerErrors[task.id] ? <ThemedText style={styles.pickerError}>{pickerErrors[task.id]}</ThemedText> : null}

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

              {task.evidence ? (
                <View style={styles.evidencePreview}>
                  <Image source={{ uri: task.evidence.downloadUrl }} style={styles.evidenceImage} contentFit="cover" />
                  <ThemedText style={styles.evidenceLabel}>Previous evidence</ThemedText>
                </View>
              ) : null}

              <View style={styles.evidenceRow}>
                <TouchableOpacity
                  style={[styles.evidenceButton, { borderColor: tintColor }]}
                  onPress={() => pickImage(task.id, 'camera')}
                  disabled={loading}
                >
                  <ThemedText style={styles.evidenceButtonText}>📷 Camera</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.evidenceButton, { borderColor: tintColor }]}
                  onPress={() => pickImage(task.id, 'gallery')}
                  disabled={loading}
                >
                  <ThemedText style={styles.evidenceButtonText}>🖼 Gallery</ThemedText>
                </TouchableOpacity>
              </View>

              {evidenceDrafts[task.id] ? (
                <View style={styles.evidencePreview}>
                  <Image source={{ uri: evidenceDrafts[task.id].localUri }} style={styles.evidenceImage} contentFit="cover" />
                  <TouchableOpacity style={styles.removeButton} onPress={() => clearDraft(task.id)}>
                    <ThemedText style={styles.removeButtonText}>✕</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.evidenceLabel}>New evidence attached</ThemedText>
                </View>
              ) : null}

              {pickerErrors[task.id] ? <ThemedText style={styles.pickerError}>{pickerErrors[task.id]}</ThemedText> : null}

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
          Available: {availablePayoutPoints} pts ({formatPointsAsMoney(availablePayoutPoints, conversionRate, currencyCode)}){pendingPayoutPoints > 0 ? ` · ${pendingPayoutPoints} pts pending` : ''}
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
              <ThemedText style={styles.meta}>
                {formatPointsAsMoney(req.requestedPoints, conversionRate, currencyCode)} · {req.status}
              </ThemedText>
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
            onPress={async () => {
              await exitChildMode();
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
  container: { flex: 1, paddingHorizontal: 24 },
  content: {},
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
  lessonsButton: {
    borderRadius: 8,
    alignItems: 'center' as const,
    paddingVertical: 12,
    marginBottom: 8,
  },
  lessonsButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  goalsButton: {
    borderRadius: 8,
    alignItems: 'center' as const,
    paddingVertical: 12,
    marginBottom: 8,
  },
  goalsButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  goalsCompact: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  goalsCompactLabel: { fontSize: 14, fontWeight: '600', opacity: 0.85 },
  goalsCompactProgress: { fontSize: 13, opacity: 0.65, marginTop: 2 },
  announcementsCompact: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  announcementsCompactLabel: { fontSize: 14, fontWeight: '600', opacity: 0.85, marginBottom: 2 },
  announcementsCompactBody: { fontSize: 13, opacity: 0.65, lineHeight: 18 },
  announcementsCompactMore: { fontSize: 12, opacity: 0.5, marginTop: 4 },
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
  evidenceRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  evidenceButton: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  evidenceButtonText: { fontSize: 13, fontWeight: '600' },
  evidencePreview: { marginTop: 8, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  evidenceImage: { width: '100%', height: 200, borderRadius: 8 },
  removeButton: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  evidenceLabel: { fontSize: 12, opacity: 0.65, marginTop: 4 },
  pickerError: { color: '#e53e3e', fontSize: 13, marginTop: 6 },
});
