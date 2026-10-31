import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, size as sizes, useTheme } from '@/core/theme';

import { Icon, type IconName } from './Icon';

export type AppBarKind = 'root' | 'back';

export interface AppBarProps {
  kind: AppBarKind;
  title: string;
  /** kind="back": back button. */
  onBack?: () => void;
  backLabel?: string;
  /** Trailing action (bell on root, "more" on back pages). */
  onAction?: () => void;
  actionLabel: string;
  actionIcon?: IconName;
}

/** Top bar (Figma 5:842): 64 dp, bottom border only. Icon buttons are 48 x 48. */
export function AppBar({
  kind,
  title,
  onBack,
  backLabel,
  onAction,
  actionLabel,
  actionIcon,
}: AppBarProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  const trailing = actionIcon ?? (kind === 'root' ? 'bell' : 'more');
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: fac.surface,
          borderBottomColor: fac.border,
          paddingLeft: kind === 'root' ? 16 : 4,
        },
      ]}
    >
      {kind === 'back' ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel ?? 'Back'}
          style={styles.iconButton}
        >
          <Icon name="arrow-left" size={24} color={fac.ink} />
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={[facText.title, styles.title, { color: fac.ink }]}>
        {title}
      </Text>
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        style={styles.iconButton}
      >
        <Icon name={trailing} size={24} color={fac.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 1,
  },
  title: { flex: 1 },
  iconButton: {
    width: sizes.targetFac,
    height: sizes.targetFac,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
