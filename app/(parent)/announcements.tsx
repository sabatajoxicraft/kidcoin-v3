import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  archiveAnnouncement,
  createAnnouncement,
  subscribeFamilyAnnouncements,
} from '@/lib/announcement-service';
import type { Announcement } from '@/src/types';

export default function ParentAnnouncementsScreen() {
  const { family, userProfile } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const familyId = family?.id ?? '';
  const parentId = userProfile?.id ?? '';

  useEffect(() => {
    if (!familyId) return;
    const unsub = subscribeFamilyAnnouncements(
      familyId,
      (data) => {
        setAnnouncements(data);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
        setLoading(false);
      },
    );
    return unsub;
  }, [familyId]);

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) return;
    if (!familyId || !parentId) return;
    setSubmitting(true);
    setError(null);
    try {
      await createAnnouncement(familyId, parentId, trimmedTitle, trimmedBody);
      setTitle('');
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (announcementId: string) => {
    if (!parentId) return;
    setError(null);
    try {
      await archiveAnnouncement(announcementId, parentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to archive announcement');
    }
  };

  const active = announcements.filter((a) => a.status === 'active');
  const archived = announcements.filter((a) => a.status === 'archived');

  const isFormValid = title.trim().length > 0 && body.trim().length > 0 && !!familyId && !!parentId;

  const renderAnnouncementCard = (item: Announcement, showArchive: boolean) => (
    <View key={item.id} style={[styles.card, { borderColor: tintColor + '44' }]}>
      <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
      <ThemedText style={styles.cardBody}>{item.body}</ThemedText>
      <ThemedText style={styles.cardMeta}>
        {item.createdAt.toLocaleDateString()}
      </ThemedText>
      {showArchive && (
        <TouchableOpacity
          style={[styles.archiveButton, { borderColor: textColor + '44' }]}
          onPress={() => handleArchive(item.id)}
        >
          <ThemedText style={styles.archiveButtonText}>Archive</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backText, { color: tintColor }]}>‹ Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Announcements</ThemedText>
        </View>

        {/* Create form */}
        <View style={[styles.formCard, { borderColor: tintColor + '44' }]}>
          <ThemedText style={styles.sectionLabel}>New Announcement</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor + '44' }]}
            placeholder="Title"
            placeholderTextColor={textColor + '66'}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, styles.bodyInput, { color: textColor, borderColor: textColor + '44' }]}
            placeholder="Message"
            placeholderTextColor={textColor + '66'}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={500}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: isFormValid && !submitting ? tintColor : textColor + '33' },
            ]}
            onPress={handleCreate}
            disabled={!isFormValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.createButtonText}>Post Announcement</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}

        {/* Active announcements */}
        <ThemedText style={styles.sectionLabel}>Active ({active.length})</ThemedText>
        {loading ? (
          <ActivityIndicator style={styles.spinner} />
        ) : active.length === 0 ? (
          <ThemedText style={styles.empty}>No active announcements.</ThemedText>
        ) : (
          active.map((a) => renderAnnouncementCard(a, !!parentId))
        )}

        {/* Archived announcements */}
        {archived.length > 0 && (
          <>
            <ThemedText style={[styles.sectionLabel, styles.archivedLabel]}>
              Archived ({archived.length})
            </ThemedText>
            {archived.map((a) => renderAnnouncementCard(a, false))}
          </>
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
  formCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  archivedLabel: { marginTop: 24, opacity: 0.45 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  bodyInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardBody: { fontSize: 14, lineHeight: 20, opacity: 0.85, marginBottom: 6 },
  cardMeta: { fontSize: 12, opacity: 0.5, marginBottom: 8 },
  archiveButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  archiveButtonText: { fontSize: 13, fontWeight: '500', opacity: 0.7 },
  errorText: { color: '#E53E3E', marginBottom: 12, fontSize: 14 },
  empty: { opacity: 0.5, marginBottom: 12 },
  spinner: { marginVertical: 20 },
});
