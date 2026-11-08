import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/core/i18n/t';
import { facText, space, useTheme } from '@/core/theme';
import type { Role } from '@/core/types/common';
import { Button } from '@/core/ui';
import type { VerifyResult } from '../domain/pin';
import { PinEntry } from './PinEntry';

export interface SignInProps {
  /** Roles that have a PIN set. */
  roles: Role[];
  signIn: (role: Role, pin: string) => Promise<VerifyResult>;
  onSuccess: (role: Role) => void;
  onCancel?: () => void;
  /** Remaining lock time in ms, polled after a locked result. */
  lockedForMs?: () => Promise<number>;
}

/** FB-01 Adult sign-in: role list, 4 PIN dots, keypad. Wrong PINs clear silently (D-04). */
export function SignIn({ roles, signIn, onSuccess, onCancel, lockedForMs }: SignInProps) {
  const { colors } = useTheme();
  const [role, setRole] = useState<Role | null>(roles.length === 1 ? (roles[0] ?? null) : null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!locked) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const left = lockedForMs ? await lockedForMs() : 60_000;
      if (left <= 0) setLocked(false);
      else timer = setTimeout(() => void poll(), Math.min(left, 1000));
    };
    void poll();
    return () => clearTimeout(timer);
  }, [locked, lockedForMs]);

  const onPin = async (pin: string) => {
    if (!role) return;
    const result = await signIn(role, pin);
    if (result === 'ok') onSuccess(role);
    else if (result === 'locked') setLocked(true);
    // 'fail': nothing is shown; the dots have already cleared.
  };

  return (
    <View style={styles.wrap} testID="screen-signin">
      <Text style={[facText.title, { color: colors.fac.ink }]}>{t('signin.title')}</Text>
      <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('signin.adults_only')}</Text>
      {roles.length === 0 ? (
        <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('signin.no_roles')}</Text>
      ) : (
        <>
          <View style={styles.roles}>
            {roles.map((r) => (
              <Button
                key={r}
                label={t(`role.${r}`)}
                variant={role === r ? 'primary' : 'secondary'}
                onPress={() => setRole(r)}
              />
            ))}
          </View>
          {role ? (
            <PinEntry onComplete={(pin) => void onPin(pin)} disabled={locked} dotsLabel={t('signin.pin_prompt')} />
          ) : (
            <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('signin.role_prompt')}</Text>
          )}
        </>
      )}
      {onCancel ? <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.s16, padding: space.s24 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s8, justifyContent: 'center' },
});
