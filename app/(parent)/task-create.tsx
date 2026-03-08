import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useTask } from '@/hooks/use-task';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TaskCreateScreen() {
  const { children } = useFamily();
  const { createTask } = useTask();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const bgColor = useThemeColor({}, 'background');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  const [childId, setChildId] = useState<string | null>(children[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <ThemedText type="title" style={styles.title}>Create Task</ThemedText>

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
        style={[styles.input, styles.multilineInput, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
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

      {children.length === 0 ? <ThemedText style={styles.error}>Add a child before creating tasks.</ThemedText> : null}
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: tintColor }, saving && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={saving || children.length === 0}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Create Task</ThemedText>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.doneButton} onPress={() => router.back()} disabled={saving}>
        <ThemedText style={[styles.doneButtonText, { color: tintColor }]}>Back</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  title: { marginBottom: 24, textAlign: 'center' },
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
