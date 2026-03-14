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
import { formatPointsAsMoney, useDeviceCurrency } from '@/lib/currency';
import type { Announcement, EvidenceDraft, SavingsGoal } from '@/src/types';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardEmptyState,
  DashboardBadge,
  DashboardActionButton,
  ChildHeroCard,
  ParentQuickActionTile,
} from '@/components/dashboard';

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
  const currencyCode = useDeviceCurrency();
  const conversionRate = family?.settings?.pointsConversionRate ?? 0.1;
  const assignedTasks = tasks.filter((task) => task.status === 'assigned');
  const returnedTasks = tasks.filter((task) => task.status === 'returned');
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

        <ThemedText type="title" style={styles.title}>Mission Board</ThemedText>

        {activeChild ? (
          <View style={styles.childModeBanner}>
            <ThemedText style={[styles.childModeText, { color: tintColor }]}>
              👶 Child mode · {activeChild.displayName}
            </ThemedText>
          </View>
        ) : null}

        <ChildHeroCard
          name={displayChild?.displayName ?? 'there'}
          points={currentPoints}
          availablePoints={availablePayoutPoints}
          pendingPoints={pendingPayoutPoints}
          moneyEquivalent={formatPointsAsMoney(availablePayoutPoints, conversionRate, currencyCode)}
          borderColor={tintColor + '44'}
        />

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        {loading ? <ActivityIndicator color={tintColor} style={styles.loader} /> : null}

        <TouchableOpacity onPress={() => router.push('/(child)/announcements')} activeOpacity={0.8}>
          <DashboardCard borderColor={tintColor + '44'}>
            <DashboardSectionHeader title="📢 Announcements" />
            {activeAnnouncements.length > 0 ? (
              <>
                <ThemedText style={styles.announcementTitle}>{activeAnnouncements[0].title}</ThemedText>
                <ThemedText style={styles.announcementBody} numberOfLines={2}>
                  {activeAnnouncements[0].body}
                </ThemedText>
                {activeAnnouncements.length > 1 ? (
                  <ThemedText style={styles.announcementsMore}>
                    +{activeAnnouncements.length - 1} more
                  </ThemedText>
                ) : null}
              </>
            ) : (
              <ThemedText style={styles.announcementBody}>No announcements yet.</ThemedText>
            )}
          </DashboardCard>
        </TouchableOpacity>

        <DashboardSectionHeader
          title="Do Next"
          meta={assignedTasks.length > 0 ? `${assignedTasks.length} task${assignedTasks.length !== 1 ? 's' : ''}` : undefined}
        />

        {assignedTasks.length > 0 ? (
          assignedTasks.map((task) => (
            <DashboardCard key={task.id} borderColor={tintColor + '44'}>
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
                disabled={loading}
                activeOpacity={0.8}
                accessibilityState={{ disabled: loading }}
                onPress={() => handleSubmit(task.id)}
              >
                <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
                  <DashboardActionButton
                    variant="primary"
                    label="Submit"
                    onPress={() => {}}
                    backgroundColor={tintColor}
                    style={loading ? { opacity: 0.4 } : undefined}
                  />
                </View>
              </TouchableOpacity>
            </DashboardCard>
          ))
        ) : (
          <DashboardEmptyState message="No tasks assigned right now — check back soon! 🎉" />
        )}

        {returnedTasks.length > 0 ? (
          <DashboardSectionHeader title="Fix & Resubmit" meta={`${returnedTasks.length} need${returnedTasks.length === 1 ? 's' : ''} attention`} />
        ) : null}

        {returnedTasks.map((task) => (
          <DashboardCard key={task.id} borderColor={tintColor + '44'}>
            <View style={styles.taskTitleRow}>
              <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
              <DashboardBadge label="Returned" backgroundColor="#F59E0B" />
            </View>
            {task.description ? <ThemedText style={styles.taskDescription}>{task.description}</ThemedText> : null}
            <ThemedText style={styles.meta}>{task.points} pts</ThemedText>
            {task.feedback ? <ThemedText style={styles.feedback}>{"Parent's note:"} {task.feedback}</ThemedText> : null}

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
              disabled={loading}
              activeOpacity={0.8}
              accessibilityState={{ disabled: loading }}
              onPress={() => handleSubmit(task.id)}
            >
              <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
                <DashboardActionButton
                  variant="primary"
                  label="Resubmit"
                  onPress={() => {}}
                  backgroundColor={tintColor}
                  style={loading ? { opacity: 0.4 } : undefined}
                />
              </View>
            </TouchableOpacity>
          </DashboardCard>
        ))}

        <TouchableOpacity onPress={() => router.push('/(child)/goals')} activeOpacity={0.8}>
          <DashboardCard borderColor={tintColor + '44'}>
            <DashboardSectionHeader title="My Goals" meta="View All →" />
            {activeGoals.length > 0 ? (
              (() => {
                const top = activeGoals.reduce(
                  (best, g) =>
                    safeGoalPct(currentPoints, g.targetPoints) > safeGoalPct(currentPoints, best.targetPoints)
                      ? g
                      : best,
                  activeGoals[0],
                );
                const pct = safeGoalPct(currentPoints, top.targetPoints);
                return (
                  <>
                    <ThemedText style={styles.goalTitle}>{top.title}</ThemedText>
                    <ThemedText style={styles.goalProgress}>{pct}% complete</ThemedText>
                  </>
                );
              })()
            ) : (
              <ThemedText style={styles.goalEmpty}>Set your first savings goal 🎯</ThemedText>
            )}
          </DashboardCard>
        </TouchableOpacity>

        <DashboardSectionHeader title="Request Payout" />
        <DashboardCard borderColor={tintColor + '44'}>
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
            Available: {availablePayoutPoints} pts ({formatPointsAsMoney(availablePayoutPoints, conversionRate, currencyCode)}){pendingPayoutPoints > 0 ? ` · ${pendingPayoutPoints} pts pending` : ''}{minPayoutAmount > 0 ? ` · Min: ${minPayoutAmount} pts` : ''}
          </ThemedText>
          <TouchableOpacity
            disabled={isPayoutFormInvalid || loading}
            activeOpacity={0.8}
            accessibilityState={{ disabled: isPayoutFormInvalid || loading }}
            onPress={handleRequestPayout}
          >
            <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
              <DashboardActionButton
                variant="primary"
                label="Submit Payout Request"
                onPress={() => {}}
                backgroundColor={tintColor}
                style={(isPayoutFormInvalid || loading) ? { opacity: 0.4 } : undefined}
              />
            </View>
          </TouchableOpacity>
        </DashboardCard>

        <TouchableOpacity onPress={() => router.push('/(child)/history')} activeOpacity={0.8}>
          <DashboardCard borderColor={tintColor + '44'}>
            <DashboardSectionHeader title="📜 Activity & Payouts" meta="View All →" />
            <ThemedText style={styles.historyHint}>
              {transactions.length > 0
                ? `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} · ${payoutRequests.length} payout request${payoutRequests.length !== 1 ? 's' : ''}`
                : 'No activity yet — complete tasks to earn points! 🌟'}
            </ThemedText>
          </DashboardCard>
        </TouchableOpacity>

        <View style={styles.quickNavRow}>
          <ParentQuickActionTile
            label="📚 Lessons"
            onPress={() => router.push('/(child)/lessons')}
            tintColor={tintColor}
          />
          <ParentQuickActionTile
            label="🎯 Goals"
            onPress={() => router.push('/(child)/goals')}
            tintColor={tintColor}
          />
        </View>

        <DashboardActionButton
          variant="outline"
          label="Refresh"
          onPress={() => refresh().catch(() => undefined)}
          borderColor={textColor + '44'}
        />

        {activeChild ? (
          <DashboardActionButton
            variant="outline"
            label="Switch to Parent"
            onPress={async () => {
              await exitChildMode();
              router.replace('/(parent)');
            }}
            borderColor={textColor + '44'}
          />
        ) : null}

        <DashboardActionButton
          variant="outline"
          label="Sign Out"
          onPress={signOut}
          borderColor={textColor + '44'}
        />

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: {},
  title: { marginBottom: 8 },
  childModeBanner: {
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  childModeText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
  },
  error: { color: '#e53e3e', marginBottom: 8 },
  loader: { marginBottom: 8 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  taskDescription: { marginTop: 4, opacity: 0.8 },
  meta: { marginTop: 6, fontSize: 13, opacity: 0.7 },
  feedback: { marginTop: 6, fontSize: 13 },
  announcementTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  announcementBody: { fontSize: 13, opacity: 0.65, lineHeight: 18 },
  announcementsMore: { fontSize: 12, opacity: 0.5, marginTop: 4 },
  goalTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  goalProgress: { fontSize: 13, opacity: 0.65 },
  goalEmpty: { fontSize: 13, opacity: 0.65 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 15,
  },
  payoutMeta: { fontSize: 13, opacity: 0.65, marginBottom: 8 },
  historyHint: { fontSize: 13, opacity: 0.65, marginTop: 4 },
  quickNavRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
