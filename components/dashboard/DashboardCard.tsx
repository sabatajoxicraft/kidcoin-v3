import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedView } from '@/components/themed-view';

type Props = {
  borderColor: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function DashboardCard({ borderColor, style, children }: Props) {
  return (
    <ThemedView style={[styles.card, { borderColor }, style]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
});
