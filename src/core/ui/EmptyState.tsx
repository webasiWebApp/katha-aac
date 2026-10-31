import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';

import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  title: string;
  body: string;
  icon?: IconName;
}

/** Empty / early state (Figma 5:1162): 64 dp icon disc, heading, plain-language body. */
export function EmptyState({ title, body, icon = 'chart' }: EmptyStateProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${body}`}
      style={[styles.card, { backgroundColor: fac.surface, borderColor: fac.border }]}
    >
      <View style={[styles.disc, { backgroundColor: fac.primarySoft }]}>
        <Icon name={icon} size={28} color={fac.primary} />
      </View>
      <Text style={[facText.heading, { color: fac.ink }]}>{title}</Text>
      <Text style={[facText.body, styles.body, { color: fac.inkMuted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
    alignItems: 'center',
  },
  disc: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  body: { textAlign: 'center' },
});
