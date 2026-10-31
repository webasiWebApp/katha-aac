import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';

import { Icon, type IconName } from './Icon';

export type StatTrend = 'up' | 'down' | 'flat';

const TREND_ICON: Record<StatTrend, IconName> = {
  up: 'trend-up',
  down: 'trend-down',
  flat: 'trend-flat',
};

export interface StatTileProps {
  label: string;
  value: string;
  trend: StatTrend;
  /** Text next to the trend arrow, for example "+8 vs last week". */
  delta: string;
}

/** Number tile for the insights dashboard (Figma 5:1048). Display only. */
export function StatTile({ label, value, trend, delta }: StatTileProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}, ${delta}`}
      style={[styles.tile, { backgroundColor: fac.surface, borderColor: fac.border }]}
    >
      <Text style={[facText.caption, { color: fac.inkMuted }]}>{label}</Text>
      <Text style={[facText.stat, { color: fac.ink }]}>{value}</Text>
      <View style={styles.delta}>
        <Icon name={TREND_ICON[trend]} size={16} color={fac.inkMuted} />
        <Text style={[facText.caption, { color: fac.inkMuted }]}>{delta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.lg, borderWidth: 1, padding: 14, gap: 4 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
