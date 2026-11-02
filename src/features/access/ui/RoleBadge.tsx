import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';
import { Icon, type IconName } from '@/core/ui';

export type Role = 'parent' | 'slp' | 'educator' | 'ot';

const ROLE_LABELS: Record<Role, string> = {
  parent: 'Parent / Caregiver',
  slp: 'Speech-Language Pathologist',
  educator: 'Educator / School staff',
  ot: 'Occupational Therapist',
};

const ROLE_ICONS: Record<Role, IconName> = {
  parent: 'users',
  slp: 'speaker',
  educator: 'book',
  ot: 'hand',
};

export interface RoleBadgeProps {
  role: Role;
}

/** Role identity chip (Figma 4:125). Pill, padding 4/12, Fac/Caption Strong. */
export function RoleBadge({ role }: RoleBadgeProps) {
  const { colors } = useTheme();

  type Palette = { bg: string; ink: string };
  const palette: Record<Role, Palette> = {
    parent:   { bg: colors.fac.primarySoft, ink: colors.fac.primary },
    slp:      { bg: colors.fac.muted,       ink: colors.chart.cViolet },
    educator: { bg: colors.fac.successSoft, ink: colors.fac.success },
    ot:       { bg: colors.fac.warningSoft, ink: colors.fac.warning },
  };

  const { bg, ink } = palette[role];
  const label = ROLE_LABELS[role];
  const icon = ROLE_ICONS[role];

  return (
    <View
      style={[styles.badge, { backgroundColor: bg }]}
      accessible
      accessibilityLabel={label}
    >
      <Icon name={icon} size={16} color={ink} />
      <Text style={[facText.captionStrong, { color: ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
});
