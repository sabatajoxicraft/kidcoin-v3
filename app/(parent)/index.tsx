import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
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
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const renderChild = ({ item }: { item: ChildProfile }) => (
    <View style={[styles.childItem, { borderColor: tintColor + '44' }]}>
      <ThemedText style={styles.childName}>{item.displayName}</ThemedText>
      <View style={[styles.badge, { backgroundColor: tintColor }]}>
        <ThemedText style={styles.badgeText}>{AGE_GROUP_LABELS[item.ageGroup] ?? item.ageGroup}</ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
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
        onPress={() => router.push('/(setup)/child-add')}
      >
        <ThemedText style={styles.buttonText}>Add Child</ThemedText>
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
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
  childName: { fontSize: 16, fontWeight: '500' },
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
    marginBottom: 32,
  },
  outlineButtonText: { fontWeight: '600', fontSize: 16 },
});
