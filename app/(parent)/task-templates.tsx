import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getTaskTemplateAgeGroupLabel,
  getTaskTemplatesForAgeGroup,
  TASK_TEMPLATE_AGE_GROUPS,
} from '@/lib/task-template-catalog';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AgeGroup, TaskTemplate } from '@/src/types';

type TemplateAgeFilter = 'all' | AgeGroup;

const TEMPLATE_FILTERS: { key: TemplateAgeFilter; label: string }[] = [
  { key: 'all', label: 'All ages' },
  ...TASK_TEMPLATE_AGE_GROUPS.map((group) => ({ key: group.key, label: group.label })),
];

export default function TaskTemplatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<TemplateAgeFilter>('all');

  const visibleAgeGroups =
    selectedAgeGroup === 'all'
      ? TASK_TEMPLATE_AGE_GROUPS
      : TASK_TEMPLATE_AGE_GROUPS.filter((group) => group.key === selectedAgeGroup);

  const handleUseTemplate = (templateId: string) => {
    router.replace({
      pathname: '/(parent)/task-create',
      params: { templateId },
    });
  };

  const renderTemplateCard = (template: TaskTemplate) => (
    <View key={template.id} style={[styles.card, { borderColor: tintColor + '44' }]}>
      <View style={styles.badgeRow}>
        <View style={[styles.ageBadge, { borderColor: tintColor + '44', backgroundColor: tintColor + '11' }]}>
          <ThemedText style={[styles.ageBadgeText, { color: tintColor }]}>
            {getTaskTemplateAgeGroupLabel(template.ageGroup)}
          </ThemedText>
        </View>
        <View style={[styles.pointsBadge, { backgroundColor: tintColor }]}>
          <ThemedText style={styles.pointsBadgeText}>Suggested {template.suggestedPoints} pts</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.cardTitle}>{template.title}</ThemedText>
      <ThemedText style={styles.cardDescription}>{template.description}</ThemedText>
      <ThemedText style={styles.cardMeta}>
        {template.category} • {template.estimatedTime}
      </ThemedText>
      <ThemedText style={styles.cardTip}>Parent tip: {template.parentTip}</ThemedText>

      <TouchableOpacity
        style={[styles.useButton, { backgroundColor: tintColor }]}
        onPress={() => handleUseTemplate(template.id)}
      >
        <ThemedText style={styles.useButtonText}>Use Template</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <ThemedText type="title" style={styles.title}>Task Templates</ThemedText>
        <ThemedText style={styles.subtitle}>
          Built-in ideas by age group. Picking one opens the normal create-task form so you can still
          edit the title, description, points, and child assignment before saving.
        </ThemedText>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: textColor + '44' }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.secondaryButtonText}>Back</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tintColor }]}
            onPress={() => router.replace('/(parent)/task-create')}
          >
            <ThemedText style={styles.primaryButtonText}>Create from scratch</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {TEMPLATE_FILTERS.map((filter) => {
            const isSelected = selectedAgeGroup === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  { borderColor: tintColor + '44' },
                  isSelected && { backgroundColor: tintColor, borderColor: tintColor },
                ]}
                onPress={() => setSelectedAgeGroup(filter.key)}
              >
                <ThemedText style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {filter.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {visibleAgeGroups.map((group) => (
          <View key={group.key} style={styles.section}>
            <ThemedText type="subtitle">{group.label}</ThemedText>
            <ThemedText style={styles.sectionHint}>{group.helperText}</ThemedText>
            {getTaskTemplatesForAgeGroup(group.key).map(renderTemplateCard)}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { paddingBottom: 24 },
  title: { marginBottom: 8 },
  subtitle: { opacity: 0.75, marginBottom: 16, lineHeight: 20 },
  topActions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  primaryButton: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '600' },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  filterChipTextSelected: { color: '#fff' },
  section: { marginBottom: 24 },
  sectionHint: { opacity: 0.7, marginTop: 4, marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  ageBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ageBadgeText: { fontSize: 12, fontWeight: '600' },
  pointsBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDescription: { marginTop: 6, lineHeight: 20, opacity: 0.85 },
  cardMeta: { marginTop: 8, fontSize: 13, opacity: 0.7 },
  cardTip: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  useButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: { color: '#fff', fontWeight: '600' },
});
