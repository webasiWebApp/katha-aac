import { StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';

import { Icon, type IconName } from './Icon';

export interface ToastProps {
  message: string;
  icon?: IconName;
}

/** Transient confirmation (Figma 5:1158): fac/ink background, fac/on-primary text. */
export function Toast({ message, icon = 'check' }: ToastProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
      style={[styles.toast, { backgroundColor: colors.fac.ink }]}
    >
      <Icon name={icon} size={20} color={colors.fac.onPrimary} />
      <Text style={[facText.body, styles.message, { color: colors.fac.onPrimary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },
  message: { flex: 1 },
});
