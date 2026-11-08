import { useState } from 'react';
import { Text } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, useTheme } from '@/core/theme';
import type { Setting } from '@/core/types/common';
import { Button, SegmentedControl, Screen } from '@/core/ui';
import { startSession } from '../data/sessionRepo';

/** SS-1 Start child mode. The setting is chosen by an adult, never inferred (D-13). */
export function StartSessionScreen({
  learnerName,
  learnerId,
  onStarted,
  onBack,
}: {
  learnerName: string;
  learnerId: string;
  onStarted: (sessionId: string) => void;
  onBack?: () => void;
}) {
  const db = useDb();
  const { role } = useAppContext();
  const { colors } = useTheme();
  const [setting, setSetting] = useState<Setting>('unknown');
  const [failed, setFailed] = useState(false);

  const start = () => {
    try {
      const id = startSession(db, { learnerId, setting, role: role ?? 'parent' });
      onStarted(id);
    } catch (e) {
      logError('sessions', 'start_failed', e);
      setFailed(true);
    }
  };

  return (
    <Screen
      title={t('session.start')}
      onBack={onBack}
      testID="screen-start-session"
      footer={<Button label={t('session.start_button')} size="L" onPress={start} />}
    >
      <Text style={[facText.heading, { color: colors.fac.ink }]}>{learnerName}</Text>
      <Text style={[facText.heading, { color: colors.fac.ink }]}>{t('session.where')}</Text>
      <SegmentedControl
        accessibilityLabel={t('session.where')}
        options={[
          { key: 'home', label: t('session.setting_home') },
          { key: 'school', label: t('session.setting_school') },
          { key: 'therapy', label: t('session.setting_therapy') },
          { key: 'unknown', label: t('session.setting_not_sure') },
        ]}
        selectedKey={setting}
        onSelect={(k) => setSetting(k as Setting)}
      />
      <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('session.pinning_hint')}</Text>
      {failed ? <Text style={[facText.body, { color: colors.fac.danger }]}>{t('errors.generic')}</Text> : null}
    </Screen>
  );
}
