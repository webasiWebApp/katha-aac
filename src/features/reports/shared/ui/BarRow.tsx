import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, space, useTheme } from '@/core/theme';

export interface BarRowProps {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
}

/** Horizontal bar row (Figma 12:1295). Height 28 dp, label 96 wide. */
export function BarRow({ label, value, max, valueLabel }: BarRowProps) {
  const { colors } = useTheme();
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <View style={styles.row}>
      <Text
        style={[facText.caption, styles.label, { color: colors.fac.inkMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View
        style={[styles.track, { backgroundColor: colors.fac.muted }]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      >
        <View
          style={[
            styles.fill,
            { backgroundColor: colors.fac.primary, width: `${fraction * 100}%` },
          ]}
        />
      </View>
      <Text style={[facText.captionStrong, styles.value, { color: colors.fac.ink }]}>
        {valueLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
  },
  label: { width: 96 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  value: { textAlign: 'right', minWidth: 40 },
});
