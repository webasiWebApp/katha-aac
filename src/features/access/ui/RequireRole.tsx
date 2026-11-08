import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, space, useTheme } from '@/core/theme';
import { Button, EmptyState } from '@/core/ui';
import { canView, loadPermissions, type Resource } from '../domain/permissions';

type Answer = 'yes' | 'no' | 'error';

/** Permission check for the signed-in role. If the permissions cannot be read it denies (fail closed). */
function usePermission(resource: Resource, attempt: number): Answer {
  const db = useDb();
  const { role } = useAppContext();
  void attempt;
  try {
    return canView(role, resource, loadPermissions(db)) ? 'yes' : 'no';
  } catch (e) {
    logError('access', 'permission_read_failed', e);
    return 'error';
  }
}

export function useCanView(resource: Resource): boolean {
  return usePermission(resource, 0) === 'yes';
}

/** Renders children only when the signed-in role may view the resource; else an EmptyState. */
export function RequireRole({ resource, children }: { resource: Resource; children: ReactNode }) {
  const { colors } = useTheme();
  const [attempt, setAttempt] = useState(0);
  const answer = usePermission(resource, attempt);
  if (answer === 'error') {
    return (
      <View style={{ gap: space.s16, alignItems: 'center' }} testID="load-error">
        <Text style={[facText.body, { color: colors.fac.ink }]}>{t('errors.generic')}</Text>
        <Button label={t('common.try_again')} onPress={() => setAttempt((n) => n + 1)} />
      </View>
    );
  }
  if (answer === 'no') {
    return <EmptyState title={t('common.not_available')} body={t('common.not_available_body')} icon="lock" />;
  }
  return <>{children}</>;
}
