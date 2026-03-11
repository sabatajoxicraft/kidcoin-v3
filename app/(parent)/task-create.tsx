import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getTaskTemplateAgeGroupLabel, getTaskTemplateById } from '@/lib/task-template-catalog';

export default function TaskCreateScreen() {
  const { templateId: rawTemplateId } = useLocalSearchParams<{ templateId?: string | string[] }>();
  const { children } = useFamily();
  const { createTask } = useTask();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const bgColor = useThemeColor({}, 'background');
  const templateId = Array.isArray(rawTemplateId) ? rawTemplateId[0] : rawTemplateId;
  const selectedTemplate = templateId ? getTaskTemplateById(templateId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  const [childId, setChildId] = useState<string | null>(children[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (children.length === 0) {
      if (childId !== null) {
        setChildId(null);
      }
      return;
    }

    if (!childId || !children.some((child) => child.id === childId)) {
      setChildId(children[0].id);
    }
  }, [childId, children]);

  useEffect(() => {
    if (!selectedTemplate) return;

    setTitle(selectedTemplate.title);
    setDescription(selectedTemplate.description);
    setPoints(String(selectedTemplate.suggestedPoints));
    setError(null);
  }, [selectedTemplate]);

  const selectedChild = children.find((child) => child.id === childId) ?? null;
  const templateAgeGroupLabel = selectedTemplate
    ? getTaskTemplateAgeGroupLabel(selectedTemplate.ageGroup)
    : null;
  const showAgeGroupHint =
    selectedTemplate != null &&
    selectedChild != null &&
    selectedChild.ageGroup !== selectedTemplate.ageGroup;

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    if (!childId) {
      setError('Please choose a child.');
      return;
    }

    const parsedPoints = Number.parseInt(points, 10);
    if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
      setError('Points must be a positive number.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        points: parsedPoints,
        assignedToChildId: childId,
      });
      router.replace('/(parent)/tasks');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <ThemedText type="title" style={styles.title}>Create Task</ThemedText>
        <ThemedText style={styles.subtitle}>
          {selectedTemplate
            ? 'Template loaded. Update anything before assigning it.'
            : 'Create a custom task or start from a built-in template.'}
        </ThemedText>

        <TouchableOpacity
          style={[styles.templateLink, { borderColor: tintColor + '44' }]}
          onPress={() => router.replace('/(parent)/task-templates')}
          disabled={saving}
        >
          <ThemedText style={[styles.templateLinkText, { color: tintColor }]}>
            {selectedTemplate ? 'Choose a different template' : 'Browse task templates'}
          </ThemedText>
          <ThemedText style={[styles.templateLinkArrow, { color: tintColor }]}>›</ThemedText>
        </TouchableOpacity>

        {selectedTemplate ? (
          <View
            style={[
              styles.templateCard,
              { borderColor: tintColor + '44', backgroundColor: tintColor + '08' },
            ]}
          >
            <View style={styles.templateBadgeRow}>
              <View
                style={[
                  styles.ageBadge,
                  { borderColor: tintColor + '44', backgroundColor: tintColor + '11' },
                ]}
              >
                <ThemedText style={[styles.ageBadgeText, { color: tintColor }]}>
                  {templateAgeGroupLabel}
                </ThemedText>
              </View>
              <View style={[styles.pointsBadge, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.pointsBadgeText}>
                  Suggested {selectedTemplate.suggestedPoints} pts
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.templateCardTitle}>{selectedTemplate.title}</ThemedText>
            <ThemedText style={styles.templateCardMeta}>
              {selectedTemplate.category} • {selectedTemplate.estimatedTime}
            </ThemedText>
            <ThemedText style={styles.templateCardTip}>Parent tip: {selectedTemplate.parentTip}</ThemedText>
          </View>
        ) : null}

        {templateId && !selectedTemplate ? (
          <ThemedText style={styles.error}>
            That template could not be loaded. You can still create a task manually.
          </ThemedText>
        ) : null}

        <ThemedText style={styles.label}>Title</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
          placeholder="Task title"
          placeholderTextColor={textColor + '88'}
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <ThemedText style={styles.label}>Description (optional)</ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            { borderColor: tintColor, color: textColor, backgroundColor: bgColor },
          ]}
          placeholder="Task details"
          placeholderTextColor={textColor + '88'}
          value={description}
          onChangeText={setDescription}
          editable={!saving}
          multiline
        />

        <ThemedText style={styles.label}>Points</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
          placeholder="10"
          placeholderTextColor={textColor + '88'}
          value={points}
          onChangeText={setPoints}
          keyboardType="numeric"
          editable={!saving}
        />

        <ThemedText style={styles.label}>Assign to</ThemedText>
        <View style={styles.childRow}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childButton,
                { borderColor: tintColor },
                childId === child.id && { backgroundColor: tintColor },
              ]}
              onPress={() => setChildId(child.id)}
              disabled={saving}
            >
              <ThemedText
                style={[styles.childButtonText, childId === child.id && styles.childButtonTextSelected]}
              >
                {child.displayName}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {showAgeGroupHint ? (
          <ThemedText style={styles.helperText}>
            This template is aimed at {templateAgeGroupLabel}. You can still assign it to{' '}
            {selectedChild?.displayName} if that feels like the best fit.
          </ThemedText>
        ) : null}

        {children.length === 0 ? (
          <ThemedText style={styles.error}>Add a child before creating tasks.</ThemedText>
        ) : null}
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }, saving && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={saving || children.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Create Task</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()} disabled={saving}>
          <ThemedText style={[styles.doneButtonText, { color: tintColor }]}>Back</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { paddingBottom: 16 },
  title: { marginBottom: 8, textAlign: 'center' },
  subtitle: { marginBottom: 12, textAlign: 'center', opacity: 0.75, lineHeight: 20 },
  templateLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  templateLinkText: { fontSize: 14, fontWeight: '600' },
  templateLinkArrow: { fontSize: 20, fontWeight: '300', lineHeight: 20 },
  templateCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  templateBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
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
  templateCardTitle: { fontSize: 16, fontWeight: '600' },
  templateCardMeta: { marginTop: 6, fontSize: 13, opacity: 0.7 },
  templateCardTip: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: { minHeight: 90, textAlignVertical: 'top' },
  childRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  helperText: { marginTop: 8, fontSize: 13, opacity: 0.75, lineHeight: 18 },
  childButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  childButtonText: { fontSize: 14 },
  childButtonTextSelected: { color: '#fff', fontWeight: '600' },
  error: { color: '#e53e3e', marginTop: 8, fontSize: 14 },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  doneButton: { alignItems: 'center', marginTop: 16, paddingVertical: 10 },
  doneButtonText: { fontSize: 16, fontWeight: '600' },
});
