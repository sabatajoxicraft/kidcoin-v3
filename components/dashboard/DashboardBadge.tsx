import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type Props = {
  label: string;
  backgroundColor: string;
  style?: StyleProp<ViewStyle>;
};

export function DashboardBadge({ label, backgroundColor, style }: Props) {
  return (
    <View style={[styles.pill, { backgroundColor }, style]}>
      <ThemedText style={styles.text}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
