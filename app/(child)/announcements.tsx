import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { subscribeActiveAnnouncements } from '@/lib/announcement-service';
import type { Announcement } from '@/src/types';

export default function ChildAnnouncementsScreen() {
  const { family, userProfile, children, activeChild } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayChild = activeChild ?? children.find((c) => c.id === userProfile?.id);
  const familyId = displayChild?.familyId ?? family?.id ?? '';

  useEffect(() => {
    if (!familyId) return;
    const unsub = subscribeActiveAnnouncements(
      familyId,
      (data) => {
        setAnnouncements(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [familyId]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backText, { color: tintColor }]}>‹ Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Announcements</ThemedText>
        </View>

        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}

        {loading ? (
          <ActivityIndicator style={styles.spinner} />
        ) : announcements.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: tintColor + '33' }]}>
            <ThemedText style={styles.emptyTitle}>📢 No announcements yet</ThemedText>
            <ThemedText style={styles.emptyBody}>
              Your family hasn&apos;t posted any announcements. Check back later!
            </ThemedText>
          </View>
        ) : (
          announcements.map((item) => (
            <View key={item.id} style={[styles.card, { borderColor: tintColor + '44' }]}>
              <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.cardBody}>{item.body}</ThemedText>
              <ThemedText style={styles.cardMeta}>
                {item.createdAt.toLocaleDateString()}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 17 },
  title: {},
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardBody: { fontSize: 14, lineHeight: 20, opacity: 0.85, marginBottom: 6 },
  cardMeta: { fontSize: 12, opacity: 0.5 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptyBody: { fontSize: 14, opacity: 0.65, textAlign: 'center', lineHeight: 20 },
  errorText: { color: '#E53E3E', marginBottom: 12, fontSize: 14 },
  spinner: { marginVertical: 20 },
});
