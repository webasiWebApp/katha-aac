import { StyleSheet, Text, View } from 'react-native';

import { facCard, facText, radius, useTheme } from '@/core/theme';

import { Button } from './Button';

export interface DialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel: string;
  onCancel: () => void;
}

/** Confirmation dialog card (Figma 5:1144): radius 24, ghost cancel + primary confirm. */
export function Dialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
}: DialogProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityViewIsModal
      accessibilityRole="alert"
      accessibilityLabel={title}
      style={[styles.card, { backgroundColor: colors.fac.surface }, facCard]}
    >
      <Text style={[facText.title, { color: colors.fac.ink }]}>{title}</Text>
      <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{body}</Text>
      <View style={styles.actions}>
        <Button label={cancelLabel} variant="ghost" onPress={onCancel} />
        <Button label={confirmLabel} variant="primary" onPress={onConfirm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
    alignSelf: 'stretch',
    maxWidth: 360,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
