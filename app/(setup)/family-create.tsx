import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import type { CurrencyCode } from '@/src/types';

const CURRENCY_OPTIONS: { key: CurrencyCode; label: string }[] = [
  { key: 'ZAR', label: 'R ZAR' },
  { key: 'USD', label: '$ USD' },
  { key: 'EUR', label: '€ EUR' },
  { key: 'GBP', label: '£ GBP' },
];

export default function FamilyCreateScreen() {
  const [familyName, setFamilyName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('ZAR');
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
      await createFamily(familyName.trim(), selectedCurrency);
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

        <ThemedText style={styles.label}>Family Currency</ThemedText>
        <View style={styles.currencyRow}>
          {CURRENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.currencyButton,
                { borderColor: tintColor },
                selectedCurrency === opt.key && { backgroundColor: tintColor },
              ]}
              onPress={() => setSelectedCurrency(opt.key)}
              disabled={saving}
            >
              <ThemedText
                style={[
                  styles.currencyButtonText,
                  selectedCurrency === opt.key && styles.currencyButtonTextSelected,
                ]}
              >
                {opt.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <ThemedText style={styles.currencyHint}>
          {SUPPORTED_CURRENCIES[selectedCurrency].name}
        </ThemedText>

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
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  currencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  currencyButtonText: { fontSize: 13, fontWeight: '500' },
  currencyButtonTextSelected: { color: '#fff', fontWeight: '600' },
  currencyHint: { fontSize: 12, opacity: 0.6, marginBottom: 16 },
  error: { color: '#e53e3e', marginBottom: 12, fontSize: 14 },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
