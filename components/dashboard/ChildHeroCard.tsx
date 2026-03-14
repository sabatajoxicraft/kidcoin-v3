import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DashboardCard } from './DashboardCard';

type Props = {
  name: string;
  points: number;
  availablePoints: number;
  pendingPoints: number;
  moneyEquivalent: string;
  borderColor: string;
};

export function ChildHeroCard({ name, points, availablePoints, pendingPoints, moneyEquivalent, borderColor }: Props) {
  return (
    <DashboardCard borderColor={borderColor}>
      <ThemedText style={styles.greeting}>Hi, {name}! 👋</ThemedText>
      <ThemedText style={styles.points}>{points}</ThemedText>
      <ThemedText style={styles.subtitle}>points</ThemedText>
      {availablePoints < points ? (
        <ThemedText style={styles.available}>
          Available to redeem: {availablePoints} pts ({moneyEquivalent})
        </ThemedText>
      ) : null}
      {pendingPoints > 0 ? (
        <ThemedText style={styles.pending}>• {pendingPoints} pts waiting for approval</ThemedText>
      ) : null}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 14, opacity: 0.7, marginBottom: 4 },
  points: { fontSize: 36, fontWeight: '800', lineHeight: 44 },
  subtitle: { fontSize: 14, opacity: 0.7 },
  available: { fontSize: 13, opacity: 0.75, marginTop: 6 },
  pending: { fontSize: 12, opacity: 0.5, marginTop: 2 },
});
