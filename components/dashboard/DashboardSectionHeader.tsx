import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type Props = {
  title: string;
  meta?: string;
  style?: StyleProp<ViewStyle>;
};

export function DashboardSectionHeader({ title, meta, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      {meta ? <ThemedText style={styles.meta}>{meta}</ThemedText> : null}
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
});
