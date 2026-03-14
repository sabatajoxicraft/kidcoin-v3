import { StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type Props = {
  label: string;
  onPress: () => void;
  tintColor: string;
  style?: StyleProp<ViewStyle>;
};

export function ParentQuickActionTile({ label, onPress, tintColor, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.tile, { borderColor: tintColor + '44' }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ThemedText style={styles.label}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
