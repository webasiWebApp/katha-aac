import { useState } from 'react';
import { View } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { space } from '@/core/theme';
import type { Role } from '@/core/types/common';
import { Button, Card, Chip, LoadGate, ListRow, Screen } from '@/core/ui';
import { getConsent, getLearner } from '../data/learnerRepo';
import { getPinService } from '../data/pinStore';
import { loadPermissions, ROLES, savePermission, type RolePermission } from '../domain/permissions';
import { PinEntry } from './PinEntry';
import { RoleBadge } from './RoleBadge';

const TOGGLES: { key: keyof RolePermission; label: string }[] = [
  { key: 'canOpenReport', label: 'roles.open_report' },
  { key: 'canSeeHistory', label: 'roles.see_history' },
  { key: 'canExport', label: 'roles.export' },
  { key: 'canEnterObservations', label: 'roles.enter_observations' },
];

/** FB-04 Roles and permissions. Only the parent can edit; others see it read-only. */
export function RolesPermissionsScreen({ onBack }: { onBack?: () => void }) {
  const db = useDb();
  const { role } = useAppContext();
  const isParent = role === 'parent';
  const load = useLoad(
    'access',
    () => {
      const learner = getLearner(db);
      return {
        perms: loadPermissions(db),
        consentAt: learner ? (getConsent(db, learner.id)?.guardian_consent_at ?? null) : null,
      };
    },
    [db],
  );
  const [settingPin, setSettingPin] = useState<{ role: Role; first: string | null } | null>(null);
  const [pinError, setPinError] = useState(false);

  const onPinEntered = async (pin: string) => {
    if (!settingPin) return;
    if (settingPin.first === null) {
      setSettingPin({ ...settingPin, first: pin });
      setPinError(false);
      return;
    }
    if (settingPin.first !== pin) {
      setPinError(true);
      setSettingPin({ role: settingPin.role, first: null });
      return;
    }
    try {
      await getPinService().setPin(settingPin.role, pin);
    } catch (e) {
      logError('access', 'set_pin_failed', e);
    }
    setSettingPin(null);
  };

  return (
    <Screen title={t('roles.title')} onBack={onBack} testID="screen-roles">
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          <>
            {load.data.consentAt ? (
              <Chip tone="success" label={t('privacy.consent_recorded', { date: load.data.consentAt.slice(0, 10) })} />
            ) : null}
            {!isParent ? <Chip tone="neutral" label={t('roles.read_only')} /> : null}
            {ROLES.map((r) => (
              <Card key={r}>
                <RoleBadge role={r} />
                <View style={{ gap: space.s4 }}>
                  {TOGGLES.map((tg) => (
                    <ListRow
                      key={tg.key}
                      kind="toggle"
                      title={t(tg.label)}
                      toggleValue={load.data.perms[r][tg.key]}
                      toggleLocked={!isParent || r === 'parent'}
                      onToggle={(v) => {
                        try {
                          savePermission(db, role, r, { [tg.key]: v });
                          load.reload();
                        } catch (e) {
                          logError('access', 'permission_save_failed', e);
                        }
                      }}
                    />
                  ))}
                  {isParent ? (
                    <ListRow
                      kind="navigation"
                      title={t('roles.set_pin')}
                      icon="lock"
                      onPress={() => setSettingPin({ role: r, first: null })}
                    />
                  ) : null}
                </View>
              </Card>
            ))}
            {settingPin ? (
              <Card title={t('roles.set_pin_for', { role: t(`role.${settingPin.role}`) })}>
                <Chip tone="neutral" label={settingPin.first === null ? t('roles.enter_pin') : t('roles.repeat_pin')} />
                {pinError ? <Chip tone="warning" label={t('onboarding.pin_mismatch')} /> : null}
                <PinEntry dotsLabel={t('signin.pin_prompt')} onComplete={(p) => void onPinEntered(p)} />
                <Button label={t('common.cancel')} variant="ghost" onPress={() => setSettingPin(null)} />
              </Card>
            ) : null}
          </>
        ) : null}
      </LoadGate>
    </Screen>
  );
}
