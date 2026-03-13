import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function FamilyCreateScreen() {
  const [familyName, setFamilyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createFamily } = useFamily();
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const bgColor = useThemeColor({}, 'background');

  const handleSubmit = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createFamily(familyName.trim());
      router.replace('/(setup)/child-add');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.title}>Create Your Family</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: tintColor, color: textColor, backgroundColor: bgColor }]}
          placeholder="e.g. The Smith Family"
          placeholderTextColor={textColor + '88'}
          value={familyName}
          onChangeText={setFamilyName}
          editable={!saving}
          autoFocus
        />

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }, saving && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Continue</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  title: { marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  error: { color: '#e53e3e', marginBottom: 12, fontSize: 14 },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
