import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/core/i18n/t';
import { facText, radius, space, useTheme } from '@/core/theme';
import type { Role } from '@/core/types/common';
import { Button } from '@/core/ui';
import { getPinService } from '../data/pinStore';
import type { VerifyResult } from '../domain/pin';
import { PinEntry } from './PinEntry';

export interface PinConfirmProps {
  role: Role;
  title: string;
  onConfirmed: () => void;
  onCancel: () => void;
  /** Injected in tests; defaults to the device PIN service. */
  verify?: (role: Role, pin: string) => Promise<VerifyResult>;
}

/** Re-enter the signed-in adult's PIN before a destructive action. */
export function PinConfirm({ role, title, onConfirmed, onCancel, verify }: PinConfirmProps) {
  const { colors } = useTheme();
  const check = verify ?? ((r: Role, p: string) => getPinService().verifyPin(r, p));
  return (
    <View
      style={[styles.card, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}
      testID="pin-confirm"
      accessibilityViewIsModal
    >
      <Text style={[facText.heading, { color: colors.fac.ink }]}>{title}</Text>
      <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('pin_confirm.body')}</Text>
      <PinEntry
        dotsLabel={t('signin.pin_prompt')}
        onComplete={(pin) => {
          void check(role, pin).then((r) => {
            if (r === 'ok') onConfirmed();
          });
        }}
      />
      <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.s16, gap: space.s16, alignItems: 'center' },
});
