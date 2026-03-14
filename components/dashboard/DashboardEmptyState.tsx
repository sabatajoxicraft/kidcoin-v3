import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type Props = {
  message: string;
  style?: StyleProp<TextStyle>;
};

export function DashboardEmptyState({ message, style }: Props) {
  return (
    <ThemedText style={[styles.text, style]}>{message}</ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    marginTop: 32,
    textAlign: 'center',
    opacity: 0.5,
  },
});
