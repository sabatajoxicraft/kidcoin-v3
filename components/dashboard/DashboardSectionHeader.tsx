import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DashboardNotificationBadge } from './DashboardNotificationBadge';

type Props = {
  title: string;
  meta?: string;
  style?: StyleProp<ViewStyle>;
  notificationCount?: number;
};

export function DashboardSectionHeader({ title, meta, style, notificationCount = 0 }: Props) {
  return (
    <View style={[styles.row, style]}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      {(meta || notificationCount > 0) ? (
        <View style={styles.trailing}>
          {meta ? <ThemedText style={styles.meta}>{meta}</ThemedText> : null}
          <DashboardNotificationBadge count={notificationCount} style={styles.badge} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    opacity: 0.6,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'relative',
    top: 0,
    right: 0,
    marginLeft: 8,
  },
});
