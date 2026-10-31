import { StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';

import { Icon } from './Icon';

export interface OfflineBadgeProps {
  /** Text such as "Works offline" (supplied by the caller, never hard-coded). */
  label: string;
}

/** "Works offline" status badge (Figma 5:819, R13). Display only. */
export function OfflineBadge({ label }: OfflineBadgeProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.badge, { backgroundColor: colors.fac.successSoft }]}
      accessible
      accessibilityLabel={label}
    >
      <Icon name="offline" size={16} color={colors.fac.success} />
      <Text style={[facText.captionStrong, { color: colors.fac.success }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 28,
    borderRadius: 14,
    paddingLeft: 8,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
});
