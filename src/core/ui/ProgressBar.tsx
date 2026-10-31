import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';

export interface ProgressBarProps {
  /** 0 to 1. Values outside the range are clamped. */
  value: number;
  accessibilityLabel: string;
}

/** 8 dp progress bar (Figma 7:804): fac/muted track, fac/primary fill, radius 4. */
export function ProgressBar({ value, accessibilityLabel }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View
      style={[styles.track, { backgroundColor: colors.fac.muted }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View
        style={[styles.fill, { backgroundColor: colors.fac.primary, width: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: 8, borderRadius: 4 },
});
