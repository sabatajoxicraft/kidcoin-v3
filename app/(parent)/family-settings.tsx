import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SUPPORTED_CURRENCIES, formatCurrency } from '@/lib/currency';
import type { CurrencyCode } from '@/src/types';

const CURRENCY_OPTIONS: { key: CurrencyCode; label: string }[] = [
  { key: 'ZAR', label: 'R ZAR' },
  { key: 'USD', label: '$ USD' },
  { key: 'EUR', label: '€ EUR' },
  { key: 'GBP', label: '£ GBP' },
];

export default function FamilySettingsScreen() {
  const { family, updateFamilySettings } = useFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    family?.settings?.currencyCode ?? 'ZAR',
  );
  const [conversionRateInput, setConversionRateInput] = useState(
    String(family?.settings?.pointsConversionRate ?? 0.1),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync form when family settings change (e.g. on first load)
  useEffect(() => {
    if (family?.settings) {
      setSelectedCurrency(family.settings.currencyCode ?? 'ZAR');
      setConversionRateInput(String(family.settings.pointsConversionRate));
    }
  }, [family?.id, family?.settings, family?.settings?.currencyCode, family?.settings?.pointsConversionRate]);

  const parsedRate = parseFloat(conversionRateInput);
  const rateValid = Number.isFinite(parsedRate) && parsedRate > 0;

  const preview = rateValid
    ? `1 point = ${formatCurrency(parsedRate, selectedCurrency)}`
    : 'Enter a valid conversion rate';

  const handleSave = async () => {
    if (!rateValid) {
      setError('Please enter a valid conversion rate greater than 0 (e.g. 0.10).');
      return;
    }
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      await updateFamilySettings({
        currencyCode: selectedCurrency,
        pointsConversionRate: parsedRate,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backText, { color: tintColor }]}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Family Settings</ThemedText>
        </View>

        <ThemedText style={styles.label}>Currency</ThemedText>
        <View style={styles.chipRow}>
          {CURRENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                { borderColor: tintColor },
                selectedCurrency === opt.key && { backgroundColor: tintColor },
              ]}
              onPress={() => { setSelectedCurrency(opt.key); setSaved(false); }}
              disabled={saving}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  selectedCurrency === opt.key && styles.chipTextSelected,
                ]}
              >
                {opt.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <ThemedText style={styles.hint}>{SUPPORTED_CURRENCIES[selectedCurrency].name}</ThemedText>

        <ThemedText style={styles.label}>
          Points Conversion Rate
        </ThemedText>
        <ThemedText style={styles.hint}>
          How much 1 point is worth in {SUPPORTED_CURRENCIES[selectedCurrency].symbol}
        </ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor + '44' }]}
          placeholder="e.g. 0.10"
          placeholderTextColor={textColor + '66'}
          value={conversionRateInput}
          onChangeText={(v) => { setConversionRateInput(v); setSaved(false); }}
          keyboardType="decimal-pad"
          editable={!saving}
        />

        <View style={[styles.previewBox, { borderColor: tintColor + '55' }]}>
          <ThemedText style={[styles.previewText, { color: tintColor }]}>{preview}</ThemedText>
        </View>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {saved ? <ThemedText style={styles.success}>Settings saved ✓</ThemedText> : null}

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: tintColor }, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save Settings</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: { marginBottom: 28 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 17 },
  title: {},
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  hint: { fontSize: 12, opacity: 0.6, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  previewText: { fontSize: 15, fontWeight: '600' },
  error: { color: '#e53e3e', marginBottom: 12, fontSize: 14 },
  success: { color: '#38a169', marginBottom: 12, fontSize: 14 },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
