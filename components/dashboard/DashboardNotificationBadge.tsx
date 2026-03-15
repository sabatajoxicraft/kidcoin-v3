import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  count: number;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
};

export function DashboardNotificationBadge({
  count,
  style,
  backgroundColor = '#E53E3E',
}: Props) {
  const borderColor = useThemeColor({}, 'background');

  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }, style]}>
      <ThemedText style={styles.text}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
