import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DashboardCard } from './DashboardCard';
import { DashboardBadge } from './DashboardBadge';

type Props = {
  name: string;
  points: number;
  ageGroup: string;
  ageGroupLabel: string;
  onPress: () => void;
  borderColor: string;
  badgeColor: string;
};

export function ChildSummaryCard({
  name,
  points,
  ageGroupLabel,
  onPress,
  borderColor,
  badgeColor,
}: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <DashboardCard borderColor={borderColor} style={styles.cardOverride}>
        <View style={styles.row}>
          <View>
            <ThemedText style={styles.name}>{name}</ThemedText>
            <ThemedText style={styles.points}>{points} pts</ThemedText>
          </View>
          <View style={styles.right}>
            <DashboardBadge label={ageGroupLabel} backgroundColor={badgeColor} />
            <ThemedText style={[styles.chevron, { color: badgeColor }]}>›</ThemedText>
          </View>
        </View>
      </DashboardCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardOverride: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  points: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
});
