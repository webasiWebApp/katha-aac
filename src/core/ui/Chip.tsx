import { StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';

export type ChipTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface ChipProps {
  label: string;
  tone?: ChipTone;
}

/** Small status label (Figma 5:818). Display only, not a touch target. */
export function Chip({ label, tone = 'neutral' }: ChipProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  const palette: Record<ChipTone, { bg: string; ink: string }> = {
    neutral: { bg: fac.muted, ink: fac.inkMuted },
    primary: { bg: fac.primarySoft, ink: fac.primary },
    success: { bg: fac.successSoft, ink: fac.success },
    warning: { bg: fac.warningSoft, ink: fac.warning },
    danger: { bg: fac.dangerSoft, ink: fac.danger },
  };
  const { bg, ink } = palette[tone];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]} accessible accessibilityLabel={label}>
      <Text style={[facText.captionStrong, { color: ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
