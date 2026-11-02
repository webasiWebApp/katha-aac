import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, space, useTheme } from '@/core/theme';
import { Icon } from '@/core/ui';

const BANNER_TEXT =
  'This report describes recorded app activity, not all communication. Usage statistics alone do not show language development.';

/** Limitation notice shown at the top of every report (Figma 5:269). */
export function LimitationBanner() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.note.bg, borderColor: colors.note.border },
      ]}
      accessible
      accessibilityLabel={BANNER_TEXT}
    >
      <Icon name="info" size={18} color={colors.fac.inkMuted} />
      <Text style={[facText.caption, styles.text, { color: colors.fac.inkMuted }]}>
        {BANNER_TEXT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.s12,
    gap: space.s8,
  },
  text: { flex: 1 },
});
