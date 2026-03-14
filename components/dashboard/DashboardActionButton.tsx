import { StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
};

export function DashboardActionButton({
  label,
  onPress,
  variant = 'outline',
  style,
  backgroundColor,
  borderColor,
}: Props) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[styles.base, styles.primary, { backgroundColor }, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.primaryText}>{label}</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.base, styles.outline, { borderColor }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ThemedText style={styles.outlineText}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primary: {
    // backgroundColor comes from prop (inline)
  },
  outline: {
    borderWidth: 1,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  outlineText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
