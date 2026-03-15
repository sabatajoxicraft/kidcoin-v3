import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useAuth } from '@/hooks/use-auth';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  DashboardSectionHeader,
  DashboardActionButton,
  DashboardCard,
  DashboardEmptyState,
  ChildSummaryCard,
  ParentQuickActionTile,
} from '@/components/dashboard';
import type { ChildProfile } from '@/src/types';

const AGE_GROUP_LABELS: Record<string, string> = {
  junior: 'Junior',
  standard: 'Standard',
  teen: 'Teen',
};

export default function ParentDashboard() {
  const { family, children } = useFamily();
  const { signOut } = useAuth();
  const { tasks, payoutRequests } = useTask();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const pendingTaskReviews = tasks.filter((t) => t.status === 'submitted').length;
  const pendingPayoutReviews = payoutRequests.filter((r) => r.status === 'pending').length;
  const totalAttention = pendingTaskReviews + pendingPayoutReviews;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedText type="title" style={styles.familyName}>
          {family?.name ?? 'My Family'}
        </ThemedText>
        <ThemedText style={styles.familyMeta}>
          {children.length} child{children.length !== 1 ? 'ren' : ''}
        </ThemedText>

        {/* Attention overview — compact read-only summary of items needing action */}
        {totalAttention > 0 ? (
          <DashboardCard borderColor={tintColor + '55'} style={styles.attentionCard}>
            <ThemedText type="defaultSemiBold" style={styles.attentionHeading}>
              Needs attention
            </ThemedText>
            {pendingTaskReviews > 0 ? (
              <ThemedText style={styles.attentionRow}>
                • {pendingTaskReviews} task submission{pendingTaskReviews !== 1 ? 's' : ''} awaiting review
              </ThemedText>
            ) : null}
            {pendingPayoutReviews > 0 ? (
              <ThemedText style={styles.attentionRow}>
                • {pendingPayoutReviews} payout request{pendingPayoutReviews !== 1 ? 's' : ''} awaiting approval
              </ThemedText>
            ) : null}
          </DashboardCard>
        ) : null}

        {/* Urgent Action Tray */}
        <DashboardSectionHeader title="Approvals & Tasks" style={styles.sectionHeader} />
        <View style={styles.tileRow}>
          <ParentQuickActionTile
            label="Review Tasks"
            tintColor={tintColor}
            onPress={() => router.push('/(parent)/tasks')}
            notificationCount={pendingTaskReviews}
          />
          <ParentQuickActionTile
            label="Review Payouts"
            tintColor={tintColor}
            onPress={() => router.push('/(parent)/payouts')}
            notificationCount={pendingPayoutReviews}
          />
          <ParentQuickActionTile
            label="Create Task"
            tintColor={tintColor}
            onPress={() => router.push('/(parent)/task-create')}
          />
        </View>

        {/* Family Snapshot */}
        <DashboardSectionHeader
          title="Children"
          meta={`${children.length} member${children.length !== 1 ? 's' : ''}`}
          style={styles.sectionHeader}
        />
        {children.length === 0 ? (
          <DashboardEmptyState message="No children added yet." />
        ) : (
          children.map((item: ChildProfile) => (
            <ChildSummaryCard
              key={item.id}
              name={item.displayName}
              points={item.points}
              ageGroup={item.ageGroup}
              ageGroupLabel={AGE_GROUP_LABELS[item.ageGroup] ?? item.ageGroup}
              borderColor={tintColor + '44'}
              badgeColor={tintColor}
              onPress={() => router.push(`/(parent)/child/${item.id}`)}
            />
          ))
        )}

        {/* Secondary Actions */}
        <DashboardSectionHeader title="More" style={styles.sectionHeader} />
        <DashboardActionButton
          label="📢 Announcements"
          variant="outline"
          borderColor={textColor + '44'}
          onPress={() => router.push('/(parent)/announcements')}
        />
        <DashboardActionButton
          label="📊 Analytics"
          variant="outline"
          borderColor={textColor + '44'}
          onPress={() => router.push('/(parent)/reporting')}
        />
        <DashboardActionButton
          label="Task Templates"
          variant="outline"
          borderColor={textColor + '44'}
          onPress={() => router.push('/(parent)/task-templates')}
        />
        <DashboardActionButton
          label="Add Child"
          variant="outline"
          borderColor={textColor + '44'}
          onPress={() => router.push('/(parent)/child-add')}
        />
        <DashboardActionButton
          label="Enter Child Mode"
          variant="outline"
          borderColor={textColor + '44'}
          onPress={() => router.push('/(parent)/child-mode')}
        />
        <DashboardActionButton
          label="Sign Out"
          variant="outline"
          borderColor={textColor + '44'}
          onPress={signOut}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  familyName: {
    marginBottom: 4,
    marginTop: 16,
  },
  familyMeta: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 24,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  attentionCard: {
    marginBottom: 16,
  },
  attentionHeading: {
    marginBottom: 6,
    fontSize: 13,
  },
  attentionRow: {
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 2,
  },
});
