import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, radius, size as sizes, useTheme } from '@/core/theme';

import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'L' | 'M';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** L = 56 dp, M = 48 dp (facilitator minimum). */
  size?: ButtonSize;
  /** Optional leading icon (hidden by default in Figma). */
  icon?: IconName;
  disabled?: boolean;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const HEIGHT: Record<ButtonSize, number> = { L: 56, M: sizes.targetFac };

/** Facilitator button (Figma 5:805). Disabled uses 45 % opacity, as in SuggestionCard > Held. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'M',
  icon,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  const textColor =
    variant === 'secondary' ? fac.ink : variant === 'ghost' ? fac.primary : fac.onPrimary;
  const background =
    variant === 'primary'
      ? fac.primary
      : variant === 'danger'
        ? fac.danger
        : variant === 'secondary'
          ? fac.surface
          : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { height: HEIGHT[size], backgroundColor: background },
        variant === 'secondary' && { borderWidth: 1, borderColor: fac.border },
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={20} color={textColor} /> : null}
        <Text style={[facText.bodyStrong, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: sizes.targetFac,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.45 },
});
