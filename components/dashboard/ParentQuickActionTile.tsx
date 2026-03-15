import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DashboardNotificationBadge } from './DashboardNotificationBadge';

type Props = {
  label: string;
  onPress: () => void;
  tintColor: string;
  style?: StyleProp<ViewStyle>;
  notificationCount?: number;
};

export function ParentQuickActionTile({
  label,
  onPress,
  tintColor,
  style,
  notificationCount = 0,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.tile, { borderColor: tintColor + '44' }, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.label}>{label}</ThemedText>
      </TouchableOpacity>
      <DashboardNotificationBadge count={notificationCount} style={styles.badge} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  tile: {
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
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
});
