import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/family-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChildModeScreen() {
  const { children, enterChildMode, loading } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const isBusy = loading || submitting;

  useEffect(() => {
    if (children.length === 0) {
      setSelectedChildId(null);
      return;
    }
    setSelectedChildId((current) =>
      current && children.some((child) => child.id === current) ? current : children[0].id,
    );
  }, [children]);

  const handleEnterChildMode = async () => {
    if (!selectedChildId) {
      setError('Please select a child.');
      return;
    }
    if (pin.length !== 4) {
      setError('PIN must be 4 digits.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await enterChildMode(selectedChildId, pin);
      setPin('');
      router.replace('/(child)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enter child mode.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>Enter Child Mode</ThemedText>
        <ThemedText style={styles.subtitle}>Choose a child profile and enter their PIN.</ThemedText>

        {loading ? <ActivityIndicator color={tintColor} style={styles.loader} /> : null}

        <View style={styles.childList}>
          {children.length > 0 ? (
            children.map((child) => {
              const isSelected = selectedChildId === child.id;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childItem,
                    { borderColor: tintColor + '44' },
                    isSelected && { borderColor: tintColor, backgroundColor: tintColor + '14' },
                  ]}
                  onPress={() => {
                    setSelectedChildId(child.id);
                    setError(null);
                  }}
                  disabled={isBusy}
                >
                  <View>
                    <ThemedText style={styles.childName}>{child.displayName}</ThemedText>
                    <ThemedText style={styles.childPoints}>{child.points} pts</ThemedText>
                  </View>
                  {isSelected ? (
                    <View style={[styles.selectedBadge, { backgroundColor: tintColor }]}>
                      <ThemedText style={styles.selectedBadgeText}>Selected</ThemedText>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <ThemedText style={styles.empty}>No children available. Add a child first.</ThemedText>
          )}
        </View>

        <ThemedText style={styles.label}>4-Digit PIN</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: tintColor, color: textColor, backgroundColor }]}
          placeholder="PIN"
          placeholderTextColor={textColor + '88'}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          editable={!isBusy}
        />

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }, isBusy && styles.buttonDisabled]}
          onPress={handleEnterChildMode}
          disabled={isBusy || children.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Enter Child Mode</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: textColor + '44' }]}
          onPress={() => router.back()}
          disabled={isBusy}
        >
          <ThemedText style={styles.outlineButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  content: { paddingBottom: 24 },
  title: { marginBottom: 8 },
  subtitle: { opacity: 0.7, marginBottom: 16 },
  loader: { marginBottom: 12 },
  childList: { marginBottom: 8 },
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
  childPoints: { fontSize: 13, opacity: 0.7, marginTop: 2 },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { opacity: 0.6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: '#e53e3e', marginTop: 8, fontSize: 14 },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  outlineButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  outlineButtonText: { fontWeight: '600', fontSize: 16 },
});
