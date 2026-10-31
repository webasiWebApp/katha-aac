import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';
import { Icon } from '@/core/ui';

export interface ConsentBannerProps {
  /** For example "Data stays on this device" (R14). */
  title: string;
  /** For example "Research logging is optional and can be withdrawn at any time." */
  body: string;
}

/** Privacy / consent notice (Figma 5:1171): primary-soft card with a shield icon. */
export function ConsentBanner({ title, body }: ConsentBannerProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${body}`}
      style={[styles.banner, { backgroundColor: fac.primarySoft }]}
    >
      <Icon name="shield" size={24} color={fac.primary} />
      <View style={styles.text}>
        <Text style={[facText.bodyStrong, { color: fac.ink }]}>{title}</Text>
        <Text style={[facText.caption, { color: fac.inkMuted }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: radius.lg,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 14,
  },
  text: { flex: 1, gap: 2 },
});
