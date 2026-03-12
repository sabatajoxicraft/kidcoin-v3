import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ChildProfile } from '@/src/types';

const AGE_GROUP_LABELS: Record<string, string> = {
  junior: 'Junior',
  standard: 'Standard',
  teen: 'Teen',
};

export default function ParentDashboard() {
  const { family, children } = useFamily();
  const { signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const renderChild = ({ item }: { item: ChildProfile }) => (
    <TouchableOpacity
      style={[styles.childItem, { borderColor: tintColor + '44' }]}
      onPress={() => router.push(`/(parent)/child/${item.id}`)}
    >
      <View>
        <ThemedText style={styles.childName}>{item.displayName}</ThemedText>
        <ThemedText style={styles.pointsText}>{item.points} pts</ThemedText>
      </View>
      <View style={styles.childItemRight}>
        <View style={[styles.badge, { backgroundColor: tintColor }]}>
          <ThemedText style={styles.badgeText}>{AGE_GROUP_LABELS[item.ageGroup] ?? item.ageGroup}</ThemedText>
        </View>
        <ThemedText style={[styles.chevron, { color: tintColor }]}>›</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <ThemedText type="title" style={styles.title}>{family?.name ?? 'My Family'}</ThemedText>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={renderChild}
        ListEmptyComponent={<ThemedText style={styles.empty}>No children added yet.</ThemedText>}
        style={styles.list}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: tintColor }]}
        onPress={() => router.push('/(parent)/task-create')}
      >
        <ThemedText style={styles.buttonText}>Create Task</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineButton, { borderColor: textColor + '44' }]}
        onPress={() => router.push('/(parent)/task-templates')}
      >
        <ThemedText style={styles.outlineButtonText}>Task Templates</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineButton, { borderColor: textColor + '44' }]}
        onPress={() => router.push('/(parent)/tasks')}
      >
        <ThemedText style={styles.outlineButtonText}>Review Tasks</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineButton, { borderColor: textColor + '44' }]}
        onPress={() => router.push('/(parent)/payouts')}
      >
        <ThemedText style={styles.outlineButtonText}>Review Payouts</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineButton, { borderColor: textColor + '44' }]}
        onPress={() => router.push('/(parent)/announcements')}
      >
        <ThemedText style={styles.outlineButtonText}>📢 Announcements</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineButton, { borderColor: textColor + '44' }]}
        onPress={() => router.push('/(parent)/child-add')}
      >
        <ThemedText style={styles.outlineButtonText}>Add Child</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineButton, { borderColor: textColor + '44' }]}
        onPress={() => router.push('/(parent)/child-mode')}
      >
        <ThemedText style={styles.outlineButtonText}>Enter Child Mode</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineButton, { borderColor: textColor + '44' }]}
        onPress={signOut}
      >
        <ThemedText style={styles.outlineButtonText}>Sign Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  title: { marginBottom: 24 },
  list: { flex: 1 },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  childItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: { fontSize: 22, fontWeight: '300', lineHeight: 24 },
  childName: { fontSize: 16, fontWeight: '500' },
  pointsText: { fontSize: 13, opacity: 0.7, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, opacity: 0.5 },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  outlineButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  outlineButtonText: { fontWeight: '600', fontSize: 16 },
});
