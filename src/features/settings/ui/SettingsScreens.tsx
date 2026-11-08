import { useState } from 'react';
import { Text } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { setSetting, getSetting } from '@/core/db/settings';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, useTheme } from '@/core/theme';
import { Button, Card, Chip, LoadGate, ListRow, Screen, Toast } from '@/core/ui';
import {
  LearnerPreferences,
  PinConfirm,
  deleteAllRecords,
  deleteRecordsOlderThan,
  getLearner,
} from '@/features/access/index';
import { devicePlatformSpeak, getAudioService } from '@/features/audio/index';
import { getActiveVocabularyId } from '@/features/vocabulary/index';
import { loadLicences } from '../data/licences';
import { loadDemoData } from '../domain/demoData';

export const APP_VERSION = '1.0.0';
export const SCHEMA_VERSION = 'v1';

export type SettingsRoute =
  | 'childView'
  | 'voice'
  | 'learner'
  | 'roles'
  | 'privacy'
  | 'data'
  | 'about'
  | 'vocabulary';

/** FB-05 Settings list. */
export function SettingsListScreen({ onOpen }: { onOpen: (r: SettingsRoute) => void }) {
  const db = useDb();
  const { role } = useAppContext();
  const load = useLoad('settings', () => getLearner(db) ?? null, [db]);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const isParent = role === 'parent';
  const learner = load.status === 'ready' ? load.data : null;

  return (
    <Screen title={t('settings.title')} testID="screen-settings">
      <LoadGate status={load.status} onRetry={load.reload}>
        <ListRow kind="navigation" title={t('settings.child_view')} icon="child" onPress={() => onOpen('childView')} />
        <ListRow kind="navigation" title={t('settings.voice_audio')} icon="speaker" onPress={() => onOpen('voice')} />
        <ListRow kind="value" title={t('settings.language')} value={t('settings.language_value')} icon="globe" />
        <ListRow kind="navigation" title={t('profile.title')} icon="users" onPress={() => onOpen('learner')} />
        <ListRow kind="navigation" title={t('roles.title')} icon="lock" onPress={() => onOpen('roles')} />
        <ListRow kind="navigation" title={t('privacy.title')} icon="shield" onPress={() => onOpen('privacy')} />
        <ListRow kind="navigation" title={t('settings.vocabulary')} icon="book" onPress={() => onOpen('vocabulary')} />
        <ListRow kind="navigation" title={t('settings.data_retention')} icon="storage" onPress={() => onOpen('data')} />
        <ListRow kind="navigation" title={t('settings.about')} icon="info" onPress={() => onOpen('about')} />
        {learner && learner.is_fictional === 1 && isParent ? (
          confirming ? (
            <PinConfirm
              role="parent"
              title={t('settings.reset_demo')}
              onCancel={() => setConfirming(false)}
              onConfirmed={() => {
                try {
                  loadDemoData(db);
                  setToast(t('settings.demo_loaded'));
                } catch (e) {
                  logError('settings', 'demo_failed', e);
                }
                setConfirming(false);
              }}
            />
          ) : (
            <Button label={t('settings.reset_demo')} variant="danger" onPress={() => setConfirming(true)} />
          )
        ) : null}
        {toast ? <Toast message={toast} /> : null}
      </LoadGate>
    </Screen>
  );
}

/** ST-1 Child view settings. */
export function ChildViewSettingsScreen({ onBack }: { onBack?: () => void }) {
  const db = useDb();
  const { role } = useAppContext();
  const load = useLoad('settings', () => getLearner(db) ?? null, [db]);
  return (
    <Screen title={t('settings.child_view')} onBack={onBack} testID="screen-child-view-settings">
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' && load.data ? (
          <LearnerPreferences learner={load.data} editable={role === 'parent'} showAdultCheck />
        ) : null}
      </LoadGate>
    </Screen>
  );
}

/** ST-2 Voice and audio. */
export function VoiceAudioScreen({ onBack }: { onBack?: () => void }) {
  const db = useDb();
  const { colors } = useTheme();
  const load = useLoad(
    'settings',
    async () => {
      const svc = getAudioService(db);
      const status = await svc.init();
      return { found: status.found, voice: status.voice, clips: svc.clipCount() };
    },
    [db],
  );
  return (
    <Screen title={t('settings.voice_audio')} onBack={onBack} testID="screen-voice-audio">
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          <>
            <Chip tone={load.data.found ? 'success' : 'neutral'} label={load.data.found ? t('onboarding.voice_found') : t('onboarding.voice_missing')} />
            <Text style={[facText.body, { color: colors.fac.ink }]}>{t('settings.clips_installed', { n: load.data.clips })}</Text>
            <Button
              label={t('onboarding.play_test')}
              variant="secondary"
              onPress={() => void devicePlatformSpeak(load.data.voice).catch((e: unknown) => logError('audio', 'test_failed', e))}
            />
          </>
        ) : null}
      </LoadGate>
    </Screen>
  );
}

/** ST-3 Data and retention. Parent only, PIN confirmed. */
export function DataRetentionScreen({ onBack }: { onBack?: () => void }) {
  const db = useDb();
  const { role } = useAppContext();
  const [pending, setPending] = useState<null | { kind: 'older'; months: 6 | 12 | 24 } | { kind: 'all' }>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isParent = role === 'parent';

  const run = () => {
    try {
      if (pending?.kind === 'older') deleteRecordsOlderThan(db, role, pending.months);
      else deleteAllRecords(db, role);
      setToast(t('privacy.deleted_toast'));
    } catch (e) {
      logError('settings', 'delete_failed', e);
    }
    setPending(null);
  };

  return (
    <Screen title={t('settings.data_retention')} onBack={onBack} testID="screen-data-retention">
      <Text>{t('settings.retention_body')}</Text>
      {!isParent ? <Chip tone="neutral" label={t('roles.read_only')} /> : null}
      {isParent && pending ? (
        <PinConfirm role="parent" title={t('settings.confirm_delete')} onCancel={() => setPending(null)} onConfirmed={run} />
      ) : null}
      {isParent && !pending ? (
        <Card>
          {([6, 12, 24] as const).map((m) => (
            <Button key={m} label={t('settings.delete_older', { n: m })} variant="danger" onPress={() => setPending({ kind: 'older', months: m })} />
          ))}
          <Button label={t('privacy.delete_all')} variant="danger" onPress={() => setPending({ kind: 'all' })} />
        </Card>
      ) : null}
      {toast ? <Toast message={toast} /> : null}
    </Screen>
  );
}

/** ST-4 About. */
export function AboutScreen({ onBack, onExportLog }: { onBack?: () => void; onExportLog?: (text: string) => void }) {
  const [showLicences, setShowLicences] = useState(false);
  const [licences] = useState(loadLicences);
  const db = useDb();
  const { role } = useAppContext();
  const load = useLoad(
    'settings',
    () => ({
      vocab: getActiveVocabularyId(db),
      errors: db.all<{ at: string; area: string; code: string; message: string; app_version: string }>(
        'SELECT at, area, code, message, app_version FROM error_log ORDER BY at',
      ),
      adultCheck: getSetting<boolean>(db, 'childView.adultCheck', true),
    }),
    [db],
  );
  void setSetting;
  return (
    <Screen title={t('settings.about')} onBack={onBack} testID="screen-about">
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          <>
            <ListRow kind="value" title={t('about.app_version')} value={APP_VERSION} />
            <ListRow kind="value" title={t('about.schema_version')} value={SCHEMA_VERSION} />
            <ListRow kind="value" title={t('about.vocabulary_version')} value={load.data.vocab} />
            {role === 'parent' ? (
              <Button
                label={t('about.export_log')}
                variant="secondary"
                onPress={() =>
                  onExportLog?.(
                    load.data.errors.map((e) => `${e.at}\t${e.app_version}\t${e.area}\t${e.code}\t${e.message}`).join('\n'),
                  )
                }
              />
            ) : null}
            <Text>{t('about.licences_note')}</Text>
            <Button
              label={showLicences ? t('about.licences_hide') : t('about.licences_show', { count: licences.length })}
              variant="ghost"
              onPress={() => setShowLicences((v) => !v)}
            />
            {showLicences
              ? licences.map((l) => <ListRow key={l.pkg} kind="value" title={l.pkg} value={l.licenses} />)
              : null}
          </>
        ) : null}
      </LoadGate>
    </Screen>
  );
}
