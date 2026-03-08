import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AgeGroup } from '@/src/types';

const AGE_GROUPS: { key: AgeGroup; label: string }[] = [
  { key: 'junior', label: 'Junior (6-9)' },
  { key: 'standard', label: 'Standard (10-13)' },
  { key: 'teen', label: 'Teen (14+)' },
];

export default function ChildAddScreen() {
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addChild } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const bgColor = useThemeColor({}, 'background');

  const resetForm = () => {
    setName('');
    setAgeGroup(null);
    setPin('');
    setConfirmPin('');
    setError(null);
  };

  const handleAdd = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    if (!ageGroup) { setError('Please select an age group.'); return; }
    if (pin.length !== 4) { setError('PIN must be 4 digits.'); return; }
    if (pin !== confirmPin) { setError('PINs do not match.'); return; }
    setError(null);
    setSaving(true);
    try {
      await addChild(name.trim(), ageGroup, pin);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    router.replace('/(parent)');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <ThemedText type="title" style={styles.title}>Add a Child</ThemedText>

      <ThemedText style={styles.label}>Name</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
        placeholder="Child's name"
        placeholderTextColor={textColor + '88'}
        value={name}
        onChangeText={setName}
        editable={!saving}
      />

      <ThemedText style={styles.label}>Age Group</ThemedText>
      <View style={styles.ageGroupRow}>
        {AGE_GROUPS.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[
              styles.ageButton,
              { borderColor: tintColor },
              ageGroup === g.key && { backgroundColor: tintColor },
            ]}
            onPress={() => setAgeGroup(g.key)}
            disabled={saving}
          >
            <ThemedText
              style={[styles.ageButtonText, ageGroup === g.key && styles.ageButtonTextSelected]}
            >
              {g.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText style={styles.label}>4-Digit PIN</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
        placeholder="PIN"
        placeholderTextColor={textColor + '88'}
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
        editable={!saving}
      />

      <ThemedText style={styles.label}>Confirm PIN</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
        placeholder="Confirm PIN"
        placeholderTextColor={textColor + '88'}
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
        editable={!saving}
      />

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: tintColor }, saving && styles.buttonDisabled]}
        onPress={handleAdd}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Add Child</ThemedText>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone} disabled={saving}>
        <ThemedText style={[styles.doneButtonText, { color: tintColor }]}>Done</ThemedText>
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
  ageGroupRow: { flexDirection: 'row', gap: 8 },
  ageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  ageButtonText: { fontSize: 13 },
  ageButtonTextSelected: { color: '#fff', fontWeight: '600' },
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
