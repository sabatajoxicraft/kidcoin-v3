import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DashboardNotificationBadge } from './DashboardNotificationBadge';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
  notificationCount?: number;
};

export function DashboardActionButton({
  label,
  onPress,
  variant = 'outline',
  style,
  backgroundColor,
  borderColor,
  notificationCount = 0,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {variant === 'primary' ? (
        <TouchableOpacity
          style={[styles.base, styles.primary, { backgroundColor }, style]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.primaryText}>{label}</ThemedText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.base, styles.outline, { borderColor }, style]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.outlineText}>{label}</ThemedText>
        </TouchableOpacity>
      )}
      <DashboardNotificationBadge count={notificationCount} style={styles.badge} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
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
  badge: {
    position: 'absolute',
    top: 6,
    right: 12,
  },
});
